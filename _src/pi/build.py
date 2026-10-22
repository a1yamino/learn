import sys;sys.path.insert(0,'/workspace/coursekit');from gen import build
CFG={'dir':'/workspace/pi-course','slug':'pi','runall':1,'setup':'ln -s /workspace/src/pi-mono pi-mono','path':'/workspace/node22/bin:'}
for n in sys.argv[1:]: build(CFG,int(n))
