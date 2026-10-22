TITLE='代码坏味道（上）：命名、函数与重复';MIN=45;NEXT='代码坏味道（下）：类、耦合与启发式'
DESC='“坏味道”是表面上的征兆，提示更深层的设计问题，它们本身不一定是错误。本课整理与命名、函数、重复相关的一组：神秘的名字、过长函数、过长参数列表、标识参数、死函数、重复代码、魔法数、基本类型偏执、数据泥团、长长的 if/elif 链、注释过多、临时字段。每个坏味道都给出识别方法和对应的重构手法。这些名字来自《代码整洁之道》第 17 章与 Fowler 的《重构》，两者高度重合。'
SUM=['<b>坏味道是提示，不是规则</b>：它告诉你“值得看一眼”，是否修改取决于这段代码的变化频率和阅读频率。',
'<b>神秘的名字、过长函数、过长参数列表</b>：最常见的三个。对应手法：改名；提取函数；引入参数对象或保持对象完整（传 <code>order</code> 而不是 <code>order.id, order.total, order.status</code>）。',
'<b>重复代码与魔法数</b>：同一知识出现在多处。提取函数、命名常量、提升到共同的位置。',
'<b>基本类型偏执</b>：用 str、int、float 表示领域概念（金额、电话、货币代码、坐标）。校验和格式化逻辑因此散落各处。引入值对象：<code>Money</code>、<code>PhoneNumber</code>。',
'<b>数据泥团</b>：总是一起出现的几个数据（<code>start_date, end_date</code>；<code>street, city, zipcode</code>）。删除其中一个会让其他失去意义？那它们就是一个对象。',
'<b>死代码与注释过多</b>：没人调用的函数、永远为假的分支、注释掉的代码——删掉。需要大段注释解释的代码，先尝试用提取函数和改名让它自解释。']
S1=('从征兆到病因','一个坏味道往往指向一个缺失的概念。')
A1=[('征兆','到处是 amount: float 与 currency: str 两个参数，以及 round(x, 2)。',[('s1','amount, currency','bad',0,0,200),('s2','round(x, 2) × 14','bad',0,60,200),('s3','f"¥{x:,.2f}" × 9','bad',0,120,200)]),
('诊断','基本类型偏执 + 数据泥团：缺失了“金额”这个概念。',[('s1','amount, currency','sig',0,0,200),('s2','round(x, 2) × 14','sig',0,60,200),('s3','f"¥{x:,.2f}" × 9','sig',0,120,200),('d','缺失概念：Money','sig',260,60,180)]),
('治疗','引入值对象，把规则集中在一处。',[('m','Money(Decimal, "CNY")','ok',0,0,240),('a','加减、舍入','ok',0,60,240),('b','格式化','ok',0,120,240),('c','禁止不同币种相加','ok',0,180,240)])]
S2=('动手：闻一闻','选择一段代码，说出坏味道的名字和手法。')
CHI=[('ship(...)','def ship(name, street, city, zipcode, phone, weight, express, fragile):\n    ...','bad','<b>过长参数列表 + 数据泥团 + 标识参数</b>。引入 <code>Address</code>、<code>Parcel</code>；把 express 变成两种不同的服务或枚举。'),
('price: float','def apply_coupon(price: float, currency: str, pct: float) -> float:\n    return round(price * (1 - pct / 100), 2)','bad','<b>基本类型偏执</b>。float 表示金额会有精度问题，舍入规则与币种散落各处。使用 <code>Money</code>（基于 Decimal）。'),
('if status == 3','if order.status == 3 or order.status == 7:\n    ...','bad','<b>魔法数</b>。用枚举并把判断放到对象上：<code>if order.is_cancellable():</code>。'),
('old_export()','def old_export(rows):   # 没有任何调用者\n    ...','bad','<b>死函数</b>。删掉。git 里有。可以用 <code>vulture</code> 等工具帮你找。'),
('临时字段','class Report:\n    def __init__(self):\n        self.tmp_total = None   # 只在 render() 期间有值\n    def render(self): ...','bad','<b>临时字段</b>：对象的一个字段只在某些时候有意义。改为局部变量或参数，或提取一个只在该过程中存在的对象。'),
('保持对象完整','# 之前\nlimit = credit_limit(customer.id, customer.tier, customer.since)\n# 之后\nlimit = credit_limit(customer)','ok','手法“保持对象完整”：以后需要更多字段时，签名不必改变。（权衡：函数对 Customer 的依赖变大了。）')]
CHH='选择一段代码。'
S3=('坏味道 → 手法 对照表','常用的组合。下一课与第 17 课会练习其中的手法。','''<table class="tbl"><tr><th>坏味道</th><th>识别</th><th>常用手法</th></tr>
<tr><td>神秘的名字</td><td>需要读实现才知道是什么</td><td>改名（函数、变量、字段）</td></tr>
<tr><td>过长函数</td><td>混合多个抽象层级；有“段落注释”</td><td>提取函数；以查询取代临时变量；分解条件</td></tr>
<tr><td>过长参数列表</td><td>≥ 4 个参数；同几个参数总一起传</td><td>引入参数对象；保持对象完整；移除标识参数</td></tr>
<tr><td>重复代码</td><td>改一处必须改另一处</td><td>提取函数；上移方法；命名常量</td></tr>
<tr><td>基本类型偏执</td><td>str/float 表示领域概念；格式与校验散落</td><td>以对象取代基本类型（值对象）</td></tr>
<tr><td>数据泥团</td><td>几个数据总是成群出现</td><td>提取类</td></tr>
<tr><td>重复的 switch</td><td>同样的类型分支出现在多处</td><td>以多态取代条件；查表</td></tr>
<tr><td>死代码</td><td>无调用者；不可达分支</td><td>删除</td></tr>
<tr><td>注释（作为除臭剂）</td><td>大段注释解释“这一段在做什么”</td><td>提取函数；改名；引入断言</td></tr></table>''')
S4=('工具帮忙闻','几个能自动发现部分坏味道的工具。')
TERM=[['vulture src/ --min-confidence 60','src/billing/legacy.py:12: unused function \'old_export\' (60% confidence)\nsrc/users/views.py:88: unreachable code after \'return\' (100% confidence)','死代码检测：60% 为候选线索，不能仅凭工具结果就删除公开接口或动态调用的代码；阈值提高到80时不会显示60%的候选。'],
['ruff check --select PLR0913,PLR2004,C901 src/','src/ship.py:3:5: PLR0913 Too many arguments in function definition (8 > 5)\nsrc/orders.py:41:30: PLR2004 Magic value used in comparison, consider replacing `3` with a constant variable\nsrc/report.py:23:5: C901 `monthly_report` is too complex (14 > 10)','参数过多、魔法数、过高的复杂度。'],
['grep -rnE "round\\([^,]+, 2\\)" --include=*.py src/ | wc -l','14','手工搜索：散落的金额舍入，提示缺少 Money 类型。']]
S5=('在你的电脑上练习','用值对象治疗“基本类型偏执”：把散落在各处的金额 float 改为 <code>Money</code>。')
PRAC=[('之前：float 金额的精度问题。','python3 -c "\nprice = 0.1 + 0.2\nprint(price, price == 0.3)\nprint(round(2.675, 2))"',None),
('值对象：基于 Decimal，不可变，带币种，舍入与格式化集中在一处。','cat > money.py <<\'EOF\'\nfrom dataclasses import dataclass\nfrom decimal import Decimal, ROUND_HALF_UP\n\nCENT = Decimal("0.01")\n\n@dataclass(frozen=True)\nclass Money:\n    amount: Decimal\n    currency: str = "CNY"\n\n    @classmethod\n    def of(cls, value, currency="CNY"):\n        return cls(Decimal(str(value)).quantize(CENT, ROUND_HALF_UP), currency)\n\n    def __add__(self, other):\n        self._require_same_currency(other)\n        return Money(self.amount + other.amount, self.currency)\n\n    def times(self, factor):\n        return Money.of(self.amount * Decimal(str(factor)), self.currency)\n\n    def __str__(self):\n        symbol = {"CNY": "¥", "USD": "$"}.get(self.currency, self.currency + " ")\n        return f"{symbol}{self.amount:,.2f}"\n\n    def _require_same_currency(self, other):\n        if other.currency != self.currency:\n            raise ValueError(f"不能把 {other.currency} 加到 {self.currency}")\nEOF\npython3 -c "\nfrom money import Money\nprint(Money.of(0.1) + Money.of(0.2) == Money.of(0.3))\nprint(Money.of(2.675))\nprint(Money.of(1234.5).times(0.9))\ntry:\n    Money.of(1) + Money.of(1, \'USD\')\nexcept ValueError as e:\n    print(e)"',None)]
CHAL=('诊断一段代码','列出下面代码中的坏味道（至少 5 个）及对应手法：<pre class="cmd">def proc(o, flag, d1, d2):\n    # 计算\n    t = 0\n    for i in o["items"]:\n        t += i["p"] * i["q"]\n    if o["type"] == 2:\n        t = t * 0.95\n    if flag:\n        print("debug", t)\n    # 检查日期\n    if d1 > d2:\n        return -1\n    return round(t, 2)</pre>',
'<ul><li><b>神秘的名字</b>：<code>proc</code>、<code>o</code>、<code>t</code>、<code>d1/d2</code> → 改名。</li><li><b>标识参数</b>：<code>flag</code> 控制调试输出 → 删除，用日志级别控制。</li><li><b>数据泥团</b>：<code>d1, d2</code> 总是一起出现，是一个时间段 → <code>DateRange</code>，并在构造时校验 start ≤ end（异常而不是 -1）。</li><li><b>魔法数</b>：<code>2</code>（某种客户类型）、<code>0.95</code> → 枚举与命名常量。</li><li><b>基本类型偏执</b>：dict 表示订单、float 表示金额 → <code>Order</code>、<code>LineItem</code>、<code>Money</code>。</li><li><b>返回码</b>：<code>-1</code> 与金额共用返回值 → 异常。</li><li><b>段落注释</b>（“# 计算”“# 检查日期”）→ 提取函数 <code>subtotal(order)</code>、<code>DateRange</code>。</li></ul>')
QUIZ=[['坏味道是？',['值得调查的征兆','一定要立即修复的错误','语法错误'],0,''],
['几个总是一起出现的参数是？',['数据泥团','死代码','临时字段'],0,''],
['用 float 和 str 表示金额与币种属于？',['基本类型偏执','过长函数','死代码'],0,''],
['只在某个方法执行期间有意义的字段是？',['临时字段','值对象','常量'],0,''],
['没有调用者的函数应该？',['删除','注释掉','加 TODO'],0,'']]
