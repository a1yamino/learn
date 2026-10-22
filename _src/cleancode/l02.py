TITLE='有意义的命名';MIN=45;NEXT='函数：短小、只做一件事、一个抽象层级'
DESC='名字是代码里最多、也最便宜的文档。本课讲命名的几条核心规则：名副其实（名字回答“为什么存在、做什么、怎么用”），避免误导和无意义的区分，可读可搜索，不做心智映射，类名用名词、函数名用动词，每个概念只用一个词，用解决方案领域和问题领域的名字，添加有意义的上下文；以及名字长度与作用域的关系、Python 的命名惯例。练习会用重命名把一段“谜语代码”变得自解释。'
SUM=['<b>名副其实</b>：如果一个名字还需要注释来解释，它就不够好。<code>d</code> → <code>elapsed_days</code>；<code>get_them()</code> → <code>flagged_cells()</code>。',
'<b>避免误导</b>：不要叫 <code>account_list</code> 却是个字典；不要用只差一个字母的名字（<code>XYZControllerForHandling</code> 与 <code>XYZControllerForStorage</code>）；小写 <code>l</code> 和大写 <code>O</code> 容易看成 1 和 0。',
'<b>有意义的区分</b>：<code>a1, a2</code>、<code>product_info</code> 与 <code>product_data</code>、<code>the_message</code> 这类噪音词无法告诉读者区别在哪里。如果名字必须不同，那么意义也应不同。',
'<b>可读、可搜索</b>：能念出来的名字便于讨论；单字母名和魔法数无法搜索。名字长度应与作用域大小相称：3 行循环里的 <code>i</code> 可以接受，模块级常量要完整。',
'<b>类名用名词，函数名用动词</b>：<code>Invoice</code>、<code>AddressParser</code>；<code>send_invoice()</code>、<code>is_overdue()</code>。布尔值用 <code>is_/has_/can_</code> 开头。<b>一个概念一个词</b>：不要同时用 fetch、retrieve、get 表示同一件事。',
'<b>两种领域</b>：程序员熟悉的概念用解决方案领域的名字（<code>job_queue</code>、<code>visitor</code>）；业务概念用问题领域的名字，与领域专家说同一种语言（领域驱动设计中的“通用语言”）。<b>添加有意义的上下文</b>：散落的 <code>street, city, state</code> 不如放进 <code>Address</code>。']
S1=('名字回答三个问题','一个变量从 d 变成 elapsed_days_since_last_login，读者少猜了什么。')
A1=[('只有类型','d：一个整数。读者只知道它是数字。',[('n','d','bad',0,0,200),('q1','为什么存在？','bad',240,0,160),('q2','做什么？','bad',240,60,160),('q3','怎么用？','bad',240,120,160)]),
('有了单位','days：知道了单位，但不知道是什么的天数。',[('n','days','sig',0,0,200),('q1','为什么存在？','bad',240,0,160),('q2','单位：天','ok',240,60,160),('q3','怎么用？','bad',240,120,160)]),
('有了含义','elapsed_days_since_last_login：读者知道它的用途和计算方式。',[('n','elapsed_days_since_last_login','ok',0,0,220),('q1','衡量活跃度','ok',260,0,160),('q2','单位：天','ok',260,60,160),('q3','与阈值比较','ok',260,120,160)]),
('够用即可','作用域越小，名字可以越短：一个三行的函数内，days_inactive 已足够清楚。',[('n','days_inactive','ok',0,0,220),('s','作用域：3 行','sig',260,0,160)])]
S2=('动手：给它起个好名字','每个按钮是一个常见的坏名字。点开看问题和改法。')
CHI=[('data','def process(data):\n    for x in data:\n        ...\n\n问题：data、process、x 什么也没说\n改为：\ndef send_overdue_reminders(invoices):\n    for invoice in invoices:\n        ...','bad','泛泛的名字是“空洞的命名”。名字应包含领域信息。'),
('user_list','user_list = {"alice": User(...), "bob": User(...)}\n\n问题：它是 dict，不是 list\n改为：\nusers_by_name = {...}','bad','名字中的类型词会误导。用 <code>users_by_name</code> 同时说明了键是什么。'),
('flag','if flag:\n    ...\n\n问题：什么为真？\n改为：\nif is_trial_expired:\n    ...','bad','布尔名应当读起来像一个陈述：<code>is_</code>、<code>has_</code>、<code>should_</code>。'),
('fetch / get / retrieve','client.fetch_user(id)\nrepo.get_order(id)\napi.retrieve_invoice(id)\n\n问题：同一件事三个词\n改为：统一用 get_*','sig','一个概念一个词，读者就不用猜三者之间是否有区别。'),
('86400','if age > 86400:\n\n问题：魔法数，无法搜索\n改为：\nSECONDS_PER_DAY = 24 * 60 * 60\nif age_seconds > SECONDS_PER_DAY:','bad','命名常量可搜索、自解释，也只需改一处。'),
('i','for i in range(len(rows)):\n    total += rows[i].amount\n\n短作用域里的 i 可以接受\n更好：\nfor row in rows:\n    total += row.amount','ok','名字长度与作用域相称。能直接迭代时，就不需要索引。')]
CHH='选择一个坏名字。'
S3=('Python 的命名惯例与上下文','规则之外，语言社区有自己的约定（PEP 8）。','''<table class="tbl"><tr><th>种类</th><th>写法</th><th>例子</th></tr>
<tr><td>模块、函数、变量</td><td>小写 + 下划线</td><td><code>invoice_parser.py</code>、<code>send_invoice()</code></td></tr>
<tr><td>类</td><td>大驼峰</td><td><code>InvoiceParser</code></td></tr>
<tr><td>常量</td><td>大写 + 下划线</td><td><code>MAX_RETRIES</code></td></tr>
<tr><td>内部使用</td><td>单下划线前缀</td><td><code>_parse_header()</code></td></tr>
<tr><td>布尔</td><td>is_ / has_ / can_ / should_</td><td><code>has_discount</code></td></tr></table>
<p><b>添加有意义的上下文</b>：下面左边的变量单独出现时，<code>state</code> 是“州”还是“状态”？放进类之后，上下文就清楚了。也不要添加<b>无意义</b>的上下文：在一个叫 <code>billing</code> 的包里，每个类都加 <code>Billing</code> 前缀只是噪音。</p>
<pre class="cmd" style="overflow-x:auto;white-space:pre"># 之前                          # 之后
first_name = ...                @dataclass
last_name = ...                 class Address:
street = ...                        street: str
city = ...                          city: str
state = ...                         state: str
zipcode = ...                       zipcode: str</pre>''')
S4=('重命名要靠工具','手动查找替换容易漏改或误改；编辑器的重命名基于语法分析。')
TERM=[['grep -rn "def calc" .','./billing/orders.py:12:def calc(rows, threshold):','先找到定义。'],
['grep -rnw "calc" . | wc -l','7','有 7 处使用。纯文本替换会误伤叫 calc 的其他东西。'],
['# 在编辑器中：F2（VS Code）或 Shift+F6（PyCharm）→ total_of_paid_orders','已重命名 1 个定义、6 处引用','基于语义的重命名只修改真正引用这个函数的地方。'],
['python3 -m unittest -q','Ran 23 tests in 0.041s\n\nOK','改名后跑一遍测试。']]
S5=('在你的电脑上练习','把一段“谜语代码”通过逐步改名变得自解释。每一步都运行测试。')
PRAC=[('谜语代码：扫雷棋盘上，找出被标记的格子。','cat > board.py <<\'EOF\'\ndef get_them(the_list):\n    list1 = []\n    for x in the_list:\n        if x[0] == 4:\n            list1.append(x)\n    return list1\nEOF\ncat > test_board.py <<\'EOF\'\nimport unittest\nfrom board import *\n\nclass T(unittest.TestCase):\n    def test_flagged(self):\n        cells = [[0], [4], [2], [4]]\n        self.assertEqual(len(get_them(cells)), 2)\n\nif __name__ == "__main__":\n    unittest.main(argv=["x"], verbosity=0)\nEOF\npython3 test_board.py',None),
('第一步：只改名字，让每个名字回答“它是什么”。','cat > board.py <<\'EOF\'\nSTATUS_VALUE = 0\nFLAGGED = 4\n\ndef get_flagged_cells(game_board):\n    flagged_cells = []\n    for cell in game_board:\n        if cell[STATUS_VALUE] == FLAGGED:\n            flagged_cells.append(cell)\n    return flagged_cells\n\nget_them = get_flagged_cells  # 旧名字，迁移期保留\nEOF\npython3 test_board.py',None),
('第二步：让“格子”成为一个类，<code>is_flagged</code> 隐藏了表示方式。','cat > board.py <<\'EOF\'\nfrom dataclasses import dataclass\n\nFLAGGED = 4\n\n@dataclass\nclass Cell:\n    status: int\n\n    def is_flagged(self):\n        return self.status == FLAGGED\n\ndef get_flagged_cells(game_board):\n    return [cell for cell in game_board if cell.is_flagged()]\nEOF\ncat > test_board.py <<\'EOF\'\nimport unittest\nfrom board import Cell, get_flagged_cells\n\nclass T(unittest.TestCase):\n    def test_flagged(self):\n        board = [Cell(0), Cell(4), Cell(2), Cell(4)]\n        self.assertEqual(len(get_flagged_cells(board)), 2)\n\nif __name__ == "__main__":\n    unittest.main(argv=["x"], verbosity=0)\nEOF\npython3 test_board.py',None),
('最终版本读起来像一句话。','python3 -c "from board import *; print(get_flagged_cells([Cell(4), Cell(1)]))"',None)]
CHAL=('给这个函数改名','下面的代码来自一个借书系统。只改名字（变量、函数、常量），让它不需要注释：<pre class="cmd">def chk(u, b, d):\n    if len(u.l) >= 5:\n        return 1\n    if b.s != "a":\n        return 2\n    if d > 30:\n        return 3\n    return 0</pre>',
'<pre class="cmd">from enum import IntEnum\n\nMAX_LOANS_PER_MEMBER = 5\nMAX_LOAN_DAYS = 30\nAVAILABLE = "a"\n\nclass LoanRefusal(IntEnum):  # 整数枚举：保留枚举语义，也保持旧返回码契约\n    NONE = 0\n    TOO_MANY_LOANS = 1\n    BOOK_NOT_AVAILABLE = 2\n    PERIOD_TOO_LONG = 3\n\ndef check_loan_request(member, book, requested_days):\n    loans = member.l       # 旧对象的字段，先在函数内部解释其含义\n    status = book.s\n    if len(loans) >= MAX_LOANS_PER_MEMBER:\n        return LoanRefusal.TOO_MANY_LOANS\n    if status != AVAILABLE:\n        return LoanRefusal.BOOK_NOT_AVAILABLE\n    if requested_days > MAX_LOAN_DAYS:\n        return LoanRefusal.PERIOD_TOO_LONG\n    return LoanRefusal.NONE\n\nchk = check_loan_request  # 旧名字，迁移期保留</pre><p>用 <code>IntEnum</code> 为返回码命名，它的成员就是整数，旧调用方的 <code>result == 2</code> 仍然成立；新调用方可写 <code>result == LoanRefusal.BOOK_NOT_AVAILABLE</code>。保留 <code>chk = check_loan_request</code> 可渐进迁移函数名。普通 Enum（<code>Enum.X == 2</code> 为 False）、字段改名和异常会改变契约，需单独迁移并验证，不能混入“只改名字”的练习。第 8 课再讨论异常。</p>')
QUIZ=[['account_list 实际上是一个 dict，问题是？',['名字误导','名字太短','没有问题'],0,'类型词与实际不符会误导读者。'],
['product_info 与 product_data 并存的问题是？',['无意义的区分：读者看不出区别','太长','违反 PEP 8'],0,'名字不同，意义也应不同。'],
['布尔变量最好的名字是？',['flag','is_trial_expired','trial'],1,'读起来像一个陈述。'],
['名字长度应该？',['越长越好','与作用域大小相称','不超过 3 个字符'],1,'短作用域可以用短名。'],
['在同一代码库中用 fetch、get、retrieve 表示同一件事？',['可以，增加多样性','应统一为一个词','只在测试里可以'],1,'一个概念一个词。']]
