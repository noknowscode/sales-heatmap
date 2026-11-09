#!/bin/sh
# Renders every Sales Heatmap banner: 1x (1200 x 630) and 2x (2400 x 1260) from the same composition, and the two
# heroes (1920 x 1080). Run from src/ with NODE_PATH reaching playwright:  NODE_PATH=$(npm root -g) sh tools/render-all.sh
set -e
OUT=../finals
B="showcase-desk showcase-phones showcase-daynight focus-heatmap focus-figures focus-regions focus-card stylized-split stylized-palettes stylized-stack stylized-split-titled"
args=""
for n in $B; do args="$args $n.html $OUT/$n@1x.png 1200 630 1 $n.html $OUT/$n@2x.png 1200 630 2"; done
args="$args stylized-split-hero.html $OUT/stylized-split-hero.png 1920 1080 1 stylized-palettes-hero.html $OUT/stylized-palettes-hero.png 1920 1080 1"
node tools/render.js $args
# the finals are written as rendered; tools/pack.py then recompresses them losslessly
python3 -I tools/pack.py $OUT
