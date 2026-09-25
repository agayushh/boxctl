#!/usr/bin/env python3
"""Render the 15 second boxctl promo: cairo + Pillow frames piped into ffmpeg.

python3 render.py                 full 1080p60 render -> boxctl-promo.mp4
python3 render.py --stills 2,4.8  preview frames + contact sheet in ./stills
"""
import argparse
import math
import os
import subprocess
import sys
from multiprocessing import get_context

from PIL import Image

from reel.core import FPS, H, NF, W
from reel.frame import init_worker, render


HERE = os.path.dirname(os.path.abspath(__file__))


def stills(times):
    init_worker()
    out = os.path.join(HERE, "stills")
    os.makedirs(out, exist_ok=True)
    thumbs = []
    for t in times:
        fi = int(round(t * FPS))
        img = Image.frombytes("RGB", (W, H), render(fi))
        path = os.path.join(out, f"t{t:05.2f}.png")
        img.save(path)
        thumbs.append(img.resize((W // 4, H // 4), Image.LANCZOS))
        print("still", path)
    cols = 4
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * W // 4, rows * H // 4))
    for i, th in enumerate(thumbs):
        sheet.paste(th, ((i % cols) * W // 4, (i // cols) * H // 4))
    sheet.save(os.path.join(out, "sheet.png"))
    print("sheet", os.path.join(out, "sheet.png"))


def full(workers, batch=20):
    audio = os.path.join(HERE, "promo.wav")
    out = os.path.join(HERE, "boxctl-promo.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-"]
    if os.path.exists(audio):
        cmd += ["-i", audio, "-c:a", "aac", "-b:a", "256k"]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-profile:v", "high",
            "-movflags", "+faststart", "-shortest", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    ctx = get_context("spawn")
    with ctx.Pool(workers, initializer=init_worker) as pool:
        for start in range(0, NF, batch):
            for frame in pool.map(render, range(start, min(NF, start + batch))):
                proc.stdin.write(frame)
            print(f"frames {min(NF, start + batch)}/{NF}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("wrote", out)
    return proc.returncode


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", type=str, default="")
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()
    if args.stills:
        stills([float(x) for x in args.stills.split(",")])
    else:
        sys.exit(full(args.workers))
