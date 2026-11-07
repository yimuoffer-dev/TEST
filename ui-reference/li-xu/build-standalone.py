import hashlib
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
css = (root / 'style.css').read_text() + '\n' + (root / 'calibration.css').read_text()
font = base64.b64encode((root / 'assets/lixu-serif.woff').read_bytes()).decode()
css = css.replace('assets/lixu-serif.woff', 'data:font/woff;base64,' + font)
for name, data in images.items():
    css = css.replace('assets/' + name + '.png', data)
html = (root / 'index.html').read_text().replace('<link rel="stylesheet" href="style.css">', '<style>' + css + '</style>').replace('<link rel="stylesheet" href="calibration.css">', '').replace('<script src="app.js"></script>', '<script>' + js + '</script>')
script_hash=base64.b64encode(hashlib.sha256(js.encode()).digest()).decode()
html=html.replace("script-src 'self'", "script-src 'sha256-"+script_hash+"'")
(root / '礼序-完整复刻.html').write_text(html)
