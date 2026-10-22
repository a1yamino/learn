TITLE='函数参数、副作用与命令查询分离';MIN=45;NEXT='注释：何时该写，何时该删'
DESC='参数是函数接口的主要部分。本课讲参数数量（零元、一元、二元、三元及以上）与理解成本，标识参数（布尔参数）为什么是一种坏味道，参数对象，输出参数；然后讲副作用：名字没有说出的隐藏行为，时间耦合；命令查询分离（一个函数要么改变状态，要么返回信息）；以及 Python 特有的可变默认参数陷阱、仅限关键字参数如何让调用处自解释。'
SUM=['<b>参数越少越好</b>：每个参数都是读者必须理解、测试必须覆盖的维度。三个以上的参数通常说明一些参数应该组成一个对象（<code>Point(x, y)</code>、<code>DateRange(start, end)</code>）。',
'<b>标识参数是坏味道</b>：<code>render(page, True)</code> 中的 <code>True</code> 是什么？它说明函数做了两件事。拆成 <code>render_for_print(page)</code> 与 <code>render_for_screen(page)</code>，或至少要求关键字参数。',
'<b>仅限关键字参数</b>（Python 的 <code>*</code>）让调用处必须写出名字：定义 <code>def transfer(source, target, amount, *, notify=False): ...</code>，调用 <code>transfer(a, b, 100, notify=True)</code>。裸 <code>*</code> 写在定义处，不是调用处。',
'<b>避免隐藏的副作用</b>：<code>check_password()</code> 内部顺便初始化会话，就制造了时间耦合——只有在“可以初始化会话”的时候才能调用它。副作用要么移出去，要么写进名字。',
'<b>命令查询分离（CQS）</b>：<code>set(attr, value)</code> 既修改又返回成功与否，导致 <code>if set("name", "x")</code> 这种含混的代码。要么做事（命令，返回 None），要么回答问题（查询，无副作用）。例外：<code>pop()</code> 这类约定俗成的操作。',
'<b>不修改传入的参数</b>：输出参数让读者困惑“它会被改吗”。返回新值；Python 中尤其要警惕可变默认参数 <code>def f(items=[])</code>，它在多次调用之间共享。']
S1=('一个函数，四个参数','逐步让参数说明自己。')
A1=[('调用处','book(r, s, e, True)：读者不知道每个位置是什么。',[('c','book(r, s, e, True)','bad',0,0,260)]),
('参数对象','开始和结束总是一起出现，它们是一个概念：时间段。',[('c','book(room, Slot(s, e), True)','sig',0,0,300),('o','Slot(start, end)','ok',0,60,200)]),
('拆掉标识参数','True 表示“发送通知”：这是第二件事。',[('c','book(room, slot)','ok',0,0,220),('n','notify_attendees(booking)','ok',0,60,240)]),
('或者：关键字参数','如果标识参数必须保留，强制用名字传递。',[('c','book(room, slot, *, notify=True)','ok',0,0,320)])]
S2=('动手：找出问题','每个按钮是一个函数签名或调用。')
CHI=[('render(page, True)','def render(page, is_suite):\n    ...\n\nrender(page, True)\n\n问题：标识参数，函数做两件事，调用处不可读','bad','拆成 <code>render_suite_page(page)</code> 和 <code>render_single_page(page)</code>。'),
('check_password','def check_password(user, password):\n    if hash(password) == user.password_hash:\n        Session.initialize(user)\n        return True\n    return False\n\n问题：名字只说“检查”，却初始化了会话','bad','隐藏副作用 + 时间耦合。把会话初始化移到调用方，或改名为 <code>login_if_password_matches</code>。'),
('if set(...)','if attributes.set("username", "bob"):\n    ...\n\n问题：是“如果设置成功”还是“如果之前是 bob”？','bad','违反命令查询分离。拆成 <code>if attributes.has("username"):</code> 与 <code>attributes.set(...)</code>。'),
('append_footer(report)','def append_footer(report):\n    report.lines.append("---")\n\nappend_footer(report)\n\n问题：输出参数','sig','读者要读实现才知道 report 被修改了。更好：<code>report.append_footer()</code>（方法修改自身是预期的）或返回新对象。'),
('def add(item, items=[])','def add(item, items=[]):\n    items.append(item)\n    return items\n\nadd(1)  -> [1]\nadd(2)  -> [1, 2]   ← 共享了同一个默认列表！','bad','默认值只在定义时求值一次。使用 <code>items=None</code> 并在函数内创建新列表。'),
('transfer(..., *, notify)','def transfer(source, target, amount, *, notify=False):\n    ...\n\ntransfer(a, b, 100, notify=True)','ok','三个参数都有自然顺序（从、到、多少），标识参数被强制写出名字。')]
CHH='选择一个签名。'
S3=('参数数量与测试成本','每增加一个参数，需要考虑的组合就成倍增加。','''<table class="tbl"><tr><th>参数个数</th><th>例子</th><th>说明</th></tr>
<tr><td>0</td><td><code>report.render()</code></td><td>最容易理解与测试</td></tr>
<tr><td>1</td><td><code>is_valid(email)</code>、<code>parse(text)</code>、<code>on_click(event)</code></td><td>常见的三种形态：问一个问题、转换一个值、处理一个事件</td></tr>
<tr><td>2</td><td><code>Point(x, y)</code>、<code>assert_equal(expected, actual)</code></td><td>有自然顺序时没问题；没有自然顺序时，调用处容易写反</td></tr>
<tr><td>3</td><td><code>transfer(source, target, amount)</code></td><td>需要有充分理由；考虑参数对象或关键字参数</td></tr>
<tr><td>更多</td><td><code>create(a, b, c, d, e, f)</code></td><td>几乎总是缺少一个概念（对象）</td></tr></table>
<p><b>Python 的工具</b>：关键字参数让调用处自解释；<code>*</code> 之后的参数只能用关键字传递；<code>@dataclass</code> 可以快速定义参数对象。不要为了“减少参数”而改用 <code>**kwargs</code> 吞下一切——那只是把参数藏了起来。</p>''')
S4=('可变默认参数','在 Python 解释器中观察它。')
TERM=[['def add(item, items=[]):\n    items.append(item)\n    return items\nadd(1); add(2)','[1]\n[1, 2]','第二次调用拿到的是第一次调用修改过的同一个列表。'],
['add.__defaults__','([1, 2],)','默认值保存在函数对象上，在定义时只计算一次。'],
['def add(item, items=None):\n    items = [] if items is None else items\n    items.append(item)\n    return items\nadd(1); add(2)','[1]\n[2]','每次调用都创建新列表。']]
S5=('在你的电脑上练习','把一个有标识参数、隐藏副作用和输出参数的函数改为清晰的接口。')
PRAC=[('之前：一个参数过多、做了两件事的函数。','cat > invoice.py <<\'EOF\'\nsent = []\n\ndef make_invoice(customer, items, discount, send, lines=[]):\n    total = 0\n    for name, price in items:\n        lines.append(f"{name}: {price}")\n        total += price\n    total = total * (1 - discount)\n    lines.append(f"total: {total:.2f}")\n    if send:\n        sent.append(customer)\n    return lines\nEOF\npython3 -c "\nimport invoice\nprint(invoice.make_invoice(\'ann\', [(\'pen\', 10)], 0, False))\nprint(invoice.make_invoice(\'bob\', [(\'ink\', 20)], 0.1, True))\nprint(invoice.sent)"',None),
('可变默认参数让 bob 的发票里出现了 ann 的行。重构：参数对象、拆掉标识参数、返回新值。','cat > invoice.py <<\'EOF\'\nfrom dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass LineItem:\n    name: str\n    price: float\n\n@dataclass(frozen=True)\nclass Invoice:\n    customer: str\n    items: tuple[LineItem, ...]\n    discount: float = 0.0\n\n    def total(self):\n        return sum(i.price for i in self.items) * (1 - self.discount)\n\n    def lines(self):\n        return [f"{i.name}: {i.price}" for i in self.items] + [f"total: {self.total():.2f}"]\n\nclass Mailer:\n    def __init__(self):\n        self.sent = []\n\n    def send(self, invoice):\n        self.sent.append(invoice.customer)\nEOF\npython3 -c "\nfrom invoice import *\nann = Invoice(\'ann\', (LineItem(\'pen\', 10),))\nbob = Invoice(\'bob\', (LineItem(\'ink\', 20),), discount=0.1)\nprint(ann.lines()); print(bob.lines())\nmailer = Mailer(); mailer.send(bob); print(mailer.sent)"',None),
('发送是独立的命令，生成是独立的查询。本例用 tuple 保存冻结的 LineItem；frozen=True 只禁止字段重新赋值，不会递归冻结传入的 list 等对象。','python3 -c "\nfrom invoice import *\ni = Invoice(\'c\', (LineItem(\'a\', 1),))\ntry:\n    i.discount = 0.5\nexcept Exception as e:\n    print(type(e).__name__)"',None)]
CHAL=('设计一个接口','你要写一个搜索订单的函数。需求：可以按客户、状态、日期范围（开始和结束）过滤，可以选择排序字段和方向，可以分页（页码、每页条数），可以选择是否包含已删除订单。写出函数签名，并说明你的选择。',
'<pre class="cmd">@dataclass(frozen=True)\nclass DateRange:\n    start: date\n    end: date\n\n@dataclass(frozen=True)\nclass Page:\n    number: int = 1\n    size: int = 50\n\ndef search_orders(\n    *,\n    customer_id: str | None = None,\n    status: OrderStatus | None = None,\n    placed_within: DateRange | None = None,\n    sort_by: str = "placed_at",\n    descending: bool = True,\n    page: Page = Page(),\n    include_deleted: bool = False,\n) -> list[Order]: ...</pre><ul><li>全部为<b>仅限关键字参数</b>：9 个维度没有自然顺序，调用处必须写名字，如 <code>search_orders(status=PAID, page=Page(2))</code>。</li><li><code>DateRange</code>、<code>Page</code> 是总是成对出现的概念，组成参数对象，也可以在别处复用并单独校验（start ≤ end）。</li><li><code>include_deleted</code> 是标识参数，但它<b>不改变函数做的事</b>（仍然是“搜索”），只是过滤条件之一，以关键字形式保留是合理的。</li><li>参数很多时，也可以定义一个 <code>OrderQuery</code> 对象，让函数只接受一个参数：<code>search_orders(query)</code>。</li></ul>')
QUIZ=[['render(page, True) 中的 True 说明？',['函数做了两件事','函数很快','参数类型错误'],0,'标识参数。'],
['命令查询分离的意思是？',['函数要么改变状态，要么返回信息，不同时做','命令行与查询分开','SQL 读写分离'],0,''],
['def f(items=[]) 的问题是？',['默认列表在调用之间共享','语法错误','运行太慢'],0,''],
['Python 中强制调用方写出参数名用？',['在参数列表中放一个 *','用 **kwargs','加注释'],0,''],
['check_password() 顺便初始化会话，属于？',['隐藏副作用与时间耦合','命令查询分离','纯函数'],0,'']]
