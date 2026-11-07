from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
s=(root/'styles/design.wxss').read_text()
s=re.sub(r'(-?\d+(?:\.\d+)?)px',lambda m:'1px' if m.group(1)=='1' else f'{float(m.group(1))*750/863:.2f}rpx',s)
(root/'styles/reference.wxss').write_text('/* Generated from styles/design.wxss. */\n'+s)
(root/'styles/tokens.wxss').write_text('/* Palette extracted from the reference HTML. */\n.paper{background:#f6ecdf}.ink{color:#28261f}.vermilion{color:#a43e29}.gold{color:#b78d51}\n')
(root/'app.wxss').write_text('@import "styles/tokens.wxss";\n@import "styles/reference.wxss";\n')
