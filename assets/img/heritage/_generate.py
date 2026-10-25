"""Engraved line art for the Heritage design (Ten Talents website).

Run:  python3 assets/img/heritage/_generate.py
Writes the SVGs next to this file. Pure standard library, deterministic output.
The leading underscore keeps this script out of the GitHub Pages build.
"""
import math
import os
import re

OUT = os.path.dirname(os.path.abspath(__file__))
GOLD_LIGHT = "#C9A96E"  # on midnight navy
GOLD_INK = "#9A7A47"    # on ivory paper


def f(v):
    s = f"{v:.1f}"
    s = s.rstrip("0").rstrip(".") if "." in s else s
    return "0" if s in ("-0", "") else s


def polar_path(fn, samples, cx=0.0, cy=0.0):
    pts = []
    for i in range(samples):
        t = 2 * math.pi * i / samples
        r = fn(t)
        pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return "M" + " ".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"


def wave_ring(rid, rm, amp, k, copies, per_wave=12, width=0.6, opacity=1.0, cos=False):
    """A guilloche braid: one wavy circle plus rotated copies (rotation = phase shift)."""
    trig = math.cos if cos else math.sin
    d = polar_path(lambda t: rm + amp * trig(k * t), k * per_wave)
    step = 360.0 / (k * copies)
    defs = f'<path id="{rid}" d="{d}"/>'
    uses = "".join(f'<use href="#{rid}" transform="rotate({f(step * j)})"/>' for j in range(1, copies))
    group = f'<g stroke-width="{width}" opacity="{opacity}"><use href="#{rid}"/>{uses}</g>'
    return defs, group


def circle(r, width=0.6, opacity=1.0, extra=""):
    return f'<circle r="{f(r)}" stroke-width="{width}" opacity="{opacity}"{extra}/>'


def beads(r, count, size=2.0, opacity=1.0):
    gap = 2 * math.pi * r / count
    return (f'<circle r="{f(r)}" stroke-width="{size}" stroke-linecap="round" '
            f'stroke-dasharray="0 {gap:.3f}" opacity="{opacity}"/>')


def svg(view, body, colour, defs="", w=None, h=None):
    size = f' width="{w}" height="{h}"' if w and h else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}"{size} fill="none" stroke="{colour}" '
            f'stroke-linejoin="round">' + (f"<defs>{defs}</defs>" if defs else "") + body + "</svg>\n")


def write(name, text):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(text)
    print(f"{name}: {len(text):,} bytes")


# ---------------------------------------------------------------- rosette
def rosette(colour):
    defs, body = [], []
    for args in [("ra", 226, 11, 60, 6, 12, 0.55, 0.9),
                 ("rb", 166, 24, 30, 10, 12, 0.5, 0.85),
                 ("rc", 88, 42, 12, 12, 16, 0.5, 0.8),
                 ("rd", 22, 9, 6, 6, 16, 0.5, 0.9)]:
        d, g = wave_ring(*args[:5], per_wave=args[5], width=args[6], opacity=args[7])
        defs.append(d); body.append(g)
    rings = [circle(252, 0.9), circle(246, 0.45), circle(238, 0.35, 0.7), circle(212, 0.6),
             beads(203, 180, 2.0, 0.85), circle(195, 0.6), circle(138, 0.55), circle(133, 0.35, 0.7),
             circle(36, 0.6), circle(32, 0.35), f'<circle r="2.2" fill="{colour}" stroke="none"/>']
    return svg("-260 -260 520 520", "".join(rings) + "".join(body), colour, "".join(defs), 520, 520)


# ---------------------------------------------------------------- band (tileable)
def band(colour):
    W, H, lam = 240, 28, 40
    def wave(amp, lam_, phase=0.0):
        pts = []
        x = -lam_
        while x <= W + lam_ + 0.01:
            y = H / 2 + amp * math.sin(2 * math.pi * x / lam_ + phase)
            pts.append(f"{f(x)} {f(y)}")
            x += lam_ / 16
        return "M" + " ".join(pts)
    defs = f'<path id="w1" d="{wave(8.5, lam)}"/><path id="w2" d="{wave(4, lam / 2)}"/>'
    copies = "".join(f'<use href="#w1" transform="translate({f(lam * j / 6)} 0)"/>' for j in range(6))
    fine = "".join(f'<use href="#w2" transform="translate({f(lam / 2 * j / 3)} 0)"/>' for j in range(3))
    body = (f'<g stroke-width="0.55">{copies}</g><g stroke-width="0.4" opacity="0.7">{fine}</g>'
            f'<path d="M0 1.2H{W}M0 {H - 1.2}H{W}" stroke-width="0.7"/>')
    return svg(f"0 0 {W} {H}", body, colour, defs, W, H)


# ---------------------------------------------------------------- medallion
def medallion(colour):
    defs, body = [], []
    d, g = wave_ring("ma", 40, 17, 10, 8, 14, 0.5, 0.9); defs.append(d); body.append(g)
    d, g = wave_ring("mb", 13, 5, 6, 4, 14, 0.45, 0.9); defs.append(d); body.append(g)
    leaves = []
    leaf = '<path id="lf" d="M0 0C4 -4.4 10.5 -4 15 0C10.5 4 4 4.4 0 0ZM1.6 0H13" stroke-width="0.6"/>'
    defs.append(leaf)
    R = 84
    def pt(deg, r=R):
        a = math.radians(deg)
        return r * math.cos(a), r * math.sin(a)
    for side in (-1, 1):  # two laurel branches rising from a tie at the base (90deg = bottom)
        for i in range(12):
            deg = 90 + side * (16 + i * 12)
            grow = deg + (90 if side < 0 else -90)  # direction the branch grows
            for off, tilt in ((4.0, 34), (-4.0, -34)):
                x, y = pt(deg, R + off)
                leaves.append(f'<use href="#lf" transform="translate({f(x)} {f(y)}) rotate({f(grow + tilt * side)})"/>')
        end = 90 + side * (16 + 12 * 12)
        x, y = pt(end)
        leaves.append(f'<use href="#lf" transform="translate({f(x)} {f(y)}) rotate({f(end + (90 if side < 0 else -90))})"/>')
    (lx0, ly0), (lx1, ly1) = pt(82), pt(90 + 16 + 12 * 12)
    (rx0, ry0), (rx1, ry1) = pt(98), pt(90 - 16 - 12 * 12)
    stem = (f'<path d="M{f(lx0)} {f(ly0)}A{R} {R} 0 0 1 {f(lx1)} {f(ly1)}" stroke-width="0.7"/>'
            f'<path d="M{f(rx0)} {f(ry0)}A{R} {R} 0 0 0 {f(rx1)} {f(ry1)}" stroke-width="0.7"/>')
    ribbon = ('<path d="M0 85C-4 80 -11 80 -11 85C-11 90 -4 90 0 85C4 80 11 80 11 85C11 90 4 90 0 85Z" stroke-width="0.6"/>'
              '<circle cy="85" r="1.8" stroke-width="0.6"/>'
              '<path d="M-1 86.5L-6 97L-3.4 95.6L-2.6 99M1 86.5L6 97L3.4 95.6L2.6 99" stroke-width="0.6"/>')
    rings = [circle(118, 1.0), circle(114, 0.4), beads(108, 120, 1.8), circle(102, 0.6),
             circle(66, 0.7), circle(62, 0.35), circle(20, 0.6), f'<circle r="1.8" fill="{colour}" stroke="none"/>']
    return svg("-122 -122 244 244", "".join(rings) + stem + "".join(leaves) + ribbon + "".join(body),
               colour, "".join(defs), 244, 244)


def heavier(text, factor):
    """Scale every stroke width, so fine engraving still reads when the art is shown small."""
    return re.sub(r'stroke-width="([0-9.]+)"', lambda m: f'stroke-width="{float(m.group(1)) * factor:.2f}"', text)


# ---------------------------------------------------------------- portico
def portico(colour):
    W, H = 480, 360
    cx = W / 2
    out = []
    pat = ('<pattern id="hz" width="6" height="2.6" patternUnits="userSpaceOnUse">'
           f'<path d="M0 1.3H6" stroke="{colour}" stroke-width="0.45"/></pattern>'
           '<pattern id="vt" width="2.4" height="6" patternUnits="userSpaceOnUse">'
           f'<path d="M1.2 0V6" stroke="{colour}" stroke-width="0.4"/></pattern>')
    # steps and stylobate
    out.append('<g stroke-width="0.9">')
    for i, (y0, y1, inset) in enumerate([(318, 326, 52), (326, 336, 40), (336, 348, 28)]):
        out.append(f'<rect x="{inset}" y="{y0}" width="{W - 2 * inset}" height="{y1 - y0}"/>')
        out.append(f'<rect x="{inset}" y="{y0 + (y1 - y0) * 0.55:.1f}" width="{W - 2 * inset}" height="{(y1 - y0) * 0.45:.1f}" fill="url(#hz)" stroke="none"/>')
    out.append(f'<path d="M8 348H{W - 8}" stroke-width="0.8"/>')
    # intercolumniation shadow (the dark cella behind the columns)
    centres = [cx + s * d for d in (29.6, 88.8, 148) for s in (-1, 1)]
    centres.sort()
    out.append(f'<rect x="{centres[0] - 20}" y="132" width="{centres[-1] - centres[0] + 40}" height="172" fill="url(#hz)" stroke="none" opacity="0.9"/>')
    out.append(f'<path d="M{centres[0] - 20} 132V304M{centres[-1] + 20} 132V304" stroke-width="0.6"/>')
    # door in the cella, centred
    out.append(f'<path d="M{cx - 18} 304V214H{cx + 18}V304" stroke-width="0.8"/>')
    out.append(f'<rect x="{cx - 18}" y="214" width="36" height="90" fill="#FBF8F2" stroke-width="0.8"/>')
    out.append(f'<path d="M{cx} 214V304M{cx - 13} 222H{cx - 4}V254H{cx - 13}ZM{cx + 4} 222H{cx + 13}V254H{cx + 4}Z'
               f'M{cx - 13} 262H{cx - 4}V296H{cx - 13}ZM{cx + 4} 262H{cx + 13}V296H{cx + 4}Z" stroke-width="0.5"/>')
    out.append('</g>')
    # columns (Doric: plinth, torus, entasis shaft with flutes, echinus, abacus)
    for c in centres:
        bw, tw = 17.5, 15.0  # half-widths at base / top of shaft
        out.append('<g stroke-width="0.8">')
        out.append(f'<path d="M{c - bw} 304L{c - tw} 134H{c + tw}L{c + bw} 304Z" fill="#FBF8F2"/>')
        for k in range(1, 7):  # flutes, denser toward the shaded right side
            p = k / 7
            q = p ** 0.8
            xb, xt = c - bw + 2 * bw * q, c - tw + 2 * tw * q
            out.append(f'<path d="M{f(xb)} 302L{f(xt)} 136" stroke-width="{0.35 + 0.35 * p:.2f}"/>')
        out.append(f'<path d="M{f(c + bw * 0.55)} 300L{f(c + tw * 0.55)} 138L{f(c + tw)} 138L{f(c + bw)} 300Z" fill="url(#vt)" stroke="none"/>')
        out.append(f'<rect x="{f(c - 23)}" y="310" width="46" height="8" fill="#FBF8F2"/>')
        out.append(f'<path d="M{f(c - 20)} 310C{f(c - 22)} 306 {f(c - 19)} 304 {f(c - bw)} 304H{f(c + bw)}C{f(c + 19)} 304 {f(c + 22)} 306 {f(c + 20)} 310Z" fill="#FBF8F2"/>')
        out.append(f'<path d="M{f(c - tw)} 134C{f(c - tw - 1)} 128 {f(c - 21)} 125 {f(c - 21)} 121H{f(c + 21)}C{f(c + 21)} 125 {f(c + tw + 1)} 128 {f(c + tw)} 134Z" fill="#FBF8F2"/>')
        out.append(f'<rect x="{f(c - 23)}" y="112" width="46" height="9" fill="#FBF8F2"/>')
        out.append('</g>')
    # entablature: architrave, frieze with triglyphs, dentils, cornice
    x0, x1 = centres[0] - 26, centres[-1] + 26
    out.append('<g stroke-width="0.8">')
    out.append(f'<rect x="{f(x0)}" y="92" width="{f(x1 - x0)}" height="20" fill="#FBF8F2"/>')
    out.append(f'<path d="M{f(x0)} 99H{f(x1)}M{f(x0)} 105H{f(x1)}" stroke-width="0.45"/>')
    out.append(f'<rect x="{f(x0)}" y="70" width="{f(x1 - x0)}" height="22" fill="#FBF8F2"/>')
    span = centres[1] - centres[0]
    tri = []
    for c in centres + [c + span / 2 for c in centres[:-1]]:
        tri.append(f'<rect x="{f(c - 6)}" y="72" width="12" height="18" fill="#FBF8F2" stroke-width="0.6"/>'
                   f'<path d="M{f(c - 2)} 74V90M{f(c + 2)} 74V90" stroke-width="0.5"/>')
    for c in [centres[i] + span / 4 * s for i in range(len(centres)) for s in (-1, 1)]:
        if x0 + 8 < c < x1 - 8:
            tri.append(f'<circle cx="{f(c)}" cy="81" r="3.2" stroke-width="0.45"/>')
    out.append("".join(tri))
    dent = "".join(f'<rect x="{f(x)}" y="64" width="4" height="5" stroke-width="0.4"/>'
                   for x in [x0 + 2 + 7 * i for i in range(int((x1 - x0 - 4) / 7))])
    out.append(f'<path d="M{f(x0 - 6)} 64H{f(x1 + 6)}M{f(x0 - 10)} 58H{f(x1 + 10)}V64H{f(x0 - 10)}Z" fill="#FBF8F2"/>')
    out.append(dent)
    out.append(f'<rect x="{f(x0 - 10)}" y="64" width="{f(x1 - x0 + 20)}" height="6" fill="url(#hz)" stroke="none" opacity="0.6"/>')
    # pediment, tympanum and a small rosette at its centre
    apex = 10
    out.append(f'<path d="M{f(x0 - 12)} 58L{f(cx)} {apex}L{f(x1 + 12)} 58Z" fill="#FBF8F2" stroke-width="0.9"/>')
    out.append(f'<path d="M{f(x0 + 6)} 54L{f(cx)} {apex + 9}L{f(x1 - 6)} 54Z" stroke-width="0.55"/>')
    out.append(f'<path d="M{f(x0 + 6)} 54L{f(cx)} {apex + 9}L{f(x1 - 6)} 54Z" fill="url(#hz)" stroke="none" opacity="0.45"/>')
    out.append(f'<circle cx="{cx}" cy="40" r="11" fill="#FBF8F2" stroke-width="0.7"/><circle cx="{cx}" cy="40" r="8" stroke-width="0.4"/>')
    petals = "".join(f'<ellipse cx="{f(cx + 4.6 * math.cos(math.radians(a)))}" cy="{f(40 + 4.6 * math.sin(math.radians(a)))}" rx="3.2" ry="1.4" '
                     f'transform="rotate({a} {f(cx + 4.6 * math.cos(math.radians(a)))} {f(40 + 4.6 * math.sin(math.radians(a)))})" stroke-width="0.4"/>'
                     for a in range(0, 360, 45))
    out.append(petals)
    out.append(f'<path d="M{f(cx)} {apex - 1}C{f(cx - 3)} {apex - 4} {f(cx - 2)} {apex - 8} {f(cx)} {apex - 10}C{f(cx + 2)} {apex - 8} {f(cx + 3)} {apex - 4} {f(cx)} {apex - 1}Z'
               f'M{f(cx - 1)} {apex - 1}C{f(cx - 5)} {apex - 2} {f(cx - 7)} {apex - 5} {f(cx - 6)} {apex - 7}M{f(cx + 1)} {apex - 1}C{f(cx + 5)} {apex - 2} {f(cx + 7)} {apex - 5} {f(cx + 6)} {apex - 7}" stroke-width="0.55"/>')
    out.append('</g>')
    return svg(f"0 0 {W} {H}", "".join(out), colour, pat, W, H)


if __name__ == "__main__":
    write("rosette.svg", rosette(GOLD_LIGHT))
    write("band.svg", band(GOLD_LIGHT))
    write("band-ink.svg", band(GOLD_INK))
    write("medallion.svg", heavier(medallion(GOLD_LIGHT), 1.8))     # small ornament on navy
    write("medallion-ink.svg", heavier(medallion(GOLD_INK), 1.3))   # larger plate on paper
    write("portico.svg", portico(GOLD_INK))
