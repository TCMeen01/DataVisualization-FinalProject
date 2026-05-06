import asyncio
import time
from pathlib import Path


async def run_code(code: str, sandbox_dir: Path, timeout_s: int = 30) -> dict:
    sandbox_dir.mkdir(parents=True, exist_ok=True)
    script = sandbox_dir / "run.py"
    script.write_text(code, encoding="utf-8")

    started = time.perf_counter()
    proc = await asyncio.create_subprocess_exec(
        "python",
        str(script),
        cwd=str(sandbox_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=timeout_s)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        return {
            "status": "failed",
            "stdout": "",
            "stderr": f"Timeout sau {timeout_s}s",
            "execution_time_ms": int((time.perf_counter() - started) * 1000),
        }

    return {
        "status": "completed" if proc.returncode == 0 else "failed",
        "stdout": stdout_b.decode("utf-8", errors="replace"),
        "stderr": stderr_b.decode("utf-8", errors="replace"),
        "execution_time_ms": int((time.perf_counter() - started) * 1000),
    }
