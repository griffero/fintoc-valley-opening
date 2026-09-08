"""Convert an OFL font's ASCII outlines to Three.js typeface geometry."""
import json,sys
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
font=TTFont(sys.argv[1]); glyphs=font.getGlyphSet(); cmap=font.getBestCmap()
class Pen(BasePen):
 def __init__(self,g):super().__init__(g);self.commands=[]
 def point(self,p):return [str(round(p[0],3)),str(round(p[1],3))]
 def _moveTo(self,p):self.start=p;self.commands+=['m']+self.point(p)
 def _lineTo(self,p):self.commands+=['l']+self.point(p)
 def _qCurveToOne(self,c,p):self.commands+=['q']+self.point(p)+self.point(c)
 def _curveToOne(self,a,b,p):self.commands+=['b']+self.point(p)+self.point(a)+self.point(b)
 def _closePath(self):self.commands+=['l']+self.point(self.start)
result={}
for c in range(32,127):
 name=cmap.get(c)
 if not name:continue
 p=Pen(glyphs);glyphs[name].draw(p)
 result[chr(c)]={'ha':font['hmtx'][name][0],'o':' '.join(p.commands)}
head=font['head']
data={'glyphs':result,'familyName':'Anton','ascender':font['hhea'].ascent,'descender':font['hhea'].descent,'underlinePosition':-100,'underlineThickness':50,'boundingBox':{'xMin':head.xMin,'xMax':head.xMax,'yMin':head.yMin,'yMax':head.yMax},'resolution':head.unitsPerEm,'original_font_information':{'source':'https://github.com/google/fonts/tree/main/ofl/anton','license':'SIL Open Font License 1.1'}}
open(sys.argv[2],'w').write(json.dumps(data,separators=(',',':')))
