"""Warehouse tiles, the crate, the pusher, stars, and particle effects."""


import math

import cairo

from .core import AMBER, INK, WHITE, e_out_expo, hsh, lerp, mix, prog, rgba, rrect, setc, shade
from .story import TS


def burst(ctx, x, y, t, t0, n, seed, colors, speed=(240, 760), life=(0.45, 0.8), size=(7, 16), grav=900.0):
    age = t - t0
    if age < 0 or age > life[1]:
        return
    for j in range(n):
        lf = lerp(life[0], life[1], hsh(seed, j, 1))
        if age > lf:
            continue
        ang = 2 * math.pi * hsh(seed, j, 2)
        sp = lerp(speed[0], speed[1], hsh(seed, j, 3))
        dist = sp * (1 - math.exp(-3.2 * age)) / 3.2
        px = x + math.cos(ang) * dist
        py = y + math.sin(ang) * dist + 0.5 * grav * age * age
        q = age / lf
        sz = lerp(size[0], size[1], hsh(seed, j, 4)) * (1 - q)
        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(age * 9 * (hsh(seed, j, 5) - 0.5) + hsh(seed, j, 6) * 6)
        setc(ctx, colors[j % len(colors)], (1 - q) ** 0.7)
        ctx.rectangle(-sz / 2, -sz / 2, sz, sz)
        ctx.fill()
        ctx.restore()



def ring(ctx, x, y, t, t0, r0, r1, dur=0.5, width=10.0, color=WHITE, alpha=0.9):
    p = prog(t, t0, t0 + dur)
    if p <= 0 or p >= 1:
        return
    setc(ctx, color, alpha * (1 - p) ** 1.3)
    ctx.set_line_width(max(0.5, width * (1 - p)))
    ctx.new_sub_path()
    ctx.arc(x, y, lerp(r0, r1, e_out_expo(p)), 0, 2 * math.pi)
    ctx.stroke()



def glow(ctx, x, y, r, color, a):
    if a <= 0:
        return
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    g.add_color_stop_rgba(0, *rgba(color, a))
    g.add_color_stop_rgba(1, *rgba(color, 0))
    ctx.set_source(g)
    ctx.new_sub_path()
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.fill()



def draw_floor(ctx, gx, gy, th, alpha=1.0):
    x, y = gx * TS, gy * TS
    setc(ctx, shade(th["floor"], 1.0 + 0.05 * ((gx + gy) % 2)), alpha)
    ctx.rectangle(x, y, TS, TS)
    ctx.fill()
    setc(ctx, shade(th["floor"], 1.6), 0.35 * alpha)
    ctx.set_line_width(1.5)
    ctx.rectangle(x + 0.75, y + 0.75, TS - 1.5, TS - 1.5)
    ctx.stroke()



def draw_wall(ctx, gx, gy, th, alpha=1.0):
    x, y = gx * TS, gy * TS
    ctx.save()
    ctx.rectangle(x, y, TS, TS)
    ctx.clip()
    setc(ctx, th["mortar"])
    ctx.paint_with_alpha(alpha)
    rows, g, bw = 3, TS * 0.045, TS * 0.5
    rh = TS / rows
    for r in range(rows):
        row = gy * rows + r
        off = (row % 2) * bw * 0.5
        yy = y + r * rh
        xx = math.floor((x - off) / bw) * bw + off
        while xx < x + TS:
            v = 0.84 + 0.2 * hsh(round((xx - off) / bw), row)
            setc(ctx, shade(th["wall"], v), alpha)
            ctx.rectangle(xx + g / 2, yy + g / 2, bw - g, rh - g)
            ctx.fill()
            setc(ctx, shade(th["wall"], v * 1.2), 0.9 * alpha)
            ctx.rectangle(xx + g / 2, yy + g / 2, bw - g, g)
            ctx.fill()
            xx += bw
    ctx.restore()



def draw_goal(ctx, cx, cy, th, t, scale=1.0, alpha=1.0):
    c = th["goal"]
    glow(ctx, cx, cy, TS * 0.46 * scale, c, 0.42 * alpha)
    pulse = 0.5 + 0.5 * math.sin(t * 5.0 + cx * 0.01)
    setc(ctx, c, (0.35 + 0.3 * pulse) * alpha)
    ctx.set_line_width(TS * 0.03)
    ctx.new_sub_path()
    ctx.arc(cx, cy, TS * (0.2 + 0.02 * pulse) * scale, 0, 2 * math.pi)
    ctx.stroke()
    setc(ctx, c, alpha)
    ctx.new_sub_path()
    ctx.arc(cx, cy, TS * 0.1 * scale, 0, 2 * math.pi)
    ctx.fill()



def draw_crate(ctx, cx, cy, ts, th, done=0.0, sx=1.0, sy=1.0, rot=0.0, alpha=1.0):
    if abs(sx) < 1e-3 or abs(sy) < 1e-3 or alpha <= 0:
        return
    col = mix(th["crate"], th["done"], done)
    s = ts * 0.84
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.scale(sx, sy)
    if done > 0:
        glow(ctx, 0, 0, s * 0.98, th["goal"], 0.55 * done * alpha)
    setc(ctx, (0, 0, 0), 0.38 * alpha)
    rrect(ctx, -s / 2 + ts * 0.03, -s / 2 + ts * 0.07, s, s, ts * 0.09)
    ctx.fill()
    setc(ctx, col, alpha)
    rrect(ctx, -s / 2, -s / 2, s, s, ts * 0.09)
    ctx.fill()
    dark = shade(col, 0.52)
    i = s / 2 - ts * 0.11
    setc(ctx, dark, alpha)
    ctx.set_line_width(ts * 0.055)
    rrect(ctx, -i, -i, 2 * i, 2 * i, ts * 0.03)
    ctx.stroke()
    ctx.set_line_width(ts * 0.075)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(-i, -i)
    ctx.line_to(i, i)
    ctx.move_to(i, -i)
    ctx.line_to(-i, i)
    ctx.stroke()
    setc(ctx, shade(col, 1.3), 0.85 * alpha)
    ctx.set_line_width(ts * 0.03)
    ctx.move_to(-s / 2 + ts * 0.1, -s / 2 + ts * 0.035)
    ctx.line_to(s / 2 - ts * 0.1, -s / 2 + ts * 0.035)
    ctx.stroke()
    if done > 0:
        setc(ctx, th["goal"], done * alpha)
        ctx.set_line_width(ts * 0.04)
        rrect(ctx, -s / 2 - ts * 0.05, -s / 2 - ts * 0.05, s + ts * 0.1, s + ts * 0.1, ts * 0.13)
        ctx.stroke()
    ctx.restore()



def draw_pusher(ctx, cx, cy, th, facing=1, phase=0.0, push=0.0, sx=1.0, sy=1.0, alpha=1.0, scale=1.0):
    if abs(sx) < 1e-3 or abs(sy) < 1e-3 or alpha <= 0:
        return
    ts = TS * scale
    col = th["player"]
    ctx.save()
    ctx.translate(cx, cy + ts * 0.36)
    setc(ctx, (0, 0, 0), 0.35 * alpha)
    ctx.save()
    ctx.scale(1, 0.28)
    ctx.new_sub_path()
    ctx.arc(0, 0, ts * 0.24, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()
    ctx.scale(sx * facing, sy)
    ctx.rotate(0.2 * push)
    ctx.translate(0, -ts * 0.36)
    ctx.set_line_width(ts * 0.078)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    setc(ctx, col, alpha)
    sw = math.sin(phase)
    hip, sh = (0, ts * 0.08), (0, -ts * 0.13)
    for foot in ((ts * 0.09 + ts * 0.12 * sw, ts * 0.36), (-ts * 0.09 - ts * 0.12 * sw, ts * 0.36)):
        ctx.move_to(*hip)
        ctx.line_to(*foot)
    ctx.move_to(*sh)
    ctx.line_to(*hip)
    walk = ((ts * 0.13 - ts * 0.1 * sw, ts * 0.04), (-ts * 0.13 + ts * 0.1 * sw, ts * 0.04))
    shove = ((ts * 0.31, -ts * 0.09), (ts * 0.29, -ts * 0.02))
    for a, b in zip(walk, shove):
        ctx.move_to(*sh)
        ctx.line_to(lerp(a[0], b[0], push), lerp(a[1], b[1], push))
    ctx.stroke()
    ctx.new_sub_path()
    ctx.arc(0, -ts * 0.255, ts * 0.105, 0, 2 * math.pi)
    ctx.fill()
    setc(ctx, INK, alpha)
    ctx.new_sub_path()
    ctx.arc(ts * 0.04, -ts * 0.265, ts * 0.018, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()



def draw_star(ctx, x, y, r, rot, alpha=1.0):
    if r <= 0.5 or alpha <= 0:
        return
    glow(ctx, x, y, r * 1.9, AMBER, 0.32 * alpha)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.new_path()
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.47
        ctx.line_to(math.cos(ang) * rr, math.sin(ang) * rr)
    ctx.close_path()
    g = cairo.LinearGradient(0, -r, 0, r)
    g.add_color_stop_rgba(0, *rgba((255, 226, 120), alpha))
    g.add_color_stop_rgba(1, *rgba((255, 140, 0), alpha))
    ctx.set_source(g)
    ctx.fill_preserve()
    setc(ctx, (130, 64, 0), alpha)
    ctx.set_line_width(r * 0.07)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()
    setc(ctx, WHITE, 0.35 * alpha)
    ctx.save()
    ctx.translate(-r * 0.18, -r * 0.3)
    ctx.scale(1, 0.55)
    ctx.new_sub_path()
    ctx.arc(0, 0, r * 0.2, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()
    ctx.restore()
