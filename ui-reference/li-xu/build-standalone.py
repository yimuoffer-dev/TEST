"""Bundle local CSS, JS and supplied PNGs into an offline HTML file."""
from pathlib import Path
import base64
import json
root = Path(__file__).resolve().parent
images = {p.stem: 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode() for p in (root / 'assets').glob('*.png')}
js = (root / 'app.js').read_text().replace('src="assets/${name}.png"', 'src="${ASSET_URLS[name]}"')
js = 'const ASSET_URLS=' + json.dumps(images) + ';\n' + js
for name, data in images.items():
    js = js.replace('assets/' + name + '.png', data)
css = (root / 'style.css').read_text()
for name, data in images.items():
    css = css.replace('assets/' + name + '.png', data)
html = (root / 'index.html').read_text().replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>').replace('<script src="app.js"></script>', '<script>' + js + '</script>')
(root / '礼序-完整复刻.html').write_text(html)
