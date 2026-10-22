TITLE='格式：垂直与水平的排版';MIN=35;NEXT='对象与数据结构：数据抽象与迪米特法则'
DESC='格式是沟通的一部分。本课讲垂直格式（文件大小、报纸隐喻、用空行分隔概念、相关的代码靠近、变量在使用处附近声明、调用者在被调用者之上）与水平格式（行宽、空格表达优先级、缩进），以及团队规则为什么比个人偏好更重要——在 Python 中这意味着把格式交给 Black 或 Ruff 自动处理，把精力留给名字和结构。'
SUM=['<b>格式是给人看的</b>：今天的写法会影响以后每一个读者。一致性比任何具体规则都重要。',
'<b>报纸隐喻</b>：文件顶部是高层概念与公共接口，越往下越是细节。名字（文件名、模块名）应当能告诉读者是否找对了地方。',
'<b>垂直间距与靠近</b>：空行分隔不同概念；紧密相关的代码放在一起；局部变量在第一次使用处附近声明；调用者在被调用者之上，相关函数相邻。',
'<b>水平格式</b>：行宽保持适中（Black 默认 88）；空格表达结构（<code>a*b + c*d</code> 中的空格暗示了优先级——但自动格式化工具会统一处理）；不要为了对齐而加空格，它会在改名后失效。',
'<b>团队规则</b>：由工具执行格式（Black、Ruff format、isort），在 CI 与提交钩子中检查，代码评审就不必再讨论空格和引号。',
'<b>文件大小</b>：大多数模块在数百行以内就足够；一个数千行的文件往往混合了多个概念，按概念拆成包。']
S1=('报纸式的文件','从上往下，从概括到细节。')
A1=[('标题','模块的 docstring 和公共函数在最上面：读者先知道“这里有什么”。',[('h','"""订单导出"""','ok',0,0,260),('p','export_orders()','ok',0,60,260)]),
('段落','公共函数调用的辅助函数，按调用顺序紧随其后。',[('h','"""订单导出"""','ok',0,0,260),('p','export_orders()','ok',0,60,260),('a','_load()  _to_rows()','sig',0,120,260)]),
('细节','最底层的工具函数在最后。读者可以在任何深度停下。',[('h','"""订单导出"""','ok',0,0,260),('p','export_orders()','ok',0,60,260),('a','_load()  _to_rows()','sig',0,120,260),('d','_format_cell()','',0,180,260)]),
('反例','辅助函数散落在文件各处，读者需要来回跳跃。',[('d','_format_cell()','bad',0,0,260),('p','export_orders()','bad',0,60,260),('x','unrelated_util()','bad',0,120,260),('a','_load()','bad',0,180,260)])]
S2=('动手：这些格式问题，谁来解决？','选择一个问题，看它属于人还是工具。')
CHI=[('引号与空格','x=foo( a,b )\nname=\'bob\'\n\n→ 工具（ruff format / black）：\nx = foo(a, b)\nname = "bob"','ok','<b>工具</b>。不应在评审中讨论。'),
('导入顺序','import sys, os\nfrom b import y\nimport requests\nfrom a import x\n\n→ 工具（ruff 的 isort 规则）','ok','<b>工具</b>。标准库、第三方、本地分组，按字母排序。'),
('对齐空格','name       = "x"\nage        = 3\nlast_login = now()\n\n改名后对齐会被打破，diff 里会出现无关行','sig','<b>工具会移除</b>。对齐引导读者“纵向阅读”而忽略了左右的关系。'),
('概念之间的空行','def load(): ...\ndef save(): ...\nclass Exporter: ...\n\n函数之间该空几行由工具决定；\n函数内部按“段落”用空行分组由人决定','sig','<b>人与工具</b>：工具规定顶层的空行数，函数内的“段落”需要人来判断。'),
('函数的顺序','调用者在上，被调用者在下；\n相关函数相邻。\n\n工具无法判断概念上的关联','bad','<b>人</b>。这是结构问题，不是排版问题。'),
('3000 行的文件','utils.py：3000 行，84 个函数\n\n拆分为 utils/dates.py、utils/money.py ...','bad','<b>人</b>。按概念拆分。')]
CHH='选择一个问题。'
S3=('Python 项目的格式配置','一份典型配置：格式与 lint 交给 Ruff，在提交前和 CI 中运行。','''<pre class="cmd" style="overflow-x:auto;white-space:pre"># pyproject.toml
[tool.ruff]
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "SIM"]   # 风格、错误、导入顺序、常见 bug、升级、简化

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff         # lint，--fix 自动修复
        args: [--fix]
      - id: ruff-format  # 格式化</pre>
<p>一旦格式由工具决定，团队就把讨论集中在工具无法判断的事情上：名字、函数边界、模块边界、概念的远近。这正是本课程后面所有课的主题。</p>''')
S4=('格式化工具在做什么','对一个格式混乱的文件运行 Ruff。')
TERM=[['ruff format --diff messy.py','-def f( a,b ):\n-    return a*b+  1\n+def f(a, b):\n+    return a * b + 1\n\n1 file would be reformatted','--diff 只显示改动，不写入。'],
['ruff check --select I,F messy.py','messy.py:1:1: I001 Import block is un-sorted or un-formatted\nmessy.py:2:8: F401 `os` imported but unused\nFound 2 errors.\n[*] 2 fixable with the `--fix` option.','I 是导入顺序，F 是 pyflakes 规则（如未使用的导入）。'],
['ruff check --fix messy.py && ruff format messy.py','Found 2 errors (2 fixed, 0 remaining).\n1 file reformatted','在提交钩子里运行这两条，格式就不再是讨论话题。']]
S5=('在你的电脑上练习','用标准库就能完成：Python 自带的 <code>ast</code> 可以按“报纸”顺序检查函数排列。如果已安装 ruff，也可以运行它。')
PRAC=[('一个顺序混乱的模块：被调用者在调用者之前，相关函数分散。','cat > export.py <<\'EOF\'\ndef _format_cell(v):\n    return str(v).replace(",", " ")\n\ndef unrelated_helper():\n    return 42\n\ndef export_orders(orders):\n    return "\\n".join(_to_row(o) for o in orders)\n\ndef _to_row(order):\n    return ",".join(_format_cell(v) for v in order)\nEOF',''),
('写一个小检查：如果函数在它的第一个调用者之前定义，就报告并返回非零退出码。这里只演示本课的排列约定，不是 Python 语法要求，也不是通用静态分析器。','cat > stepdown.py <<\'EOF\'\nimport ast, sys\n\ndef check(path):\n    tree = ast.parse(open(path).read())\n    defs = {n.name: n.lineno for n in tree.body if isinstance(n, ast.FunctionDef)}\n    first_caller = {}\n    for fn in tree.body:\n        if not isinstance(fn, ast.FunctionDef):\n            continue\n        for node in ast.walk(fn):\n            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in defs:\n                first_caller.setdefault(node.func.id, fn.lineno)\n    violations = 0\n    for name, line in defs.items():\n        caller = first_caller.get(name)\n        if caller and caller > line:\n            print(f"{path}:{line}: {name} 定义在调用者（第 {caller} 行）之前")\n            violations += 1\n    return violations\n\nraise SystemExit(1 if check(sys.argv[1]) else 0)\nEOF\npython3 stepdown.py export.py',None),
('按报纸顺序重排，删除无关函数（它应在别的模块里）。','cat > export.py <<\'EOF\'\n"""把订单导出为 CSV 文本。"""\n\n\ndef export_orders(orders):\n    return "\\n".join(_to_row(o) for o in orders)\n\n\ndef _to_row(order):\n    return ",".join(_format_cell(v) for v in order)\n\n\ndef _format_cell(value):\n    return str(value).replace(",", " ")\nEOF\npython3 stepdown.py export.py; echo "检查通过: $?"; python3 -c "from export import export_orders; print(export_orders([(1, \'a,b\'), (2, \'c\')]))"',None),
('（可选）如果装了 ruff：<code>pip install ruff</code>，再检查格式。','if command -v ruff >/dev/null; then\n    ruff format --check export.py\nelse\n    echo "未安装 ruff，跳过"\nfi',None)]
CHAL=('排列一个类','一个 <code>ReportGenerator</code> 类有这些方法：<code>_fetch_rows</code>、<code>generate</code>（公共入口，依次调用 <code>_fetch_rows</code>、<code>_summarize</code>、<code>_render</code>）、<code>_render</code>（调用 <code>_format_money</code>）、<code>__init__</code>、<code>_summarize</code>、<code>_format_money</code>。按报纸顺序排列它们。',
'<pre class="cmd">class ReportGenerator:\n    def __init__(...)\n    def generate(...)        # 公共入口：读者从这里开始\n    def _fetch_rows(...)     # 按 generate 中的调用顺序\n    def _summarize(...)\n    def _render(...)\n    def _format_money(...)   # _render 的细节，紧跟其后</pre><p>构造函数在最前（约定），公共方法在私有方法之前，私有方法按首次被调用的顺序排列，最底层的细节在最后。</p>')
QUIZ=[['团队格式规则最好怎样执行？',['交给自动格式化工具与 CI','在代码评审中逐条指出','每人按喜好'],0,''],
['报纸隐喻中文件顶部应该是？',['高层概念与公共接口','最底层的工具函数','导入的注释'],0,''],
['局部变量应在哪里声明？',['第一次使用处附近','函数开头集中声明','模块顶部'],0,''],
['为什么不建议用空格对齐赋值？',['改名后对齐被破坏，产生无关 diff','运行变慢','语法错误'],0,''],
['3000 行的 utils.py 通常意味着？',['混合了多个概念，应按概念拆分','设计很好','需要更多注释'],0,'']]
