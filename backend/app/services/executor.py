from __future__ import annotations

import asyncio
import base64
import shutil
import subprocess
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


def _run_code_sync(code: str, sandbox_dir: Path, timeout: int) -> dict[str, Any]:
    """Sync version of run_code for Windows compatibility"""
    sandbox_dir = Path(sandbox_dir).resolve()
    sandbox_dir.mkdir(parents=True, exist_ok=True)
    _ensure_datasets(sandbox_dir)
    script = sandbox_dir / "run.py"
    script.write_text(code, encoding="utf-8")

    started = time.perf_counter()
    try:
        proc = subprocess.run(
            [sys.executable, "run.py"],
            cwd=str(sandbox_dir),
            capture_output=True,
            timeout=timeout,
        )
        stdout = proc.stdout.decode("utf-8", errors="replace")
        stderr = proc.stderr.decode("utf-8", errors="replace")
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
    except subprocess.TimeoutExpired:
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


async def run_code(code: str, sandbox_dir: Path, timeout: int = 30) -> dict[str, Any]:
    """Async wrapper around sync subprocess for Windows compatibility"""
    return await asyncio.to_thread(_run_code_sync, code, sandbox_dir, timeout)
