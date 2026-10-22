TITLE='单元测试与 TDD：整洁的测试';MIN=50;NEXT='类：单一职责与内聚'
DESC='测试代码和生产代码一样重要：脏的测试会变得难以修改，最终被删除，生产代码也就失去了重构的安全网。本课讲 TDD 的三条定律与“红—绿—重构”循环，整洁测试的标准（可读性第一）、构造—操作—检验（Arrange-Act-Assert）结构、面向领域的测试语言、每个测试一个概念、F.I.R.S.T. 原则，以及测试替身（fake、stub、mock）的取舍和“过度 mock”的问题。练习用 TDD 从零写一个小功能。'
SUM=['<b>TDD 三定律</b>：① 在写出一个失败的测试之前，不写生产代码；② 只写刚好失败的测试（编译失败也算失败）；③ 只写刚好让测试通过的生产代码。循环很短：红 → 绿 → 重构。',
'<b>测试保护的是可修改性</b>：有了快速、可靠的测试，你才敢重构；没有测试，每次修改都是冒险，代码会逐渐腐烂。',
'<b>可读性第一</b>：测试是活的文档。用 Arrange-Act-Assert 三段结构；用领域语言的辅助函数（<code>given_cart_with(...)</code>）隐藏无关细节；测试名描述行为（<code>test_vip_gets_free_shipping</code>）。',
'<b>每个测试一个概念</b>：一个测试失败时，名字就应该说明哪个行为坏了。断言可以有多个，但它们应验证同一个概念。',
'<b>F.I.R.S.T.</b>：快速（Fast）、独立（Independent）、可重复（Repeatable，不依赖网络、时间、随机数）、自足验证（Self-validating，通过或失败，不需要人看日志）、及时（Timely，与生产代码一起写）。',
'<b>测试替身</b>：优先用真实对象或内存假实现（fake）；对外部系统用 stub 提供数据；只在“交互本身就是行为”时（如“应发送一封邮件”）使用 mock 验证调用。过度 mock 会把测试绑在实现细节上，重构时大量测试无故失败。']
S1=('红—绿—重构','一个循环通常只有几分钟。')
A1=[('红','写一个失败的测试，描述下一个小行为。',[('r','红：test_empty_cart_total_is_zero ✗','bad',0,0,340)]),
('绿','写最少的代码让它通过——哪怕是 return 0。',[('r','红：test_empty_cart_total_is_zero','',0,0,340),('g','绿：return 0  ✓','ok',0,60,340)]),
('下一个红','新测试迫使实现变得更通用。',[('r','红：test_total_sums_items ✗','bad',0,0,340),('g','绿：return sum(...)  ✓','ok',0,60,340)]),
('重构','测试是绿的，现在可以安全地改名、去重复、拆函数。',[('g','绿：所有测试 ✓','ok',0,0,340),('f','重构：提取 Money 类型','sig',0,60,340),('k','仍然 ✓','ok',0,120,340)])]
S2=('动手：这个测试好吗？','选择一个测试。')
CHI=[('test1()','def test1():\n    c = Cart()\n    c.add(Item("a", 10))\n    c.add(Item("b", 5))\n    assert c.total() == 15\n    c.apply("VIP")\n    assert c.shipping() == 0\n    c.remove("a")\n    assert c.total() == 5','bad','名字没有信息；测试了三个概念（合计、VIP 运费、删除）。拆成三个测试，每个名字描述一个行为。'),
('AAA','def test_vip_gets_free_shipping():\n    cart = cart_with(Item("pen", 10))\n    cart.apply_membership(VIP)\n\n    shipping = cart.shipping_fee()\n\n    assert shipping == 0','ok','清楚的 Arrange（构造）、Act（操作）、Assert（检验），名字就是规格说明。'),
('依赖当前时间','def test_coupon_expired():\n    c = Coupon(expires=date(2026, 12, 31))\n    assert c.is_expired() is False','bad','2027 年这个测试会失败——不可重复。注入时钟：<code>c.is_expired(today=date(2026, 6, 1))</code>。'),
('过度 mock','def test_place_order():\n    repo = Mock(); calc = Mock(); calc.total.return_value = 10\n    place_order(repo, calc, items)\n    calc.total.assert_called_once_with(items)\n    repo.save.assert_called_once()','bad','测试的是“调用了哪些方法”而不是结果。把 total 的计算内联、或换一种实现，测试就失败，尽管行为没变。用内存仓库（fake），断言保存的订单内容。'),
('mock 合适的场景','def test_password_reset_sends_email():\n    mailer = RecordingMailer()\n    request_password_reset(users, mailer, "ann@x.com")\n    assert mailer.sent == [("ann@x.com", "重置密码")]','ok','“发送了邮件”正是要验证的行为。这里用一个记录调用的假实现，比 Mock 的断言更易读。')]
CHH='选择一个测试。'
S3=('测试替身','同一个名词“mock”常被用来指代几种不同的东西。','''<table class="tbl"><tr><th>种类</th><th>做什么</th><th>例子</th><th>何时用</th></tr>
<tr><td>Dummy</td><td>只为填参数，不被使用</td><td><code>None</code>、空对象</td><td>签名要求但与测试无关</td></tr>
<tr><td>Stub</td><td>返回预设的数据</td><td>总是返回 25℃ 的天气源</td><td>为被测代码提供输入</td></tr>
<tr><td>Fake</td><td>可工作的简化实现</td><td>内存仓库、内存文件存储</td><td>替代慢或外部的依赖；首选</td></tr>
<tr><td>Spy / Mock</td><td>记录调用，事后断言</td><td><code>RecordingMailer</code>、<code>unittest.mock.Mock</code></td><td>交互本身就是要验证的行为</td></tr></table>
<p><b>测试金字塔</b>：大量快速的单元测试（毫秒级），较少的集成测试（验证适配器与真实数据库、服务），少量端到端测试。测试越慢、越依赖外部，就越不适合在每次保存时运行。</p>''')
S4=('运行测试','unittest 的常用选项。')
TERM=[['python3 -m unittest -v','test_add_item_increases_total (test_cart.CartTest...) ... ok\ntest_empty_cart_total_is_zero (test_cart.CartTest...) ... ok\n...\nRan 6 tests in 0.001s\n\nOK','-v 列出每个测试的名字：好的测试名读起来就是规格说明。'],
['python3 -m unittest test_cart.CartTest.test_vip_gets_free_shipping','.\nRan 1 test in 0.000s\n\nOK','只运行一个测试：TDD 循环中最常用。'],
['python3 -m unittest -k shipping','..\nRan 2 tests in 0.000s\n\nOK','按名字过滤。'],
['python3 -m unittest -f','F\n======================================================================\nFAIL: test_remove_item ...','-f（failfast）：第一个失败就停止。']]
S5=('在你的电脑上练习','用 TDD 从零写一个购物车。每一步：先运行看到红，再写代码看到绿。')
PRAC=[('红：第一个测试。<code>cart.py</code> 还不存在。','cat > test_cart.py <<\'EOF\'\nimport unittest\nfrom cart import Cart\n\nclass CartTest(unittest.TestCase):\n    def test_empty_cart_total_is_zero(self):\n        self.assertEqual(Cart().total(), 0)\nEOF\npython3 -m unittest 2>&1 | grep -E "Error|Ran|FAILED"',None),
('绿：最少的代码。','cat > cart.py <<\'EOF\'\nclass Cart:\n    def total(self):\n        return 0\nEOF\npython3 -m unittest 2>&1 | tail -n 1',None),
('红：下一个行为迫使实现变得通用。','cat >> test_cart.py <<\'EOF\'\n\n    def test_total_sums_item_prices(self):\n        cart = Cart()\n        cart.add("pen", 10)\n        cart.add("ink", 5)\n        self.assertEqual(cart.total(), 15)\nEOF\npython3 -m unittest 2>&1 | grep -E "^(ERROR|FAIL|AttributeError|Ran)"',None),
('绿。','cat > cart.py <<\'EOF\'\nclass Cart:\n    def __init__(self):\n        self._prices = []\n\n    def add(self, name, price):\n        self._prices.append(price)\n\n    def total(self):\n        return sum(self._prices)\nEOF\npython3 -m unittest 2>&1 | tail -n 1',None),
('红：VIP 满 100 免运费，否则运费 8。','cat >> test_cart.py <<\'EOF\'\n\n    def test_shipping_is_8_by_default(self):\n        self.assertEqual(Cart().shipping_fee(), 8)\n\n    def test_vip_gets_free_shipping(self):\n        cart = Cart(is_vip=True)\n        self.assertEqual(cart.shipping_fee(), 0)\nEOF\npython3 -m unittest 2>&1 | grep -E "^(ERROR|FAIL|Ran)"',None),
('绿，然后重构：测试保护下把价格和名字一起保存。','cat > cart.py <<\'EOF\'\nSTANDARD_SHIPPING = 8\n\nclass Cart:\n    def __init__(self, is_vip=False):\n        self._items = {}\n        self._is_vip = is_vip\n\n    def add(self, name, price):\n        self._items[name] = price\n\n    def total(self):\n        return sum(self._items.values())\n\n    def shipping_fee(self):\n        return 0 if self._is_vip else STANDARD_SHIPPING\nEOF\npython3 -m unittest -v 2>&1 | grep -E "ok$|Ran|OK"',None)]
CHAL=('继续 TDD','继续上面的购物车，用 TDD 依次加入：① 同一商品添加两次时数量累加（需要改变数据结构）；② 删除商品；③ 非 VIP 满 99 元免运费。对每一项先写出测试名，再写测试。',
'<pre class="cmd">def test_adding_same_item_twice_doubles_quantity(self):\n    cart = Cart(); cart.add("pen", 10); cart.add("pen", 10)\n    self.assertEqual(cart.total(), 20)\n\ndef test_removed_item_is_not_charged(self):\n    cart = Cart(); cart.add("pen", 10); cart.add("ink", 5)\n    cart.remove("pen")\n    self.assertEqual(cart.total(), 5)\n\ndef test_free_shipping_from_99(self):\n    cart = Cart(); cart.add("bag", 99)\n    self.assertEqual(cart.shipping_fee(), 0)\n\ndef test_shipping_charged_below_99(self):\n    cart = Cart(); cart.add("bag", 98.99)\n    self.assertEqual(cart.shipping_fee(), 8)</pre><p>第一个测试会失败（dict 覆盖了同名商品），这正是测试的价值：它暴露了上一步“重构”中引入的错误假设。实现改为保存 <code>{name: (price, quantity)}</code>。第三项需要两个测试，覆盖边界的两侧（99 与 98.99）。</p>')
QUIZ=[['TDD 的循环是？',['红 → 绿 → 重构','写代码 → 写测试 → 发布','重构 → 红 → 绿'],0,''],
['测试最重要的品质是？',['可读性','覆盖率 100%','断言数量'],0,''],
['依赖当前日期的测试违反了 F.I.R.S.T. 中的？',['Repeatable（可重复）','Fast','Timely'],0,''],
['过度 mock 的主要问题？',['测试绑定实现细节，重构时无故失败','运行太慢','无法编写'],0,''],
['首选的测试替身通常是？',['内存假实现（fake）','到处 Mock','真实生产服务'],0,'']]
