TITLE='类：单一职责与内聚';MIN=45;NEXT='SOLID：开闭、里氏替换、接口隔离与依赖倒置'
DESC='类是比函数更大的组织单位。本课讲类的组织顺序与封装；“类应当短小”中的“短小”指的是职责而不是行数；单一职责原则（SRP）——一个类只应有一个引起它变化的原因，或者说只对一类“使用者”负责；内聚（方法使用了多少字段）如何指引拆分；为修改而组织（把变化隔离在新类中）。练习把一个“上帝类”按变化原因拆开。'
SUM=['<b>短小的度量是职责</b>：如果无法用 25 个词左右、不用“和”“或”“如果”描述一个类，它很可能承担了多个职责。<code>Manager</code>、<code>Processor</code>、<code>Super</code> 这类名字常常意味着职责模糊。',
'<b>单一职责原则（SRP）</b>：一个模块应当只有一个引起它变化的原因。Martin 后来的表述更精确：一个模块只对一个“角色”（一类利益相关者）负责——财务改的计算规则和运营改的报表格式不应在同一个类里互相影响。',
'<b>许多小类，而不是几个大类</b>：系统的复杂度是固定的；问题是你希望把工具放在一个个贴好标签的小抽屉里，还是全扔进一个大抽屉。',
'<b>内聚</b>：类的方法越多地使用同一组字段，内聚越高。如果一部分方法只用字段 a、b，另一部分只用 c、d，那里就藏着两个类。',
'<b>拆分长函数常常会揭示新的类</b>：提取方法时如果发现要传很多参数，或某几个局部变量总是一起出现，它们可能属于一个新类。',
'<b>为修改而组织</b>：新增一种 SQL 语句不应修改已有的语句类；每种变化落在一个新类里，旧代码无需重新测试（这引出下一课的开闭原则）。']
S1=('内聚揭示隐藏的类','把方法和它们使用的字段连起来看。')
A1=[('一个大类','Employee 有 6 个方法、5 个字段。',[('e','Employee','bad',0,0,160)]),
('画出使用关系','calculate_pay、overtime 用 rate、hours；report_hours、format_row 用 hours、name；save、load 用 db（以及全部数据字段）。',[('p','calculate_pay / overtime','sig',0,0,220),('r','report_hours / format_row','sig',0,60,220),('s','save / load','sig',0,120,220),('f1','rate, hours','',260,0,150),('f2','hours, name','',260,60,150),('f3','db','',260,120,150)]),
('三组，三个变化原因','财务（工资规则）、运营（工时报表）、技术（存储方式）。',[('p','PayCalculator（财务）','ok',0,0,240),('r','HourReporter（运营）','ok',0,60,240),('s','EmployeeRepository（技术）','ok',0,120,240),('d','EmployeeData','',280,60,150)])]
S2=('动手：几个变化原因？','选择一个类，看分析。')
CHI=[('UserManager','class UserManager:\n    def register(self, form): ...\n    def hash_password(self, pw): ...\n    def send_welcome_email(self, user): ...\n    def export_users_csv(self): ...\n    def ban(self, user, reason): ...','bad','至少四个变化原因：注册流程、密码策略（安全团队）、邮件内容（市场）、导出格式（运营）。“Manager”一词掩盖了这一点。'),
('Invoice','@dataclass\nclass Invoice:\n    lines: list[Line]\n    tax_rate: Decimal\n\n    def subtotal(self): ...\n    def tax(self): ...\n    def total(self): ...','ok','高内聚：所有方法都使用 lines 与 tax_rate，只因“发票计算规则”而变化。'),
('Invoice + PDF','class Invoice:\n    def total(self): ...\n    def to_pdf(self): ...       # 排版\n    def save_to_db(self): ...   # 持久化','bad','计算、排版、持久化是三个变化原因。改 PDF 字体也要重新测试金额计算。'),
('Order（不必拆）','class Order:\n    def add_item(self, item): ...\n    def remove_item(self, sku): ...\n    def total(self): ...\n    def is_empty(self): ...','ok','方法很多不代表职责多。它们都围绕“订单内容”这一个概念，并使用同一组字段。')]
CHH='选择一个类。'
S3=('SRP 的常见误解','“只做一件事”是函数的规则；SRP 讨论的是变化与人。','''<table class="tbl"><tr><th>误解</th><th>澄清</th></tr>
<tr><td>每个类只能有一个方法</td><td>SRP 关心变化原因，不关心方法个数。<code>Order</code> 可以有十个方法。</td></tr>
<tr><td>拆得越细越好</td><td>过度拆分会让一个变化需要同时修改五个类（“散弹式修改”，第 15 课）。拆分的边界应与变化的边界一致。</td></tr>
<tr><td>SRP 是关于代码的</td><td>它关于组织：谁会要求修改它？两个不同的团队要求修改同一个类，就会产生冲突与意外。</td></tr></table>
<p>书中用 SQL 生成器举例：一个 <code>Sql</code> 类包含 <code>create()</code>、<code>insert()</code>、<code>select()</code>……每新增一种语句都要修改它。重构为 <code>Sql</code> 抽象类与 <code>CreateSql</code>、<code>SelectSql</code> 等子类后，新增语句只需新增一个类，已有类不受影响。在 Python 中，同样的思想也可以用一组函数或一个注册表实现——重点是变化被隔离。</p>''')
S4=('用工具找出低内聚的类','统计每个方法使用了哪些 self 字段。')
TERM=[['python3 cohesion.py employee.py','Employee\n  calculate_pay      hours overtime rate\n  overtime           hours rate\n  report_hours       format_row\n  format_row         hours name\n  save               db hours name rate\n  load               db hours name rate','计算方法围绕 rate、hours；报表方法围绕 name、hours；只有 save/load 使用 db——持久化是一个独立的关注点。这就是拆分的依据。'],
['python3 cohesion.py invoice.py','Invoice\n  subtotal           lines\n  tax                lines tax_rate\n  total              lines tax_rate','高内聚：都围绕同一组字段。']]
S5=('在你的电脑上练习','先写一个测量内聚的小工具，再用它指导拆分。')
PRAC=[('工具：列出每个方法用到的 self 字段。','cat > cohesion.py <<\'EOF\'\nimport ast, sys\n\ntree = ast.parse(open(sys.argv[1]).read())\nfor cls in [n for n in tree.body if isinstance(n, ast.ClassDef)]:\n    print(cls.name)\n    for fn in [n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name != "__init__"]:\n        fields = sorted({a.attr for a in ast.walk(fn)\n                         if isinstance(a, ast.Attribute) and isinstance(a.value, ast.Name)\n                         and a.value.id == "self" and not a.attr.startswith("__")})\n        print(f"  {fn.name:<18} {\' \'.join(fields)}")\nEOF',''),
('一个“上帝类”。','cat > employee.py <<\'EOF\'\nclass Employee:\n    def __init__(self, name, rate, hours, db):\n        self.name, self.rate, self.hours, self.db = name, rate, hours, db\n\n    def calculate_pay(self):\n        return self.rate * min(self.hours, 40) + self.overtime()\n\n    def overtime(self):\n        return self.rate * 1.5 * max(0, self.hours - 40)\n\n    def report_hours(self):\n        return self.format_row()\n\n    def format_row(self):\n        return f"{self.name:<8}{self.hours:>4}h"\n\n    def save(self):\n        self.db[self.name] = (self.rate, self.hours)\n\n    def load(self):\n        self.rate, self.hours = self.db[self.name]\nEOF\npython3 cohesion.py employee.py',None),
('按变化原因拆开：数据、计算（财务）、报表（运营）、存储（技术）。','cat > employee.py <<\'EOF\'\nfrom dataclasses import dataclass\n\nSTANDARD_WEEK_HOURS = 40\nOVERTIME_MULTIPLIER = 1.5\n\n@dataclass(frozen=True)\nclass Employee:\n    name: str\n    rate: float\n    hours: float\n\nclass PayCalculator:\n    def pay(self, e):\n        regular = min(e.hours, STANDARD_WEEK_HOURS)\n        overtime = max(0, e.hours - STANDARD_WEEK_HOURS)\n        return e.rate * (regular + overtime * OVERTIME_MULTIPLIER)\n\nclass HourReporter:\n    def row(self, e):\n        return f"{e.name:<8}{e.hours:>4}h"\n\nclass EmployeeRepository:\n    def __init__(self, db):\n        self._db = db\n\n    def save(self, e):\n        self._db[e.name] = (e.rate, e.hours)\n\n    def load(self, name):\n        rate, hours = self._db[name]\n        return Employee(name, rate, hours)\nEOF\npython3 cohesion.py employee.py && python3 -c "\nfrom employee import *\nrepo = EmployeeRepository({})\nrepo.save(Employee(\'ann\', 100, 45))\nann = repo.load(\'ann\')\nprint(PayCalculator().pay(ann)); print(HourReporter().row(ann))"',None)]
CHAL=('找出变化原因','一个 <code>ReportService</code> 类有这些方法：<code>fetch_sales(month)</code>（SQL 查询）、<code>apply_fx_rates(rows)</code>（按汇率换算）、<code>to_excel(rows)</code>、<code>to_pdf(rows)</code>、<code>email_to_cfo(file)</code>、<code>schedule_monthly()</code>。列出它的变化原因（以及会要求修改的人），并给出拆分方案。',
'<table class="tbl"><tr><th>变化原因</th><th>谁会要求</th><th>新类 / 模块</th></tr><tr><td>数据来自哪里、怎么查</td><td>数据团队 / DBA</td><td><code>SalesRepository.fetch(month)</code></td></tr><tr><td>汇率换算规则</td><td>财务</td><td><code>CurrencyConverter</code></td></tr><tr><td>输出格式</td><td>报表使用者</td><td><code>ExcelRenderer</code>、<code>PdfRenderer</code>（同一接口）</td></tr><tr><td>谁收到、怎么发</td><td>管理层</td><td><code>ReportDelivery</code></td></tr><tr><td>何时运行</td><td>运维</td><td>调度配置（cron / 任务框架），不在类里</td></tr></table><p>最后用一个很薄的 <code>MonthlySalesReport.run(month)</code> 编排这些部件。它只因“流程步骤”变化而变化。</p>')
QUIZ=[['单一职责原则中的“职责”指？',['引起变化的原因 / 负责的角色','方法数量','代码行数'],0,''],
['内聚高的类的特征？',['大多数方法使用同一组字段','字段很多','方法都很短'],0,''],
['名为 UserManager 的类常常意味着？',['职责模糊','设计很好','性能很高'],0,''],
['把类拆得过细可能导致？',['一个变化需要修改许多类（散弹式修改）','运行时错误','无法测试'],0,''],
['方法很多的类一定违反 SRP 吗？',['不一定，看变化原因','一定','只在 Python 中'],0,'']]
