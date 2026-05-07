# REQUIREMENTS.md
# Vietnam YouTube Analytics Dashboard + AI Module
# Đồ án cuối kỳ — Trực quan hóa dữ liệu

> **Dành cho Claude Code:** Đây là file yêu cầu hoàn chỉnh. Đọc toàn bộ trước khi viết bất kỳ dòng code nào. File này là nguồn sự thật duy nhất (single source of truth) cho toàn bộ đồ án.

---

## 1. Bối cảnh & Mục tiêu

### 1.1 Đề bài tóm tắt
Xây dựng **dashboard trực quan hóa dữ liệu** phân tích hành vi nội dung YouTube Việt Nam, kèm **module AI hỗ trợ phân tích** theo mô hình Human-in-the-loop. Hệ thống trình bày trong buổi vấn đáp cuối kỳ.

**Bối cảnh thị trường (theo Digital 2025 Vietnam — DataReportal):**
- YouTube đạt **62,3 triệu người dùng tại Việt Nam** đầu 2025 (61,5% dân số), ad reach 78% người dùng internet.
- **YouTube Shorts** nhận hơn 70 tỷ view toàn cầu/ngày từ cuối 2020, định hình lại nội dung VN giai đoạn 2021–2025.
- **YouTube Shopping ra mắt tại VN tháng 10/2024** — VN nằm trong 6 quốc gia đầu tiên; chỉ sau 1 năm, watch time nội dung mua sắm tại VN tăng hơn **500%**.
- Số kênh YouTube VN có doanh thu hàng tỷ đồng tăng hơn **35%** vào cuối 2024.

→ Dataset trải dài 2015–2026 (chủ yếu 2024–2026, ~73%) đủ rộng để bắt được toàn bộ chuỗi biến động: TV truyền thống → long-form → bùng nổ short-form → COVID → YouTube Shopping.

### 1.2 Dữ liệu
| File | Rows | Cols | Mô tả |
|---|---|---|---|
| `videos_processed.csv` | 30,778 | 37 | Metadata + metrics của từng video |
| `channels_processed.csv` | 56 | 25 | Thống kê tổng hợp theo channel |

**Nguồn:** [Kaggle — YouTube Video Analytics Vietnam](https://www.kaggle.com/datasets/nguyncng111/youtube-video-in-vietnam/data)

100% dữ liệu từ các kênh YouTube Việt Nam (country = VN) — đáp ứng yêu cầu >50% dữ liệu liên quan Việt Nam.

### 1.3 Câu hỏi nghiên cứu & 5 Mục tiêu Phân tích (RO)

**Câu hỏi nghiên cứu trung tâm:**
> *"Hệ sinh thái YouTube Việt Nam đã thay đổi như thế nào trong giai đoạn 2015–2025 dưới tác động của video short-form, và những yếu tố nào tạo ra tăng trưởng, phân hoá và bất thường trong hành vi xem – tương tác của người dùng?"*

Toàn bộ dashboard và AI module được tổ chức xoay quanh **5 Research Objectives (RO)**, mỗi RO map 1-1 với một trang dashboard:

#### RO1 — Xu hướng nội dung short-form vs long-form
Đo và trực quan hoá tỷ trọng video short-form theo năm, quý, thể loại và từng kênh. Định nghĩa thống nhất: short-form = `is_short_form=True` (đã được tính trong dataset, kết hợp `duration_sec < 180s` hoặc URL `/shorts/`). Mục tiêu: so sánh trước/sau mốc 2020–2021, xác định nhóm kênh "xoay trục" mạnh sang short-form.

#### RO2 — Tăng trưởng kênh & phân hoá theo thể loại
So sánh `median_views_per_video` và `avg_views_per_video_dataset` của 8 nhóm thể loại (Kids, Comedy, Gaming, Music, News, Vlog, Education, Sports). Phân tích phân bố theo `subscriber_tier` (**Mid/Large/Mega — 3 tier** trong dataset) và phát hiện kênh tăng trưởng bất thường qua `view_zscore`.

#### RO3 — Bất thường ở cấp video
Phát hiện video viral (`is_viral=True` — top 1% view toàn dataset). Phát hiện video có `like_view_ratio` thấp bất thường dù view rất cao (`suspect_fake_view=True`) — dấu hiệu tiềm ẩn của view không tự nhiên hoặc nội dung tranh cãi. Đối chiếu với các tháng/quý có biến động lớn (COVID, Tết, ra mắt Shorts).

#### RO4 — Quan hệ giữa biến & "nghịch lý tương tác"
Kiểm tra mối quan hệ `duration_sec` ↔ `view_count`. Phân tích `engagement_rate` theo `duration_group`, `channel_category`, `day_of_week`/`hour_posted`, `subscriber_tier`. Kiểm định giả thuyết "nghịch lý tương tác": kênh **Mid** có engagement_rate cao hơn kênh **Mega**?

#### RO5 — Creator Economy & YouTube Shopping
Từ tháng 10/2024 trở đi (mốc YouTube Shopping ra mắt VN), theo dõi tần suất video thương mại (`is_commercial=True`). So sánh view và engagement giữa video thương mại vs nội dung thuần, xác định kênh chuyển dịch mạnh sang mô hình kinh doanh nội dung (`commercial_count` cao trên `channels_processed.csv`).

**Lưu ý mapping page:** RO1 → `/short-form`, RO2 → `/channels`, RO3 → `/anomaly`, RO4 → `/interaction`, RO5 → `/economy` (chi tiết tại §3).

---

## 2. Mô tả Dataset chi tiết

### 2.1 `channels_processed.csv` (56 channels)

| Column | Type | Mô tả | Ghi chú |
|---|---|---|---|
| `channel_id` | str | ID kênh YouTube (key) | |
| `channel_name` | str | Tên kênh | |
| `channel_created_at` | datetime | Ngày tạo kênh | |
| `country` | str | Quốc gia | Tất cả = "VN" |
| `description_len` | int | Độ dài mô tả kênh | |
| `subscriber_count` | int | Tổng subscribers | Range: 686K–20M |
| `total_view_count` | int | Tổng lượt xem (YouTube) | |
| `total_video_count` | int | Tổng video đã đăng | |
| `uploads_playlist_id` | str | ID playlist upload | |
| `channel_category` | str | Danh mục kênh | 8 categories, 7 kênh mỗi loại |
| `note` | str | Tên kênh (trùng channel_name) | |
| `channel_age_years` | float | Tuổi kênh (năm) | Range: 2.86–16.7 |
| `subscriber_tier` | str | Phân nhóm subscribers | Mega/Large/Mid |
| `avg_views_per_video` | float | Avg views/video (YouTube total) | |
| `video_count_dataset` | int | Số video trong dataset | Tối đa 600/kênh |
| `total_views_dataset` | int | Tổng views trong dataset | |
| `avg_views_per_video_dataset` | float | Avg views/video trong dataset | |
| `median_views_per_video` | float | Median views/video | Ít bị skew hơn mean |
| `avg_engagement_rate` | float | Avg engagement rate kênh | (likes+comments)/views |
| `short_form_count` | int | Số video ngắn (Shorts) | |
| `viral_count` | int | Số video viral | |
| `commercial_count` | int | Số video thương mại | |
| `first_video_date` | datetime | Video đầu tiên trong dataset | |
| `last_video_date` | datetime | Video gần nhất trong dataset | |
| `short_form_ratio` | float | Tỉ lệ video ngắn | Range: 0–0.988 |

**Channel categories (8 loại, 7 kênh mỗi loại):**
`Kids | Gaming | Music | Comedy | Vlog | News | Education | Sports`

**Subscriber tiers (3 tier trong dataset thật):**
- `Mega`: 10 kênh (subscribers rất cao, ≥~8M)
- `Large`: 43 kênh (subscribers phổ biến)
- `Mid`: 3 kênh (subscribers thấp hơn)

> **Lưu ý:** [Bao_cao_de_tai.md](Bao_cao_de_tai.md) §3.2 đề xuất 4 tier (Micro/Mid/Large/Mega) nhưng dataset đã processed chỉ có 3 tier — báo cáo cuối và dashboard đều phải dùng **3 tier thực tế**. KHÔNG chia lại Micro.

### 2.2 `videos_processed.csv` (30,778 videos)

| Column | Type | Mô tả | Ghi chú |
|---|---|---|---|
| `video_id` | str | ID video YouTube (key) | |
| `channel_id` | str | FK → channels | |
| `channel_name` | str | Tên kênh | |
| `channel_category` | str | Danh mục kênh | 1 null |
| `published_at` | datetime | Thời điểm đăng | |
| `year` | int | Năm đăng | 2015–2026 |
| `month` | int | Tháng đăng | 1–12 |
| `quarter` | int | Quý | 1–4 |
| `day_of_week` | int | Ngày trong tuần | 0=Mon, 6=Sun |
| `hour_posted` | int | Giờ đăng (UTC) | 0–23 |
| `title` | str | Tiêu đề video | |
| `title_length` | int | Độ dài tiêu đề | |
| `description_len` | int | Độ dài mô tả | |
| `tags` | str | Tags (pipe-separated) | 3,799 nulls |
| `tag_count` | int | Số lượng tags | |
| `category_id` | int | ID danh mục YouTube | |
| `category_name` | str | Tên danh mục YouTube | Khác với channel_category |
| `duration_iso` | str | Duration ISO 8601 | |
| `duration_sec` | float | Duration (giây) | |
| `duration_min` | float | Duration (phút) | |
| `duration_group` | str | Nhóm thời lượng | Short/Medium/Long; 29 nulls |
| `is_short_form` | bool | Là YouTube Shorts? | ~37% True |
| `is_url_short` | bool | URL dạng youtu.be/short? | |
| `view_count` | int | Lượt xem | Range: 0–620M |
| `like_count` | int | Lượt thích | |
| `engagement_rate` | float | (likes+comments)/views | 26 nulls |
| `like_view_ratio` | float | likes/views | 26 nulls |
| `is_viral` | bool | Được xác định là viral | |
| `view_zscore` | float | Z-score views trong kênh | |
| `is_above_channel_avg` | bool | Views > avg channel? | |
| `suspect_fake_view` | bool | Nghi ngờ view ảo | |
| `median_lv_channel` | float | Median like/view ratio của kênh | |
| `is_commercial` | bool | Video thương mại | |
| `definition` | str | sd/hd | |
| `caption` | bool | Có phụ đề không | |
| `view_mean` | float | Mean views của kênh (trong dataset) | |
| `view_std` | float | Std views của kênh (trong dataset) | |

### 2.3 Key Statistics

**Videos:**
- Tổng: 30,778 videos từ 56 kênh
- Thời gian: 2015–2026 (chủ yếu 2024–2026: ~73%)
- Short form: 11,331 (~36.8%) vs Long form: 19,447 (~63.2%)
- View median: ~69,000; Mean: ~1.67M (rất skewed do viral)
- Max views: 620M (FLife TV)
- Engagement rate avg: 1.3%; max: 45%

**Categories — insights quan trọng:**
| Category | Short Form % | Avg Engagement | Viral Count |
|---|---|---|---|
| Comedy | 62.8% | 1.16% | 6 |
| Kids | 54.6% | 0.59% | 138 ⭐ |
| Music | 45.6% | 1.76% | 123 ⭐ |
| Sports | 40.8% | 1.21% | 0 |
| News | 38.8% | 1.12% | 0 |
| Education | 22.2% | 1.53% | 0 |
| Gaming | 14.6% | 1.88% ⭐ | 5 |
| Vlog | 13.4% | 1.39% | 36 |

**Posting time patterns:**
- Peak hours: 11:00–12:00 (5,100–5,200 videos), 10:00 (~2,100), 13:00 (~2,900)
- Low: 16:00–20:00 (ít nhất)
- Day of week: Khá đều, Chủ nhật ít nhất (~3,927)

**Top viral videos:**
1. FLife TV — 620M views
2. Sơn Tùng M-TP — "Nơi Này Có Anh" — 443M
3. BingGo Leaders — 400M, 349M, 334M

---

## 3. Yêu cầu Dashboard (Phần 1)

### 3.1 Kiến trúc tổng thể UI

Layout: **Sidebar navigation** (trái) + **Main content** (phải).

Mỗi trang dashboard map 1-1 với một câu chuyện trong báo cáo (RO1–RO5 ở §1.3).

**6 trang dashboard + 2 utility = 8 routes:**

| Route | Tên | RO | Charts MVP |
|---|---|---|---|
| `/` | **Tổng Quan** (Overview) | — | 3 + 4 KPI |
| `/short-form` | **Xu Hướng Short-form** | RO1 | 2 |
| `/channels` | **Tăng Trưởng Kênh** | RO2 | 2 |
| `/anomaly` | **Bất Thường & Viral** | RO3 | 2 |
| `/interaction` | **Nghịch Lý Tương Tác** | RO4 | 2 |
| `/economy` | **Creator Economy** | RO5 | 2 |
| `/ai` | **AI Workspace** | — | — |
| `/logs` | **Audit Logs** | — | — |

**Tổng 13 charts MVP** (≥10 đáp ứng DoD §11, dưới 15 vẫn còn dư cho Phase 2 mở rộng).

### 3.2 Page: Tổng Quan (`/`)

Trang landing tóm gọn 5 RO bằng 4 KPI + 3 chart "macro view" + InsightCard kể câu chuyện chung.

**KPI Cards (hàng đầu):**
- Tổng số kênh: 56
- Tổng số video: 30,778
- Tổng lượt xem: sum `view_count`
- Tỉ lệ short-form vs long-form (% từ `is_short_form`)

**Chart A1 — Phân bố kênh theo danh mục** (Pie/Donut, Recharts)
- Data: `channels.channel_category.value_counts()`
- 8 categories, 7 kênh mỗi loại → chart đều nhau
- **Cross-filter:** click slice → filter A2, A3 trên cùng trang

**Chart A2 — Tổng view theo năm** (Line, Recharts)
- Data: `videos.groupby('year')['view_count'].sum()`
- X: year 2015–2026, Y: tổng view
- Highlight tăng trưởng mạnh từ 2022; ghi chú "2026 đang cập nhật"

**Chart A3 — Tỉ lệ short-form vs long-form theo năm** (Stacked area, Recharts)
- Data: `videos.groupby('year')['is_short_form'].mean()` + `1 - mean`
- → Bắt khoảnh khắc Shorts vượt long-form (~2021–2022)

### 3.3 Page: Xu Hướng Short-form (`/short-form`) — RO1

Trả lời: *Short-form đã thay đổi nội dung VN ra sao? Kênh nào "xoay trục" mạnh?*

**Filter:** Year range slider 2015–2026, dropdown channel_category (All + 8).

**Chart B1 — Heatmap Kênh × Năm short_form_ratio** (Plotly)
- Data: `videos.groupby(['channel_name','year'])['is_short_form'].mean().unstack()`
- X: year, Y: channel_name (sort theo short_form_ratio tổng), color: green gradient
- → Phát hiện rõ nhóm kênh xoay trục từ 2021+

**Chart B2 — Short vs Long theo năm/quý** (Stacked bar, Recharts)
- Data: `videos.groupby(['year','is_short_form']).size()` (option toggle quý/năm)
- → So sánh số lượng tuyệt đối, phụ trợ cho Chart A3

### 3.4 Page: Tăng Trưởng Kênh (`/channels`) — RO2

Trả lời: *Thể loại nào tăng trưởng tốt nhất? Phân hoá Mid → Mega ra sao?*

**Filter:** Dropdown channel_category (All + 8), dropdown subscriber_tier (All + Mid/Large/Mega).

**Chart C1 — Box plot view/video theo channel_category** (Plotly)
- Data: `videos.groupby('channel_category')['view_count']`
- → Kể câu chuyện skewness: Kids có outlier cực cao nhưng median thấp

**Chart C2 — Scatter Subscribers vs Avg Views** (Plotly)
- X: `channels.subscriber_count` (log scale), Y: `avg_views_per_video_dataset`
- Size: `video_count_dataset`, Color: `channel_category`
- Tooltip: channel_name, subscriber_tier, viral_count
- → Quan sát phân hoá Mid/Large/Mega + outlier kênh nhỏ-bùng-nổ

### 3.5 Page: Bất Thường & Viral (`/anomaly`) — RO3

Trả lời: *Video viral có gì đặc biệt? Có dấu hiệu view ảo không?*

**Filter:** Dropdown channel_name (All + 56), year range slider.

**Chart D1 — Scatter view_count vs like_view_ratio** (Plotly, log-x)
- X: `view_count` (log), Y: `like_view_ratio`
- Color: `suspect_fake_view` (đỏ True / xanh False)
- Tooltip: title, channel_name, view_count, like_count
- → Vùng dưới-trái-dưới = nghi vấn view ảo

**Chart D2 — Top 15 viral videos** (Bảng + horizontal bar, Recharts)
- Data: `videos[videos.is_viral].sort_values('view_count', desc).head(15)`
- Cột: rank, title, channel_name, channel_category, view_count, engagement_rate, year
- → Top dataset: FLife TV 620M, Sơn Tùng "Nơi Này Có Anh" 443M, BingGo Leaders...

### 3.6 Page: Nghịch Lý Tương Tác (`/interaction`) — RO4

Trả lời: *Khi nào người ta engage nhiều? Kênh nhỏ có engagement cao hơn kênh lớn?*

**Filter:** Multi-select channel_category, dropdown duration_group (All + Short/Medium/Long).

**Chart E1 — Box plot engagement_rate theo duration_group × subscriber_tier** (Plotly)
- Group chính: duration_group; group phụ: subscriber_tier (3 tier)
- → Trả lời "nghịch lý tương tác": có hay không Mid > Mega về engagement?

**Chart E2 — Heatmap day_of_week × hour_posted vs avg view_count** (Plotly)
- Data: `videos.groupby(['day_of_week','hour_posted'])['view_count'].mean().unstack()`
- X: hour 0–23, Y: Mon–Sun (day_of_week 0–6)
- → "Giờ vàng" 11–12h trưa; ghi chú UTC → GMT+7

### 3.7 Page: Creator Economy (`/economy`) — RO5

Trả lời: *YouTube Shopping (10/2024) đã thay đổi nội dung VN thế nào?*

**Filter:** Year-month range (mặc định 2024-01 → 2026-05), multi-select channel_category.

**Chart F1 — Số video commercial theo tháng** (Line, Recharts)
- Data: `videos[videos.is_commercial].groupby(['year','month']).size()`
- Vertical reference line tại 2024-10 (mốc YouTube Shopping ra mắt VN)
- → Bắt được mức tăng "500% watch time" mà DataReportal báo cáo

**Chart F2 — View trung bình: commercial vs non-commercial theo category** (Grouped bar, Recharts)
- Data: `videos.groupby(['channel_category','is_commercial'])['view_count'].mean()`
- Hai bar/category (commercial vs not), color phân biệt
- → Bảng phụ: top 10 kênh theo `commercial_count` cao nhất

### 3.8 Yêu cầu tương tác (Tiêu chí 5)

- **Cross-filter (BẮT BUỘC):** Click slice trong Chart A1 (Overview) → filter A2, A3 ngay trên trang Overview. Đáp ứng yêu cầu DoD "ít nhất 1 page có cross-filter".
- **Filter cục bộ:** Mỗi page RO1–RO5 có ít nhất 1 dropdown/range slider; debounce 300ms trước khi gọi API.
- **Tooltip đầy đủ:** Mọi chart hiển thị giá trị chính xác (number formatting K/M/B).
- **Zoom/Pan:** Chart Plotly (B1, C1, C2, D1, E1, E2) hỗ trợ zoom + pan.
- **Reset filter:** Nút "Reset all filters" trên mỗi page có FilterBar.
- **Export PNG:** Plotly tích hợp sẵn nút download chart → PNG.

### 3.9 Storytelling (Tiêu chí 7) — Insight Cards 1-1 với 6 page

Mỗi page có một **InsightCard** (nền `bg-emerald-500/10`, icon 💡) tóm tắt phát hiện chính:

- **Tổng Quan:** *"30,778 video từ 56 kênh trải dài 11 năm. Bùng nổ thật sự bắt đầu từ 2022; short-form vượt mốc 50% từ 2024."*
- **RO1 — Short-form:** *"Comedy có tỉ lệ short-form cao nhất (62.8%), Vlog thấp nhất (13.4%). Vài kênh xoay trục từ ~0% → ~90% chỉ trong 2 năm."*
- **RO2 — Channels:** *"Kids có median view thấp nhưng outlier cực cao — vài video viral kéo cả kênh. Mega kênh không phải luôn đứng đầu avg view."*
- **RO3 — Anomaly:** *"Top viral: FLife TV 620M views. Music & Kids chiếm áp đảo viral count (123 + 138). Một số video view rất cao nhưng like_view_ratio bất thường thấp."*
- **RO4 — Interaction:** *"Giờ vàng 11h–12h trưa. Gaming có engagement cao nhất (1.88%) dù tỉ lệ short-form thấp. Kiểm định Mid > Mega về engagement_rate?"*
- **RO5 — Economy:** *"YouTube Shopping ra mắt 10/2024 — số video commercial tăng rõ rệt. Engagement video commercial khác biệt so với nội dung thuần."*

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
Bạn là trợ lý phân tích dữ liệu YouTube Việt Nam.

DATASET:
- videos_processed.csv: 30,778 video với các cột sau:
  {INJECT: video_schema}
- channels_processed.csv: 56 kênh với các cột sau:
  {INJECT: channel_schema}

QUY TẮC NGHIÊM NGẶT:
1. CHỈ sử dụng các cột được liệt kê trong schema. KHÔNG bịa cột mới.
2. Đọc dữ liệu từ đường dẫn: './videos_processed.csv' và './channels_processed.csv'
3. Lưu mọi biểu đồ bằng: plt.savefig('output_figure.png', dpi=100, bbox_inches='tight')
   Sau đó: plt.close()  # BẮT BUỘC để tránh memory leak
4. KHÔNG dùng plt.show()
5. Nếu cần xuất bảng: print(df.to_string()) hoặc print(df.head(20).to_string())
6. Mỗi bước code phải có comment tiếng Việt giải thích rõ ràng
7. KHÔNG import thư viện ngoài: pandas, numpy, matplotlib, seaborn, scipy
8. KHÔNG gọi network, KHÔNG os.system, KHÔNG subprocess, KHÔNG ghi file ngoài ./ 
9. Xử lý NaN trước khi tính toán

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
2. Copy `videos_processed.csv` và `channels_processed.csv` vào `SANDBOX_DIR` (symlink hoặc copy)
3. `subprocess.run(["python", "script.py"], cwd=SANDBOX_DIR, timeout=TIMEOUT, capture_output=True)`
4. Đọc `output_figure.png` nếu tồn tại → encode base64
5. Return `{stdout, stderr, figures: [base64], execution_time_ms}`
6. Cleanup `output_figure.png` và `script.py` sau khi xong

### 4.5 API Endpoints

#### `POST /api/ai/generate`
```json
// Request
{
  "prompt": "Vẽ biểu đồ so sánh engagement rate giữa 8 category",
  "conversation_history": []  // optional, cho multi-turn
}

// Response
{
  "request_id": "uuid4",
  "code": "# Đoạn code này tính và vẽ...\nimport pandas as pd\n...",
  "explanation": "Code sẽ load videos_processed.csv, group theo channel_category, tính mean engagement_rate và vẽ horizontal bar chart có màu sắc theo category.",
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
  "videos": {
    "row_count": 30778,
    "columns": [
      {"name": "video_id", "dtype": "str", "null_count": 0},
      {"name": "view_count", "dtype": "float", "null_count": 0, "min": 0, "max": 620378988, "mean": 1666310}
    ]
  },
  "channels": {
    "row_count": 56,
    "columns": [...]
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
| **Charts (interactive)** | Plotly.js + react-plotly.js | latest | Hover, zoom, heatmap |
| **Code editor** | Monaco Editor | latest | VS Code engine |
| **LLM** | Google Gemini 2.0 Flash | latest | Free tier, nhanh |
| **Database** | SQLite (aiosqlite) | latest | Đơn giản, local |
| **Package manager FE** | pnpm | latest | Nhanh |

### 5.1 Màu sắc (Design System — Cohere × Sentry × Supabase)

```css
/* Tailwind config */
primary: '#10b981'      /* emerald-500 — Supabase */
secondary: '#8b5cf6'    /* violet-500 — Sentry accent */
background: '#0f0f0f'   /* dark bg */
surface: '#1a1a2e'      /* card bg */
border: '#2d2d3a'

/* Category colors (dùng nhất quán trên toàn app) */
Kids:       '#f59e0b'   /* amber */
Gaming:     '#10b981'   /* emerald */
Music:      '#8b5cf6'   /* violet */
Comedy:     '#f97316'   /* orange */
Vlog:       '#06b6d4'   /* cyan */
News:       '#ef4444'   /* red */
Education:  '#3b82f6'   /* blue */
Sports:     '#84cc16'   /* lime */
```

---

## 6. Project Structure

```
vn-youtube-dashboard/
├── REQUIREMENTS.md         ← File này
├── INIT.md                 ← Init tasks cho Claude Code
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
│   │   ├── videos_processed.csv    ← Dataset chính
│   │   └── channels_processed.csv  ← Dataset kênh
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
│   │   ├── short-form/page.tsx     ← /short-form (RO1)
│   │   ├── channels/page.tsx       ← /channels (RO2)
│   │   ├── anomaly/page.tsx        ← /anomaly (RO3)
│   │   ├── interaction/page.tsx    ← /interaction (RO4)
│   │   ├── economy/page.tsx        ← /economy (RO5)
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
│   │   │   └── PieChart.tsx
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
│       ├── constants.ts            ← CATEGORY_COLORS, etc.
│       └── utils.ts                ← Format numbers, dates
```

---

## 7. Tiêu chí đánh giá ↔ Implementation Mapping

| Tiêu chí | Điểm | Implementation |
|---|---|---|
| 1. Nguồn dữ liệu đáng tin cậy | Cơ bản | Hiển thị nguồn Kaggle + data dictionary trên UI |
| 2. Phù hợp với mục đích | Quan trọng | Chọn đúng chart type: boxplot=phân phối, line=trend, heatmap=pattern 2 chiều |
| 3. Rõ ràng và dễ hiểu | Quan trọng | Label đầy đủ, tooltip, unit rõ ràng (K/M/B views) |
| 4. Tích hợp & liên kết | Quan trọng | Cross-filter giữa các chart, shared filter state |
| 5. Tương tác & điều hướng | Quan trọng | Plotly hover/zoom, dropdown filter, clickable elements |
| 6. Thiết kế hấp dẫn | Quan trọng | Dark theme, consistent category colors, smooth animations |
| 7. Phân tích dữ liệu | Rất quan trọng | InsightCard trên mỗi page, trend analysis, correlation |
| 8. Tích hợp AI | Rất quan trọng | Full HITL flow, Monaco editor, audit logs |

---

## 8. Câu hỏi vấn đáp chuẩn bị sẵn — map 1-1 với 5 RO

Dùng AI module để demo. Mỗi câu verify 1 RO end-to-end (prompt → code → approve → figure → log).

**Câu 1 — RO1:** *"Vẽ heatmap tỉ lệ short-form theo kênh × năm. Liệt kê 5 kênh xoay trục mạnh nhất từ 2020 sang 2024."*
```
→ AI sinh code: pivot videos.groupby(['channel_name','year'])['is_short_form'].mean(),
  seaborn heatmap; rồi diff short_form_ratio (year>=2024) - (year<2020), sort desc head(5)
```

**Câu 2 — RO2:** *"So sánh median views/video của 8 thể loại, breakdown theo subscriber_tier (3 tier)."*
```
→ AI sinh code: groupby [channel_category, subscriber_tier] → median view_count;
  grouped bar chart 3 cụm (Mid/Large/Mega) × 8 category
```

**Câu 3 — RO3:** *"Liệt kê top 10 video có suspect_fake_view=True kèm tỉ lệ like/view của chúng."*
```
→ AI sinh code: filter videos[suspect_fake_view==True], sort by view_count desc, head(10);
  print bảng video_id, title, channel_name, view_count, like_view_ratio
```

**Câu 4 — RO4:** *"Heatmap day_of_week × hour_posted vs avg view_count. Giờ nào tốt nhất để đăng?"*
```
→ AI sinh code: pivot groupby ['day_of_week','hour_posted']['view_count'].mean();
  matplotlib imshow + annotation cell có view cao nhất; ghi chú UTC → GMT+7
```

**Câu 5 — RO5:** *"Số video is_commercial theo tháng từ 2024-01. Có tăng đột biến sau 10/2024 không?"*
```
→ AI sinh code: filter year==2024+, groupby year+month → count is_commercial==True;
  line chart với vertical line tại 2024-10 (YouTube Shopping ra mắt)
```

**Câu 6 (ngoài lề, không cần code):** *"Tóm tắt 3 insight quan trọng nhất từ 5 RO của đề tài này."*
```
→ AI trả về explanation thuần, không sinh code
```

---

## 9. Data Notes — Lưu ý khi viết code phân tích

- `tags` có 3,799 nulls → `df['tags'].fillna('').apply(lambda x: x.split('|'))` khi xử lý
- `engagement_rate` có 26 nulls → luôn `.dropna()` trước khi tính stats
- `view_count` rất skewed (max 620M, median 69K) → dùng log scale khi histogram, dùng median thay mean
- `year 2026` vẫn đang diễn ra → khi trend theo năm, ghi chú "2026 (đang cập nhật)"
- `day_of_week`: 0 = Monday, 6 = Sunday (Python convention)
- `hour_posted` là UTC → thực tế GMT+7 = `hour_posted + 7 (mod 24)`
- `is_viral` do nhóm tự define dựa trên z-score — không phải định nghĩa chính thức của YouTube
- Khi join 2 file: `videos.merge(channels[['channel_id','subscriber_count','channel_age_years']], on='channel_id', how='left')`

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
- [ ] Tối thiểu **13/15 charts** được implement đầy đủ (Overview 3 + 5 RO × 2)
- [ ] KPI cards có số liệu đúng từ dataset thật
- [ ] Cross-filter hoạt động trên trang Overview (click slice Pie A1 → filter A2, A3)
- [ ] InsightCard có nội dung ý nghĩa trên **mỗi 6 trang dashboard** (1-1 với 5 RO + Tổng Quan)
- [ ] Category colors nhất quán trên toàn app theo palette §5.1

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
```

---

*File được tạo tự động từ phân tích dataset. Cập nhật lần cuối: 2026-05-07.*