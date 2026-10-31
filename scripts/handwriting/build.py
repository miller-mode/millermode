import json, re, subprocess, os
from pathlib import Path
import numpy as np
from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString

UPM = 1000
CAP = 700
SMALL = 0.72
SIDE = 55
SPACE = 300
BOUNCE = 30
LETTER_VARIANTS = 5
DIGIT_VARIANTS = 4
DIGIT_NAMES = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]

HERE = Path(__file__).parent
OUTPUT = HERE.parent.parent / "app" / "fonts" / "MMHand.woff2"
os.chdir(HERE / ".build")

meta = json.load(open("meta.json"))
os.makedirs("pbm", exist_ok=True)


def components(mask):
    labels = np.zeros(mask.shape, int)
    count = 0
    for y, x in zip(*np.where(mask)):
        if labels[y, x]:
            continue
        count += 1
        stack = [(y, x)]
        labels[y, x] = count
        while stack:
            cy, cx = stack.pop()
            for ny in range(cy - 1, cy + 2):
                for nx in range(cx - 1, cx + 2):
                    if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not labels[ny, nx]:
                        labels[ny, nx] = count
                        stack.append((ny, nx))
    return labels, count


def clean(name):
    mask = np.asarray(Image.open(f"glyphs/{name}.png").convert("L")) < 128
    labels, count = components(mask)
    sizes = [(labels == i).sum() for i in range(1, count + 1)]
    main = int(np.argmax(sizes)) + 1
    main_rows = np.where((labels == main).any(1))[0]
    keep = np.zeros_like(mask)
    for i, size in enumerate(sizes, 1):
        rows = np.where((labels == i).any(1))[0]
        overlaps = rows.min() <= main_rows.max() and rows.max() >= main_rows.min()
        if size >= max(sizes) * 0.06 and overlaps:
            keep |= labels == i
    ys, xs = np.where(keep)
    trimmed_bottom = mask.shape[0] - (ys.max() + 1)
    keep = keep[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
    return keep, trimmed_bottom


def trace(name):
    keep, trimmed_bottom = clean(name)
    Image.fromarray((~keep * 255).astype(np.uint8)).convert("1").save(f"pbm/{name}.pbm")
    subprocess.run(["potrace", "-s", "-t", "8", "-a", "1.0", "-O", "0.3", f"pbm/{name}.pbm", "-o", f"pbm/{name}.svg"], check=True)
    svg = open(f"pbm/{name}.svg").read()
    paths = re.findall(r'<path d="([^"]+)"', svg)
    return paths, keep.shape, meta[name]["descent"] + trimmed_bottom


def median_height(names):
    return float(np.median([meta[n]["h"] for n in names]))


letter_names = [f"{chr(65 + i)}{v}" for i in range(26) for v in range(LETTER_VARIANTS)]
digit_names = [f"d{d}_{v}" for v in range(DIGIT_VARIANTS) for d in range(1, 10)]
def letter_scale(upper):
    return CAP / median_height([f"{upper}{v}" for v in range(LETTER_VARIANTS)])


def digit_scale(d):
    return CAP * 0.92 / median_height([f"d{d}_{v}" for v in range(DIGIT_VARIANTS)])

glyphs = {}


def add(glyph, source, scale, x_squeeze=1.0):
    paths, (height, width), descent = trace(source)
    pen = T2CharStringPen(0, None)
    sx = scale * x_squeeze
    rise = max(-BOUNCE, min(BOUNCE, descent * scale))
    transform = TransformPen(pen, (sx / 10, 0, 0, scale / 10, SIDE, rise))
    for d in paths:
        parse_path(d, transform)
    advance = round(width * sx + SIDE * 2)
    glyphs[glyph] = (pen, advance)


for i in range(26):
    upper = chr(65 + i)
    lower = upper.lower()
    for v in range(LETTER_VARIANTS):
        suffix = "" if v == 0 else f".v{v}"
        add(f"{upper}{suffix}", f"{upper}{v}", letter_scale(upper))
        add(f"{lower}{suffix}", f"{upper}{(v + 2) % LETTER_VARIANTS}", letter_scale(upper) * SMALL)

for d, name in enumerate(DIGIT_NAMES, 1):
    for v in range(DIGIT_VARIANTS):
        suffix = "" if v == 0 else f".v{v}"
        add(f"{name}{suffix}", f"d{d}_{v}", digit_scale(d))

add("zero", "O1", letter_scale("O") * 0.92, 0.82)

space_pen = T2CharStringPen(SPACE, None)
glyphs["space"] = (space_pen, SPACE)
notdef = T2CharStringPen(SPACE, None)
glyphs[".notdef"] = (notdef, SPACE)

order = [".notdef", "space"] + [g for g in glyphs if g not in (".notdef", "space")]
cmap = {32: "space", 48: "zero"}
for i in range(26):
    cmap[65 + i] = chr(65 + i)
    cmap[97 + i] = chr(97 + i)
for d, name in enumerate(DIGIT_NAMES, 1):
    cmap[48 + d] = name

fb = FontBuilder(UPM, isTTF=False)
fb.setupGlyphOrder(order)
fb.setupCharacterMap(cmap)
charstrings = {g: glyphs[g][0].getCharString() for g in order}
fb.setupCFF("MMHand-Regular", {"FullName": "MM Hand"}, charstrings, {})
fb.setupHorizontalMetrics({g: (glyphs[g][1], 0) for g in order})
fb.setupHorizontalHeader(ascent=900, descent=-250)
fb.setupNameTable({"familyName": "MM Hand", "styleName": "Regular"})
fb.setupOS2(sTypoAscender=900, sTypoDescender=-250, usWinAscent=950, usWinDescent=300, sCapHeight=CAP, sxHeight=round(CAP * SMALL))
fb.setupPost()

letters = [chr(65 + i) for i in range(26)] + [chr(97 + i) for i in range(26)]
letter_sets = [" ".join(f"{g}{'' if v == 0 else f'.v{v}'}" for g in letters) for v in range(LETTER_VARIANTS)]
digit_sets = [" ".join(f"{g}{'' if v == 0 else f'.v{v}'}" for g in DIGIT_NAMES) for v in range(DIGIT_VARIANTS)]

fea = []
for v, members in enumerate(letter_sets):
    fea.append(f"@L{v} = [{members}];")
for v, members in enumerate(digit_sets):
    fea.append(f"@D{v} = [{members}];")
fea.append("feature calt {")
fea.append("  lookup cycleLetters {")
for v in range(LETTER_VARIANTS - 1):
    fea.append(f"    sub @L{v} @L0' by @L{v + 1};")
fea.append("  } cycleLetters;")
fea.append("  lookup cycleDigits {")
for v in range(DIGIT_VARIANTS - 1):
    fea.append(f"    sub @D{v} @D0' by @D{v + 1};")
fea.append("  } cycleDigits;")
fea.append("} calt;")
addOpenTypeFeaturesFromString(fb.font, "\n".join(fea))

fb.font.flavor = "woff2"
fb.font.save(OUTPUT)
print("glyphs", len(order))
