"""Kinetic type that rides on top of each shot."""


from .core import AMBER, CREAM, MUTED, W, e_in_cubic, e_out_cubic, e_out_expo, lerp, mix, prog
from .glyphs import BOLD, MONO, measure, slam, slot, text
from .story import LAND_T, SEQ, SWAPS, THEMES
from .cards import flipped_count


X0 = 118



def draw_play_text(ctx, t):
    if not 3.95 < t < 7.2:
        return
    ex = 6.36
    a = e_out_cubic(prog(t, 4.02, 4.35)) * (1 - e_in_cubic(prog(t, ex, ex + 0.12)))
    if a > 0:
        n = sum(1 for lt in LAND_T if t >= lt)
        landed = [lt for lt in LAND_T if t >= lt]
        pop = 1 - prog(t, landed[-1], landed[-1] + 0.25) if landed else 0.0
        kw = dict(family=MONO, weight=BOLD, spacing=6, ax=0)
        text(ctx, "CRATES", X0 - (1 - a) * 30, 330, 30, MUTED, a, **kw)
        text(ctx, f"{n}/3", X0 + 188 - (1 - a) * 30, 330, 30, AMBER, a, scale=1 + 0.35 * e_out_cubic(pop), **kw)
    slam(ctx, "PUSH.", X0, 452, 150, CREAM, t, 4.5, t_exit=ex)
    slam(ctx, "NEVER", X0, 598, 118, CREAM, t, 5.0, t_exit=ex)
    slam(ctx, "PULL.", X0, 740, 150, AMBER, t, 5.5, t_exit=ex)
    slam(ctx, "SOLVED.", X0, 540, 170, AMBER, t, 6.5, t_exit=6.95, exit_dx=-140, exit_dy=0)



def draw_theme_text(ctx, t, th):
    if not 7.0 < t < 9.3:
        return
    ain = e_out_expo(prog(t, 7.05, 7.4))
    aout = e_in_cubic(prog(t, 9.02, 9.2))
    a = ain * (1 - aout)
    if a <= 0:
        return
    dx = -(1 - ain) * 60 - aout * 80
    lag = 0.07
    k = sum(1 for s in SWAPS if t >= s + lag)
    tp = prog(t, SWAPS[k - 1] + lag, SWAPS[k - 1] + lag + 0.2) if k > 0 else 1.0
    text(ctx, "THEMES", X0 + dx, 300, 30, MUTED, a, ax=0, family=MONO, weight=BOLD, spacing=6)
    num_new, num_old = str(min(k + 1, 8)), str(min(k, 8)) if k > 0 else "1"
    slot(ctx, num_old, num_new, X0 + dx, 520, 300, THEMES[SEQ[k]]["accent"], tp, a)
    text(ctx, "/8", X0 + 200 + dx, 600, 64, MUTED, a, ax=0, condensed=True)
    name_old = THEMES[SEQ[k - 1]]["name"] if k > 0 else THEMES[0]["name"]
    slot(ctx, name_old, THEMES[SEQ[k]]["name"], X0 + dx, 760, 78, CREAM, tp, a)



def draw_puzzle_text(ctx, t):
    if not 9.7 < t < 12.15:
        return
    out = e_in_cubic(prog(t, 11.95, 12.12))
    p = e_out_expo(prog(t, 9.72, 10.1))
    if p > 0:
        n = int(round(50 * e_out_cubic(prog(t, 9.72, 10.38))))
        size = 112
        wn = measure("50", size, condensed=True).adv
        ww = measure(" PUZZLES", size, condensed=True).adv
        left = 960 - (wn + ww) / 2
        y = 150 - out * 60
        ctx.save()
        ctx.rectangle(0, y - size * 0.62, W, size * 1.24)
        ctx.clip()
        dy = (1 - p) * size * 1.1
        text(ctx, f"{n:02d}", left + wn, y + dy, size, AMBER, 1 - out, ax=1, condensed=True)
        text(ctx, " PUZZLES", left + wn, y + dy, size, CREAM, 1 - out, ax=0, condensed=True)
        ctx.restore()
    q = e_out_cubic(prog(t, 10.3, 10.6))
    if q > 0:
        k = flipped_count(t)
        done = k == 50
        pulse = 1 - prog(t, 11.38, 11.7) if done else 0.0
        col = mix(MUTED, AMBER, 1.0 if done else 0.0)
        text(ctx, f"SOLVER VERIFIED   {k:02d}/50", 960, 962 + (1 - q) * 20 + out * 40, 30, col, q * (1 - out),
             family=MONO, weight=BOLD, spacing=5, scale=1 + 0.08 * pulse)



def draw_score_text(ctx, t):
    if not 12.3 < t < 13.2:
        return
    out = e_in_cubic(prog(t, 12.98, 13.14))
    a1 = e_out_cubic(prog(t, 12.36, 12.7))
    text(ctx, "LOCAL HIGH SCORES", 960, 300 - out * 30, 30, MUTED, a1 * (1 - out), family=MONO, weight=BOLD,
         spacing=lerp(30, 10, a1))
    p2 = e_out_expo(prog(t, 12.5, 12.85))
    if p2 > 0:
        ctx.save()
        ctx.rectangle(0, 712 - 60, W, 120)
        ctx.clip()
        text(ctx, "BEAT PAR. EARN ALL THREE.", 960, 712 + (1 - p2) * 95 + out * 40, 84, CREAM, 1 - out, condensed=True)
        ctx.restore()
    a3 = prog(t, 12.64, 12.9)
    text(ctx, "16 MOVES   PAR 16   0:09", 960, 790 + out * 40, 28, AMBER, a3 * (1 - out), family=MONO, weight=BOLD, spacing=3)
