TITLE='SOLID：开闭、里氏替换、接口隔离与依赖倒置';MIN=55;NEXT='系统：关注点分离与依赖注入'
DESC='上一课讲了 S（单一职责）。本课讲另外四条：开闭原则（对扩展开放、对修改关闭）、里氏替换原则（子类型必须能替换父类型而不破坏程序的正确性）、接口隔离原则（不要强迫使用者依赖它不用的方法）、依赖倒置原则（高层策略与低层细节都依赖抽象）。每条都配一个在 Python 中常见的反例与重构，并讨论什么时候不值得应用它们（YAGNI）。'
SUM=['<b>开闭原则（OCP）</b>：添加新行为时，通过新增代码（新类、新函数、新注册项）完成，而不是修改已有的、经过测试的代码。实现手段：多态、策略对象、注册表、插件。',
'<b>里氏替换原则（LSP）</b>：凡是使用父类型的地方，换成子类型都应当正确工作。经典反例：<code>Square</code> 继承 <code>Rectangle</code> 后，设置宽度会意外改变高度。子类不应加强前置条件、削弱后置条件，或抛出父类未声明的异常（如 <code>NotImplementedError</code>）。',
'<b>接口隔离原则（ISP）</b>：使用者只依赖它需要的方法。一个巨大的 <code>Repository</code> 接口让只读的报表模块也依赖写方法。Python 中用小的 <code>Protocol</code> 表达“我需要什么”。',
'<b>依赖倒置原则（DIP）</b>：业务规则不应依赖数据库、框架、HTTP 这些细节；两者都依赖抽象，并且抽象由<b>高层</b>（使用者）定义。依赖注入是实现它的常用手段（下一课）。',
'<b>原则是工具，不是目标</b>：为“可能的扩展”提前建立抽象层会增加复杂度（YAGNI：你不会需要它）。常见的做法是：第一次直接写；第二次出现变化时，引入抽象（“三次法则”的变体）。',
'<b>Python 的特点</b>：鸭子类型与 <code>Protocol</code> 让接口很轻；函数是一等公民，很多“策略模式”只需要传一个函数。']
S1=('依赖倒置','箭头方向反过来之后发生了什么。')
A1=[('直接依赖','业务规则（下单）直接导入并调用 PostgreSQL 与 SMTP。',[('h','下单规则','',0,60,160),('d','PostgreSQL','bad',260,0,150),('m','SMTP','bad',260,120,150)]),
('后果','测试下单需要数据库和邮件服务器；换存储要改业务代码。',[('h','下单规则 ✗ 难测试','bad',0,60,200),('d','PostgreSQL','',260,0,150),('m','SMTP','',260,120,150)]),
('倒置','业务层定义它需要的接口（OrderRepository、Notifier），细节实现这些接口。',[('h','下单规则','ok',0,60,160),('i1','OrderRepository','sig',200,0,170),('i2','Notifier','sig',200,120,170),('d','PgOrderRepository','',400,0,170),('m','SmtpNotifier','',400,120,170)]),
('结果','依赖箭头从细节指向抽象，测试时注入内存实现。',[('h','下单规则 ✓','ok',0,60,160),('i1','OrderRepository','sig',200,0,170),('i2','Notifier','sig',200,120,170),('d','InMemoryRepo','ok',400,0,170),('m','RecordingNotifier','ok',400,120,170)])]
S2=('动手：违反了哪一条？','选择一段代码。')
CHI=[('if kind == ...','def export(report, kind):\n    if kind == "csv": ...\n    elif kind == "xlsx": ...\n    elif kind == "pdf": ...\n# 新增 json 格式：修改这个函数','bad','<b>OCP</b>。用注册表：<code>EXPORTERS = {"csv": export_csv, ...}</code>，新增格式只需注册一个新函数。'),
('Square(Rectangle)','class Square(Rectangle):\n    def set_width(self, w):\n        self.w = self.h = w\n\ndef stretch(r: Rectangle):\n    r.set_width(10)\n    assert r.area() == 10 * r.h   # 对 Square 失败','bad','<b>LSP</b>。正方形在数学上是矩形，但在“可单独设置宽高”的契约下不是。不要继承：两者各自实现 <code>Shape</code>，或使用不可变值对象。'),
('raise NotImplementedError','class ReadOnlyStore(Store):\n    def save(self, item):\n        raise NotImplementedError','bad','<b>LSP 与 ISP</b>。调用方拿到一个 Store 却不能 save。把接口拆成 <code>Reader</code> 与 <code>Writer</code>，只读存储只实现 Reader。'),
('巨大的接口','class Repository(Protocol):\n    def get(...); def find(...); def save(...)\n    def delete(...); def bulk_import(...); def vacuum(...)\n\ndef monthly_report(repo: Repository): ...  # 只用 find','bad','<b>ISP</b>。报表只需要 <code>class Finder(Protocol): def find(...)</code>。依赖越窄，替换与测试越容易。'),
('import psycopg','# orders/rules.py\nimport psycopg\n\ndef place_order(conn: psycopg.Connection, cart): ...','bad','<b>DIP</b>。业务规则依赖了数据库驱动。改为依赖业务层定义的 <code>OrderRepository</code>。'),
('传一个函数','def apply_discount(price, policy=lambda p: p):\n    return policy(price)\n\napply_discount(100, lambda p: p * 0.9)','ok','在 Python 中，最简单的策略就是一个函数。满足 OCP，不需要类层次。')]
CHH='选择一段代码。'
S3=('何时应用，何时不必','每条原则都有成本：额外的抽象、间接层和文件。','''<table class="tbl"><tr><th>原则</th><th>值得应用的信号</th><th>可以暂缓的情况</th></tr>
<tr><td>OCP</td><td>同一个分支链已经第二次因新类型被修改；有第三方需要扩展你的代码（插件）</td><td>只有一两种情况，且很少变化</td></tr>
<tr><td>LSP</td><td>始终遵守：违反它的继承一定会产生 bug</td><td>—（不确定时用组合代替继承）</td></tr>
<tr><td>ISP</td><td>使用者只用了接口中很少的方法；实现类被迫写空方法</td><td>接口本来就小</td></tr>
<tr><td>DIP</td><td>业务规则需要在没有基础设施的情况下测试；细节可能被替换</td><td>小脚本、一次性工具；与框架深度绑定的薄层（如简单的 CRUD 视图）</td></tr></table>
<pre class="cmd" style="overflow-x:auto;white-space:pre"># Python 中的 ISP + DIP：使用者声明自己需要的最小接口
from typing import Protocol

class OrderFinder(Protocol):
    def orders_in(self, month: str) -> list[Order]: ...

def monthly_revenue(orders: OrderFinder, month: str) -> Decimal:
    return sum(o.total for o in orders.orders_in(month))</pre>''')
S4=('LSP 的测试','把同一套契约测试运行在每个子类型上。')
TERM=[['python3 -m unittest -v test_contract','test_area_after_set_width (test_contract.RectangleContract) ... ok\ntest_area_after_set_width (test_contract.SquareContract) ... FAIL','同一个契约测试在子类型上失败：违反了 LSP。'],
['python3 -m unittest -v test_contract','test_store_roundtrip (test_contract.InMemoryStoreContract) ... ok\ntest_store_roundtrip (test_contract.SqliteStoreContract) ... ok','反过来，契约测试保证了每个实现都可以互换。']]
S5=('在你的电脑上练习','用注册表实现 OCP，用契约测试检验 LSP。')
PRAC=[('之前：新增格式要修改函数。之后：注册表。','cat > exporters.py <<\'EOF\'\nimport json\n\nEXPORTERS = {}\n\ndef exporter(name):\n    def register(fn):\n        EXPORTERS[name] = fn\n        return fn\n    return register\n\n@exporter("csv")\ndef to_csv(rows):\n    return "\\n".join(",".join(map(str, r)) for r in rows)\n\n@exporter("json")\ndef to_json(rows):\n    return json.dumps(rows)\n\ndef export(rows, fmt):\n    try:\n        return EXPORTERS[fmt](rows)\n    except KeyError:\n        raise ValueError(f"不支持的格式 {fmt!r}，可选：{sorted(EXPORTERS)}") from None\nEOF\ncat > plugin_tsv.py <<\'EOF\'\nfrom exporters import exporter\n\n@exporter("tsv")   # 新格式：新文件，不修改 exporters.py\ndef to_tsv(rows):\n    return "\\n".join("\\t".join(map(str, r)) for r in rows)\nEOF\npython3 -c "\nimport plugin_tsv\nfrom exporters import export\nrows = [[1, \'a\'], [2, \'b\']]\nfor f in [\'csv\', \'json\', \'tsv\']:\n    print(f, repr(export(rows, f)))\ntry:\n    export(rows, \'xml\')\nexcept ValueError as e:\n    print(e)"',None),
('LSP：一套契约测试，运行在每个子类型上。','cat > shapes.py <<\'EOF\'\nclass Rectangle:\n    def __init__(self, w, h):\n        self.w, self.h = w, h\n    def set_width(self, w):\n        self.w = w\n    def area(self):\n        return self.w * self.h\n\nclass Square(Rectangle):\n    def __init__(self, side):\n        super().__init__(side, side)\n    def set_width(self, w):\n        self.w = self.h = w\nEOF\ncat > test_contract.py <<\'EOF\'\nimport unittest\nfrom shapes import Rectangle, Square\n\nclass RectangleContract(unittest.TestCase):\n    def make(self):\n        return Rectangle(2, 3)\n\n    def test_area_after_set_width(self):\n        r = self.make()\n        h = r.h\n        r.set_width(10)\n        self.assertEqual(r.area(), 10 * h)\n\nclass SquareContract(RectangleContract):\n    def make(self):\n        return Square(3)\n\nunittest.main(argv=["x", "-v"], exit=False)\nEOF\npython3 test_contract.py 2>&1 | grep -E "\\.\\.\\.|AssertionError"',None)]
CHAL=('修复 LSP','给出两种消除上面 <code>Square</code>/<code>Rectangle</code> 问题的设计，并说明各自适合的场景。',
'<ol><li><b>不可变值对象</b>：去掉会修改自身的 <code>set_width</code>，改为 <code>with_width(w)</code>，并规定它总是返回一个新的 <code>Rectangle</code>（宽为 w、高不变）。<code>Square(3).with_width(10)</code> 得到 <code>Rectangle(10, 3)</code>——不再是正方形，但契约对两者都成立，因为没有对象被“就地改形”。适合几何、金额这类值。</li><li><b>不继承，共享接口</b>：<code>Rectangle</code> 与 <code>Square</code> 都实现 <code>Shape</code> 协议（<code>area()</code>），彼此没有继承关系；需要修改尺寸的代码只接受 <code>Rectangle</code>。适合两者行为确实不同的情况。</li></ol><p>判断依据：继承表达的是“<b>行为上</b>可替换”，而不是现实中的“是一种”。</p>')
QUIZ=[['开闭原则要求新增行为时？',['新增代码而不是修改已有代码','修改基类','删除旧代码'],0,''],
['子类方法抛出 NotImplementedError 常常违反？',['里氏替换原则','开闭原则','DRY'],0,''],
['接口隔离原则在 Python 中的轻量做法？',['使用者定义需要的最小 Protocol','写一个大的抽象基类','用 **kwargs'],0,''],
['依赖倒置中，抽象由谁定义？',['高层（使用者）','数据库驱动','框架'],0,''],
['Python 中实现简单策略最轻的方式？',['传一个函数','三层继承','元类'],0,'']]
