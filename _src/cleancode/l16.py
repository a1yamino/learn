TITLE='代码坏味道（下）：类、耦合与启发式';MIN=45;NEXT='重构手法：提取、内联、移动与以多态取代条件'
DESC='本课整理与类和模块之间关系相关的坏味道：发散式变化（一个类因多种原因被修改）、散弹式修改（一个变化要改许多类）、依恋情结（方法更关心别的类的数据）、过长的消息链、中间人、不恰当的亲密关系、被拒绝的遗赠、全局可变数据、重复的 switch，以及书中第 17 章的一些通用启发式：不同抽象层级混杂、基类依赖派生类、不该有的人为耦合、封装条件、避免否定条件、隐藏的时间耦合。'
SUM=['<b>发散式变化与散弹式修改是一对</b>：前者是一个类承担了多个变化原因（拆分它）；后者是一个变化原因散落在多个类（合并它们）。目标是让“一个变化原因 ↔ 一个模块”。',
'<b>依恋情结</b>：一个方法频繁访问另一个对象的数据，计算的逻辑应搬到数据所在的类（移动函数）。“把行为放在数据旁边”。',
'<b>消息链与中间人</b>：<code>a.b().c().d()</code> 让调用方依赖整条结构（隐藏委托）；但如果一个类的一半方法都只是转发给另一个对象，它就成了多余的中间人（移除中间人）。两者之间需要平衡。',
'<b>全局可变数据</b>：任何地方都能修改，因此任何地方都可能是 bug 的来源。封装它（只能通过函数修改），缩小作用域，或改为不可变。',
'<b>封装条件、避免否定</b>：<code>if timer.has_expired() and not timer.is_recurrent()</code> → <code>if should_be_deleted(timer)</code>；<code>if not buffer.should_not_compact()</code> → <code>if buffer.should_compact()</code>。',
'<b>隐藏的时间耦合</b>：必须先调用 <code>a()</code> 再调用 <code>b()</code>，但代码中没有任何体现。让每一步的输出成为下一步的输入，顺序就由数据流强制。']
S1=('发散式变化 vs 散弹式修改','同一个原则（一个变化原因对应一个模块）的两种违反。')
A1=[('发散式变化','Order 类：改税率要改它、改导出格式要改它、改存储方式也要改它。',[('o','Order','bad',0,60,140),('r1','税率','sig',220,0,120),('r2','导出格式','sig',220,60,120),('r3','存储','sig',220,120,120)]),
('拆分','每个变化原因一个模块。',[('o1','TaxPolicy','ok',0,0,160),('o2','OrderExporter','ok',0,60,160),('o3','OrderRepository','ok',0,120,160)]),
('散弹式修改','新增一种货币：要改 checkout、invoice、report、email 四个文件。',[('c','新增货币','sig',0,60,140),('f1','checkout.py','bad',220,0,140),('f2','invoice.py','bad',220,60,140),('f3','report.py','bad',220,120,140),('f4','email.py','bad',380,60,140)]),
('合并','货币相关的知识集中到 Money 模块。',[('c','新增货币','sig',0,60,140),('m','money.py','ok',220,60,140)])]
S2=('动手：闻一闻（下）','选择一段代码。')
CHI=[('依恋情结','class Invoice:\n    def shipping(self, customer):\n        if customer.tier == "gold" and customer.years > 3:\n            return 0\n        return 10 if customer.country == "CN" else 30','bad','<b>依恋情结</b>：这段逻辑几乎只用 customer 的数据。移动到 <code>Customer.shipping_fee()</code>，或提取一个运费策略。'),
('中间人','class Department:\n    def manager(self): return self._staff.manager()\n    def headcount(self): return self._staff.headcount()\n    def budget(self): return self._staff.budget()\n    def hire(self, p): return self._staff.hire(p)','bad','<b>中间人</b>：几乎所有方法都只是转发。让调用者直接使用 <code>staff</code>，或者让 Department 增加真正的行为。'),
('全局可变','CONFIG = {}\n\ndef handle(req):\n    CONFIG["locale"] = req.locale   # 改了全局！\n    return render(req)','bad','<b>全局可变数据</b>：并发请求会互相覆盖。把 locale 作为参数传递，或使用请求作用域的上下文（<code>contextvars</code>）。'),
('否定条件','if not user.is_not_verified():\n    ...','bad','<b>否定的否定</b>。提供正向的谓词：<code>if user.is_verified():</code>。'),
('封装条件','if order.paid and not order.shipped and order.created > cutoff:\n    ...\n→\nif order.awaits_shipment_since(cutoff):','ok','<b>封装条件</b>：复杂条件被命名，意图清楚，也可以单独测试。'),
('时间耦合','gen.load_config()\ngen.parse_sources()   # 依赖 load_config 设置的字段\ngen.render()          # 依赖 parse_sources 设置的字段','bad','<b>隐藏的时间耦合</b>。改为 <code>config = load_config(); sources = parse_sources(config); render(sources)</code>：顺序由数据流强制。')]
CHH='选择一段代码。'
S3=('书中的其他启发式','第 17 章还列出了许多通用的检查项，这里选出最实用的几条。','''<table class="tbl"><tr><th>启发式</th><th>说明</th></tr>
<tr><td>基类不依赖派生类</td><td>基类中出现 <code>if isinstance(self, Special)</code> 说明抽象泄漏了</td></tr>
<tr><td>信息过多</td><td>模块暴露的接口越少越好；不需要公开的就设为私有</td></tr>
<tr><td>不恰当的静态方法</td><td>如果函数可能需要多态行为，就不要做成静态方法</td></tr>
<tr><td>使用解释性变量</td><td>把复杂表达式的中间结果命名，比注释更好</td></tr>
<tr><td>函数名应说明行为</td><td><code>date.add(5)</code>：加 5 天？5 周？修改自身还是返回新对象？→ <code>add_days_to</code> / <code>days_later(5)</code></td></tr>
<tr><td>理解算法</td><td>不要靠反复试错让测试通过；先理解它为什么正确</td></tr>
<tr><td>用多态替代 if/else</td><td>“一个 switch 原则”：同一选择只出现一次，用于创建多态对象</td></tr>
<tr><td>遵循约定</td><td>团队的约定比个人偏好重要</td></tr>
<tr><td>边界条件封装</td><td><code>level + 1</code> 出现在多处 → <code>next_level = level + 1</code></td></tr></table>''')
S4=('用 git 发现散弹式修改','经常一起被修改的文件，往往藏着一个应该合并的概念。')
TERM=[['git log --name-only --format="" --since=6.months | sort | uniq -c | sort -rn | head -4','     41 src/orders/order.py\n     23 src/billing/invoice.py\n     22 src/billing/checkout.py\n     21 src/reports/sales.py','order.py 修改了 41 次：可能存在发散式变化。'],
['python3 cochange.py --since 6.months','invoice.py + checkout.py + sales.py  一起修改 18 次','这三个文件几乎总是一起修改：散弹式修改的信号（例如都包含货币逻辑）。']]
S5=('在你的电脑上练习','修复依恋情结与隐藏的时间耦合。')
PRAC=[('之前：方法依恋别人的数据；步骤依赖隐式字段。','cat > gen.py <<\'EOF\'\nclass Customer:\n    def __init__(self, tier, years, country):\n        self.tier, self.years, self.country = tier, years, country\n\nclass Invoice:\n    def shipping(self, c):\n        if c.tier == "gold" and c.years > 3:\n            return 0\n        return 10 if c.country == "CN" else 30\n\nclass ReportGenerator:\n    def load(self, raw):\n        self.rows = [r.split(",") for r in raw]\n    def summarize(self):\n        self.total = sum(int(r[1]) for r in self.rows)\n    def render(self):\n        return f"total={self.total}"\nEOF\npython3 -c "\nfrom gen import *\ng = ReportGenerator()\ng.load([\'a,1\', \'b,2\'])\ntry:\n    print(g.render())   # 忘了 summarize()\nexcept AttributeError as e:\n    print(\'AttributeError:\', e)"',None),
('之后：行为移到数据旁边；数据流强制顺序。','cat > gen.py <<\'EOF\'\nfrom dataclasses import dataclass\n\nFREE_SHIPPING_MIN_YEARS = 3\n\n@dataclass(frozen=True)\nclass Customer:\n    tier: str\n    years: int\n    country: str\n\n    def shipping_fee(self):\n        if self.tier == "gold" and self.years > FREE_SHIPPING_MIN_YEARS:\n            return 0\n        return 10 if self.country == "CN" else 30\n\ndef parse(raw):\n    return [line.split(",") for line in raw]\n\ndef summarize(rows):\n    return sum(int(amount) for _, amount in rows)\n\ndef render(total):\n    return f"total={total}"\n\ndef report(raw):\n    return render(summarize(parse(raw)))\nEOF\npython3 -c "\nfrom gen import *\nprint(report([\'a,1\', \'b,2\']))\nprint(Customer(\'gold\', 5, \'US\').shipping_fee(), Customer(\'basic\', 1, \'CN\').shipping_fee())"',None)]
CHAL=('选择方向','<code>Order</code> 类中有一个方法 <code>discount()</code>，它读取 <code>customer.tier</code>、<code>customer.years</code>、<code>customer.coupons</code>，以及 <code>self.total</code>。它应该留在 Order、移到 Customer，还是放到新的地方？说出你的判断依据。',
'<p>它同时依恋两个对象。判断依据是“<b>什么变化会导致它改变</b>”：</p><ul><li>如果折扣规则主要是“会员等级的权益”（由会员体系决定），移到 <code>Customer.discount_for(total)</code>，Order 只传入金额。</li><li>如果折扣规则经常变化、由营销团队调整、还会涉及商品与活动，提取一个 <code>DiscountPolicy.discount(order, customer)</code>（策略对象），两者都不依恋。</li><li>只有当它主要依赖订单内容时才留在 Order。</li></ul><p>“依恋情结”提示的是数据与行为离得太远；解决方案是让行为靠近变化原因所在的地方。</p>')
QUIZ=[['一个变化需要修改许多类是？',['散弹式修改','发散式变化','中间人'],0,''],
['一个类因多种原因被修改是？',['发散式变化','散弹式修改','临时字段'],0,''],
['方法大量使用另一个对象的数据是？',['依恋情结','数据泥团','死代码'],0,''],
['消除隐藏的时间耦合的方法？',['让上一步的输出成为下一步的输入','加注释说明顺序','加锁'],0,''],
['几乎所有方法都在转发调用的类是？',['中间人','上帝类','值对象'],0,'']]
