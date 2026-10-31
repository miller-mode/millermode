from pathlib import Path
from PIL import Image
import numpy as np, json, os
import fitz

HERE = Path(__file__).parent
WORK = HERE / ".build"
WORK.mkdir(exist_ok=True)
os.chdir(WORK)

document = fitz.open(HERE / "mm-writing.pdf")
fitz.Pixmap(document, document[0].get_images(full=True)[0][0]).save("scan.png")

im = np.asarray(Image.open('scan.png').convert('L')).astype(float)
ink = im < 140
os.makedirs('glyphs', exist_ok=True)

def runs(mask):
    out = []; start = None
    for i, v in enumerate(mask):
        if v and start is None: start = i
        if not v and start is not None: out.append([start, i]); start = None
    if start is not None: out.append([start, len(mask)])
    return out

def clusters(region, count, min_gap=6):
    spans = runs(region.sum(0) > 0)
    merged = [spans[0]]
    for span in spans[1:]:
        if span[0] - merged[-1][1] < min_gap: merged[-1][1] = span[1]
        else: merged.append(span)
    while len(merged) > count:
        gaps = [merged[i + 1][0] - merged[i][1] for i in range(len(merged) - 1)]
        i = int(np.argmin(gaps))
        merged[i] = [merged[i][0], merged[i + 1][1]]
        del merged[i + 1]
    return merged

left = ink[:, :700]
rows = runs(left.sum(1) > 0)
fixed = []
for r in rows:
    if r[1] - r[0] > 130:
        proj = left[r[0]:r[1]].sum(1).astype(float)
        mid = slice(int(len(proj) * 0.3), int(len(proj) * 0.7))
        cut = r[0] + mid.start + int(np.argmin(proj[mid]))
        fixed += [[r[0], cut], [cut, r[1]]]
    else:
        fixed.append(r)
assert len(fixed) == 26, len(fixed)

meta = {}
def save(name, crop, baseline_offset):
    ys, xs = np.where(crop)
    crop = crop[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    descent = baseline_offset - (ys.max() + 1)
    Image.fromarray(((~crop) * 255).astype(np.uint8)).save(f'glyphs/{name}.png')
    meta[name] = {'w': int(crop.shape[1]), 'h': int(crop.shape[0]), 'descent': int(descent)}

for index, (y0, y1) in enumerate(fixed):
    letter = chr(65 + index)
    band = left[y0:y1]
    cells = clusters(band, 5)
    bottoms = []
    for x0, x1 in cells:
        ys = np.where(band[:, x0:x1].any(1))[0]
        bottoms.append(ys.max() + 1)
    baseline = int(np.median(bottoms))
    for v, (x0, x1) in enumerate(cells):
        save(f'{letter}{v}', band[:, x0:x1], baseline)

right = ink[:, 700:]
lines = runs(right.sum(1) > 0)

digit_rows = [(1701, 1781), (1972, 2040), (2193, 2263), (2435, 2506)]
for variant, (y0, y1) in enumerate(digit_rows):
    band = right[y0 - 6:y1 + 6]
    cells = clusters(band, 9, 1)
    bottoms = [np.where(band[:, x0:x1].any(1))[0].max() + 1 for x0, x1 in cells]
    baseline = int(np.median(bottoms))
    for d, (x0, x1) in enumerate(cells):
        save(f'd{d + 1}_{variant}', band[:, x0:x1], baseline)

json.dump(meta, open('meta.json', 'w'), indent=1)
