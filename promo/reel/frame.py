"""Composites a frame, then adds motion blur, bloom, chromatic aberration, grain, and vignette."""


import cairo
import numpy as np
from PIL import Image, ImageFilter

from .core import AMBER, FPS, H, NIGHT, W, WHITE, e_io_cubic, e_out_expo, lerp, prog, rgba, setc
from .story import BLUR_WINDOWS, flash, impact, shake, theme_state
from .backdrop import draw_bg, draw_hud, draw_marquee
from .intro import draw_intro
from .board import draw_board_scene
from .cards import draw_cards
from .finale import draw_logo, draw_stars, logo_geom
from .captions import draw_play_text, draw_puzzle_text, draw_score_text, draw_theme_text


def draw_world(ctx, t, th):
    draw_bg(ctx, th, t)
    if t < 4.2:
        draw_marquee(ctx, t, th)
    if t < 9.5:
        draw_board_scene(ctx, t, th)
    elif t < 12.3:
        draw_cards(ctx, t, th)



def draw_scene(ctx, t):
    sx, sy = shake(t)
    ctx.save()
    ctx.translate(sx, sy)
    th, wipe = theme_state(t)
    if wipe:
        old, new, p = wipe
        draw_world(ctx, t, old)
        X = lerp(-700, W + 700, e_io_cubic(p))
        m = ctx.get_matrix()
        ctx.save()
        ctx.identity_matrix()
        ctx.move_to(-100, -100)
        ctx.line_to(X + (-100 - 540) * 0.45, -100)
        ctx.line_to(X + (H + 100 - 540) * 0.45, H + 100)
        ctx.line_to(-100, H + 100)
        ctx.close_path()
        ctx.clip()
        ctx.set_matrix(m)
        draw_world(ctx, t, new)
        ctx.restore()
        ctx.save()
        ctx.identity_matrix()
        for lw, a, col in ((110, 0.16, new["accent"]), (14, 0.95, new["accent"]), (3, 0.9, WHITE)):
            ctx.move_to(X + (-100 - 540) * 0.45, -100)
            ctx.line_to(X + (H + 100 - 540) * 0.45, H + 100)
            setc(ctx, col, a)
            ctx.set_line_width(lw)
            ctx.stroke()
        ctx.restore()
    else:
        draw_world(ctx, t, th)

    if 12.2 <= t < 13.52:
        draw_stars(ctx, t, logo_geom()[1])
    draw_hud(ctx, t)
    draw_play_text(ctx, t)
    draw_theme_text(ctx, t, th)
    draw_puzzle_text(ctx, t)
    draw_score_text(ctx, t)
    if t >= 13.5:
        draw_logo(ctx, t)
    ctx.restore()



def draw_frame(t):
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    ctx = cairo.Context(surf)
    if t < 1.36:
        draw_intro(ctx, t)
    elif t < 1.72:
        setc(ctx, NIGHT)
        ctx.paint()
        p = prog(t, 1.36, 1.72)
        hh = (H / 2 + 90) * e_out_expo(p) + 2
        ctx.save()
        ctx.rectangle(0, 540 - hh, W, 2 * hh)
        ctx.clip()
        draw_scene(ctx, t)
        ctx.restore()
        for y in (540 - hh, 540 + hh):
            g = cairo.LinearGradient(0, y - 60, 0, y + 60)
            g.add_color_stop_rgba(0, *rgba(AMBER, 0))
            g.add_color_stop_rgba(0.5, *rgba(AMBER, 0.6 * (1 - p)))
            g.add_color_stop_rgba(1, *rgba(AMBER, 0))
            ctx.set_source(g)
            ctx.rectangle(0, y - 60, W, 120)
            ctx.fill()
            setc(ctx, WHITE, (1 - p) ** 1.5)
            ctx.rectangle(0, y - 2, W, 4)
            ctx.fill()
    else:
        draw_scene(ctx, t)
    fl = flash(t)
    if fl > 0.003:
        setc(ctx, WHITE, min(0.95, fl))
        ctx.paint()
    surf.flush()
    buf = np.ndarray((H, W, 4), np.uint8, surf.get_data())
    return np.ascontiguousarray(buf[:, :, 2::-1])



GRAIN = None

VIG = None



def init_worker():
    global GRAIN, VIG
    rng = np.random.default_rng(7)
    GRAIN = rng.normal(0, 4.5, (H + 64, W + 64)).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * 0.85 + ((yy - H / 2) / (H / 2)) ** 2)
    u = np.clip((r - 0.45) / 0.9, 0, 1)
    VIG = (1 - 0.5 * u * u * (3 - 2 * u)).astype(np.float32)



def post(rgb, t, fi):
    img = rgb.astype(np.float32)
    small = np.asarray(Image.fromarray(rgb).reduce(4)).astype(np.float32)
    bright = np.clip((small - 140) * 1.5, 0, 255).astype(np.uint8)
    bl = Image.fromarray(bright).filter(ImageFilter.GaussianBlur(9)).resize((W, H), Image.BILINEAR)
    img += np.asarray(bl).astype(np.float32) * 0.55
    k = int(round(1 + 9 * min(1.5, impact(t))))
    img[:, :, 0] = np.roll(img[:, :, 0], k, axis=1)
    img[:, :, 2] = np.roll(img[:, :, 2], -k, axis=1)
    img *= VIG[:, :, None]
    gx, gy = (fi * 37) % 64, (fi * 23) % 64
    img += GRAIN[gy:gy + H, gx:gx + W][:, :, None]
    return np.clip(img, 0, 255).astype(np.uint8)



def blurred(t):
    return any(a <= t <= b for a, b in BLUR_WINDOWS)



def render(fi):
    t = fi / FPS
    if blurred(t):
        subs = 5
        acc = np.zeros((H, W, 3), np.float32)
        for i in range(subs):
            acc += draw_frame(t + (i / (subs - 1) - 0.5) * (0.5 / FPS))
        rgb = (acc / subs).astype(np.uint8)
    else:
        rgb = draw_frame(t)
    return post(rgb, t, fi).tobytes()
