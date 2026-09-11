# K4 — Ngày 1: Bài Tập & Phản Ánh
## Khám Phá LLM API | Phiếu Thực Hành

**Thời lượng:** 4 tiếng
**Cách làm:** Trả lời từng câu ngay sau khi hoàn thành block tương ứng —
đừng để dồn hết về cuối buổi. Thay dòng `*Câu trả lời của bạn*` bằng câu
trả lời thật (chấm tự động sẽ đếm số câu đã trả lời).

---

## Block 1 — API Cơ Bản (trả lời sau Checkpoint 1)

### Câu 1.1 — Độ nhạy của temperature
Gọi `call_openai` với temperature 0.0, 0.5, 1.0 và 1.5 dùng prompt
**"Hãy kể cho tôi một sự thật thú vị về Việt Nam."**

**Bạn nhận thấy quy luật gì qua bốn phản hồi?** (2–3 câu)
> *temperature càng cao thì mức độ trả lời của model càng được viết trau chuốt và biến tấu sáng tạo*

### Câu 1.2 — Chọn temperature cho sản phẩm
**Bạn sẽ đặt temperature bao nhiêu cho chatbot hỗ trợ khách hàng, và tại sao?**
> *tôi sẽ đặt tempature là 0.5 cho trung tính giữa mức độ sáng tạo và sự thật để câu trả lời trau chuốt hơn*

### Câu 1.3 — Đánh đổi chi phí
Kịch bản: 10.000 người dùng hoạt động mỗi ngày, mỗi người gọi API 3 lần,
mỗi lần trung bình ~350 token đầu ra.

**Ước tính GPT-4o đắt hơn GPT-4o-mini bao nhiêu lần cho workload này? Nêu một
trường hợp GPT-4o xứng đáng với chi phí và một trường hợp nên dùng mini:**
> Với 10.000 người dùng × 3 lượt/ngày × 350 token đầu ra ≈ 10.500.000 token/ngày:
> GPT-4o tốn khoảng **105 USD/ngày** (0.010 USD/1K token) trong khi GPT-4o-mini chỉ
> khoảng **6.3 USD/ngày** (0.0006 USD/1K token) — GPT-4o đắt hơn **~16.7 lần**. GPT-4o
> đáng dùng cho các tác vụ cần suy luận phức tạp, độ chính xác cao và rủi ro sai sót
> tốn kém (ví dụ: phân tích hợp đồng pháp lý, debug code nghiệp vụ quan trọng). Mini
> phù hợp cho các tác vụ khối lượng lớn, đơn giản, lặp lại như trả lời FAQ, phân loại
> ý định tin nhắn hoặc chatbot chào hỏi cơ bản — nơi sự khác biệt chất lượng không
> đáng để trả thêm 16 lần chi phí.

---

## Block 2 — System Prompt & Token (trả lời sau Checkpoint 2)

### Câu 2.1 — Sức mạnh của persona
Gọi `chat_with_system_prompt` hai lần với cùng câu hỏi
**"Giải thích blockchain là gì?"** nhưng hai system prompt khác nhau:
- "Bạn là giáo viên tiểu học, giải thích thật đơn giản cho trẻ 8 tuổi."
- "Bạn là chuyên gia tài chính, trả lời chuyên sâu bằng thuật ngữ kỹ thuật."

**Hai phản hồi khác nhau như thế nào (độ dài, từ vựng, ví dụ)? System prompt
ảnh hưởng đến hành vi model ra sao?** (3–4 câu)
> Persona "giáo viên tiểu học" mở đầu bằng "Chào các em nhỏ!", dùng phép ẩn dụ đời
> thường ("blockchain giống như một cuốn sổ tay điện tử") và tránh hoàn toàn thuật
> ngữ kỹ thuật. Persona "chuyên gia tài chính" đi thẳng vào định nghĩa kỹ thuật
> ("distributed ledger technology - DLT", "hash", "khối - block") mà không giải
> thích thêm, câu văn dày đặc thông tin hơn hẳn. Cùng một câu hỏi nhưng system
> prompt định hình hoàn toàn giọng văn, từ vựng và độ sâu kỹ thuật của câu trả lời —
> chứng minh system prompt là công cụ mạnh để "lập trình" persona mà không cần đổi
> model hay fine-tune.

### Câu 2.2 — tiktoken vs đếm từ
Chọn một đoạn văn tiếng Việt ~100 từ. So sánh số token theo `count_tokens`
(tiktoken) với ước lượng `số từ / 0.75` mà Part 1 đã dùng.

**Hai con số chênh nhau bao nhiêu phần trăm? Vì sao tiếng Việt thường tốn
nhiều token hơn tiếng Anh cùng độ dài?**
> Với đoạn văn tiếng Việt 126 từ: `count_tokens` (tiktoken, bộ mã `o200k_base` của
> gpt-4o) đếm được **149 token**, trong khi ước lượng `số từ / 0.75` cho ra **168
> token** — chênh nhau khoảng **12.8%** (ước lượng cao hơn thực tế ở đây). Thú vị là
> nếu dùng bộ mã cũ hơn (`cl100k_base`, model gpt-3.5-turbo), cùng đoạn văn đó tốn tới
> **274 token** — gần gấp đôi. Điều này cho thấy tiếng Việt vốn tốn nhiều token hơn
> tiếng Anh cùng độ dài (do dấu thanh và ký tự có dấu khiến từ bị tách thành nhiều
> subword hơn trong các bộ mã BPE huấn luyện chủ yếu trên tiếng Anh), nhưng các bộ mã
> mới như `o200k_base` đã cải thiện đáng kể độ phủ cho tiếng Việt — công thức
> "từ/0.75" vốn được hiệu chỉnh cho tiếng Anh nên không còn phản ánh đúng thực tế với
> bộ mã mới.

---

## Block 3 — Streaming & Độ Bền (trả lời sau Checkpoint 3)

### Câu 3.1 — Trải nghiệm người dùng với streaming
**Streaming quan trọng nhất trong trường hợp nào, và khi nào thì
non-streaming lại phù hợp hơn?** (1 đoạn văn)
> Streaming quan trọng nhất khi phản hồi dài và người dùng đang chờ trực tiếp (chat
> UI, trợ lý viết văn bản) — nó giúp người dùng thấy nội dung xuất hiện ngay lập tức
> thay vì nhìn màn hình trống trong nhiều giây, giảm cảm giác "app bị treo" dù tổng
> thời gian xử lý không đổi. Ngược lại, non-streaming phù hợp hơn khi kết quả cần
> được xử lý như một khối hoàn chỉnh trước khi dùng được — ví dụ gọi API để lấy JSON
> có cấu trúc, chạy xử lý hàng loạt (batch) không có người xem trực tiếp, hoặc khi
> logic phía sau cần validate/parse toàn bộ câu trả lời trước khi quyết định bước
> tiếp theo.

### Câu 3.2 — Vì sao backoff theo cấp số nhân?
**So với delay cố định (ví dụ luôn chờ 1 giây), exponential backoff có lợi
thế gì khi API bị quá tải? Điều gì xảy ra nếu hàng nghìn client cùng retry
với delay cố định giống nhau?**
> Delay cố định khiến mọi client retry đồng loạt tại cùng một thời điểm (ví dụ tất cả
> đợi đúng 1 giây rồi thử lại cùng lúc), tạo ra các đợt sóng tải đồng bộ liên tiếp
> đánh vào server — nếu server đang quá tải, làn sóng retry đồng thời này chỉ khiến
> tình trạng quá tải kéo dài thêm thay vì giảm bớt, có thể biến một sự cố tạm thời
> thành sập dịch vụ kéo dài (hiệu ứng "thundering herd"). Exponential backoff giãn
> thời gian chờ ra xa dần sau mỗi lần thất bại (0.1s, 0.2s, 0.4s...), làm các lần
> retry của các client rải đều theo thời gian thay vì dồn cục, cho server đủ thời
> gian hồi phục. Nếu có hàng nghìn client cùng backoff theo cùng lịch trình, thực tế
> nên kết hợp thêm "jitter" (random hóa nhẹ delay) để tránh chúng vẫn vô tình đồng bộ
> với nhau.

---

## Block 4 — Mini-Project (trả lời sau Checkpoint 4)

### Câu 4.1 — Thiết kế persona
**Bạn chọn persona gì cho trợ lý của mình? Viết lại system prompt đó và giải
thích 1–2 lựa chọn từ ngữ quan trọng trong prompt (ví dụ: vì sao yêu cầu
"trả lời ngắn gọn", vì sao chỉ định ngôn ngữ...):**
> Persona chọn: **"Bạn là trợ giảng thân thiện của khóa AI, trả lời ngắn gọn bằng
> tiếng Việt."** Hai lựa chọn từ ngữ quan trọng: (1) "trả lời ngắn gọn" — vì trợ lý
> chạy qua streaming trong terminal, câu trả lời dài vừa tốn token/chi phí vừa làm
> người học mất kiên nhẫn chờ đọc hết; ràng buộc độ dài ngay trong system prompt rẻ
> hơn nhiều so với việc cắt bớt câu trả lời sau khi đã sinh ra. (2) "bằng tiếng Việt"
> — chỉ định rõ ngôn ngữ để tránh model tự chuyển sang tiếng Anh khi gặp thuật ngữ kỹ
> thuật (rất hay xảy ra với các câu hỏi về AI/code), đảm bảo trải nghiệm nhất quán
> cho học viên chương trình AICB-P1.

### Câu 4.2 — Hạn chế & cải thiện
**Trợ lý của bạn hiện có hạn chế lớn nhất là gì (ví dụ: history chỉ 3 lượt,
không có bộ nhớ dài hạn, không kiểm duyệt nội dung...)? Đề xuất một cải
thiện cụ thể và mô tả ngắn cách triển khai:**
> Hạn chế lớn nhất: **history chỉ giữ 3 lượt gần nhất** (6 message) nên trợ lý "quên"
> hoàn toàn ngữ cảnh đầu buổi chat nếu hội thoại kéo dài — ví dụ học viên giới thiệu
> tên/mục tiêu học tập ở lượt 1 thì đến lượt 5 trợ lý đã không còn nhớ. Cải thiện đề
> xuất: thêm một lớp **bộ nhớ dài hạn dạng tóm tắt** — sau mỗi khi history bị cắt bớt
> (`history[-6:]`), gọi thêm 1 lần API để tóm tắt các message bị cắt thành 1-2 câu
> ngắn, lưu vào một biến `long_term_summary` và luôn chèn nó vào đầu `system prompt`
> ở mỗi lượt gọi tiếp theo. Cách này giữ ngữ cảnh quan trọng xuyên suốt phiên mà
> không làm messages list phình to (chi phí token tăng không đáng kể so với gửi lại
> toàn bộ lịch sử).

---

## Danh Sách Kiểm Tra Nộp Bài

- [ ] `python grade.py` — xem điểm tự động, mục tiêu ≥ 75/100
- [ ] Cả 4 checkpoint pytest đều pass
- [ ] Tất cả 9 câu trong file này đã được trả lời
- [ ] Đã copy bài làm vào folder `solution/`, push lên fork và dán link trên trang bài Lab ở VLearn trước 23:59 ngày 11/09/2026
