"""Frame size, palette, easing curves, and cairo helpers."""


import math


W, H, FPS, DUR = 1920, 1080, 60, 15.0

NF = int(round(FPS * DUR))

CREAM = (255, 238, 215)

AMBER = (255, 176, 0)

MUTED = (168, 148, 124)

INK = (24, 15, 6)

WHITE = (255, 255, 255)

NIGHT = (7, 6, 5)



def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x



def prog(t, a, b):
    return clamp((t - a) / (b - a))



def lerp(a, b, t):
    return a + (b - a) * t



def lerp2(a, b, t):
    return (lerp(a[0], b[0], t), lerp(a[1], b[1], t))



def smooth(a, b, x):
    u = clamp((x - a) / (b - a))
    return u * u * (3 - 2 * u)



def e_out_cubic(x):
    return 1 - (1 - x) ** 3



def e_in_cubic(x):
    return x ** 3



def e_io_cubic(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2



def e_out_expo(x):
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)



def e_in_expo(x):
    return 0.0 if x <= 0 else 2 ** (10 * x - 10)



def e_io_expo(x):
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    return 2 ** (20 * x - 10) / 2 if x < 0.5 else (2 - 2 ** (-20 * x + 10)) / 2



def e_out_back(x, s=1.70158):
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2



def e_in_back(x, s=1.70158):
    return (s + 1) * x ** 3 - s * x ** 2



def hsh(*a):
    v = math.sin(sum(x * (12.9898 + 7.233 * i) for i, x in enumerate(a)) + 0.5) * 43758.5453
    return v - math.floor(v)



def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))



def shade(c, k):
    return tuple(max(0.0, min(255.0, v * k)) for v in c)



def rgba(c, a=1.0):
    return (c[0] / 255, c[1] / 255, c[2] / 255, a)



def setc(ctx, c, a=1.0):
    ctx.set_source_rgba(*rgba(c, a))



def rrect(ctx, x, y, w, h, r):
    r = max(0.0, min(r, w / 2, h / 2))
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()
