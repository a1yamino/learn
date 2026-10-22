TITLE='为什么要写整洁的代码：混乱的代价与童子军规则';MIN=40;NEXT='有意义的命名'
DESC='《代码整洁之道》开篇的论点：代码被阅读的次数远多于被编写的次数，混乱会让每一次修改变得更慢，最终拖垮团队。本课讲“整洁”到底指什么（几位资深程序员的不同定义），混乱如何以复利方式累积，“以后再清理”为何几乎从不发生，童子军规则（离开时让营地比来时更干净），以及如何把整洁当作专业态度而不是审美偏好。最后也介绍对这本书的常见批评，帮你在本课程中有判断地吸收它。'
SUM=['<b>读远多于写</b>：修改代码之前必须先读懂它，读与写的时间比经常超过 10:1。让代码易读，就是让后续每一次修改都更快。',
'<b>混乱有复利</b>：每一处“先这样凑合”都会让下一处修改更难，于是又多一处凑合。生产率随时间下降，加人也救不回来，最后常常走向“推倒重写”——而重写的系统又会重复同样的过程。',
'<b>“以后再清理”通常等于“永不清理”</b>（LeBlanc 定律）。真正可行的是在每次修改时顺手清理一点点。',
'<b>整洁的特征</b>：意图一目了然、只做一件事并做好、没有重复、有测试保护、最小惊讶——读到的每个函数都基本是你预期的样子。',
'<b>童子军规则</b>：每次签入代码时，让它比你签出时更干净一点：改一个名字、拆一个长函数、删一处重复。小步、持续、有测试兜底。',
'<b>有判断地吸收</b>：书中的 Java 示例与“函数越短越好”等主张受到不少批评（例如 Ousterhout 的“深模块”观点）。本课程把原则当成可权衡的工具：目标始终是降低理解与修改的成本，而不是机械地遵守规则。']
S1=('混乱的复利','一个功能接一个功能地加，看生产率怎么变化。')
A1=[('第 1 个月','代码少、结构清楚，每个需求都很快。',[('a','需求 A：1 天','ok',0,0,150),('c','代码库：清楚','ok',200,0,150)]),
('凑合一下','为了赶进度，复制粘贴了一段逻辑，留下一个 TODO。',[('a','需求 A：1 天','ok',0,0,150),('b','需求 B：2 天','sig',0,60,150),('c','代码库：1 处重复','sig',200,0,150)]),
('复利','新需求必须同时改两处重复，还要绕开那个 TODO，又引入新的特例。',[('a','需求 A：1 天','ok',0,0,150),('b','需求 B：2 天','sig',0,60,150),('d','需求 C：5 天','bad',0,120,150),('c','代码库：难以理解','bad',200,0,150)]),
('加人','加人后新人更难读懂代码，并在不理解的情况下继续凑合。',[('d','需求 D：10 天','bad',0,0,150),('c','代码库：沼泽','bad',200,0,150),('p','新成员 ×3','sig',200,60,150)]),
('童子军规则','每次修改顺手清理一点，代码库保持在可理解的状态，需求成本稳定。',[('a','需求 E：2 天','ok',0,0,150),('c','代码库：持续变好','ok',200,0,150),('t','测试兜底','ok',200,60,150)])]
S2=('动手：哪一个更快读懂？','同一个函数的两个版本。选一个，看读它需要回答的问题。')
CHI=[('版本一','def calc(l, t):\n    r = 0\n    for i in l:\n        if i[2] == 1 and i[1] > t:\n            r += i[1] * 0.9\n        elif i[2] == 1:\n            r += i[1]\n    return r','bad','读者必须猜：<code>l</code> 是什么？<code>i[2] == 1</code> 是什么状态？<code>0.9</code> 是什么折扣？<code>t</code> 是阈值吗？每个问题都要去调用处或数据库里找答案。'),
('版本二','DISCOUNT_RATE = 0.9\n\ndef total_of_paid_orders(orders, discount_threshold):\n    total = 0\n    for order in orders:\n        if not order.is_paid:\n            continue\n        if order.amount > discount_threshold:\n            total += order.amount * DISCOUNT_RATE\n        else:\n            total += order.amount\n    return total','ok','名字回答了所有问题：对已支付订单求和，超过阈值打九折。这里同时把元组换成了 Order 对象，需适配输入表示。下方练习用 calc 包装旧元组接口，验证迁移前后结果一致。'),
('两者比较','经 Order 适配后的等价数据，计算结果相同\n不同的是：读懂它需要的时间\n\n版本一：约 1-2 分钟 + 查找调用方\n版本二：约 10 秒','sig','整洁不改变程序做什么，它改变的是<b>下一个人</b>理解和修改它的成本。')]
CHH='选择一个版本。'
S3=('“整洁”的几种定义','书中引用了几位资深程序员的看法，归纳起来是同一件事的不同侧面。','''<table class="tbl"><tr><th>侧面</th><th>含义</th><th>反面</th></tr>
<tr><td>优雅、高效</td><td>逻辑直接，缺陷难以藏身，依赖最少</td><td>绕弯的流程让 bug 有地方躲</td></tr>
<tr><td>像好文章一样可读</td><td>读起来像在叙述意图，不需要逆向工程</td><td>读者要在脑中模拟执行</td></tr>
<tr><td>他人可以改进</td><td>有测试、有清楚的边界，别人敢改</td><td>只有作者敢动的代码</td></tr>
<tr><td>看得出作者在乎</td><td>没有明显可改进之处</td><td>遗留的 TODO、注释掉的代码、随意的命名</td></tr>
<tr><td>没有重复、表达力强、抽象恰当</td><td>每个概念只在一处表达</td><td>同一规则改三处</td></tr>
<tr><td>符合预期</td><td>每个函数都基本是你读之前猜的样子</td><td>名为 <code>get_user</code> 的函数还会发邮件</td></tr></table>
<p>还有一些对本书的讨论值得在开始前知道：</p>
<ul><li><b>John Ousterhout</b>（《软件设计的哲学》）认为过度拆分出大量很浅的小函数会增加接口数量与阅读跳转，好的模块应该“深”：接口简单、隐藏大量实现。第 3 课会对比两种观点。</li>
<li>书中一些 Java 重构示例的结果被批评为可读性反而下降（例如依赖大量实例变量在小方法间传递状态）。本课程会指出这些地方，给出更稳妥的写法。</li>
<li>测试先行、小步重构、命名、去重复、关注点分离等核心观点则被广泛接受。</li></ul>''')
S4=('童子军规则：一次签入','一次小修改中，顺手做了哪些清理。')
TERM=[['git diff --stat','  orders.py      | 14 ++++++++------\n  test_orders.py |  9 +++++++++\n 2 files changed, 17 insertions(+), 6 deletions(-)','需求本身只改了 3 行；另外几行是清理。'],
['git log -1 --format=%B','修复：退款订单不应计入月度营收\n\n顺手清理：\n- calc → total_of_paid_orders\n- 魔法数 0.9 → DISCOUNT_RATE\n- 补上退款场景的测试','清理与修复放在一次小提交里，评审者能一眼看清。较大的清理应单独提交。'],
['python3 -m unittest -q','----------------------------------------------------------------------\nRan 4 tests in 0.001s\n\nOK','测试是清理的前提：没有测试，就无法确认行为没变。']]
S5=('在你的电脑上练习','只需要 Python 3（3.10 以上）。在一个空目录里做：先为混乱的版本写测试，再在测试保护下重构。')
PRAC=[('创建混乱的版本 <code>orders.py</code>。','cat > orders.py <<\'EOF\'\ndef calc(l, t):\n    r = 0\n    for i in l:\n        if i[2] == 1 and i[1] > t:\n            r += i[1] * 0.9\n        elif i[2] == 1:\n            r += i[1]\n    return r\nEOF',''),
('先写<b>特征测试</b>：把现有行为固定下来（元组：订单号、金额、状态，1 = 已支付）。','cat > test_orders.py <<\'EOF\'\nimport unittest\nfrom orders import calc\n\nORDERS = [(1, 100, 1), (2, 300, 1), (3, 500, 0), (4, 200, 1)]\n\nclass TestCalc(unittest.TestCase):\n    def test_only_paid_orders_count(self):\n        self.assertEqual(calc([(1, 100, 0)], 1000), 0)\n\n    def test_discount_above_threshold(self):\n        self.assertAlmostEqual(calc([(1, 300, 1)], 250), 270)\n\n    def test_mixed(self):\n        self.assertAlmostEqual(calc(ORDERS, 250), 570)\n\n    def test_threshold_is_exclusive(self):\n        self.assertEqual(calc([(1, 250, 1)], 250), 250)\n\nif __name__ == "__main__":\n    unittest.main()\nEOF\npython3 -m unittest -v',None),
('在测试保护下重构：引入 <code>Order</code>、改名、命名常量。旧函数保留为一个薄包装，调用方不用一次全改。','cat > orders.py <<\'EOF\'\nfrom dataclasses import dataclass\n\nPAID = 1\nDISCOUNT_RATE = 0.9\n\n@dataclass(frozen=True)\nclass Order:\n    id: int\n    amount: float\n    status: int\n\n    @property\n    def is_paid(self):\n        return self.status == PAID\n\ndef total_of_paid_orders(orders, discount_threshold):\n    total = 0\n    for order in orders:\n        if not order.is_paid:\n            continue\n        if order.amount > discount_threshold:\n            total += order.amount * DISCOUNT_RATE\n        else:\n            total += order.amount\n    return total\n\ndef calc(rows, threshold):  # 兼容旧调用方，逐步迁移后删除\n    return total_of_paid_orders([Order(*r) for r in rows], threshold)\nEOF\npython3 -m unittest',None),
('确认行为没有变化的同时，代码现在“说出了”它在做什么。','python3 -c "from orders import Order, total_of_paid_orders as t; print(t([Order(1, 300, 1), Order(2, 100, 0)], 250))"',None)]
CHAL=('童子军规则：一次小清理','在下面这个函数里只做<b>三处</b>最有价值的小改进（不改变行为），并说明为什么选它们：<pre class="cmd">def proc(d):\n    # 检查\n    if d["a"] < 18:\n        return False\n    x = d["e"].split("@")\n    if len(x) != 2:\n        return False\n    # TODO 以后支持手机号\n    return True</pre>',
'<ol><li><b>函数名</b>：<code>proc</code> → <code>is_valid_signup</code>。它返回布尔值并判断注册数据是否合法，名字应该说出来。</li><li>局部名称：将 d 命名为 signup，再用 <code>age = signup["a"]</code>、<code>email = signup["e"]</code> 表达含义。这里保留原字典键；改成 age/email 会改变输入契约，需另行迁移调用方，不能当作行为不变的小清理。</li><li><b>魔法数和无用注释</b>：<code>18</code> → <code>MINIMUM_AGE = 18</code>；删除“# 检查”这种复述代码的注释；TODO 移到问题跟踪系统里。</li></ol><p>没有选择大改结构：童子军规则要求的是每次一点点、有测试兜底，而不是在修 bug 时顺手重写模块。</p>')
QUIZ=[['为什么可读性是首要目标？',['因为读代码的时间远多于写代码','因为编译器需要','因为代码越短越快'],0,'修改前必须先读懂，读写时间比常超过 10:1。'],
['混乱的代码最终常常导致？',['生产率持续下降，最后推倒重写','性能提升','测试变少但更可靠'],0,'混乱以复利方式累积。'],
['童子军规则说的是？',['每次签入让代码比签出时更干净一点','每季度安排一次大重构','只有作者能改自己的代码'],0,'小步、持续。'],
['重构之前首先需要？',['能确认行为不变的测试','新的框架','更长的注释'],0,'没有测试就无法确认重构没有改变行为。'],
['Ousterhout 对“函数越短越好”的主要批评是？',['大量很浅的小函数增加接口与阅读跳转','短函数运行更慢','Python 不支持短函数'],0,'他主张“深模块”：简单接口、隐藏大量实现。']]
