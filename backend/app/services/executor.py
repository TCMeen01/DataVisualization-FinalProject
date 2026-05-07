from __future__ import annotations

import asyncio
import base64
import shutil
import sys
import time
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATASET_FILES = ("videos_processed.csv", "channels_processed.csv")


def _ensure_datasets(sandbox_dir: Path) -> None:
    for name in DATASET_FILES:
        src = DATA_DIR / name
        dst = sandbox_dir / name
        if src.exists() and not dst.exists():
            shutil.copy2(src, dst)


def _cleanup_run_script(script: Path) -> None:
    try:
        script.unlink(missing_ok=True)
    except OSError:
        pass


def _capture_figures(sandbox_dir: Path) -> list[str]:
    figures: list[str] = []
    for png in sorted(sandbox_dir.glob("*.png")):
        try:
            data = png.read_bytes()
            encoded = base64.b64encode(data).decode("ascii")
            figures.append(f"data:image/png;base64,{encoded}")
        finally:
            try:
                png.unlink(missing_ok=True)
            except OSError:
                pass
    return figures


async def run_code(code: str, sandbox_dir: Path, timeout: int = 30) -> dict[str, Any]:
    sandbox_dir = Path(sandbox_dir).resolve()
    sandbox_dir.mkdir(parents=True, exist_ok=True)
    _ensure_datasets(sandbox_dir)
    script = sandbox_dir / "run.py"
    script.write_text(code, encoding="utf-8")

    started = time.perf_counter()
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        "run.py",
        cwd=str(sandbox_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, stderr_b = await asyncio.wait_for(
            proc.communicate(), timeout=timeout
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        elapsed = int((time.perf_counter() - started) * 1000)
        figures = _capture_figures(sandbox_dir)
        _cleanup_run_script(script)
        return {
            "status": "failed",
            "stdout": "",
            "stderr": "",
            "figures": figures,
            "execution_time_ms": elapsed,
            "error_message": f"Vượt quá thời gian thực thi {timeout}s",
        }

    stdout = stdout_b.decode("utf-8", errors="replace")
    stderr = stderr_b.decode("utf-8", errors="replace")
    elapsed = int((time.perf_counter() - started) * 1000)
    figures = _capture_figures(sandbox_dir)
    _cleanup_run_script(script)

    if proc.returncode == 0:
        return {
            "status": "completed",
            "stdout": stdout,
            "stderr": stderr,
            "figures": figures,
            "execution_time_ms": elapsed,
            "error_message": None,
        }
    return {
        "status": "failed",
        "stdout": stdout,
        "stderr": stderr,
        "figures": figures,
        "execution_time_ms": elapsed,
        "error_message": stderr.strip().splitlines()[-1] if stderr.strip() else "Lỗi thực thi không rõ",
    }
