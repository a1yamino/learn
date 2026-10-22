TITLE='函数：短小、只做一件事、一个抽象层级';MIN=50;NEXT='函数参数、副作用与命令查询分离'
DESC='函数是程序的第一层组织单位。本课讲书中关于函数的核心主张：短小；只做一件事（以及如何判断“一件事”）；每个函数只处在一个抽象层级，代码能自顶向下像报纸一样阅读（下降规则）；switch / if-elif 链的处理；描述性的名字。然后把它和 Ousterhout 的“深模块”观点放在一起比较：拆分的目的是降低理解成本，过度拆分同样会增加成本。练习把一个 40 行的混合函数拆成清晰的层级。'
SUM=['<b>只做一件事</b>：判断方法——如果还能从函数中提取出一个名字不是简单复述原实现的新函数，它就在做不止一件事；或者，如果函数中的语句分属不同的抽象层级，它也在做不止一件事。',
'<b>一个抽象层级</b>：<code>render_report()</code> 中同时出现 <code>build_sections()</code>（高层）与 <code>line.strip().split(",")</code>（低层）会让读者在层级之间来回跳。把低层细节下沉到命名良好的函数中。',
'<b>下降规则</b>：调用者在上，被调用者紧随其下，读代码像读报纸：先标题，再段落，再细节。',
'<b>短小</b>是结果而不是目标：书中主张很短（几行）；更稳妥的标准是“一屏之内、一眼能看懂意图”。拆分后每个函数应当有一个有意义的名字，否则拆分只是增加跳转。',
'<b>深模块</b>（Ousterhout）：接口简单、内部隐藏大量复杂度的模块才有价值。很多只有一两行、仅被调用一次的“浅”函数，会让读者在十个文件间跳转才能拼出逻辑。两种观点的交集：<b>按概念拆分，不按行数拆分</b>。',
'<b>条件分支链</b>：根据类型选择行为的 <code>if/elif</code> 链如果在多处重复出现，用多态或查表替代，只在一处（工厂）出现一次。']
S1=('一个函数，三个抽象层级','把混在一起的层级拆开，读者每次只需要关注一个层级。')
A1=[('混在一起','monthly_report() 里既有业务步骤，又有 SQL 拼接和字符串格式化。',[('f','monthly_report()  40 行','bad',0,0,240)]),
('找出层级','高层：取数、汇总、渲染。中层：按地区分组。低层：格式化金额、拼 SQL。',[('f','monthly_report()','sig',0,0,240),('h','高层：3 个步骤','ok',280,0,170),('m','中层：分组规则','sig',280,60,170),('l','低层：格式化','bad',280,120,170)]),
('下降规则','顶层函数只读起来像目录，每一步是一个函数，紧跟在下面。',[('f','monthly_report()','ok',0,0,240),('a','load_orders(month)','ok',40,60,200),('b','totals_by_region(orders)','ok',40,120,200),('c','render(totals)','ok',40,180,200)]),
('不过度拆分','format_money() 值得命名（多处用、概念清楚）；把“加 1”提取成函数则只是增加跳转。',[('c','render(totals)','ok',0,0,200),('d','format_money(x)  ✓','ok',240,0,190),('e','add_one(x)  ✗','bad',240,60,190)])]
S2=('动手：这个函数做了几件事？','选择一个函数，看分析。')
CHI=[('save_user','def save_user(form):\n    if not form["email"] or "@" not in form["email"]:\n        raise ValueError("bad email")\n    user = User(form["name"], form["email"].lower())\n    db.insert("users", user.to_row())\n    smtp.send(user.email, "欢迎！")\n    return user','bad','至少四件事：校验、构造、持久化、发欢迎邮件。名字只说了“保存”，发邮件是隐藏的副作用（第 4 课）。拆为 <code>validate_signup</code>、<code>create_user</code>、<code>users.add</code>，由 <code>register_user</code> 编排，并把发邮件放到名字里或事件中。'),
('register_user','def register_user(form):\n    signup = validate_signup(form)\n    user = users.add(User.from_signup(signup))\n    welcome_mailer.send_to(user)\n    return user','ok','一件事：<b>编排注册流程</b>。所有语句都处在同一个抽象层级，读起来像步骤列表。'),
('price_of','def price_of(item):\n    if item.kind == "book":\n        return item.base * 0.95\n    elif item.kind == "food":\n        return item.base * 1.09\n    elif item.kind == "digital":\n        return item.base\n    raise ValueError(item.kind)','sig','本身只做一件事。但如果 <code>tax_of</code>、<code>ship_cost_of</code> 里也有同样的 kind 分支链，新增一种商品就要改所有地方——这时应改为多态或查表（第 17 课）。'),
('is_eligible','def is_eligible(user):\n    return user.age >= 18 and user.country in SUPPORTED_COUNTRIES','ok','一件事，一层抽象。不需要再拆成 <code>is_adult</code> 与 <code>is_supported_country</code>，除非这两个概念在别处也要用。')]
CHH='选择一个函数。'
S3=('两种观点并排','把书中的主张和“深模块”放在一起看，得到一个可操作的标准。','''<table class="tbl"><tr><th>问题</th><th>《代码整洁之道》</th><th>《软件设计的哲学》</th><th>本课程建议</th></tr>
<tr><td>函数多长？</td><td>越短越好，几行</td><td>长度不是问题，接口复杂度才是</td><td>一屏之内，意图一眼可见</td></tr>
<tr><td>何时拆分？</td><td>能提取出新名字就拆</td><td>能隐藏复杂度、简化接口才拆</td><td>按<b>概念</b>拆：新函数有可复用或可独立理解的意义</td></tr>
<tr><td>拆分的代价</td><td>很少讨论</td><td>接口数量增加、阅读跳转、“共享状态”变隐式</td><td>如果读者必须同时看 5 个小函数才能理解一件事，就合回去</td></tr>
<tr><td>注释</td><td>尽量用名字代替</td><td>接口注释必不可少</td><td>见第 5 课</td></tr></table>
<p>书中一个常被引用的反例：为了让方法短，把局部变量提升为实例字段，让多个小方法通过字段传递数据。这会让数据流变得隐式，读者必须追踪“谁在什么时候写了这个字段”。<b>更好的做法</b>是让小函数通过参数和返回值传递数据（尽量写成纯函数）。</p>''')
S4=('测量函数长度','用一个小工具找出代码库中最长的函数，作为清理的起点。')
TERM=[['python3 longest.py src/','  87  src/billing/report.py:monthly_report\n  54  src/users/views.py:signup\n  41  src/billing/invoice.py:render_pdf\n  12  src/billing/tax.py:tax_of','长度本身不是罪，但最长的几个函数通常同时混合了多个层级。'],
['python3 -m mccabe --min 10 src/billing/report.py','23:1: \'monthly_report\' 14','圈复杂度（分支数）14：要完整测试至少需要 14 条路径。'],
['python3 -m unittest -q','Ran 31 tests in 0.052s\n\nOK','拆分前先确保有测试覆盖。']]
S5=('在你的电脑上练习','把一个混合了三个层级的报表函数拆开。练习中的 <code>longest.py</code> 就是上面终端里用到的工具。')
PRAC=[('写一个找出最长函数的小工具（用标准库 <code>ast</code>）。','cat > longest.py <<\'EOF\'\nimport ast, pathlib, sys\n\ndef function_lengths(path):\n    tree = ast.parse(pathlib.Path(path).read_text())\n    for node in ast.walk(tree):\n        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):\n            yield node.end_lineno - node.lineno + 1, f"{path}:{node.name}"\n\nif __name__ == "__main__":\n    found = [f for p in sys.argv[1:] for f in function_lengths(p)]\n    for length, where in sorted(found, reverse=True):\n        print(f"{length:4}  {where}")\nEOF',''),
('一个混合层级的函数。','cat > report.py <<\'EOF\'\ndef monthly_report(rows):\n    totals = {}\n    for line in rows:\n        parts = line.strip().split(",")\n        if len(parts) != 3:\n            continue\n        region, status, amount = parts\n        if status != "paid":\n            continue\n        totals[region] = totals.get(region, 0) + int(amount)\n    out = []\n    for region in sorted(totals):\n        cents = totals[region]\n        out.append(f"{region:<6}{cents // 100:>8,}.{cents % 100:02d}")\n    out.append("-" * 17)\n    grand = sum(totals.values())\n    out.append(f"{\'total\':<6}{grand // 100:>8,}.{grand % 100:02d}")\n    return "\\n".join(out)\nEOF\ncat > test_report.py <<\'EOF\'\nimport unittest\nfrom report import monthly_report\nROWS = ["north,paid,123456\\n", "south,paid,99\\n", "north,refunded,500\\n", "bad line\\n", "north,paid,1000\\n"]\nEXPECTED = "north    1,244.56\\nsouth        0.99\\n-----------------\\ntotal    1,245.55"\nclass T(unittest.TestCase):\n    def test_report(self):\n        self.assertEqual(monthly_report(ROWS), EXPECTED)\nunittest.main(argv=["x"], exit=False, verbosity=0)\nEOF\npython3 test_report.py && python3 longest.py report.py',None),
('拆成三个层级：解析、汇总、渲染。顶层读起来像目录。','cat > report.py <<\'EOF\'\nfrom typing import NamedTuple\n\nclass Payment(NamedTuple):\n    region: str\n    status: str\n    cents: int\n\ndef monthly_report(lines):\n    payments = parse_payments(lines)\n    totals = paid_totals_by_region(payments)\n    return render(totals)\n\ndef parse_payments(lines):\n    for line in lines:\n        parts = line.strip().split(",")\n        if len(parts) == 3:\n            region, status, amount = parts\n            yield Payment(region, status, int(amount))\n\ndef paid_totals_by_region(payments):\n    totals = {}\n    for p in payments:\n        if p.status == "paid":\n            totals[p.region] = totals.get(p.region, 0) + p.cents\n    return totals\n\ndef render(totals):\n    lines = [row(region, totals[region]) for region in sorted(totals)]\n    lines.append("-" * 17)\n    lines.append(row("total", sum(totals.values())))\n    return "\\n".join(lines)\n\ndef row(label, cents):\n    return f"{label:<6}{format_money(cents):>11}"\n\ndef format_money(cents):\n    return f"{cents // 100:,}.{cents % 100:02d}"\nEOF\npython3 test_report.py && python3 longest.py report.py',None),
('看一下结果。','python3 -c "from report import *; print(monthly_report([\'east,paid,250000\', \'west,paid,1\']))"',None)]
CHAL=('拆分，还是不拆？','对下面每个提取方案判断是否值得，并说明理由：① 从 <code>render</code> 中提取 <code>format_money(cents)</code>；② 从 <code>paid_totals_by_region</code> 中提取 <code>is_paid(p)</code>，内容是 <code>return p.status == "paid"</code>；③ 把 <code>monthly_report</code> 的三行再合并回一个函数；④ 把 <code>parse_payments</code> 的局部变量改为实例字段，让它拆成三个无参数的方法。',
'<ol><li><b>值得</b>。“金额格式化”是独立的概念，在发票、邮件中也会用，且有边界情况（负数、千分位）值得单独测试。</li><li><b>可以，但不是必须</b>。如果“已支付”的判断在多处出现，或者未来会变复杂（部分退款），把它放到 <code>Payment.is_paid</code> 属性上最好——它属于数据本身，而不是一个游离的函数。</li><li><b>不值得</b>。三行的编排函数是这个模块最有价值的“目录”，合并会把三个层级重新混在一起。</li><li><b>不值得，而且有害</b>。用实例字段在方法之间传数据会让数据流隐式化、产生顺序依赖，也让函数无法单独测试。用参数和返回值传递。</li></ol>')
QUIZ=[['判断函数“只做一件事”的一个方法是？',['少于 5 行','语句是否都处在同一抽象层级','没有 if'],1,'混合层级说明它在做多件事。'],
['下降规则指的是？',['调用者在上，被调用者紧随其后，像报纸一样阅读','函数按字母排序','长函数放在文件末尾'],0,''],
['Ousterhout 所说的“深模块”是？',['接口简单、隐藏大量实现','继承层次很深','很多小函数'],0,''],
['把局部变量提升为实例字段以缩短方法的问题是？',['数据流变隐式，有顺序依赖','运行更慢','无法编译'],0,''],
['相同的 if/elif 类型分支出现在多处时？',['用多态或查表，只在一处分派','再复制一份','加注释'],0,'']]
