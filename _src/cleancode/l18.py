TITLE='遗留代码：特征测试与接缝';MIN=50;NEXT='并发代码的整洁'
DESC='Michael Feathers 把遗留代码定义为“没有测试的代码”。要安全地修改它，首先要把它放进测试里，但它往往难以测试：直接连接数据库、读当前时间、调用外部服务。本课讲遗留代码修改算法（找到修改点 → 找到测试点 → 解除依赖 → 写测试 → 修改与重构），特征测试（记录现有行为，而不是“应有”的行为），接缝（不修改代码就能替换行为的位置），以及几种安全地解除依赖的手法：参数化、提取并覆盖、包装方法、萌芽方法 / 萌芽类、快照（golden master）测试。'
SUM=['<b>遗留代码 = 没有测试的代码</b>。修改它的困境：要重构需要测试，要写测试需要先重构。出路是先做最小、最安全的结构修改（通常可借助编辑器自动完成），只为让测试成为可能。',
'<b>特征测试</b>：不问“应该输出什么”，而是问“现在输出什么”，并把它固定下来。哪怕现有行为看起来像 bug，也先记录；是否修复是另一个决定（可能有调用方依赖它）。',
'<b>接缝</b>：程序中可以不编辑该处代码就改变行为的地方。Python 中最常用的是<b>对象接缝</b>（传入替身）与<b>参数接缝</b>（给函数加一个带默认值的参数），以及测试时的 <code>unittest.mock.patch</code>（链接期接缝的类比）。',
'<b>萌芽方法 / 萌芽类</b>：新功能写在一个新的、经过测试的函数或类里，只在旧代码中加一行调用。旧代码不必先完全进入测试。',
'<b>包装方法</b>：需要在旧行为前后添加行为时，把旧方法改名，用原名写一个新方法调用它并加上新行为。',
'<b>快照测试（golden master）</b>：对复杂输出（报表、HTML）先保存当前输出作为基准，之后每次运行与之比对。适合在大规模重构前快速建立安全网。']
S1=('遗留代码修改算法','五步，每一步都尽量小。')
A1=[('1 修改点','确定需要修改的位置：invoice.py 的 send_invoices()。',[('a','① 修改点','sig',0,0,160)]),
('2 测试点','在哪里能观察到行为？函数返回值？发出的邮件？',[('a','① 修改点','ok',0,0,160),('b','② 测试点','sig',0,60,160)]),
('3 解除依赖','函数内部直接 datetime.now() 与 SMTP()：加参数接缝。',[('a','① 修改点','ok',0,0,160),('b','② 测试点','ok',0,60,160),('c','③ 解除依赖','sig',0,120,160)]),
('4 特征测试','记录当前行为，包括看起来奇怪的部分。',[('a','① 修改点','ok',0,0,160),('b','② 测试点','ok',0,60,160),('c','③ 解除依赖','ok',0,120,160),('d','④ 特征测试 ✓','sig',200,0,180)]),
('5 修改与重构','在测试的保护下实现需求，并清理触及的代码。',[('a','① 修改点','ok',0,0,160),('b','② 测试点','ok',0,60,160),('c','③ 解除依赖','ok',0,120,160),('d','④ 特征测试 ✓','ok',200,0,180),('e','⑤ 修改 + 重构','ok',200,60,180)])]
S2=('动手：选择一个接缝','同一段难测的代码，几种解除依赖的方式。')
CHI=[('原始代码','def overdue_notices():\n    today = datetime.date.today()\n    rows = db.query("SELECT ... FROM invoices")\n    for r in rows:\n        if r.due < today:\n            SmtpClient().send(r.email, "逾期提醒")','bad','三个隐藏依赖：当前日期、全局 db、在函数内创建的 SMTP 客户端。无法在测试中运行。'),
('参数接缝','def overdue_notices(today=None, invoices=None, mailer=None):\n    today = datetime.date.today() if today is None else today\n    invoices = invoices if invoices is not None else db.query(...)\n    mailer = SmtpClient() if mailer is None else mailer\n    ...','ok','最小改动：带默认值的参数。现有调用方完全不受影响，测试可以注入。之后再逐步把依赖移到组合根。'),
('mock.patch','@patch("billing.SmtpClient")\n@patch("billing.db")\ndef test_overdue(db, smtp): ...','sig','不改代码就能测试，适合作为第一步。但测试与模块内部的名字绑定，重构时容易失效。拿到安全网后应尽快改为显式依赖。'),
('萌芽方法','def overdue_notices():\n    ...\n    for r in rows:\n        if is_overdue(r, today):      # 新的、有测试的函数\n            ...\n\ndef is_overdue(invoice, today):     # 萌芽方法\n    return invoice.due < today and not invoice.disputed','ok','新需求（有争议的发票不提醒）写在新函数中并完整测试；旧函数只改了一行。'),
('包装方法','def send(self, msg):\n    self._log(msg)          # 新行为\n    self._send_raw(msg)     # 原来的 send 被改名\n\ndef _send_raw(self, msg):\n    ...原实现...','ok','在不改动原逻辑的情况下，在前后增加行为。')]
CHH='选择一种方式。'
S3=('特征测试的写法','让测试告诉你代码现在做什么。','''<ol><li>写一个你知道会失败的断言：<code>self.assertEqual(format_price(1234.5), "???")</code>。</li>
<li>运行，失败消息会告诉你实际值：<code>AssertionError: '1,234.50 元' != '???'</code>。</li>
<li>把实际值填进去，测试变绿。这就是一个特征测试。</li>
<li>为边界值重复：0、负数、很大的数、None。</li></ol>
<p>如果实际行为看起来是错误的（例如负数被格式化成 <code>"-0.00"</code>），<b>先记录它</b>，在测试名中写明（<code>test_negative_currently_formats_as_zero</code>），再与业务方确认是否修复。在测试中固定下来的“bug”至少不会在重构中被意外改变。</p>
<p><b>快照测试</b>是特征测试的批量版：把一批输入的输出保存为文件，之后与之比较。</p>''')
S4=('快照测试','把复杂输出固定下来，重构后对比。')
TERM=[['python3 snapshot.py --record','已记录 120 个输入的输出 → snapshots/report.txt','重构之前：录制基准。'],
['python3 snapshot.py','120/120 与快照一致','每次重构之后运行。'],
['python3 snapshot.py','输入 #37 不一致：\n- 合计: 1,204.00\n+ 合计: 1,204.0\n119/120 与快照一致','行为被改变了：要么修复，要么确认这是有意的变化后重新录制。']]
S5=('在你的电脑上练习','给一个依赖当前时间与外部服务的函数加参数接缝，写特征测试，然后用萌芽方法加需求。')
PRAC=[('遗留代码：无法测试。', 'cat > billing.py <<\'EOF\'\nimport datetime\n\nINVOICES = [  # 代表数据库\n    {"id": 1, "email": "a@x.com", "due": datetime.date(2026, 1, 10), "disputed": False},\n    {"id": 2, "email": "b@x.com", "due": datetime.date(2026, 3, 1), "disputed": True},\n    {"id": 3, "email": "c@x.com", "due": datetime.date(2099, 1, 1), "disputed": False},\n]\n\nclass SmtpClient:\n    def send(self, to, text):\n        raise RuntimeError("测试中不能真的发邮件")\n\ndef overdue_notices():\n    today = datetime.date.today()\n    sent = 0\n    for inv in INVOICES:\n        if inv["due"] < today:\n            SmtpClient().send(inv["email"], f"发票 {inv[\'id\']} 已逾期")\n            sent += 1\n    return sent\nEOF\npython3 -c "import billing; billing.overdue_notices()"', None), ('参数接缝：加带默认值的参数，现有调用方不受影响。', 'python3 - <<\'EOF\'\ns = open("billing.py").read()\ns = s.replace("def overdue_notices():\\n    today = datetime.date.today()",\n              "def overdue_notices(today=None, invoices=None, mailer=None):\\n    today = datetime.date.today() if today is None else today\\n    invoices = INVOICES if invoices is None else invoices\\n    mailer = SmtpClient() if mailer is None else mailer")\ns = s.replace("for inv in INVOICES:", "for inv in invoices:").replace("SmtpClient().send(", "mailer.send(")\nopen("billing.py", "w").write(s)\nEOF\nsed -n "/def overdue/,\\$p" billing.py', None), ('特征测试：记录现在的行为（包括“有争议的发票也会被提醒”）。', 'cat > test_billing.py <<\'EOF\'\nimport datetime, unittest\nfrom billing import overdue_notices, INVOICES\n\nclass Recorder:\n    def __init__(self): self.sent = []\n    def __bool__(self): return False  # 合法的假值替身也应被保留\n    def send(self, to, text): self.sent.append((to, text))\n\nclass Characterization(unittest.TestCase):\n    def test_current_behaviour_includes_disputed_invoices(self):\n        mail = Recorder()\n        n = overdue_notices(today=datetime.date(2026, 6, 1), invoices=INVOICES, mailer=mail)\n        self.assertEqual(n, 2)\n        self.assertEqual(mail.sent, [("a@x.com", "发票 1 已逾期"), ("b@x.com", "发票 2 已逾期")])\n\nif __name__ == "__main__":\n    unittest.main(argv=["x", "-v"])\nEOF\npython3 test_billing.py', None), ('新需求：先把特征测试改为“不提醒有争议发票”的新期望并运行。此步应失败，证明旧实现尚不满足新需求。', 'python3 - <<\'EOF\'\nt = open("test_billing.py").read()\nt = t.replace("includes_disputed", "skips_disputed").replace("assertEqual(n, 2)", "assertEqual(n, 1)").replace(\', ("b@x.com", "发票 2 已逾期")\', "")\nopen("test_billing.py", "w").write(t)\nEOF\npython3 test_billing.py', None), ('再用萌芽方法实现新规则，测试应恢复为绿色。', 'python3 - <<\'EOF\'\ns = open("billing.py").read()\ns = s.replace(\'if inv["due"] < today:\', "if is_overdue(inv, today):")\ns += "\\n\\ndef is_overdue(invoice, today):\\n    return invoice[\\"due\\"] < today and not invoice[\\"disputed\\"]\\n"\nopen("billing.py", "w").write(s)\nEOF\npython3 test_billing.py', None)]
CHAL=('为这个类找接缝','<pre class="cmd">class PriceUpdater:\n    def run(self):\n        rates = requests.get("https://fx.example.com/latest").json()\n        for p in Product.objects.all():\n            p.price_usd = round(p.price_cny / rates["CNY"], 2)\n            p.save()\n        logging.info("updated at %s", datetime.now())</pre>列出每个依赖可以使用的接缝，并给出一个让核心计算可以测试的最小修改。',
'<ul><li><b>汇率</b>（HTTP）：参数接缝 <code>run(self, fetch_rates=fetch_rates_from_api)</code>，或构造函数注入一个 <code>RateSource</code>。</li><li><b>产品</b>（ORM）：注入 <code>products</code> 可迭代对象与 <code>save</code> 函数；或在第一步用 <code>mock.patch</code>。</li><li><b>当前时间</b>：日志里的时间不影响结果，可以不处理。</li></ul><p><b>最小修改</b>：用萌芽方法把计算提取为纯函数，并为它写测试：</p><pre class="cmd">def usd_price(price_cny, cny_per_usd):\n    return round(price_cny / cny_per_usd, 2)</pre><p><code>run()</code> 中只改一行，改为调用 <code>usd_price</code>。I/O 仍在旧代码中，但最容易出错的计算已经有了测试；之后再逐步把 I/O 依赖改为注入。</p>')
QUIZ=[['Feathers 对遗留代码的定义？',['没有测试的代码','很老的代码','别人写的代码'],0,''],
['特征测试记录的是？',['代码当前的实际行为','需求文档的行为','理想行为'],0,''],
['给函数添加带默认值的参数以便测试，属于？',['参数接缝','萌芽类','快照测试'],0,''],
['新功能写在新的、有测试的函数中，旧代码只加一行调用？',['萌芽方法','包装方法','内联'],0,''],
['mock.patch 的主要缺点？',['测试绑定模块内部名字，重构时容易失效','不能用','太慢'],0,'']]
