# REQUIREMENTS.md
# Hanoi Air Quality (PM2.5) Dashboard + AI Module
# Đồ án cuối kỳ — Trực quan hóa dữ liệu

> **Dành cho Claude Code:** Đây là file yêu cầu hoàn chỉnh. Đọc toàn bộ trước khi viết bất kỳ dòng code nào. File này là nguồn sự thật duy nhất (single source of truth) cho toàn bộ đồ án.

---

## 1. Bối cảnh & Mục tiêu

### 1.1 Đề bài tóm tắt
Xây dựng **dashboard trực quan hóa dữ liệu** phân tích chất lượng không khí (PM2.5) tại Hà Nội theo thời gian và điều kiện thời tiết, kèm **module AI hỗ trợ phân tích** theo mô hình Human-in-the-loop. Hệ thống trình bày trong buổi vấn đáp cuối kỳ.

**Bối cảnh vấn đề (theo WHO & các nghiên cứu khoa học):**
- WHO đặt ngưỡng an toàn PM2.5 hàng năm ở **15 µg/m³** (cập nhật 2021). Hà Nội thường xuyên vượt ngưỡng này gấp nhiều lần.
- **Hiện tượng nghịch nhiệt (thermal inversion)** vào mùa đông khiến PM2.5 Hà Nội có thể vượt **200 µg/m³** — "Hazardous" theo thang AQI Mỹ.
- Xe tải hạng nặng bị cấm lưu thông ban ngày tại Hà Nội → đổ ra đường **0h–5h sáng**, tạo đỉnh ô nhiễm đêm khuya bất ngờ.
- Mưa phùn đặc trưng mùa đông Hà Nội **không đủ lớn để rửa trôi PM2.5** kích thước micro — trái với quan niệm dân gian.
- Ô nhiễm không khí gây **~7 triệu ca tử vong/năm toàn cầu** (WHO) và là vấn đề sức khỏe công cộng số 1 tại các đô thị Đông Nam Á.

→ Dataset trải dài 2024–2026 (đo theo giờ, 14.451 dòng) đủ dày để phân tích đầy đủ các chu kỳ ngày/đêm, mùa vụ, và so sánh năm qua năm.

### 1.2 Dữ liệu
| File | Rows | Cols | Mô tả |
|---|---|---|---|
| `hanoi_air_quality.csv` | ~14,451 | ~12 | Đo PM2.5 + thời tiết theo giờ tại Hà Nội |

**Nguồn:** [Kaggle — Hanoi Air Quality (PM2.5) + Weather Data 2024-2026](https://www.kaggle.com/datasets/diabolicfox/hanoi-air-quality-pm2-5-weather-data-2024-2026)

100% dữ liệu từ trạm quan trắc tại Hà Nội, Việt Nam (US Embassy monitoring station) — đáp ứng yêu cầu >50% dữ liệu liên quan Việt Nam.

### 1.3 Câu hỏi nghiên cứu & 5 Mục tiêu Phân tích (RO)

**Câu hỏi nghiên cứu trung tâm:**
> *"Ô nhiễm không khí (PM2.5) tại Hà Nội bị chi phối bởi những yếu tố nào — và người dân nên ra ngoài vào lúc nào trong ngày, mùa nào trong năm để đảm bảo an toàn sức khỏe?"*

Toàn bộ dashboard và AI module được tổ chức xoay quanh **5 Research Objectives (RO)**, mỗi RO map 1-1 với một trang dashboard:

#### RO1 — Mùa nào ô nhiễm nhất & tại sao?
Đo và trực quan hóa PM2.5 theo 4 mùa. Kiểm tra tương quan giữa PM2.5 và nhiệt độ, độ ẩm. Mục tiêu: chứng minh **mùa đông là mùa tệ nhất** do hiện tượng nghịch nhiệt (thermal inversion), trong khi **độ ẩm cao (mưa phùn) KHÔNG làm giảm PM2.5** — trái với quan niệm thông thường.

#### RO2 — Giờ nào trong ngày nguy hiểm nhất?
Phân tích PM2.5 theo 24 giờ và theo ngày trong tuần. Mục tiêu: xác định khung giờ an toàn và nguy hiểm nhất; chứng minh **nửa đêm (0h–2h) ô nhiễm hơn 5h sáng** — trái với quan niệm "đêm khuya không khí trong lành".

#### RO3 — Thời tiết nào thực sự "giải cứu" không khí?
So sánh tương quan của từng biến thời tiết (nhiệt độ, độ ẩm, tốc độ gió, áp suất, lượng mưa) với PM2.5. Mục tiêu: chứng minh **chỉ có gió mới có tác dụng giảm ô nhiễm đáng kể**, còn mưa và độ ẩm gần như không có tác động.

#### RO4 — Xu hướng năm qua năm: cải thiện hay xấu đi?
So sánh PM2.5 cùng tháng giữa 2024, 2025, 2026 để loại bỏ yếu tố mùa vụ. Tách trend dài hạn khỏi nhiễu chu kỳ mùa bằng rolling average. Mục tiêu: trả lời liệu các biện pháp kiểm soát ô nhiễm của Hà Nội có hiệu quả không.

#### RO5 — Cuối tuần có sạch hơn ngày thường không?
So sánh PM2.5 giữa weekday (T2–T6) và weekend (T7–CN) theo từng giờ và từng mùa. Mục tiêu: chứng minh **chênh lệch dưới 10%** — cuối tuần KHÔNG sạch hơn đáng kể, vì nguồn ô nhiễm chính là xây dựng, đốt rơm rạ, công nghiệp — không phải xe cá nhân.

**Lưu ý mapping page:** RO1 → `/seasonal`, RO2 → `/hourly`, RO3 → `/weather`, RO4 → `/trend`, RO5 → `/weekend` (chi tiết tại §3).

---

## 2. Mô tả Dataset chi tiết

### 2.1 `hanoi_air_quality.csv` (~14,451 rows)

| Column | Type | Mô tả | Ghi chú |
|---|---|---|---|
| `datetime` | datetime | Thời điểm đo (theo giờ) | 2024-01-01 → 2026-02 |
| `pm25` | float | Nồng độ PM2.5 (µg/m³) | Range: ~0–500+; WHO limit: 15 µg/m³ |
| `aqi` | int | Air Quality Index (US EPA) | Derived từ pm25 nếu không có sẵn |
| `temp` | float | Nhiệt độ (°C) | Range: ~10–40°C |
| `humidity` | float | Độ ẩm tương đối (%) | Range: 30–100% |
| `wind_spd` | float | Tốc độ gió (m/s hoặc km/h) | — |
| `wind_dir` | float/str | Hướng gió (độ hoặc ký hiệu) | N/NE/E/SE/S/SW/W/NW |
| `pres` | float | Áp suất khí quyển (hPa) | — |
| `precip` | float | Lượng mưa (mm) | Nhiều giá trị 0 |

> **Lưu ý tên cột:** Tên cột gốc trong file CSV có thể khác (ví dụ `temperature`, `wind_speed`, `pressure`). File `hanoi_air_quality_dashboard.ipynb` đã có `COLUMN_MAP` tự động chuẩn hóa về các tên trên. Dashboard nên dùng cùng logic mapping này.

### 2.2 Các biến phái sinh (tự tạo khi load)

| Biến | Nguồn | Mô tả |
|---|---|---|
| `year` | `datetime.year` | Năm: 2024, 2025, 2026 |
| `month` | `datetime.month` | Tháng: 1–12 |
| `hour` | `datetime.hour` | Giờ trong ngày: 0–23 |
| `day_of_week` | `datetime.day_name()` | Tên ngày: Monday–Sunday |
| `is_weekend` | `dayofweek in [5,6]` | True nếu T7 hoặc CN |
| `season` | logic từ `month` | Spring (2–4) / Summer (5–7) / Autumn (8–10) / Winter (11–1) |
| `aqi_cat` | logic từ `aqi` | Good / Moderate / Unhealthy (Sensitive) / Unhealthy / Very Unhealthy / Hazardous |
| `month_label` | `strftime('%Y-%m')` | Dùng cho timeline |

### 2.3 AQI Categories (US EPA)

| AQI Range | Category | PM2.5 Range (µg/m³) | Màu |
|---|---|---|---|
| 0–50 | Good | 0–12 | `#00e400` |
| 51–100 | Moderate | 12.1–35.4 | `#ffff00` |
| 101–150 | Unhealthy (Sensitive) | 35.5–55.4 | `#ff7e00` |
| 151–200 | Unhealthy | 55.5–150.4 | `#ff0000` |
| 201–300 | Very Unhealthy | 150.5–250.4 | `#8f3f97` |
| 301–500 | Hazardous | 250.5–500.4 | `#7e0023` |

### 2.4 Key Statistics (ước tính từ dataset)

- Tổng: ~14,451 rows (đo theo giờ)
- Thời gian: 2024-01 → 2026-02 (~26 tháng)
- PM2.5 trung bình: ~50–60 µg/m³ (gấp 3–4× ngưỡng WHO)
- PM2.5 mùa đông: ~80–90 µg/m³ vs mùa hè: ~20–25 µg/m³
- % giờ vượt ngưỡng WHO (15 µg/m³): ~70–80%
- Tương quan PM2.5 với nhiệt độ: r ≈ −0.25 (lạnh → ô nhiễm hơn)
- Tương quan PM2.5 với độ ẩm: r ≈ 0 (gần như không có)
- Tương quan PM2.5 với tốc độ gió: r ≈ −0.15 (gió mạnh → PM2.5 giảm)

---

## 3. Yêu cầu Dashboard (Phần 1)

### 3.1 Kiến trúc tổng thể UI

Layout: **Sidebar navigation** (trái) + **Main content** (phải).

Mỗi trang dashboard map 1-1 với một câu chuyện trong báo cáo (RO1–RO5 ở §1.3).

**6 trang dashboard + 2 utility = 8 routes:**

| Route | Tên | RO | Charts MVP |
|---|---|---|---|
| `/` | **Tổng Quan** (Overview) | — | 3 + 4 KPI |
| `/seasonal` | **Ô Nhiễm Theo Mùa** | RO1 | 3 |
| `/hourly` | **Nguy Hiểm Theo Giờ** | RO2 | 3 |
| `/weather` | **Tác Động Thời Tiết** | RO3 | 3 |
| `/trend` | **Xu Hướng Năm Qua Năm** | RO4 | 3 |
| `/weekend` | **Cuối Tuần vs Ngày Thường** | RO5 | 3 |
| `/ai` | **AI Workspace** | — | — |
| `/logs` | **Audit Logs** | — | — |

**Tổng 15 charts MVP** (đáp ứng DoD §11).

### 3.2 Page: Tổng Quan (`/`)

Trang landing tóm gọn 5 RO bằng 4 KPI + 3 chart "macro view" + InsightCard kể câu chuyện chung.

**KPI Cards (hàng đầu):**
- PM2.5 trung bình toàn dataset (µg/m³)
- % giờ đo vượt ngưỡng WHO (15 µg/m³)
- Ngày ô nhiễm nhất (PM2.5 trung bình cao nhất)
- Ngày sạch nhất (PM2.5 trung bình thấp nhất)

**Chart A1 — Phân bổ mức AQI** (Donut, Recharts/Plotly)
- Data: `df['aqi_cat'].value_counts()`
- 6 categories theo thang AQI Mỹ; màu chuẩn AQI (xanh → đỏ tím)
- **Cross-filter:** click slice → filter A2, A3 trên cùng trang

**Chart A2 — PM2.5 trung bình theo tháng** (Line, Recharts)
- Data: `df.groupby('month_label')['pm25'].mean()`
- X: tháng 2024-01 → 2026-02, Y: PM2.5 (µg/m³)
- Reference line ngang tại WHO limit (15 µg/m³) và ngưỡng Unhealthy (55.5 µg/m³)

**Chart A3 — PM2.5 trung bình theo mùa** (Bar, Recharts)
- Data: `df.groupby('season')['pm25'].mean()`
- Màu riêng mỗi mùa, sắp xếp theo Spring → Summer → Autumn → Winter
- → Bộc lộ ngay "Winter là outlier" trên trang tổng quan

### 3.3 Page: Ô Nhiễm Theo Mùa (`/seasonal`) — RO1

Trả lời: *Mùa đông tệ hơn bao nhiêu lần? Độ ẩm có thực sự rửa sạch không khí không?*

**Filter:** Multi-select season, year range slider 2024–2026.

**Chart B1 — Box Plot PM2.5 theo mùa** (Plotly)
- Data: `df.groupby('season')['pm25']`
- 4 box (Spring/Summer/Autumn/Winter), màu riêng mỗi mùa
- Reference lines: WHO (15), Unhealthy (55.5), Very Unhealthy (150.5)
- → Thấy rõ mùa đông có median cao và phân tán rộng nhất

**Chart B2 — Scatter PM2.5 vs Nhiệt độ** (Plotly)
- X: `temp`, Y: `pm25`, Color: `season`
- Trend line (linear regression)
- Annotation: hiển thị hệ số r
- → Tương quan âm rõ ràng: lạnh hơn → ô nhiễm hơn

**Chart B3 — Scatter PM2.5 vs Độ ẩm** (Plotly)
- X: `humidity`, Y: `pm25`, Color: `season`
- Trend line
- Annotation nổi bật: **"⚠️ r ≈ 0 — Độ ẩm KHÔNG quyết định ô nhiễm!"**
- → Đây là counter-intuitive insight trung tâm của RO1

### 3.4 Page: Nguy Hiểm Theo Giờ (`/hourly`) — RO2

Trả lời: *Khung giờ nào an toàn nhất? Lúc nào nên tránh ra ngoài?*

**Filter:** Multi-select season, multi-select day_of_week (weekday/weekend).

**Chart C1 — Radial Bar / Polar Chart PM2.5 theo 24 giờ** (Plotly)
- Data: `df.groupby('hour')['pm25'].mean()`
- 24 cột bố trí hình tròn (0h ở đỉnh, chạy theo chiều kim đồng hồ)
- Màu gradient theo mức PM2.5 (xanh → đỏ)
- Annotation: đánh dấu đỉnh sáng (7h–9h), đỉnh tối (19h–21h), đáy (14h–16h)
- → Bộc lộ "nửa đêm ô nhiễm hơn sáng sớm"

**Chart C2 — Heatmap Giờ × Ngày trong tuần** (Plotly)
- Data: `df.pivot_table(index='day_of_week', columns='hour', values='pm25', aggfunc='mean')`
- X: 0–23h, Y: Mon–Sun, Color: YlOrRd
- → Xem thứ mấy và giờ nào là tệ nhất; so sánh weekday vs weekend

**Chart C3 — Stacked Bar % mức AQI theo khung giờ** (Recharts)
- Data: nhóm giờ thành 7 slot (Khuya 0–4h / Sáng sớm 5–8h / Buổi sáng 9–11h / Trưa 12–13h / Chiều 14–18h / Tối 19–21h / Đêm 22–23h)
- Stacked theo aqi_cat, màu chuẩn AQI
- → Tỷ lệ % "Good" vs "Hazardous" thay đổi rõ ràng theo khung giờ

### 3.5 Page: Tác Động Thời Tiết (`/weather`) — RO3

Trả lời: *Yếu tố thời tiết nào thực sự giảm ô nhiễm? "Mưa rửa bụi" có đúng không?*

**Filter:** Multi-select season.

**Chart D1 — Correlation Bar Chart** (Plotly/Recharts)
- Data: hệ số Pearson r của từng biến thời tiết (temp, humidity, wind_spd, pres, precip) với pm25
- Horizontal bar, màu xanh nếu r < 0 (giảm ô nhiễm), màu đỏ nếu r > 0 (tăng ô nhiễm)
- Annotation nổi bật trên thanh `humidity`: "r ≈ 0" và `wind_spd`: "r < 0 đáng kể"
- → Ranking rõ ràng: gió > nhiệt độ >> độ ẩm ≈ mưa ≈ 0

**Chart D2 — Scatter PM2.5 vs Tốc độ gió** (Plotly)
- X: `wind_spd`, Y: `pm25`, Color: `season`
- Trend line + hiển thị r
- → Gió mạnh → PM2.5 giảm; rõ nhất ở mùa đông

**Chart D3 — Dual-Axis Line: PM2.5 & Tốc độ gió theo ngày** (Plotly)
- X: ngày (daily average), Y trái: pm25, Y phải: wind_spd
- Hai đường màu khác nhau
- → Trực quan hóa mối quan hệ đảo ngược tức thì: đỉnh gió trùng đáy PM2.5

### 3.6 Page: Xu Hướng Năm Qua Năm (`/trend`) — RO4

Trả lời: *Hà Nội đang cải thiện hay xấu đi? Biện pháp kiểm soát ô nhiễm có hiệu quả?*

**Filter:** Year multi-select (2024 / 2025 / 2026).

**Chart E1 — Year-over-Year Line Chart** (Recharts)
- Data: `df.groupby(['year','month'])['pm25'].mean().unstack()`
- 3 đường (2024/2025/2026) trên cùng trục X = tháng (1–12)
- → So sánh cùng tháng giữa các năm, loại bỏ yếu tố mùa vụ

**Chart E2 — Heatmap năm × tháng** (Plotly)
- Data: `df.groupby(['year','month'])['pm25'].mean().unstack()`
- X: Jan–Dec, Y: 2024/2025/2026, Color: YlOrRd, có annotation số
- → Nhìn toàn cảnh: ô nào đỏ đậm nhất (năm nào, tháng nào là tệ nhất)

**Chart E3 — Rolling Average Trend** (Recharts)
- Data: daily average + rolling 7-day + rolling 30-day
- 3 đường trên cùng chart: raw (mờ), 7-day (trung bình), 30-day (xu hướng)
- Reference line WHO (15 µg/m³)
- → Tách trend thật khỏi nhiễu mùa vụ

### 3.7 Page: Cuối Tuần vs Ngày Thường (`/weekend`) — RO5

Trả lời: *"Cuối tuần không khí trong lành hơn" là đúng hay sai?*

**Filter:** Multi-select season, year range slider.

**Chart F1 — Box Plot PM2.5 theo ngày trong tuần** (Plotly)
- Data: `df.groupby('day_of_week')['pm25']`
- 7 box (T2–CN), màu phân biệt weekday (xanh) vs weekend (tím)
- Reference lines: TB ngày thường (dashed xanh) và TB cuối tuần (dashed tím)
- Annotation: "% khác biệt = X% — Gần như không đáng kể!"
- → Counter-intuitive: hai nhóm box overlap gần như hoàn toàn

**Chart F2 — Grouped Bar: PM2.5 theo ngày × mùa** (Recharts)
- 7 nhóm ngày × 4 màu mùa
- → Yếu tố mùa vụ (màu) chiếm ưu thế hơn nhiều so với yếu tố ngày trong tuần

**Chart F3 — Line so sánh Profile 24 giờ: Ngày thường vs Cuối tuần** (Recharts)
- 2 đường (weekday / weekend) trên cùng biểu đồ, trục X = 0–23h
- Fill area giữa 2 đường để thấy gap nhỏ
- Annotation: "Hai đường gần sát nhau → cuối tuần KHÔNG sạch hơn đáng kể"

### 3.8 Yêu cầu tương tác (Tiêu chí 5)

- **Cross-filter (BẮT BUỘC):** Click slice trong Chart A1 (Donut AQI trên Overview) → filter A2, A3 ngay trên trang Overview. Đáp ứng yêu cầu DoD "ít nhất 1 page có cross-filter".
- **Filter cục bộ:** Mỗi page RO1–RO5 có ít nhất 1 dropdown/range slider; debounce 300ms trước khi gọi API.
- **Tooltip đầy đủ:** Mọi chart hiển thị giá trị PM2.5 (µg/m³), AQI category, timestamp.
- **Zoom/Pan:** Chart Plotly (B1, B2, B3, C1, C2, D2, D3, E2) hỗ trợ zoom + pan.
- **Reset filter:** Nút "Reset all filters" trên mỗi page có FilterBar.
- **Export PNG:** Plotly tích hợp sẵn nút download chart → PNG.

### 3.9 Storytelling (Tiêu chí 7) — Insight Cards 1-1 với 6 page

Mỗi page có một **InsightCard** (nền `bg-emerald-500/10`, icon 💡) tóm tắt phát hiện chính:

- **Tổng Quan:** *"~14.000 giờ đo liên tục tại Hà Nội 2024–2026. PM2.5 trung bình vượt ngưỡng WHO gấp 3–4 lần. Ô nhiễm mang tính mãn tính, không chỉ là đỉnh điểm nhất thời."*
- **RO1 — Mùa:** *"Mùa đông tệ gấp ~4 lần mùa hè. Nhưng lý do KHÔNG phải thiếu mưa — lý do là nghịch nhiệt nhốt ô nhiễm sát đất. Độ ẩm cao gần như vô nghĩa."*
- **RO2 — Giờ:** *"Giờ an toàn nhất: 14h–16h chiều. Nguy hiểm nhất: 7h–9h sáng và 19h–21h tối. Bất ngờ: 0h–2h đêm ô nhiễm hơn 5h sáng."*
- **RO3 — Thời tiết:** *"Chỉ có gió mới có tác dụng phân tán PM2.5. Mưa phùn Hà Nội quá nhẹ để rửa hạt bụi micro. Áp suất cao → không khí tĩnh → ô nhiễm tích tụ."*
- **RO4 — Xu hướng:** *"Year-over-year chart loại bỏ nhiễu mùa vụ — cho thấy xu hướng thực sự. Rolling 30-day là đường 'sự thật' dài hạn."*
- **RO5 — Cuối tuần:** *"Weekday vs weekend chênh lệch <10%. Đốt rơm rạ, xây dựng, công nghiệp hoạt động cả 7 ngày — xe cá nhân chỉ là một phần nhỏ của vấn đề."*

---

## 4. Yêu cầu AI Module (Phần 2)

### 4.1 Nguyên tắc BẮT BUỘC (không được vi phạm)

```
1. AI CHỈ sinh code + giải thích. KHÔNG tự chạy bất kỳ thứ gì.
2. Code AI sinh ra mặc định ở trạng thái "pending" — CHƯA chạy.
3. User được quyền edit code trực tiếp trên Monaco Editor.
4. Code CHỈ chạy khi user nhấn nút "Phê duyệt & Thực thi".
5. Mỗi code block phải có comment tiếng Việt giải thích từng bước.
6. AI KHÔNG được bịa số liệu — chỉ dùng cột có trong schema.
7. Mọi request/code/result phải được ghi vào SQLite logs.
8. Code thực thi trong subprocess sandbox (timeout 30s, thư mục /sandbox).
```

### 4.2 Luồng hoạt động (Human-in-the-loop)

```
User nhập yêu cầu (chat box)
        ↓
POST /api/ai/generate
→ Backend gửi [system_prompt + data_schema + user_prompt] tới LLM
→ LLM trả về {code: "...", explanation: "..."}
→ Lưu DB với status = "pending"
        ↓
Frontend hiển thị:
  [Explanation text]
  [Monaco Editor với code — EDITABLE]
  [Trạng thái: ⏳ Chờ phê duyệt]
  [Nút: ✏️ Chỉnh sửa | ✅ Phê duyệt & Thực thi | ❌ Từ chối]
        ↓ (user review, optionally edit, then click Approve)
POST /api/execute  {request_id, code (có thể đã edited)}
→ Cập nhật DB: status = "approved" nếu user edit / "executing"
→ subprocess.run(code, timeout=30, cwd=SANDBOX_DIR)
→ Thu kết quả: stdout + figures (PNG base64) + tables
→ Lưu result vào DB, status = "completed" hoặc "failed"
        ↓
Frontend hiển thị kết quả:
  - Ảnh biểu đồ (nếu có)
  - Bảng dữ liệu (nếu có)
  - stdout text
  - Thời gian thực thi
```

### 4.3 System Prompt cho LLM

```
Bạn là trợ lý phân tích dữ liệu chất lượng không khí Hà Nội.

DATASET:
- hanoi_air_quality.csv: ~14,451 dòng đo PM2.5 + thời tiết theo giờ, với các cột sau:
  {INJECT: data_schema}

QUY TẮC NGHIÊM NGẶT:
1. CHỈ sử dụng các cột được liệt kê trong schema. KHÔNG bịa cột mới.
2. Đọc dữ liệu từ đường dẫn: './hanoi_air_quality.csv'
3. Lưu mọi biểu đồ bằng: plt.savefig('output_figure.png', dpi=100, bbox_inches='tight')
   Sau đó: plt.close()  # BẮT BUỘC để tránh memory leak
4. KHÔNG dùng plt.show()
5. Nếu cần xuất bảng: print(df.to_string()) hoặc print(df.head(20).to_string())
6. Mỗi bước code phải có comment tiếng Việt giải thích rõ ràng
7. KHÔNG import thư viện ngoài: pandas, numpy, matplotlib, seaborn, scipy
8. KHÔNG gọi network, KHÔNG os.system, KHÔNG subprocess, KHÔNG ghi file ngoài ./
9. Xử lý NaN trước khi tính toán
10. Cột datetime phải được parse: pd.to_datetime(df['datetime'])
11. Cột phái sinh: df['season'] = df['month'].apply(assign_season), df['hour'] = df['datetime'].dt.hour, v.v.

FORMAT TRẢ VỀ (JSON):
{
  "code": "# comment giải thích\nimport pandas as pd\n...",
  "explanation": "Giải thích ngắn gọn bằng tiếng Việt những gì code này sẽ làm"
}
KHÔNG trả về bất kỳ text nào ngoài JSON trên.
```

### 4.4 Code Execution Sandbox

```python
# backend/app/services/executor.py
import subprocess, os, base64, time
from pathlib import Path

SANDBOX_DIR = Path(os.getenv("SANDBOX_DIR", "./sandbox"))
DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
TIMEOUT = 30  # giây

def run_code(code: str) -> dict:
    # Copy data vào sandbox trước khi chạy
    # Chạy code trong subprocess với thư mục sandbox
    # Thu kết quả: stdout, stderr, figures (base64 PNG), execution_time
    # Trả về dict kết quả
    pass
```

Logic cụ thể:
1. Tạo file `script.py` trong `SANDBOX_DIR`
2. Copy `hanoi_air_quality.csv` vào `SANDBOX_DIR` (symlink hoặc copy)
3. `subprocess.run(["python", "script.py"], cwd=SANDBOX_DIR, timeout=TIMEOUT, capture_output=True)`
4. Đọc `output_figure.png` nếu tồn tại → encode base64
5. Return `{stdout, stderr, figures: [base64], execution_time_ms}`
6. Cleanup `output_figure.png` và `script.py` sau khi xong

### 4.5 API Endpoints

#### `POST /api/ai/generate`
```json
// Request
{
  "prompt": "Vẽ biểu đồ PM2.5 trung bình theo từng giờ trong ngày",
  "conversation_history": []  // optional, cho multi-turn
}

// Response
{
  "request_id": "uuid4",
  "code": "# Đoạn code này tính và vẽ...\nimport pandas as pd\n...",
  "explanation": "Code sẽ load hanoi_air_quality.csv, parse datetime, tính mean PM2.5 theo hour và vẽ polar bar chart có màu gradient theo mức ô nhiễm.",
  "status": "pending",
  "created_at": "2025-01-01T10:00:00"
}
```

#### `POST /api/execute`
```json
// Request
{
  "request_id": "uuid4",
  "code": "...",  // code user đã review (có thể đã edit)
  "approved_by": "user"
}

// Response
{
  "request_id": "uuid4",
  "status": "completed",  // or "failed"
  "stdout": "...",
  "stderr": "",
  "figures": ["data:image/png;base64,..."],  // list PNG
  "execution_time_ms": 1523,
  "error_message": null
}
```

#### `GET /api/logs`
```json
// Query params: ?page=1&limit=20&status=completed
// Response
{
  "total": 42,
  "items": [
    {
      "id": "uuid",
      "created_at": "...",
      "user_prompt": "...",
      "status": "completed",
      "execution_time_ms": 1523,
      "has_figures": true
    }
  ]
}
```

#### `GET /api/logs/{id}`
Trả đầy đủ: prompt + code gốc + code đã edit + explanation + result + figures

#### `GET /api/data/schema`
```json
{
  "air_quality": {
    "row_count": 14451,
    "columns": [
      {"name": "datetime", "dtype": "datetime", "null_count": 0},
      {"name": "pm25", "dtype": "float", "null_count": 0, "min": 0.5, "max": 523.0, "mean": 54.2},
      {"name": "aqi", "dtype": "int", "null_count": 0, "min": 2, "max": 500},
      {"name": "temp", "dtype": "float", "null_count": 0, "min": 10.2, "max": 40.1},
      {"name": "humidity", "dtype": "float", "null_count": 0, "min": 28.0, "max": 100.0},
      {"name": "wind_spd", "dtype": "float", "null_count": 0},
      {"name": "pres", "dtype": "float", "null_count": 0},
      {"name": "precip", "dtype": "float", "null_count": 0}
    ]
  }
}
```

### 4.6 SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS analysis_requests (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Input
    user_prompt TEXT NOT NULL,
    
    -- AI output
    ai_code TEXT,
    ai_explanation TEXT,
    
    -- After human review
    edited_code TEXT,          -- NULL nếu user không edit
    was_edited BOOLEAN DEFAULT FALSE,
    
    -- Status flow: pending → approved/rejected → executing → completed/failed
    status TEXT CHECK(status IN (
        'pending', 'approved', 'rejected', 
        'executing', 'completed', 'failed'
    )) DEFAULT 'pending',
    
    -- Execution result
    stdout TEXT,
    stderr TEXT,
    figures_json TEXT,         -- JSON array of base64 PNG strings
    execution_time_ms INTEGER,
    error_message TEXT,
    
    -- Metadata
    model_used TEXT DEFAULT 'gemini-2.0-flash'
);

CREATE INDEX IF NOT EXISTS idx_status ON analysis_requests(status);
CREATE INDEX IF NOT EXISTS idx_created ON analysis_requests(created_at DESC);
```

---

## 5. Tech Stack

| Layer | Technology | Version | Lý do chọn |
|---|---|---|---|
| **Backend** | FastAPI | latest | Async, typed, auto OpenAPI docs |
| **Backend runtime** | Python | 3.11+ | |
| **Package manager** | uv | latest | Nhanh hơn pip/poetry |
| **Frontend** | Next.js (App Router) | 15 | SSR + React ecosystem |
| **Language** | TypeScript | 5+ | Type safety |
| **Styling** | Tailwind CSS + shadcn/ui | latest | Design system nhanh |
| **Charts (static)** | Recharts | latest | React-native, nhẹ |
| **Charts (interactive)** | Plotly.js + react-plotly.js | latest | Hover, zoom, heatmap, polar |
| **Code editor** | Monaco Editor | latest | VS Code engine |
| **LLM** | Google Gemini 2.0 Flash | latest | Free tier, nhanh |
| **Database** | SQLite (aiosqlite) | latest | Đơn giản, local |
| **Package manager FE** | pnpm | latest | Nhanh |

### 5.1 Màu sắc (Design System — Dark Theme)

```css
/* Tailwind config */
primary: '#10b981'      /* emerald-500 — màu "Good" AQI */
secondary: '#8b5cf6'    /* violet-500 — accent */
background: '#0f0f0f'   /* dark bg */
surface: '#1a1a2e'      /* card bg */
border: '#2d2d3a'

/* AQI colors (dùng nhất quán trên toàn app) */
Good:                 '#00e400'   /* xanh lá */
Moderate:             '#ffff00'   /* vàng */
Unhealthy_Sensitive:  '#ff7e00'   /* cam */
Unhealthy:            '#ff0000'   /* đỏ */
Very_Unhealthy:       '#8f3f97'   /* tím */
Hazardous:            '#7e0023'   /* đỏ tối */

/* Season colors */
Spring:  '#74c476'   /* xanh lá nhạt */
Summer:  '#fd8d3c'   /* cam */
Autumn:  '#d4b483'   /* nâu vàng */
Winter:  '#6baed6'   /* xanh lam */
```

---

## 6. Project Structure

```
hanoi-aql-dashboard/
├── REQUIREMENTS.md         ← File này
├── CLAUDE.md               ← Guidance cho Claude Code
├── .gitignore
├── .env.example
├── README.md
│
├── backend/
│   ├── pyproject.toml      ← uv project
│   ├── app/
│   │   ├── main.py         ← FastAPI app, CORS, lifespan
│   │   ├── config.py       ← Settings từ env
│   │   ├── api/
│   │   │   ├── ai.py       ← POST /api/ai/generate
│   │   │   ├── execute.py  ← POST /api/execute
│   │   │   ├── logs.py     ← GET /api/logs, /api/logs/{id}
│   │   │   └── data.py     ← GET /api/data/schema, /api/data/preview
│   │   ├── services/
│   │   │   ├── llm/
│   │   │   │   ├── base.py         ← Abstract LLMClient
│   │   │   │   ├── gemini.py       ← Gemini implementation
│   │   │   │   └── prompts.py      ← System prompt template
│   │   │   ├── executor.py         ← Sandbox runner
│   │   │   └── db.py               ← SQLite init + helpers
│   │   └── models/
│   │       ├── request.py          ← Pydantic input schemas
│   │       └── response.py         ← Pydantic output schemas
│   ├── data/
│   │   └── hanoi_air_quality.csv   ← Dataset chính (gitignored)
│   ├── sandbox/                    ← Thư mục chạy code
│   └── logs.db                     ← SQLite (auto-created)
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx              ← Root layout + sidebar
│   │   ├── page.tsx                ← / Tổng Quan
│   │   ├── seasonal/page.tsx       ← /seasonal (RO1)
│   │   ├── hourly/page.tsx         ← /hourly (RO2)
│   │   ├── weather/page.tsx        ← /weather (RO3)
│   │   ├── trend/page.tsx          ← /trend (RO4)
│   │   ├── weekend/page.tsx        ← /weekend (RO5)
│   │   ├── ai/page.tsx             ← /ai AI workspace
│   │   └── logs/page.tsx           ← /logs
│   ├── components/
│   │   ├── ui/                     ← shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── charts/
│   │   │   ├── BarChart.tsx        ← Recharts wrapper
│   │   │   ├── LineChart.tsx
│   │   │   ├── ScatterChart.tsx    ← Plotly wrapper
│   │   │   ├── HeatmapChart.tsx    ← Plotly wrapper
│   │   │   ├── BoxPlot.tsx         ← Plotly wrapper
│   │   │   ├── PolarChart.tsx      ← Plotly polar/radial wrapper
│   │   │   └── DonutChart.tsx
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── InsightCard.tsx     ← 💡 Storytelling card
│   │   │   └── FilterBar.tsx
│   │   └── ai/
│   │       ├── ChatInput.tsx
│   │       ├── CodeBlock.tsx       ← Monaco + status + actions
│   │       ├── StatusBadge.tsx     ← pending/approved/completed
│   │       ├── ResultPanel.tsx     ← figures + tables + stdout
│   │       └── RequestCard.tsx     ← Card trong logs list
│   └── lib/
│       ├── api.ts                  ← Fetch wrapper
│       ├── constants.ts            ← AQI_COLORS, SEASON_COLORS, etc.
│       └── utils.ts                ← Format numbers, dates, PM2.5 → AQI category
```

---

## 7. Tiêu chí đánh giá ↔ Implementation Mapping

| Tiêu chí | Điểm | Implementation |
|---|---|---|
| 1. Nguồn dữ liệu đáng tin cậy | Cơ bản | Hiển thị nguồn Kaggle + US Embassy station + data dictionary trên UI |
| 2. Phù hợp với mục đích | Quan trọng | Boxplot=phân phối mùa, polar=pattern 24h, heatmap=pattern 2 chiều, scatter=tương quan |
| 3. Rõ ràng và dễ hiểu | Quan trọng | Label đầy đủ, tooltip PM2.5 (µg/m³) + AQI category, WHO reference lines |
| 4. Tích hợp & liên kết | Quan trọng | Cross-filter Donut AQI → Timeline + Bar mùa trên Overview |
| 5. Tương tác & điều hướng | Quan trọng | Plotly hover/zoom, dropdown filter mùa/năm, clickable elements |
| 6. Thiết kế hấp dẫn | Quan trọng | Dark theme, màu AQI chuẩn, màu mùa nhất quán, smooth animations |
| 7. Phân tích dữ liệu | Rất quan trọng | InsightCard counter-intuitive trên mỗi page, correlation analysis |
| 8. Tích hợp AI | Rất quan trọng | Full HITL flow, Monaco editor, audit logs |

---

## 8. Câu hỏi vấn đáp chuẩn bị sẵn — map 1-1 với 5 RO

Dùng AI module để demo. Mỗi câu verify 1 RO end-to-end (prompt → code → approve → figure → log).

**Câu 1 — RO1:** *"Vẽ box plot PM2.5 theo 4 mùa. Tính và hiển thị hệ số tương quan của nhiệt độ và độ ẩm với PM2.5."*
```
→ AI sinh code: groupby season → boxplot; corr(temp, pm25), corr(humidity, pm25);
  annotation nổi bật r(humidity) ≈ 0 vs r(temp) < 0
```

**Câu 2 — RO2:** *"Vẽ heatmap PM2.5 trung bình theo giờ × ngày trong tuần. Giờ nào và thứ nào tệ nhất?"*
```
→ AI sinh code: pivot_table hour × day_of_week → mean pm25;
  seaborn heatmap; print ra cell có giá trị cao nhất
```

**Câu 3 — RO3:** *"So sánh hệ số tương quan của tất cả biến thời tiết với PM2.5. Biến nào ảnh hưởng nhiều nhất?"*
```
→ AI sinh code: df[['temp','humidity','wind_spd','pres','precip','pm25']].corr()['pm25'];
  horizontal bar chart sắp xếp theo |r|; highlight wind_spd và humidity
```

**Câu 4 — RO4:** *"Vẽ biểu đồ so sánh PM2.5 trung bình theo tháng giữa năm 2024 và 2025. Năm nào ô nhiễm hơn?"*
```
→ AI sinh code: groupby [year, month] → mean pm25; line chart 2 đường;
  tính delta trung bình năm và kết luận
```

**Câu 5 — RO5:** *"So sánh profile PM2.5 theo 24 giờ giữa ngày thường và cuối tuần. Chênh lệch trung bình là bao nhiêu %?"*
```
→ AI sinh code: groupby [is_weekend, hour] → mean pm25;
  line chart 2 đường; tính % diff tổng và theo từng giờ
```

**Câu 6 (ngoài lề, không cần code):** *"Tóm tắt 3 insight counter-intuitive quan trọng nhất từ 5 RO của đề tài này."*
```
→ AI trả về explanation thuần, không sinh code
```

---

## 9. Data Notes — Lưu ý khi viết code phân tích

- `datetime` phải được parse trước: `pd.to_datetime(df['datetime'])`
- `pm25` có thể có outlier cực cao (>300 µg/m³) trong mùa đông — KHÔNG loại bỏ, đây là dữ liệu thật
- `precip` có rất nhiều giá trị 0 (Hà Nội không mưa phần lớn thời gian) → dùng `precip > 0` khi filter mưa
- `wind_dir` là categorical/degree → cần xử lý riêng nếu vẽ wind rose
- `aqi` có thể vắng mặt trong file gốc → tính từ `pm25` theo breakpoints EPA (đã có logic trong notebook)
- Khi vẽ trend theo tháng, ghi chú "2026 (đang cập nhật)" cho dữ liệu chưa đủ năm
- Mùa được định nghĩa theo khí hậu Bắc Việt Nam: Winter = Nov, Dec, Jan; Spring = Feb, Mar, Apr; Summer = May, Jun, Jul; Autumn = Aug, Sep, Oct
- `hour` là giờ địa phương Hà Nội (UTC+7) — nếu dataset lưu UTC thì phải cộng thêm 7h

---

## 10. .env.example

```env
# LLM
GEMINI_API_KEY=your_gemini_api_key_here

# Paths
DATA_DIR=./data
SANDBOX_DIR=./sandbox
DB_PATH=./logs.db

# Server
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Optional
LOG_LEVEL=INFO
```

---

## 11. Definition of Done

### Phần Dashboard ✅
- [ ] **8 trang** render đúng (6 dashboard map 5 RO + /ai + /logs), có navigation sidebar
- [ ] Tối thiểu **15 charts** được implement đầy đủ (Overview 3 + 5 RO × 3)
- [ ] KPI cards có số liệu đúng từ dataset thật
- [ ] Cross-filter hoạt động trên trang Overview (click slice Donut A1 → filter A2, A3)
- [ ] InsightCard có nội dung counter-intuitive trên **mỗi 6 trang dashboard** (1-1 với 5 RO + Tổng Quan)
- [ ] AQI colors và Season colors nhất quán trên toàn app theo palette §5.1
- [ ] WHO reference lines hiển thị trên mọi chart có trục PM2.5

### Phần AI Module ✅
- [ ] Chat box nhận input, gọi API `/ai/generate`
- [ ] Code hiển thị trong Monaco Editor (editable)
- [ ] Status badge hiển thị đúng state (pending/approved/completed)
- [ ] Nút Approve → gọi `/api/execute` → hiển thị kết quả
- [ ] Kết quả ảnh PNG render được trên frontend
- [ ] Kết quả bảng data render được (scrollable table)
- [ ] Trang Logs hiển thị lịch sử, có thể xem lại từng request
- [ ] SQLite có dữ liệu sau khi dùng

### Technical ✅
- [ ] `GET /health` trả 200
- [ ] `GET /api/data/schema` trả đúng schema
- [ ] Không có console error nghiêm trọng trên frontend
- [ ] README có hướng dẫn chạy local đầy đủ (≤ 5 lệnh)

---

*File được tạo cho đề tài Hanoi Air Quality (PM2.5) Dashboard. Cập nhật lần cuối: 2026-05-09.*
