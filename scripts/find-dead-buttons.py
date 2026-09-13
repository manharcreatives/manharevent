# -*- coding: utf-8 -*-
"""Finds <Button>s with no onClick, href, asChild, submit, or formAction.

A button that renders and does nothing is the single most common way this app
feels broken. Run from the repo root: `python scripts/find-dead-buttons.py`.

Known false positives: a <Button> wrapped in a <Link> (the regex can't see the
wrapper), and everything in (dev)/gallery, which is a component showcase.
"""
import os, re, io
dead=[]
for base,dirs,files in os.walk('apps'):
    dirs[:]=[d for d in dirs if d not in ('node_modules','.next','.turbo')]
    for f in files:
        if not f.endswith('.tsx'): continue
        p=os.path.join(base,f)
        s=io.open(p,encoding='utf-8').read()
        for m in re.finditer(r'<Button\b([^>]*?)>', s, re.S):
            attrs=m.group(1)
            if any(k in attrs for k in ('onClick','href','asChild','type="submit"','disabled','formAction')):
                continue
            line=s[:m.start()].count('\n')+1
            end=s.find('</Button>', m.end())
            label=re.sub(r'\s+',' ',re.sub(r'<[^>]*>','',s[m.end():end])).strip()[:45] if end>0 else ''
            dead.append((p.replace(os.sep,'/'),line,label))
print(len(dead),"dead <Button>s")
for d in sorted(dead): print("  %s:%d  %s"%d)
