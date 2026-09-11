(() => {
  const personaEl = document.getElementById("persona");
  const messagesEl = document.getElementById("messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const resetBtn = document.getElementById("reset-btn");
  const modelNameEl = document.getElementById("model-name");
  const apiStatusEl = document.getElementById("api-status");

  const statTurns = document.getElementById("stat-turns");
  const statTokens = document.getElementById("stat-tokens");
  const statCost = document.getElementById("stat-cost");

  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  const compareForm = document.getElementById("compare-form");
  const compareInput = document.getElementById("compare-input");
  const compareBtn = document.getElementById("compare-btn");
  const compareResult = document.getElementById("compare-result");

  let history = [];
  let session = { turns: 0, tokens: 0, cost: 0 };

  // ---------- Tabs ----------
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });

  // ---------- Persona presets ----------
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      personaEl.value = chip.dataset.persona;
    });
  });

  // ---------- Config ----------
  fetch("/api/config")
    .then((r) => r.json())
    .then((cfg) => {
      modelNameEl.textContent = cfg.model;
      apiStatusEl.classList.toggle("ok", cfg.has_api_key);
      apiStatusEl.title = cfg.has_api_key
        ? "OPENAI_API_KEY đã cấu hình"
        : "Thiếu OPENAI_API_KEY trong .env";
    })
    .catch(() => {});

  // ---------- Helpers ----------
  function clearEmptyState() {
    const empty = messagesEl.querySelector(".empty-state");
    if (empty) empty.remove();
  }

  function addMessage(role, text) {
    clearEmptyState();
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;
    wrap.innerHTML = `
      <div class="avatar">${role === "user" ? "🧑" : "🤖"}</div>
      <div class="bubble"></div>
    `;
    wrap.querySelector(".bubble").textContent = text;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap.querySelector(".bubble");
  }

  function addTyping() {
    clearEmptyState();
    const wrap = document.createElement("div");
    wrap.className = "msg assistant";
    wrap.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="bubble typing-dots"><span></span><span></span><span></span></div>
    `;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function updateStats() {
    statTurns.textContent = session.turns;
    statTokens.textContent = session.tokens;
    statCost.textContent = `$${session.cost.toFixed(4)}`;
  }

  function autoGrow(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }
  chatInput.addEventListener("input", () => autoGrow(chatInput));

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  // ---------- Reset ----------
  resetBtn.addEventListener("click", () => {
    history = [];
    session = { turns: 0, tokens: 0, cost: 0 };
    updateStats();
    messagesEl.innerHTML = `<div class="empty-state"><p>Phiên mới đã bắt đầu. Hãy đặt câu hỏi cho trợ lý.</p></div>`;
  });

  // ---------- Chat submit ----------
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage("user", message);
    chatInput.value = "";
    autoGrow(chatInput);
    sendBtn.disabled = true;

    const typingWrap = addTyping();
    let bubble = null;
    let acc = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: personaEl.value.trim(),
          message,
          history,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Lỗi HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // phần chưa hoàn chỉnh, giữ lại cho vòng sau

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (payload.delta) {
            if (!bubble) {
              typingWrap.remove();
              bubble = addMessage("assistant", "").parentElement.querySelector(".bubble");
            }
            acc += payload.delta;
            bubble.textContent = acc;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }

          if (payload.done) {
            history = payload.history;
            session.turns += 1;
            session.tokens += payload.cost.input_tokens + payload.cost.output_tokens;
            session.cost += payload.cost.total_cost;
            updateStats();
          }
        }
      }
    } catch (err) {
      typingWrap.remove();
      const bub = addMessage("assistant", `⚠️ ${err.message}`);
      bub.classList.add("error");
    } finally {
      sendBtn.disabled = false;
    }
  });

  // ---------- Compare submit ----------
  compareForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = compareInput.value.trim();
    if (!prompt) return;

    compareBtn.disabled = true;
    compareResult.innerHTML = `<p style="color:var(--text-dim);grid-column:1/-1;">Đang gọi cả hai model...</p>`;

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Lỗi HTTP ${res.status}`);

      compareResult.innerHTML = `
        <div class="compare-card">
          <h3>GPT-4o <span class="badge">chính</span></h3>
          <p>${escapeHtml(data.gpt4o_response)}</p>
          <div class="compare-meta">
            <span>⏱ ${data.gpt4o_latency.toFixed(2)}s</span>
            <span>💵 $${data.gpt4o_cost_estimate.toFixed(5)}</span>
          </div>
        </div>
        <div class="compare-card">
          <h3>GPT-4o-mini <span class="badge">nhanh &amp; rẻ</span></h3>
          <p>${escapeHtml(data.mini_response)}</p>
          <div class="compare-meta">
            <span>⏱ ${data.mini_latency.toFixed(2)}s</span>
            <span>💵 $${data.mini_cost_estimate.toFixed(5)}</span>
          </div>
        </div>
      `;
    } catch (err) {
      compareResult.innerHTML = `<p style="color:var(--danger);grid-column:1/-1;">⚠️ ${escapeHtml(err.message)}</p>`;
    } finally {
      compareBtn.disabled = false;
    }
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  updateStats();
})();
