# tui.py "按键1" "按键2" …：在伪终端中运行交互式 codex，依次输入按键（每步间隔 2 秒），
# 回应终端查询，最后打印去掉 ANSI 控制序列后的屏幕文字（尾部）
import fcntl, os, pty, re, select, struct, sys, termios, time
pid, fd = pty.fork()
if pid == 0:
    os.environ["TERM"] = "xterm-256color"
    os.execvp("codex", ["codex", "-c", "approval_policy=never"])
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 40, 110, 0, 0))  # 40 行 × 110 列
buf = b""
def pump(sec):
    global buf
    end = time.time() + sec
    while time.time() < end:
        r, _, _ = select.select([fd], [], [], 0.1)
        if not r: continue
        try: d = os.read(fd, 65536)
        except OSError: return
        buf += d
        if b"\x1b[6n" in d: os.write(fd, b"\x1b[1;1R")      # 光标位置查询
        if b"\x1b[c" in d: os.write(fd, b"\x1b[?62;c")       # 设备属性查询
        if b"\x1b]10;?" in d: os.write(fd, b"\x1b]10;rgb:ffff/ffff/ffff\x1b\\")  # 前景色查询
        if b"\x1b]11;?" in d: os.write(fd, b"\x1b]11;rgb:0000/0000/0000\x1b\\")  # 背景色查询
        if b"\x1b[?u" in d: os.write(fd, b"\x1b[?0u")       # 键盘增强查询
pump(3)
for k in sys.argv[1:]:
    for ch in k.encode().decode("unicode_escape").encode(): os.write(fd, bytes([ch])); pump(0.05)
    pump(2)
os.kill(pid, 9)
if os.environ.get("RAW"): print(repr(buf[:1500]))
# 极简终端模拟：只处理光标定位、清屏/清行与文字，足以还原 ratatui 画出的屏幕
import unicodedata
R, C = 40, 110; scr = [[" "] * C for _ in range(R)]; y = x = 0
alt = buf.rfind(b"\x1b[?1049h"); data = buf[alt:] if alt >= 0 else buf
for m in re.finditer(rb"\x1b\[([0-9;?>]*)([A-Za-z@])|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[()][A-Z0-9]|\x1b[=>78]|([\r\n\b])|([^\x1b\r\n\b]+)", data):
    a, cmd, ctl, txt = m.group(1), m.group(2), m.group(3), m.group(4)
    if cmd:
        ps = [int(v) if v.isdigit() else 0 for v in a.decode().lstrip("?>").split(";")] if a else []
        if cmd in b"Hf": y = (ps[0] if ps and ps[0] else 1) - 1; x = (ps[1] if len(ps) > 1 and ps[1] else 1) - 1
        elif cmd == b"K": scr[y][x:] = [" "] * (C - x)
        elif cmd == b"J" and ps[:1] == [2]: scr = [[" "] * C for _ in range(R)]
        elif cmd == b"C": x += ps[0] if ps else 1
        elif cmd == b"G": x = (ps[0] if ps else 1) - 1
    elif ctl == b"\r": x = 0
    elif ctl == b"\n": y = min(y + 1, R - 1)
    elif txt:
        for ch in txt.decode("utf-8", "replace"):
            if ch < " ": continue
            w = 2 if unicodedata.east_asian_width(ch) in "WF" else 1
            if 0 <= y < R and x < C:
                scr[y][x] = ch
                if w == 2 and x + 1 < C: scr[y][x + 1] = ""
            x += w
lines = ["".join(r).rstrip() for r in scr]
while lines and not lines[-1]: lines.pop()
print("\n".join(l for l in lines if l.strip()))
