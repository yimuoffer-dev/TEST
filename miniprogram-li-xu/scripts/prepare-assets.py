"""Reproducible encoding; never overwrite the supplied source PNG files."""
from pathlib import Path
from PIL import Image
import json, hashlib
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'ui-reference/li-xu/assets'
icons=['nav_ledger_outline','nav_ledger_selected','nav_people_outline','nav_people_selected','nav_stats_outline','nav_stats_selected','nav_profile_outline','nav_profile_selected','action_add','action_search','action_export','action_sync','action_settings','action_more','action_back','action_next','action_notification','action_edit','action_download','state_gift_sent','state_locked','stat_list','nav_calendar_outline','nav_home_outline','event_wedding','decor_plum','decor_bamboo','decor_chrysanthemum','decor_ginkgo','decor_cloud','event_housewarming']
names=icons+['background-6','background-8','background-9','cover-wedding','cover-baby','cover-housewarming','cover-longevity','cover-graduation','cover-memorial']
manifest=[]
for name in names:
 source=SOURCE/(name+'.png');dest=ROOT/'assets'/(name+'.webp')
 with Image.open(source) as image:
  # Cover slots render at <= 330rpx. A 750px derivative covers common 3x devices.
  if name.startswith('cover-'):image=image.resize((750,1000),Image.Resampling.LANCZOS)
  # Alpha is retained; the original source is never changed.
  image.save(dest,'WEBP',quality=86 if name.startswith('cover-') else 84,method=4)
  manifest.append(dict(name=name,source=str(source.relative_to(ROOT.parent)),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),width=image.width,height=image.height,bytes=dest.stat().st_size))
(ROOT/'assets/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('Asset bytes:',sum(x['bytes'] for x in manifest))
