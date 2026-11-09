"""Cuts src/cap/ from the raw session captures, at their own pixels or downsampled; never upsampled.

    python3 -I crop.py <raw dir> <cap dir> <job> ...

A job is  name=source.png:kind[:scale]
  kind  card   the card itself: the box of every pixel that differs from the page colour (the corner pixel), so the
               crop is exactly the card with its 2 px Outline edge and its corners
        full   the whole viewport
        well   the heatmap's well inside the card (card-relative 26..374 x 69..279 CSS px, its 1 px edge included)
        box(x,y,w,h)  any card-relative box in CSS px
  scale the stored scale (the captures are 3x; 2 stores at 2x with a Lanczos downsample); default 3
"""
import sys, os, re
from PIL import Image
import numpy as np

CAPTURE_SCALE = 3


def card_box(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    bg = a[2, 2]
    ys, xs = np.where(np.abs(a - bg).sum(2) > 12)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    raw, cap = sys.argv[1], sys.argv[2]
    os.makedirs(cap, exist_ok=True)
    for job in sys.argv[3:]:
        name, spec = job.split('=', 1)
        parts = spec.split(':')
        src, kind = parts[0], parts[1]
        scale = float(parts[2]) if len(parts) > 2 else CAPTURE_SCALE
        im = Image.open(os.path.join(raw, src)).convert('RGB')
        if kind == 'full':
            box = (0, 0) + im.size
        else:
            x0, y0, x1, y1 = card_box(im)
            if kind == 'card':
                box = (x0, y0, x1, y1)
            else:
                if kind == 'well':
                    bx, by, bw, bh = 26, 69, 348, 210
                else:
                    bx, by, bw, bh = map(float, re.match(r'box\(([^)]*)\)', kind).group(1).split(','))
                s = CAPTURE_SCALE
                box = (round(x0 + bx * s), round(y0 + by * s), round(x0 + (bx + bw) * s), round(y0 + (by + bh) * s))
        out = im.crop(box)
        if scale != CAPTURE_SCALE:
            assert scale < CAPTURE_SCALE, 'never enlarge'
            out = out.resize((round(out.width * scale / CAPTURE_SCALE), round(out.height * scale / CAPTURE_SCALE)), Image.LANCZOS)
        tag = ('%g' % scale) + 'x'
        path = os.path.join(cap, f'{name}@{tag}.png')
        out.save(path, optimize=True)
        print(path, out.size, 'from', src, box)


main()
