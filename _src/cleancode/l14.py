TITLE='简单设计四规则与涌现式设计';MIN=40;NEXT='代码坏味道（上）：命名、函数与重复'
DESC='Kent Beck 的简单设计四规则按优先级排列：① 通过所有测试；② 没有重复；③ 表达了程序员的意图；④ 类和方法的数量尽量少。本课逐条解释它们为什么这样排序、彼此如何冲突（去重复与可读性、最小化与表达力），什么是“知识的重复”与“偶然的相似”，以及如何在 TDD 的重构步骤中让良好的设计逐步涌现，而不是一开始就设计好。'
SUM=['<b>规则 1：通过所有测试</b>。系统必须首先按预期工作，且能被验证。可测试性会反过来推动更好的设计：难测的类通常耦合太紧、职责太多。',
'<b>规则 2：没有重复</b>。重复意味着同一个知识需要在多处维护（DRY）。注意区分<b>知识的重复</b>（同一条业务规则写了两次）与<b>偶然的相似</b>（两段代码碰巧长得像，但会因不同原因变化）——后者合并反而有害。',
'<b>规则 3：表达意图</b>。好名字、短函数、标准模式名（<code>Command</code>、<code>Visitor</code>）、测试当作文档。写完之后多花一点时间让下一个读者轻松。',
'<b>规则 4：尽量少的元素</b>。前三条规则不应被教条推到极端：为每个类都建接口、为每种可能都留扩展点，会产生大量无用的类。在满足前三条的前提下，越少越好。',
'<b>“三次法则”</b>：第一次直接写，第二次出现时注意到重复，第三次再抽象。过早抽象会把偶然的相似固化下来，之后拆开它比去重复更难（“错误的抽象比重复更昂贵”——Sandi Metz）。',
'<b>涌现</b>：在 TDD 的每个“重构”步骤应用这四条规则，好的结构会从小步改进中长出来，而不需要提前完整设计。']
S1=('四条规则的优先级','当规则冲突时，排在前面的赢。')
A1=[('1 测试','先保证正确且可验证。',[('a','① 通过所有测试','ok',0,0,240)]),
('2 无重复','每个知识只出现一次。',[('a','① 通过所有测试','ok',0,0,240),('b','② 没有重复','ok',0,60,240)]),
('3 表达','读者能看懂意图。去重复不能以牺牲可读性为代价。',[('a','① 通过所有测试','ok',0,0,240),('b','② 没有重复','ok',0,60,240),('c','③ 表达意图','ok',0,120,240)]),
('4 最少','在满足前三条后，删掉多余的类和方法。',[('a','① 通过所有测试','ok',0,0,240),('b','② 没有重复','ok',0,60,240),('c','③ 表达意图','ok',0,120,240),('d','④ 元素最少','sig',0,180,240)])]
S2=('动手：重复，还是偶然相似？','选择一对代码。')
CHI=[('两处税率','# checkout.py\ntotal = subtotal * 1.13\n\n# invoice.py\ntax = subtotal * 0.13','bad','<b>知识重复</b>：同一条税率规则写了两次，税率变化时只改一处就会产生不一致。提取 <code>VAT_RATE</code> 与 <code>vat_of(amount)</code>。'),
('两个校验','def valid_username(s):\n    return 3 <= len(s) <= 20\n\ndef valid_product_code(s):\n    return 3 <= len(s) <= 20','sig','<b>偶然相似</b>：用户名规则由产品/安全决定，商品编码由仓库系统决定，它们会独立变化。合并成 <code>valid_length(s)</code> 会把两个无关的规则绑在一起。可以保留重复。'),
('复制粘贴的循环','for o in orders:\n    if o.status == "paid" and o.created >= start:\n        ...\n# 另外 4 个文件中有同样的条件','bad','<b>知识重复</b>：“本期已支付的订单”是一个业务概念。提取 <code>paid_orders_since(orders, start)</code> 或 <code>Order.is_paid_since(start)</code>。'),
('过早抽象','class AbstractNotifierFactoryProvider:\n    def get_factory(self) -> AbstractNotifierFactory: ...\n\n# 目前只有一种通知方式：邮件','bad','违反<b>规则 4</b>。只有一种实现时，直接写 <code>EmailNotifier</code>。出现第二种时再引入接口。'),
('测试辅助','def make_order(**overrides):\n    defaults = dict(id=1, status="paid", total=100)\n    return Order(**{**defaults, **overrides})','ok','测试中重复的构造代码被提取为一个辅助函数，并且只写出与该测试相关的字段（<code>make_order(status="refunded")</code>），同时满足规则 2 与 3。')]
CHH='选择一对代码。'
S3=('错误的抽象','把偶然相似合并之后会发生什么。','''<p>一个常见的演化过程：</p>
<ol><li>两处代码看起来相同，于是提取了共享函数 <code>process(data)</code>。</li>
<li>新需求只影响其中一个调用者，于是加了一个参数 <code>process(data, legacy=False)</code>。</li>
<li>又一个需求，加了 <code>if mode == "x"</code>。几轮之后，共享函数里充满了只为某个调用者服务的分支。</li>
<li>没有人敢改，因为每个分支都可能影响所有调用者。</li></ol>
<p><b>修复方法</b>（Sandi Metz 的建议）：把共享函数内联回每个调用者，删掉每个调用者用不到的分支，然后重新观察真正的重复。<b>预防方法</b>：问“这两段代码会因为同一个原因而改变吗？”——只有答案为“是”时才合并。</p>
<table class="tbl"><tr><th>信号</th><th>多半是</th></tr>
<tr><td>修改一处时，你总是也要改另一处</td><td>知识重复 → 合并</td></tr>
<tr><td>共享函数中的布尔参数和模式分支越来越多</td><td>错误的抽象 → 内联并重新拆分</td></tr>
<tr><td>两段代码属于不同的业务方 / 模块</td><td>可能是偶然相似 → 观察一段时间</td></tr></table>''')
S4=('找重复','用工具找出候选，再由人判断是不是知识重复。')
TERM=[['pylint --disable=all --enable=duplicate-code src/','src/billing/invoice.py:1:0: R0801: Similar lines in 2 files\n==billing.checkout:[40:52]\n==billing.invoice:[18:30]\n    for line in lines:\n        if line.taxable:\n            tax += line.amount * 0.13','工具只能发现文本相似。'],
['grep -rn "0\\.13\\|1\\.13" --include=*.py src/','src/billing/checkout.py:44:        total = subtotal * 1.13\nsrc/billing/invoice.py:22:            tax += line.amount * 0.13\nsrc/reports/vat.py:9:    return revenue * 0.13','搜索魔法数是发现“知识重复”的好办法：同一个税率出现了三次。']]
S5=('在你的电脑上练习','在 TDD 的重构步骤中应用四条规则：先去掉知识重复，再改善表达，最后删除多余元素。')
PRAC=[('起点：测试通过（规则 1），但税率重复了三次。','cat > billing.py <<\'EOF\'\ndef checkout_total(subtotal):\n    return round(subtotal * 1.13, 2)\n\ndef invoice_tax(lines):\n    return round(sum(l * 0.13 for l in lines), 2)\n\ndef vat_report(revenue):\n    return f"VAT: {revenue * 0.13:.2f}"\nEOF\ncat > test_billing.py <<\'EOF\'\nimport unittest\nfrom billing import *\nclass T(unittest.TestCase):\n    def test_checkout(self): self.assertEqual(checkout_total(100), 113)\n    def test_invoice(self): self.assertEqual(invoice_tax([100, 50]), 19.5)\n    def test_report(self): self.assertEqual(vat_report(1000), "VAT: 130.00")\nunittest.main(argv=["x"], exit=False, verbosity=0)\nEOF\npython3 test_billing.py 2>&1 | tail -n 1; grep -c "0\\.13\\|1\\.13" billing.py',None),
('规则 2 与 3：一个知识只有一处，名字表达意图。','cat > billing.py <<\'EOF\'\nVAT_RATE = 0.13\n\ndef vat_of(amount):\n    return amount * VAT_RATE\n\ndef checkout_total(subtotal):\n    return round(subtotal + vat_of(subtotal), 2)\n\ndef invoice_tax(lines):\n    return round(vat_of(sum(lines)), 2)\n\ndef vat_report(revenue):\n    return f"VAT: {vat_of(revenue):.2f}"\nEOF\npython3 test_billing.py 2>&1 | tail -n 1; grep -c "0\\.13\\|1\\.13" billing.py',None),
('税率改变时，只需改一处，所有测试都能感知。','sed -i "s/VAT_RATE = 0.13/VAT_RATE = 0.125/" billing.py && python3 -c "from billing import *; print(checkout_total(100), invoice_tax([100, 50]), vat_report(1000))"',None)]
CHAL=('合并还是保留？','一个电商系统中：① 商品详情页和购物车页面都显示“预计送达日期”，计算逻辑相同；② 注册表单和收货地址表单都校验手机号，正则相同；③ 管理员报表与用户订单页面都把金额格式化为“¥1,234.50”；④ 用户密码与 API 密钥都要求“至少 12 位”。逐一判断是知识重复还是偶然相似。',
'<ol><li><b>知识重复</b>：同一条业务规则（物流承诺），必须一致，否则用户会看到两个日期。合并。</li><li><b>知识重复</b>：“什么是合法的中国手机号”是同一个知识。合并为 <code>PhoneNumber.parse()</code>。</li><li><b>知识重复</b>：货币显示格式是全站统一的约定。合并。</li><li><b>偶然相似</b>：密码长度由安全策略与用户体验决定；API 密钥长度由密钥生成方式决定（通常更长、随机生成）。它们会独立变化，保持分开，各自命名：<code>MIN_PASSWORD_LENGTH</code>、<code>API_KEY_LENGTH</code>。</li></ol>')
QUIZ=[['简单设计四规则的第一条是？',['通过所有测试','没有重复','类最少'],0,''],
['两段因不同原因变化、只是碰巧相同的代码？',['偶然相似，合并可能有害','必须合并','删除一个'],0,''],
['“错误的抽象”的典型信号？',['共享函数中的模式参数与分支越来越多','函数很短','有测试'],0,''],
['发现错误的抽象后的建议做法？',['内联回调用者，再重新观察真正的重复','加更多参数','加注释'],0,''],
['规则 4（元素最少）防止的是？',['过度设计、无用的抽象层','重复','测试失败'],0,'']]
