#!/usr/bin/env python3
"""Deterministic Visual Evidence Capture Harness for Heliocide Viewer.

Captures exact 1600x900 screenshots across standard checkpoints:
  - A_NORMAL (t=8.0s, FIRST_PERSON)
  - C_SHARD_GOD (t=40.0s, FIRST_PERSON, modal=true)
  - D_COLLAPSE (t=65.0s, FIRST_PERSON)
  - E_BREACH (t=90.0s, FIRST_PERSON)
  - F_SIEGE_WALL (t=112.0s, FIRST_PERSON)
  - G_STATION_LOSS (t=130.0s, CINEMATIC)
  - H_REPLAY (t=138.0s, EXTERIOR_INSPECTION)
"""

import argparse
import os
import subprocess
import time
from pathlib import Path

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
USER_DATA_DIR = Path(".chrome-headless-profile").resolve()

CHECKPOINTS = {
    "A_NORMAL": {"time": 8.0, "camera": "FIRST_PERSON", "modal": "false"},
    "C_SHARD_GOD": {"time": 40.0, "camera": "FIRST_PERSON", "modal": "true"},
    "D_COLLAPSE": {"time": 65.0, "camera": "FIRST_PERSON", "modal": "false"},
    "E_BREACH": {"time": 90.0, "camera": "FIRST_PERSON", "modal": "false"},
    "F_SIEGE_WALL": {"time": 112.0, "camera": "FIRST_PERSON", "modal": "false"},
    "G_STATION_LOSS": {"time": 130.0, "camera": "CINEMATIC", "modal": "false"},
    "H_REPLAY": {"time": 138.0, "camera": "EXTERIOR_INSPECTION", "modal": "false"},
}

def capture_screenshot(checkpoint_name: str, output_path: str, port: int = 5173, custom_time: float = None, custom_camera: str = None, custom_modal: str = None):
    cfg = CHECKPOINTS.get(checkpoint_name, {"time": 8.0, "camera": "FIRST_PERSON", "modal": "false"})
    t = custom_time if custom_time is not None else cfg["time"]
    cam = custom_camera if custom_camera is not None else cfg["camera"]
    mod = custom_modal if custom_modal is not None else cfg["modal"]

    url = f"http://localhost:{port}/?time={t}&camera={cam}&modal={mod}&paused=true"
    out = Path(output_path).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

    cmd = [
        CHROME_BIN,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        f"--user-data-dir={USER_DATA_DIR}",
        "--force-device-scale-factor=1",
        "--window-size=1600,900",
        f"--virtual-time-budget=2000",
        f"--screenshot={out}",
        url
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if out.exists() and out.stat().st_size > 0:
        print(f"Captured {checkpoint_name} -> {out} ({out.stat().st_size} bytes)")
        return True
    else:
        print(f"Failed to capture {checkpoint_name}: stderr={res.stderr} stdout={res.stdout}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Capture visual checkpoints")
    parser.add_argument("--checkpoint", default="A_NORMAL", choices=list(CHECKPOINTS.keys()) + ["ALL"])
    parser.add_argument("--out", default="screenshot.png")
    parser.add_argument("--port", type=int, default=5173)
    parser.add_argument("--time", type=float, default=None)
    parser.add_argument("--camera", default=None)
    parser.add_argument("--modal", default=None)
    args = parser.parse_args()

    if args.checkpoint == "ALL":
        for cp in CHECKPOINTS:
            target_out = f"docs/visual-evolution/baselines/{cp}.png"
            capture_screenshot(cp, target_out, port=args.port)
    else:
        capture_screenshot(args.checkpoint, args.out, port=args.port, custom_time=args.time, custom_camera=args.camera, custom_modal=args.modal)

if __name__ == "__main__":
    main()
