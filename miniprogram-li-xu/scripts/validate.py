"""Source checks, not a replacement for WeChat WXML/WXSS compilation."""
from pathlib import Path
import json,re,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
app=json.loads((root/'app.json').read_text())
assert len(app['pages'])==8
for route in app['pages']:
 for ext in ['js','json','wxml','wxss']:assert (root/(route+'.'+ext)).is_file(),(route,ext)
for p in root.rglob('*.json'):json.loads(p.read_text())
allowed={'view','text','button','image','input','picker','block','scroll-view','textarea','switch'}|set(app['usingComponents'])
count=0
for p in root.rglob('*.wxml'):
 s=p.read_text();s=re.sub(r'\bwx:else(?=[\s>])','wx:else=""',s)
 # WXML allows & and && in expressions; XML requires entity escaping.
 s=re.sub(r'&(?!amp;|lt;|gt;|quot;|apos;)', '&amp;',s)
 tree=ET.fromstring('<root xmlns:wx="wx" xmlns:bind="bind">'+s+'</root>')
 for item in tree.iter():
  if item.tag!='root':assert item.tag in allowed,(p,item.tag)
  for attr,value in item.attrib.items():
   if attr in ['{wx}if','{wx}elif','{wx}for']:assert value.startswith('{{') and value.endswith('}}'),(p,attr,value)
 for asset in re.findall(r'(?:src|source)="(/assets/[^{}"]+)"',s):assert (root/asset.lstrip('/')).exists(),(p,asset)
 count+=1
for p in root.rglob('*.wxss'):
 if p.name=='design.wxss':continue
 s=p.read_text();assert not re.search(r':has\(|mask-composite|conic-gradient|url\([\'"]?data:',s),p
for p in root.rglob('*.js'):
 s=p.read_text();assert not re.search(r'\beval\s*\(|new\s+Function\b|innerHTML|document\.|window\.',s),p
for p in (root/'assets').glob('*.webp'):
 b=p.read_bytes();assert b[:4]==b'RIFF' and b[8:12]==b'WEBP',p
exclusions=json.loads((root/'project.config.json').read_text())['packOptions']['ignore']
ignored=[x['value'] for x in exclusions if x['type']=='folder'];ignorefiles={x['value'] for x in exclusions if x['type']=='file'}
files=[p for p in root.rglob('*') if p.is_file() and p.relative_to(root).parts[0] not in ignored and str(p.relative_to(root)) not in ignorefiles]
size=sum(p.stat().st_size for p in files)
assert size<2*1024*1024,f'Package {size} exceeds 2MiB budget'
report={'sourceChecks':'passed','pages':8,'wxmlFiles':count,'runtimeBytes':size,'budgetBytes':2097152,'wechatCompiler':'not available; not executed','deviceVisualValidation':'not executed'}
(root/'tests/last-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
