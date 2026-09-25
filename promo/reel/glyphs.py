"""Type set with Pillow into antialiased masks that cairo can composite."""


import math

import cairo
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFont

from .core import clamp, e_in_cubic, e_out_cubic, e_out_expo, lerp, prog, setc


SANS, MONO = "sans", "mono"

FONT_FILES = {
    SANS: "/usr/share/fonts/truetype/ubuntu/UbuntuSans[wdth,wght].ttf",
    MONO: "/usr/share/fonts/truetype/ubuntu/UbuntuMono[wght].ttf",
}

HEAVY, BOLD, MEDIUM = 800, 700, 500

_FONTS = {}

_MASKS = {}



def get_font(family, size, weight, condensed):
    key = (family, size, weight, condensed)
    f = _FONTS.get(key)
    if f is None:
        f = ImageFont.truetype(FONT_FILES[family], size)
        if family == SANS:
            f.set_variation_by_axes([75 if condensed else 100, weight])
        else:
            f.set_variation_by_axes([min(700, max(400, weight))])
        _FONTS[key] = f
    return f



class Glyphs:
    """An antialiased A8 mask of a string, positioned by its baseline-left origin."""
    __slots__ = ("surf", "arr", "ox", "oy", "adv", "ink")



def glyphs(s, size, family=SANS, weight=HEAVY, condensed=False, spacing=0.0, outline=0.0, cache=True):
    size = int(round(size))
    key = (s, size, family, weight, condensed, round(spacing, 2), outline)
    if cache and key in _MASKS:
        return _MASKS[key]
    f = get_font(family, size, weight, condensed)
    if spacing:
        xs, x = [], 0.0
        for ch in s:
            xs.append(x)
            x += f.getlength(ch) + spacing
        adv = x - spacing
        boxes = [(xs[i] + b[0], b[1], xs[i] + b[2], b[3]) for i, b in enumerate(f.getbbox(ch, anchor="ls") for ch in s)]
        l, tp = min(b[0] for b in boxes), min(b[1] for b in boxes)
        r, bt = max(b[2] for b in boxes), max(b[3] for b in boxes)
    else:
        xs, adv = None, f.getlength(s)
        l, tp, r, bt = f.getbbox(s, anchor="ls")
    stroke = int(round(outline))
    pad = stroke + 3
    w = max(1, int(math.ceil(r - l)) + 2 * pad)
    h = max(1, int(math.ceil(bt - tp)) + 2 * pad)
    ox, oy = -l + pad, -tp + pad

    def paint(sw):
        im = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(im)
        if xs is None:
            d.text((ox, oy), s, font=f, anchor="ls", fill=255, stroke_width=sw, stroke_fill=255)
        else:
            for i, ch in enumerate(s):
                d.text((ox + xs[i], oy), ch, font=f, anchor="ls", fill=255, stroke_width=sw, stroke_fill=255)
        return im

    img = ImageChops.subtract(paint(stroke), paint(0)) if stroke > 0 else paint(0)
    stride = cairo.ImageSurface.format_stride_for_width(cairo.FORMAT_A8, w)
    arr = np.zeros((h, stride), np.uint8)
    arr[:, :w] = np.asarray(img)
    g = Glyphs()
    g.arr = arr
    g.surf = cairo.ImageSurface.create_for_data(arr, cairo.FORMAT_A8, w, h, stride)
    g.ox, g.oy, g.adv, g.ink = ox, oy, adv, (l, tp, r, bt)
    if cache:
        _MASKS[key] = g
    return g



def measure(s, size, family=SANS, weight=HEAVY, condensed=False, spacing=0.0):
    return glyphs(s, size, family, weight, condensed, spacing)



def char_x(s, size, family=SANS, weight=HEAVY, condensed=False):
    f = get_font(family, int(round(size)), weight, condensed)
    return [f.getlength(s[:i]) for i in range(len(s) + 1)]



def blit(ctx, g, x, y, color=None, alpha=1.0, source=None):
    """Paint a glyph mask with its baseline origin at (x, y) in user space."""
    pat = cairo.SurfacePattern(g.surf)
    pat.set_filter(cairo.FILTER_GOOD)
    pat.set_matrix(cairo.Matrix(x0=g.ox - x, y0=g.oy - y))
    if source is None:
        setc(ctx, color, alpha)
    else:
        ctx.set_source(source)
    ctx.mask(pat)



def text(ctx, s, x, y, size, color, alpha=1.0, ax=0.5, ay=0.5, family=SANS, weight=HEAVY,
         condensed=False, spacing=0.0, scale=1.0, rot=0.0, outline=0.0):
    if alpha <= 0.003 or not s or scale <= 0.01:
        return
    exact = abs(scale - 1) < 1e-6
    eff = size * scale
    q = size if exact else max(4, round(eff / 2) * 2)
    g = glyphs(s, q, family, weight, condensed, spacing * q / size, outline, cache=exact)
    k = eff / q
    l, tp, r, bt = g.ink
    ctx.save()
    ctx.translate(x, y)
    if rot:
        ctx.rotate(rot)
    if abs(k - 1) > 1e-3:
        ctx.scale(k, k)
    blit(ctx, g, -g.adv * ax, -(tp + (bt - tp) * ay), color, alpha)
    ctx.restore()



def slam(ctx, s, x, y, size, color, t, t0, t_exit=None, exit_dx=0.0, exit_dy=-50.0):
    if t < t0:
        return
    cx = x + measure(s, size, condensed=True).adv / 2
    p = prog(t, t0, t0 + 0.34)
    e = e_out_expo(p)
    a = clamp(p * 7)
    dx = dy = 0.0
    if t_exit is not None:
        q = e_in_cubic(prog(t, t_exit, t_exit + 0.13))
        a *= 1 - q
        dx, dy = exit_dx * q, exit_dy * q
    if a <= 0.003:
        return
    for k in (1, 2, 3):
        ep = prog(t, t0 + 0.02 * k, t0 + 0.5 + 0.06 * k)
        if 0 < ep < 1:
            text(ctx, s, cx + dx, y + dy, size, color, (1 - ep) ** 1.5 * 0.5 * a, condensed=True,
                 scale=1 + 0.22 * k * e_out_cubic(ep), outline=2.0)
    text(ctx, s, cx + dx, y + dy, size, color, a, condensed=True, scale=lerp(1.65, 1.0, e))



def slot(ctx, old, new, x, y, size, color, p, a, condensed=True, family=SANS):
    ctx.save()
    ctx.rectangle(x - 40, y - size * 0.68, 620, size * 1.36)
    ctx.clip()
    e = e_out_expo(p)
    if p < 1 and old != new:
        text(ctx, old, x, y - size * 1.3 * e, size, color, a * (1 - e), ax=0, condensed=condensed, family=family)
        text(ctx, new, x, y + size * 1.3 * (1 - e), size, color, a * e, ax=0, condensed=condensed, family=family)
    else:
        text(ctx, new, x, y, size, color, a, ax=0, condensed=condensed, family=family)
    ctx.restore()
