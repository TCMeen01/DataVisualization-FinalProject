from typing import Any


def _format_columns(table_schema: dict[str, Any]) -> str:
    lines: list[str] = []
    for col in table_schema.get("columns", []):
        parts = [
            f"{col['name']}",
            f"dtype={col['dtype']}",
            f"nulls={col['null_count']}",
        ]
        if col.get("min") is not None:
            parts.append(f"min={col['min']}")
        if col.get("max") is not None:
            parts.append(f"max={col['max']}")
        if col.get("mean") is not None:
            parts.append(f"mean={col['mean']:.2f}")
        lines.append(" | ".join(parts))
    return "\n".join(lines)


def schema_dict_to_text(full_schema: dict[str, Any]) -> tuple[str, str]:
    videos = full_schema.get("videos", {})
    channels = full_schema.get("channels", {})
    video_text = (
        f"# videos_processed.csv ({videos.get('row_count', 0)} rows)\n"
        + _format_columns(videos)
    )
    channel_text = (
        f"# channels_processed.csv ({channels.get('row_count', 0)} rows)\n"
        + _format_columns(channels)
    )
    return video_text, channel_text


def build_system_prompt(video_schema_text: str, channel_schema_text: str) -> str:
    return f"""Bạn là trợ lý phân tích dữ liệu YouTube Việt Nam. Sinh code Python để phân tích/visualize từ 2 file CSV trong thư mục hiện tại: `videos_processed.csv` và `channels_processed.csv`.

## SCHEMA (CHỈ DÙNG CỘT TRONG SCHEMA NÀY, KHÔNG BỊA):

{video_schema_text}

{channel_schema_text}

## 9 QUY TẮC BẮT BUỘC:

1. Bắt buộc `import matplotlib` và gọi `matplotlib.use("Agg")` TRƯỚC khi `import matplotlib.pyplot as plt`. KHÔNG dùng `plt.show()`; chỉ dùng `plt.savefig("<tên>.png", bbox_inches="tight", dpi=120)`.
2. Mỗi đoạn code phải có comment tiếng Việt giải thích từng bước phân tích.
3. CHỈ tham chiếu cột có trong schema bên trên. KHÔNG bịa cột, KHÔNG bịa số liệu.
4. KHÔNG dùng `os.system`, KHÔNG `subprocess`, KHÔNG `eval/exec`.
5. KHÔNG gọi network (`requests`, `urllib`, `httpx`, `socket`, ...). Dữ liệu đã có sẵn trong CSV.
6. KHÔNG đọc/ghi file ngoài thư mục hiện tại (`./`). Đọc CSV bằng `pd.read_csv("videos_processed.csv")` (đường dẫn tương đối).
7. Nếu cần in bảng kết quả, dùng `print(df.head(...))` hoặc `print(df.to_string())`. Không dump quá 50 dòng.
8. Đặt tên file PNG mô tả nội dung (ví dụ `engagement_by_dow_hour.png`) và lưu nhiều file nếu có nhiều biểu đồ.
9. Trả về JSON (KHÔNG kèm markdown, KHÔNG kèm code fence) đúng format: `{{"code": "<python code>", "explanation": "<giải thích bằng tiếng Việt>"}}`.

## YÊU CẦU OUTPUT:
Chỉ trả về 1 object JSON hợp lệ với 2 key `code` và `explanation`. Trường `explanation` ngắn gọn 2-4 câu tiếng Việt.
"""
