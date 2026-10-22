import sys;sys.path.insert(0,'/workspace/coursekit');from gen import build
for n in sys.argv[1:]: build({'dir':'/workspace/cleancode-course','slug':'cleancode','runall':1},int(n))
