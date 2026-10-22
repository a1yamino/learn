TITLE='对象与数据结构：数据抽象与迪米特法则';MIN=45;NEXT='错误处理：异常、上下文与不返回 None'
DESC='对象把数据藏在行为后面，数据结构把数据暴露出来、没有有意义的行为。两者各有所长：用对象时，添加新类型容易、添加新操作难；用数据结构加函数时，添加新操作容易、添加新类型难。本课讲数据抽象（不只是加上 getter/setter）、对象与数据结构的反对称性、迪米特法则与“火车失事”式调用链、混合体的问题、数据传输对象，以及 Python 中 dataclass、NamedTuple、property 的恰当用法。'
SUM=['<b>数据抽象</b>：接口应表达数据的<b>本质</b>，而不是它的存储方式。<code>tank.percent_fuel_remaining()</code> 比 <code>tank.get_gallons_of_gasoline()</code> 抽象层次更高。机械地给每个字段加 getter/setter 并没有隐藏任何东西。',
'<b>反对称性</b>：过程式（数据结构 + 函数）让添加<b>新函数</b>容易，添加<b>新数据类型</b>要改所有函数；面向对象让添加<b>新类型</b>容易，添加<b>新操作</b>要改所有类。根据哪一种变化更常见来选择。',
'<b>迪米特法则</b>：方法只应调用自身、参数、自己创建的对象、自己的字段的方法，不要和“陌生人”说话。<code>ctx.options.scratch_dir.absolute_path</code> 让调用方依赖了整条链的结构。',
'<b>告诉，不要问</b>：与其取出内部数据再做决定（问），不如让对象自己去做（告诉）：<code>ctx.create_scratch_file(name)</code>。但对纯数据结构（DTO、配置、JSON）链式访问是可以的——它们本来就公开结构。',
'<b>避免混合体</b>：一半是对象（有重要行为）、一半是数据结构（公开字段被外部随意修改）的类，同时得到两者的缺点。',
'<b>Python 工具</b>：<code>@dataclass(frozen=True)</code>、<code>NamedTuple</code> 适合数据结构与值对象；需要保持不变量时把字段设为私有，通过有意义的方法修改；<code>@property</code> 用来表达派生值，而不是包装每个字段。']
S1=('反对称性','两种组织方式，两种不同的“容易修改”。')
A1=[('过程式','形状是纯数据；area() 和 perimeter() 是函数，里面按类型分支。',[('s','Square / Circle（数据）','',0,0,230),('a','area(shape)','ok',260,0,170),('p','perimeter(shape)','ok',260,60,170)]),
('加一个操作','加 bounding_box(shape)：只需新增一个函数，不动已有代码。',[('s','Square / Circle（数据）','',0,0,230),('a','area(shape)','ok',260,0,170),('p','perimeter(shape)','ok',260,60,170),('b','bounding_box(shape) 新','ok',260,120,170)]),
('加一个类型','加 Triangle：每个函数里的分支都要改。',[('s','+ Triangle','bad',0,0,230),('a','area(shape) 改','bad',260,0,170),('p','perimeter(shape) 改','bad',260,60,170),('b','bounding_box 改','bad',260,120,170)]),
('面向对象','反过来：加 Triangle 只需一个新类；加一个新操作则要改所有类。',[('s','Shape.area()','',0,0,230),('t','Triangle 新','ok',0,60,230),('o','新操作：每个类都要改','bad',260,0,220)])]
S2=('动手：火车失事','选择一段调用链，看问题和改法。')
CHI=[('ctx.options...','path = ctx.options.scratch_dir.absolute_path\nf = open(path + "/" + name + ".tmp", "w")\n\n问题：调用方知道 ctx 的内部结构，\n还自己拼路径。\n\n为什么要这个路径？——为了创建临时文件。\n告诉，不要问：\nf = ctx.create_scratch_file(name)','bad','违反迪米特法则：调用方依赖了 3 层结构。把“意图”交给拥有数据的对象。'),
('order.customer.address.city','city = order.customer.address.city\n\n如果 order、customer、address 都是纯数据（DTO / dataclass，\n没有行为），这样访问可以接受。','ok','迪米特法则针对<b>对象</b>（隐藏内部的东西），不针对公开结构的数据结构。'),
('get / set 全家桶','class Account:\n    def get_balance(self): return self._balance\n    def set_balance(self, v): self._balance = v\n\naccount.set_balance(account.get_balance() - 100)\n\n问题：没有隐藏任何东西，不变量（余额 ≥ 0）\n散落在所有调用方','bad','改为有意义的行为：<code>account.withdraw(100)</code>，在一处检查余额。'),
('混合体','class Order:\n    items: list           # 外部直接 append\n    def total(self): ...  # 缓存了合计\n\norder.items.append(x)  # 缓存过期！','bad','一半对象、一半数据结构。要么完全公开（不缓存），要么把 items 私有化并提供 <code>add_item()</code>。'),
('percent_fuel','tank.percent_fuel_remaining()  # 抽象\n\n而不是\n\ntank.get_gallons()\ntank.get_capacity()   # 调用方自己算','ok','接口表达了数据的本质，内部可以换成升、换成传感器读数。')]
CHH='选择一段代码。'
S3=('Python 中的选择','什么时候用什么。','''<table class="tbl"><tr><th>需要</th><th>使用</th><th>例子</th></tr>
<tr><td>纯数据、可比较、不可变</td><td><code>@dataclass(frozen=True)</code> 或 <code>NamedTuple</code></td><td><code>Money(amount, currency)</code>、<code>DateRange</code></td></tr>
<tr><td>跨边界传输（API、消息）</td><td>DTO：dataclass / pydantic 模型</td><td><code>OrderCreatedEvent</code></td></tr>
<tr><td>保持不变量</td><td>私有字段 + 有意义的方法</td><td><code>Account.withdraw()</code></td></tr>
<tr><td>派生值</td><td><code>@property</code></td><td><code>order.total</code></td></tr>
<tr><td>按类型选择行为，类型经常增加</td><td>多态（类或 Protocol）</td><td><code>PaymentMethod.charge()</code></td></tr>
<tr><td>按类型选择行为，操作经常增加</td><td>数据 + 函数（<code>match</code> 语句）</td><td>编译器的 AST 处理</td></tr></table>
<pre class="cmd" style="overflow-x:auto;white-space:pre"># Python 3.10+ 的 match：当“操作经常增加”时，数据 + 函数很自然
def area(shape):
    match shape:
        case Square(side=s):        return s * s
        case Circle(radius=r):      return math.pi * r * r
        case _: raise TypeError(shape)</pre>''')
S4=('不变量被破坏','在解释器中观察“混合体”的问题。')
TERM=[['o = Order(); o.add_item(30); o.total','30','通过方法添加，合计正确。'],
['o.items.append(70); o.total','30','绕过方法直接修改公开列表，缓存的合计过期了。'],
['o = SafeOrder(); o.add_item(30); o.items.append(70)',"AttributeError: 'tuple' object has no attribute 'append'",'对外只暴露不可变的视图（元组），不变量由类自己保持。']]
S5=('在你的电脑上练习','把一个“get/set 全家桶”的账户改成有行为的对象，再体会反对称性。')
PRAC=[('之前：不变量散落在调用方。','cat > bank.py <<\'EOF\'\nclass Account:\n    def __init__(self):\n        self._balance = 0\n    def get_balance(self):\n        return self._balance\n    def set_balance(self, value):\n        self._balance = value\n\ndef pay(account, amount):\n    account.set_balance(account.get_balance() - amount)  # 忘了检查余额\nEOF\npython3 -c "\nfrom bank import *\na = Account(); a.set_balance(50); pay(a, 80); print(a.get_balance())"',None),
('之后：对象保护自己的不变量。','cat > bank.py <<\'EOF\'\nclass InsufficientFunds(Exception):\n    pass\n\nclass Account:\n    def __init__(self, opening_balance=0):\n        self._balance = opening_balance\n\n    @property\n    def balance(self):\n        return self._balance\n\n    def deposit(self, amount):\n        self._require_positive(amount)\n        self._balance += amount\n\n    def withdraw(self, amount):\n        self._require_positive(amount)\n        if amount > self._balance:\n            raise InsufficientFunds(f"余额 {self._balance}，需要 {amount}")\n        self._balance -= amount\n\n    @staticmethod\n    def _require_positive(amount):\n        if amount <= 0:\n            raise ValueError("金额必须为正")\nEOF\npython3 -c "\nfrom bank import *\na = Account(50)\ntry:\n    a.withdraw(80)\nexcept InsufficientFunds as e:\n    print(\'拒绝:\', e)\nprint(a.balance)"',None),
('反对称性：数据 + match 函数。新增一个操作只需新函数。','cat > shapes.py <<\'EOF\'\nimport math\nfrom dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass Square:\n    side: float\n\n@dataclass(frozen=True)\nclass Circle:\n    radius: float\n\ndef area(shape):\n    match shape:\n        case Square(side=s):\n            return s * s\n        case Circle(radius=r):\n            return math.pi * r * r\n    raise TypeError(shape)\n\ndef bounding_box(shape):  # 新操作：不改动已有代码\n    match shape:\n        case Square(side=s):\n            return (s, s)\n        case Circle(radius=r):\n            return (2 * r, 2 * r)\n    raise TypeError(shape)\nEOF\npython3 -c "\nfrom shapes import *\nfor s in [Square(2), Circle(1)]:\n    print(type(s).__name__, round(area(s), 2), bounding_box(s))"',None)]
CHAL=('选择组织方式','你在写一个支付系统，需要支持：信用卡、支付宝、微信支付，并且每年会接入 1–2 种新的支付方式；每种支付方式需要“扣款、退款、查询状态”三个操作，这三个操作多年来很少变化。另一边，你在写一个规则引擎的表达式求值器：节点类型（数字、加、乘、变量）几乎固定，但经常要添加新的操作（求值、打印、化简、类型检查）。两者分别该怎样组织？',
'<ul><li><b>支付方式：面向对象 / 多态</b>。变化的维度是“类型”，操作稳定。定义 <code>PaymentMethod</code> 协议（<code>charge</code>、<code>refund</code>、<code>status</code>），每种支付方式一个类；接入新方式时新增一个类，不改动已有代码（开闭原则，第 12 课）。</li><li><b>表达式求值器：数据结构 + 函数</b>。节点是不可变的 dataclass，每个操作是一个 <code>match</code> 函数；新增“化简”只需新增一个函数。这正是编译器常用的组织方式（或访问者模式）。</li></ul><p>两种选择没有绝对的好坏，关键是<b>预测哪一种变化更频繁</b>，让那种变化变得便宜。</p>')
QUIZ=[['给每个字段加 getter/setter 是否实现了数据抽象？',['否，没有隐藏任何东西','是','只在 Java 中是'],0,''],
['过程式代码中，添加新数据类型需要？',['修改所有相关函数','只加一个类','什么都不改'],0,''],
['ctx.options.scratch_dir.absolute_path 违反了？',['迪米特法则','命令查询分离','DRY'],0,''],
['对纯数据结构（DTO）进行链式访问？',['可以接受','总是违反迪米特法则','语法错误'],0,''],
['“告诉，不要问”的意思是？',['让拥有数据的对象完成工作','先询问用户','多写断言'],0,'']]
