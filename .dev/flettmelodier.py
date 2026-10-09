import json,re,glob
p='js/data/melodier.js'
s=open(p,encoding='utf8').read()
ok=re.compile(r'^(r|[A-G][#b]?\d)([-.,;]*)$')
endret=[];ukontr=[]
for f in sorted(glob.glob('.dev/melodikontroll/[A-D].json')):
    for m in json.load(open(f,encoding='utf8')):
        if m['status']=='ukontrollert': ukontr.append(m['id']); continue
        if m['status']!='rettet': continue
        ord_=[w for w in m['noter'].replace('|',' ').split()]
        bad=[w for w in ord_ if not ok.match(w)]
        assert not bad,(m['id'],bad)
        pat=re.compile(r"(  "+m['id']+r": \{[^\n]*?tempo: )\d+(, deler: )\[[^\]]*\](,\s*noter: `)[^`]*(`)",re.S)
        # entry may have deler/tempo on first line, noter on next
        n=pat.subn(lambda mo: f"{mo.group(1)}{m['tempo']}{mo.group(2)}{json.dumps(m['deler'])}{mo.group(3)}{m['noter']}{mo.group(4)}",s,count=1)
        assert n[1]==1,m['id']
        s=n[0]; endret.append(m['id'])
open(p,'w',encoding='utf8').write(s)
print('rettet',len(endret),endret);print('ukontrollert',ukontr)
