"""Recompresses the rendered finals losslessly (zlib level 9, PIL's optimizer): python3 -I pack.py <finals dir>"""
import sys, os
from PIL import Image
d = sys.argv[1]
for f in sorted(os.listdir(d)):
    if f.endswith('.png'):
        p = os.path.join(d, f)
        before = os.path.getsize(p)
        Image.open(p).convert('RGB').save(p, optimize=True, compress_level=9)
        print(f, before // 1024, '->', os.path.getsize(p) // 1024, 'KB')
