import sys;sys.path.insert(0,'/workspace/coursekit');from gen import build
CFG={'dir':'/workspace/codex-course','slug':'codex','runall':1,'setup':'ln -s /workspace/src/codex codex','path':'/workspace/src/codex/codex-rs/target/debug:/home/box/.cargo/bin:/workspace/node22/bin:'}
for n in sys.argv[1:]: build(CFG,int(n))
