TITLE='注释：何时该写，何时该删';MIN=40;NEXT='格式：垂直与水平的排版'
DESC='注释不能美化糟糕的代码。本课区分好注释与坏注释：法律信息、解释意图（为什么这样做）、警示后果、TODO、公共接口的文档字符串是有价值的；复述代码、日志式注释、误导性注释、注释掉的代码、位置标记、强制每个函数都写的注释则是噪音，并且会随着代码变化而过时。最后讨论“用代码代替注释”的手段，以及 Ousterhout 关于接口注释的不同观点。'
SUM=['<b>注释会过时，代码不会说谎</b>：代码被修改时，注释常常没有同步更新。一条错误的注释比没有注释更糟。',
'<b>先尝试用代码表达</b>：<code># 检查员工是否有资格享受全部福利</code> + 复杂条件 → <code>if employee.is_eligible_for_full_benefits():</code>。解释变量和提取函数能代替大部分“这段在做什么”的注释。',
'<b>好注释解释“为什么”</b>：业务原因、选择这个算法的理由、被否决的显而易见方案、外部系统的怪癖（“支付网关在周日返回 503，需重试”）、性能权衡、正则表达式的意图。',
'<b>警示与 TODO</b>：说明后果（“这个测试会运行 10 分钟”“该函数不是线程安全的”）；TODO 要具体、可追踪，最好链接到问题编号。',
'<b>坏注释</b>：复述代码（<code>i += 1  # i 加 1</code>）、日志式修改记录（用 git）、注释掉的代码（删掉，git 里有）、署名、<code>#####</code> 位置标记、为了规范而写的空洞 docstring。',
'<b>接口文档</b>：公共函数、类和模块的 docstring 描述<b>做什么、参数含义、返回值、异常和前提</b>，不描述怎么做。Ousterhout 认为接口注释是设计的一部分——在这点上它比书中的立场更积极，本课程赞同。']
S1=('一条注释的一生','注释和代码分开演化时会发生什么。')
A1=[('写下时','注释与代码一致。',[('c','# 超过 3 次失败锁定账户','ok',0,0,280),('k','if failures > 3:','ok',0,60,280)]),
('需求变了','阈值改为 5，有人只改了代码。',[('c','# 超过 3 次失败锁定账户','bad',0,0,280),('k','if failures > 5:','ok',0,60,280)]),
('误导','新同事相信了注释，写了一个错误的测试。',[('c','# 超过 3 次失败锁定账户','bad',0,0,280),('k','if failures > 5:','ok',0,60,280),('t','test: 4 次应锁定 ✗','bad',0,120,280)]),
('用代码表达','常量的名字就是文档，并且只有一个事实来源。',[('k','if failures > MAX_LOGIN_FAILURES:','ok',0,0,320),('n','MAX_LOGIN_FAILURES = 5','ok',0,60,320)])]
S2=('动手：留下还是删掉？','选择一条注释，看判断。')
CHI=[('# i 加 1','i += 1  # i 加 1','bad','<b>删掉</b>。复述代码，只增加噪音。'),
('# 为什么用插入排序','# 输入几乎总是已排序的（来自时间序列追加），\n# 插入排序在这种情况下是 O(n)，比通用排序快。\ninsertion_sort(points)','ok','<b>保留</b>。解释了“为什么”，读者否则会想把它“优化”成 sorted()。'),
('# 2024-03-01 张三：修改阈值','# 2024-03-01 张三：修改阈值\n# 2024-05-12 李四：修复 bug\nLIMIT = 5','bad','<b>删掉</b>。修改历史属于版本控制（git log / blame）。'),
('注释掉的代码','total = compute(items)\n# total = old_compute(items, legacy=True)\n# if total < 0: total = 0','bad','<b>删掉</b>。没人敢删，因为不知道它为什么在这里。git 会记得它。'),
('# 警告：慢','# 警告：此测试会生成 1GB 的临时文件，耗时约 5 分钟。\n@pytest.mark.slow\ndef test_large_export():','ok','<b>保留</b>（并且用标记让工具也知道）。警示后果。'),
('# 检查资格','# 检查员工是否有资格享受全部福利\nif emp.flags & HOURLY and emp.age > 65:','sig','<b>用代码替换</b>：<code>if emp.is_eligible_for_full_benefits():</code>，注释的内容变成了方法名。'),
('正则的意图','# 匹配 "kk:mm:ss EEE, MMM dd, yyyy"\nTIME_PATTERN = re.compile(r"\\d*:\\d*:\\d* \\w*, \\w* \\d*, \\d*")','ok','<b>保留</b>。正则很难读，说明意图有价值。更好的做法是再配一个测试用例。'),
('TODO','# TODO: 以后优化','sig','<b>改写</b>：<code># TODO(#1432): 订单超过 10 万行时改为流式导出</code>。具体、可追踪的 TODO 才有用。')]
CHH='选择一条注释。'
S3=('写好接口文档','docstring 写给调用者看，回答“我怎么用它”，而不是“它怎么实现”。','''<pre class="cmd" style="overflow-x:auto;white-space:pre">def reserve(sku: str, quantity: int, *, hold_minutes: int = 15) -> Reservation:
    """为购物车预留库存。

    预留在 hold_minutes 分钟后自动释放，除非在此之前调用 confirm()。
    同一个 sku 的多次预留会累加，不会覆盖。

    Raises:
        OutOfStock: 可用库存少于 quantity。此时不会创建部分预留。
        ValueError: quantity 不是正数。
    """</pre>
<table class="tbl"><tr><th>应该写</th><th>不应该写</th></tr>
<tr><td>行为的契约：前提条件、返回值、异常、副作用</td><td>实现步骤（“首先查询数据库，然后……”）</td></tr>
<tr><td>单位、取值范围（“毫秒”“0–1 之间”）</td><td>参数类型（类型注解已经写了）</td></tr>
<tr><td>不显然的行为（“累加，不覆盖”“不会部分预留”）</td><td>复述函数名（“预留库存的函数”）</td></tr></table>''')
S4=('从代码中找出可疑注释','几条命令帮你在清理时定位注释噪音。')
TERM=[['grep -rnE "^\\s*#\\s*(def|if|for|return|import|[a-z_]+ = )" --include=*.py src/','src/billing/tax.py:41:    # return old_rate(region)\nsrc/users/views.py:88:    # if user.is_admin:','可能是注释掉的代码。'],
['grep -rn "TODO\\|FIXME\\|XXX" --include=*.py src/ | grep -v "#[0-9]"','src/billing/report.py:12:    # TODO: 以后优化','没有关联问题编号的 TODO。'],
['git log -L 41,41:src/billing/tax.py --oneline | head -3','9f2c1ab 改用新的税率表','用 git 查看这行是什么时候、为什么变成注释的，然后放心删除。']]
S5=('在你的电脑上练习','清理一个注释过多的模块：删除噪音，用名字代替注释，保留解释“为什么”的部分。')
PRAC=[('之前。','cat > shipping.py <<\'EOF\'\n# 运费模块\n# 作者：张三\n# 2023-01-05 创建\n# 2023-06-11 李四修改\n\n# 计算运费\ndef calc(w, r, vip):\n    # 如果是 vip\n    if vip:\n        # vip 免运费\n        return 0\n    # 基础运费\n    c = 8\n    # 超过 1 公斤，每公斤加 2 元\n    if w > 1:\n        c += (w - 1) * 2\n    # 偏远地区\n    if r in ("XZ", "XJ"):\n        # 偏远地区翻倍。物流合同第 4.2 条规定\n        c *= 2\n    # c = c * 1.06\n    return c\nEOF\npython3 -c "from shipping import calc; print(calc(3, \'BJ\', False), calc(3, \'XZ\', False), calc(3, \'XJ\', True))"',None),
('之后：名字代替注释，只保留解释业务原因的那一条。','cat > shipping.py <<\'EOF\'\nBASE_FEE = 8\nINCLUDED_KG = 1\nFEE_PER_EXTRA_KG = 2\n# 物流合同第 4.2 条：西藏、新疆的运费为标准运费的两倍。\nREMOTE_REGIONS = {"XZ", "XJ"}\nREMOTE_MULTIPLIER = 2\n\ndef shipping_fee(weight_kg, region, is_vip):\n    """返回一个包裹的运费（元）。VIP 免运费。"""\n    if is_vip:\n        return 0\n    fee = BASE_FEE + max(0, weight_kg - INCLUDED_KG) * FEE_PER_EXTRA_KG\n    if region in REMOTE_REGIONS:\n        fee *= REMOTE_MULTIPLIER\n    return fee\nEOF\npython3 -c "from shipping import shipping_fee as f; print(f(3, \'BJ\', False), f(3, \'XZ\', False), f(3, \'XJ\', True))"',None),
('数一数：注释行从 12 行减少到 1 行（外加一个 docstring），信息却没有丢失。','grep -c "#" shipping.py; python3 -c "import shipping; help(shipping.shipping_fee)" | sed -n 3,4p',None)]
CHAL=('写一条好注释','下面的代码看起来像一个 bug，但其实是故意的：<pre class="cmd">def retry_delay(attempt):\n    return min(2 ** attempt, 60) + random.uniform(0, 1)</pre>同事想删掉 <code>random.uniform(0, 1)</code>，因为“它让测试不稳定”。写一条注释防止这种误改，并给出让测试稳定的办法。',
'<pre class="cmd">def retry_delay(attempt, *, jitter=random.uniform):\n    # 加入 0–1 秒的随机抖动：避免大量客户端在同一次故障后\n    # 以完全相同的节奏重试，造成周期性的流量尖峰（惊群效应）。\n    return min(2 ** attempt, 60) + jitter(0, 1)</pre><p>注释解释了<b>为什么</b>（不是“加一个随机数”这种复述），并说出了删掉它的后果。测试时通过参数注入一个确定的函数：<code>retry_delay(3, jitter=lambda a, b: 0) == 8</code>。</p>')
QUIZ=[['最好的注释通常解释？',['为什么这样做','这行在做什么','谁写的'],0,''],
['注释掉的代码应该？',['删掉，版本控制里有','保留以防万一','移到文件末尾'],0,''],
['修改历史应放在？',['版本控制','文件头注释','docstring'],0,''],
['docstring 不应该写？',['实现步骤','异常','不显然的行为'],0,'写契约，不写实现。'],
['# 检查是否有资格 + 复杂条件，更好的做法？',['提取为名字说明意图的方法','注释写得更长','删掉注释保留条件'],0,'']]
