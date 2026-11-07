from pathlib import Path
from io import BytesIO
import base64,json,zipfile
from PIL import Image
root=Path(__file__).resolve().parent
images={}
for p in (root/'assets').glob('*.png'):
 out=BytesIO()
 with Image.open(p) as im:im.save(out,format='WEBP',quality=90,method=6)
 images[p.stem]='data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode()
js=(root/'app.js').read_text().replace('src="assets/${name}.png"','src="${ASSET_URLS[name]}"')
js='const ASSET_URLS='+json.dumps(images)+';\n'+js
css=(root/'style.css').read_text()+'\n'+(root/'calibration.css').read_text()
for name,data in images.items():
 js=js.replace('assets/'+name+'.png',data)
 css=css.replace('assets/'+name+'.png',data)
css=css.replace('assets/lixu-serif.woff','data:font/woff;base64,'+base64.b64encode((root/'assets/lixu-serif.woff').read_bytes()).decode())
html=(root/'index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<link rel="stylesheet" href="calibration.css">','').replace('<script src="app.js"></script>','<script>'+js+'</script>')
(root/'礼序-轻量版.html').write_text(html)
with zipfile.ZipFile(root/'礼序-下载包.zip','w',zipfile.ZIP_DEFLATED) as z:
 z.write(root/'礼序-轻量版.html','礼序.html')
 z.writestr('打开说明.txt','解压后用 Chrome 或 Edge 打开礼序.html。无需网络，图片与字体已内嵌。\n')
print('HTML',round((root/'礼序-轻量版.html').stat().st_size/1024/1024,2),'MB')
