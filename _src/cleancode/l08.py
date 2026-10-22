TITLE='错误处理：异常、上下文与不返回 None';MIN=45;NEXT='边界：包装第三方代码'
DESC='错误处理很重要，但它不应该淹没主逻辑。本课讲：用异常代替返回码；先写 try 结构（让 try 块像事务一样）；给异常提供足够的上下文；按调用者的需要定义异常类；特例模式（Special Case）消除分支；别返回 None、别传入 None；以及 Python 的具体做法——EAFP 与 LBYL、异常链（raise ... from）、上下文管理器、不要捕获过宽的异常。最后比较“异常”与“结果类型”两种风格。'
SUM=['<b>异常代替返回码</b>：返回码迫使调用方在每次调用后立即检查，主逻辑被 <code>if err</code> 淹没。异常把正常路径与错误处理分开。',
'<b>把 try 块当作事务来写</b>（原书原则）：try 中的代码要么全部完成，要么在 except 里让程序回到一致的状态。注意这是写代码的要求，try/except 本身<b>不会自动回滚</b>已经发生的修改。先完成校验和可能失败的计算，再修改状态；跨多次写入则需数据库事务、显式补偿或其他一致性机制。先写出异常的测试，再填充实现。资源用 <code>with</code> 管理，保证释放。',
'<b>提供上下文</b>：异常消息应说明失败的操作和原因（哪个文件、哪个订单号、期望什么）。包装底层异常时用 <code>raise NewError(...) from e</code> 保留因果链。',
'<b>按调用者的需要定义异常</b>：调用者通常只关心“能否恢复、如何恢复”。把第三方库抛出的多种异常包装成少数几个有意义的领域异常（第 9 课）。',
'<b>别返回 None，也别传入 None</b>：返回 None 让每个调用者都要检查，漏掉一处就是 <code>AttributeError</code>。改为抛出异常、返回空集合，或使用特例对象（如 <code>GuestUser</code>、空的 <code>NoDiscount</code>）。用类型注解 <code>Optional</code> 标明真正可选的值。',
'<b>不要吞掉异常</b>：<code>except Exception: pass</code> 会隐藏 bug。只捕获你能处理的异常类型，范围尽量小；不能处理就让它向上传播，在边界（请求处理器、任务入口）统一记录。']
S1=('返回码 vs 异常','同一个流程，两种写法下主逻辑的样子。')
A1=[('返回码','每一步之后都要检查，主逻辑被检查代码包围。',[('a','err = delete_page(p)','',0,0,240),('b','if err: log; return','bad',0,60,240),('c','err = delete_key(k)','',0,120,240),('d','if err: log; return','bad',0,180,240)]),
('异常','正常路径连成一段，错误处理集中在一处。',[('a','delete_page(p)','ok',0,0,240),('c','delete_key(k)','ok',0,60,240),('e','except PageError as e: log(e)','sig',0,120,300)]),
('再分离','把 try 块里的主逻辑提取成函数：一个函数处理错误，另一个只做事。',[('t','delete(page): try … except','sig',0,0,300),('m','delete_page_and_refs(page)','ok',40,60,260)])]
S2=('动手：这样处理错误对吗？','选择一段代码。')
CHI=[('except: pass','try:\n    send_email(user)\nexcept Exception:\n    pass','bad','吞掉了所有异常，包括 <code>NameError</code> 等编程错误。至少要记录；更好的是只捕获 <code>SMTPException</code> 并决定是重试还是放弃。'),
('返回 None','def find_user(id):\n    row = db.get(id)\n    if row is None:\n        return None\n    return User(row)\n\nfind_user(7).email   # AttributeError: NoneType','bad','调用方忘记检查就会出错。按语义选择：找不到是异常情况 → 抛出 <code>UserNotFound</code>；可能不存在是正常的 → 命名为 <code>find_user_or_none</code> 并标注 <code>-> User | None</code>。'),
('丢失上下文','try:\n    cfg = json.load(open(path))\nexcept Exception:\n    raise ConfigError("bad config")','bad','哪个文件？哪里不对？Python 会自动保留异常上下文，但这里缺少操作信息和显式因果关系。应捕获具体异常并绑定 <code>as e</code>，改为：<code>raise ConfigError(f"无法解析配置 {path}: {e}") from e</code>。'),
('raise ... from','try:\n    cfg = json.loads(text)\nexcept json.JSONDecodeError as e:\n    raise ConfigError(\n        f"{path} 第 {e.lineno} 行不是合法的 JSON") from e','ok','具体的异常类型、有上下文的消息、保留因果链。'),
('特例对象','def discount_for(customer):\n    return customer.coupon or NoDiscount()\n\nprice = discount_for(c).apply(price)   # 无需判断','ok','特例模式：返回一个“什么也不做”的对象，而不是 None，调用方不需要分支。'),
('返回空列表','def orders_of(user):\n    rows = db.query(...)\n    return [Order(r) for r in rows]   # 可能是 []','ok','集合类型的“没有”用空集合表示，调用方的 for 循环自然处理。')]
CHH='选择一段代码。'
S3=('EAFP、异常与结果类型','Python 社区偏好 EAFP（先做再处理异常），但并非所有场景都适合异常。','''<table class="tbl"><tr><th>风格</th><th>写法</th><th>适合</th></tr>
<tr><td>LBYL（先检查）</td><td><code>if key in d: v = d[key]</code></td><td>检查很便宜，并且没有竞态</td></tr>
<tr><td>EAFP（先做）</td><td><code>try: v = d[key] except KeyError: ...</code></td><td>Python 惯用；文件、网络等“检查后状态可能已变”的操作（避免 TOCTOU 竞态）</td></tr>
<tr><td>结果类型</td><td><code>Ok(value) | Err(reason)</code>（Rust、Go 的多返回值）</td><td>失败是业务上常见、调用方必须处理的结果（如表单校验）</td></tr></table>
<p><b>判断标准</b>：失败是“例外”（磁盘满、网络断）还是“正常的另一种结果”（密码错误、库存不足）？前者用异常，在边界统一处理；后者可以作为返回值的一部分，让类型系统提醒调用方处理。书中主张一律使用异常；在今天的多语言实践里，这两种风格各有位置。</p>
<pre class="cmd" style="overflow-x:auto;white-space:pre"># 在边界统一处理：请求处理器是最外层
def handle(request):
    try:
        return ok(place_order(parse(request)))
    except ValidationError as e:
        return bad_request(e.errors)
    except OutOfStock as e:
        return conflict(str(e))
    # 其他异常不在这里捕获：交给框架记录并返回 500</pre>''')
S4=('异常链','Python 会同时显示原始异常与包装后的异常。')
TERM=[['python3 load.py missing.json','Traceback (most recent call last):\n  File "load.py", line 6, in load_config\n    with open(path) as f:\nFileNotFoundError: [Errno 2] No such file or directory: \'missing.json\'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  ...\nConfigError: 无法读取配置 missing.json','<code>from e</code> 产生 “direct cause” 链，调试时两层信息都在。'],
['python3 load.py bad.json','ConfigError: bad.json 第 3 行不是合法的 JSON: Expecting \',\' delimiter','消息里有文件名、行号和原因。']]
S5=('在你的电脑上练习','把一个返回码与 None 混用的模块改为异常与特例对象。')
PRAC=[('之前：返回码和 None。','cat > cart.py <<\'EOF\'\nSTOCK = {"pen": 3, "ink": 0}\nCOUPONS = {"SAVE10": 0.1}\n\ndef reserve(sku, qty):\n    if sku not in STOCK:\n        return -1\n    if STOCK[sku] < qty:\n        return -2\n    STOCK[sku] -= qty\n    return 0\n\ndef coupon(code):\n    return COUPONS.get(code)  # 可能是 None\n\ndef checkout(sku, qty, price, code):\n    r = reserve(sku, qty)\n    if r == -1:\n        return "unknown"\n    if r == -2:\n        return "out of stock"\n    c = coupon(code)\n    return price * qty * (1 - c)\nEOF\npython3 -c "\nfrom cart import checkout\nprint(checkout(\'pen\', 1, 10, \'SAVE10\'))\nprint(checkout(\'ink\', 1, 10, \'SAVE10\'))\nprint(checkout(\'pen\', 1, 10, None))"',None),
('没有优惠券时出现了 <code>TypeError</code>：None 被传到了算术里。之后：异常 + 特例对象。先计算总价再扣库存，避免计价失败后库存已减少；本例仅适用于单线程内存演示，异常本身不提供事务或并发保护。','cat > cart.py <<\'EOF\'\nfrom dataclasses import dataclass\n\nSTOCK = {"pen": 3, "ink": 0}\n\nclass CheckoutError(Exception):\n    pass\n\nclass UnknownProduct(CheckoutError):\n    pass\n\nclass OutOfStock(CheckoutError):\n    pass\n\n@dataclass(frozen=True)\nclass Coupon:\n    rate: float\n    def apply(self, amount):\n        return amount * (1 - self.rate)\n\nclass NoCoupon:\n    def apply(self, amount):\n        return amount\n\nCOUPONS = {"SAVE10": Coupon(0.1)}\n\ndef reserve(sku, qty):\n    if isinstance(qty, bool) or not isinstance(qty, int) or qty <= 0:\n        raise ValueError("数量必须为正整数")\n    if sku not in STOCK:\n        raise UnknownProduct(f"没有商品 {sku!r}")\n    if STOCK[sku] < qty:\n        raise OutOfStock(f"{sku} 库存 {STOCK[sku]}，需要 {qty}")\n    STOCK[sku] -= qty\n\ndef coupon_for(code):\n    return COUPONS.get(code, NoCoupon())\n\ndef checkout(sku, qty, price, code=None):\n    total = coupon_for(code).apply(price * qty)\n    reserve(sku, qty)\n    return total\nEOF\npython3 -c "\nfrom cart import *\nprint(checkout(\'pen\', 1, 10, \'SAVE10\'))\nprint(checkout(\'pen\', 1, 10))\nfor args in [(\'ink\', 1, 10), (\'cap\', 1, 10)]:\n    try:\n        checkout(*args)\n    except CheckoutError as e:\n        print(type(e).__name__, \'-\', e)"',None)]
CHAL=('修好这个“安全”的函数','<pre class="cmd">def load_settings(path):\n    try:\n        with open(path) as f:\n            data = json.load(f)\n        return data["db"]["url"], int(data["db"]["pool"])\n    except Exception:\n        return None</pre>指出问题并重写。要求：文件不存在时使用默认设置；JSON 错误或字段缺失时报错并说明原因。',
'<pre class="cmd">DEFAULT = Settings(db_url="sqlite:///app.db", pool_size=5)\n\nclass SettingsError(Exception):\n    pass\n\ndef load_settings(path) -> Settings:\n    try:\n        with open(path) as f:\n            data = json.load(f)\n    except FileNotFoundError:\n        return DEFAULT\n    except json.JSONDecodeError as e:\n        raise SettingsError(f"{path} 不是合法的 JSON（第 {e.lineno} 行）") from e\n    try:\n        db = data["db"]\n        return Settings(db_url=db["url"], pool_size=int(db["pool"]))\n    except (KeyError, TypeError, ValueError) as e:\n        raise SettingsError(f"{path} 中 db 配置不完整或格式错误: {e!r}") from e</pre><ul><li>原函数用 <code>except Exception</code> 吞掉了所有错误（包括编程错误），并返回 <code>None</code>，调用方解包时才失败，远离原因。</li><li>新版本区分了三种情况：可恢复（文件不存在 → 默认值）、配置错误（带上下文的领域异常）、其他（向上传播）。返回值是一个类型明确的 <code>Settings</code>，从不为 None。</li></ul>')
QUIZ=[['返回码的主要问题是？',['调用方必须立即检查，主逻辑被淹没','运行慢','不能返回数字'],0,''],
['包装底层异常时保留因果链用？',['raise New(...) from e','except: pass','print(e)'],0,''],
['函数可能“找不到”时，避免返回 None 的办法有？',['抛出异常、返回空集合或特例对象','返回 -1','返回字符串 "None"'],0,''],
['except Exception: pass 的问题？',['隐藏 bug，包括编程错误','语法错误','太慢'],0,''],
['EAFP 适合哪类操作？',['检查后状态可能变化的操作，如文件','纯计算','常量'],0,'避免检查与使用之间的竞态。']]
