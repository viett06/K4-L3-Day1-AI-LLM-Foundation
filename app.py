"""
Frontend web cho mini-project Part 4 (template.py) — Trợ Lý AI.

Bọc các hàm đã cài đặt trong template.py (count_tokens, estimate_cost,
retry_with_backoff, compare_models) bằng một API Flask nhỏ + giao diện web
trong thư mục static/, để trải nghiệm trợ lý CLI qua trình duyệt thay vì
terminal.

Chạy:
    pip install -r requirements.txt
    python app.py
    # mở http://localhost:5000
"""

import json
import os

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request, send_from_directory

load_dotenv()

from template import (
    OPENAI_MINI_MODEL,
    OPENAI_MODEL,
    compare_models,
    count_tokens,
    estimate_cost,
    retry_with_backoff,
)

app = Flask(__name__, static_folder="static", static_url_path="")

MAX_HISTORY_MESSAGES = 6  # 3 lượt hội thoại gần nhất (user + assistant)


def get_client():
    from openai import OpenAI

    kwargs = {"api_key": os.getenv("OPENAI_API_KEY")}
    base_url = os.getenv("OPENAI_BASE_URL")
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/config")
def config():
    return jsonify({
        "model": OPENAI_MODEL,
        "mini_model": OPENAI_MINI_MODEL,
        "has_api_key": bool(os.getenv("OPENAI_API_KEY")),
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    persona = (data.get("persona") or "").strip()
    message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not message:
        return jsonify({"error": "Thiếu tin nhắn."}), 400
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({"error": "Chưa cấu hình OPENAI_API_KEY trong .env"}), 400

    messages = (
        [{"role": "system", "content": persona}]
        + history
        + [{"role": "user", "content": message}]
    )
    client = get_client()

    def generate():
        try:
            stream = retry_with_backoff(
                lambda: client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=messages,
                    stream=True,
                )
            )
            reply = ""
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    reply += delta
                    yield f"data: {json.dumps({'delta': delta})}\n\n"

            cost = estimate_cost(message, reply)
            new_history = (history + [
                {"role": "user", "content": message},
                {"role": "assistant", "content": reply},
            ])[-MAX_HISTORY_MESSAGES:]

            yield f"data: {json.dumps({'done': True, 'reply': reply, 'cost': cost, 'history': new_history})}\n\n"
        except Exception as exc:  # lỗi API (key sai, hết quota, mạng...)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return Response(generate(), mimetype="text/event-stream")


@app.route("/api/compare", methods=["POST"])
def compare():
    data = request.get_json(force=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "Thiếu prompt."}), 400
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({"error": "Chưa cấu hình OPENAI_API_KEY trong .env"}), 400

    try:
        return jsonify(compare_models(prompt))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
