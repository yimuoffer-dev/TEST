"""Render deterministic transparent chart assets without browser-only gradients."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math
root=Path(__file__).resolve().parents[1]
font='/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc'
scale=2
f=lambda n:ImageFont.truetype(font,n*scale,index=2)
im=Image.new('RGBA',(1460,560));d=ImageDraw.Draw(im)
ink='#6d6250';line='#cbb99d';red='#ac583f';pale='#d8c5a8'
d.text((10,0),'金额（万元）',font=f(22),fill=ink)
d.rectangle((1070,12,1106,40),fill=red);d.text((1124,0),'收礼',font=f(22),fill=ink)
d.rectangle((1240,12,1276,40),fill=pale);d.text((1294,0),'送礼',font=f(22),fill=ink)
left,bottom,width,height=110,500,1320,400
for i in range(7):
 y=bottom-i*height/6
 for x in range(left,left+width,12):d.line((x,y,x+5,y),fill=line,width=1)
 label=str(i*.5) if i else '0';d.text((left-35,y),label,font=f(22),fill=ink,anchor='rm')
d.line((left,100,left,bottom,left+width,bottom),fill='#a9967c',width=2)
vals=[.38,.5,1.1,.7,1.05,2.1,.65,.85,1.6,2.7,1.22,1.22]
for i,value in enumerate(vals):
 x=left+17+i*110
 d.rectangle((x,bottom-value/3*height,x+35,bottom),fill=red)
 d.rectangle((x+38,bottom-value*.76/3*height,x+73,bottom),fill=pale)
 d.text((x+37,bottom+12),str(i+1)+'月',font=f(20),fill=ink,anchor='mt')
im.save(root/'assets/chart-trend.png',optimize=True)
im=Image.new('RGBA',(640,640));d=ImageDraw.Draw(im)
start=-90
for ratio,color in [(42,'#ad533d'),(24,'#c7a268'),(20,'#dfcfb4'),(14,'#efe3ce')]:
 end=start+ratio*3.6;d.pieslice((1,1,639,639),start,end,fill=color,outline='#fff5e5',width=2)
 angle=math.radians((start+end)/2);x=320+264*math.cos(angle);y=320+264*math.sin(angle)
 d.text((x,y),str(ratio)+'%',font=ImageFont.truetype(font,44,index=2),fill='#fff5e5' if ratio in [42,24] else '#28261f',anchor='mm');start=end
d.ellipse((106,106,534,534),fill=(0,0,0,0),outline='#fff5e5',width=2)
im.save(root/'assets/chart-donut.png',optimize=True)
print('Chart assets rendered')
