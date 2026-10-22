TITLE='系统：关注点分离与依赖注入';MIN=45;NEXT='简单设计四规则与涌现式设计'
DESC='一座城市能运转，是因为有分工和恰当的抽象层级。软件系统也一样。本课讲把系统的“构造”与“使用”分开：对象不应该自己去创建或查找依赖，而是在一个组装点（main / 组合根）统一创建，再注入进去；延迟初始化的代价；工厂；横切关注点（日志、事务、权限、重试）如何用装饰器、中间件或上下文管理器与业务逻辑分开；以及“先做简单的，再按需演进”的系统架构观。'
SUM=['<b>把构造与使用分开</b>：业务对象如果在内部 <code>new</code> 出数据库连接、读取环境变量，它就和这些细节绑死了，也无法在测试中替换。让 <code>main</code>（组合根）负责创建并连接所有对象。',
'<b>依赖注入（DI）</b>：对象通过构造函数参数获得依赖。在 Python 中通常不需要 DI 框架——在一个 <code>build_app(config)</code> 函数里手动组装就足够清楚。',
'<b>延迟初始化的隐患</b>：<code>if self._service is None: self._service = RealService()</code> 把具体类型硬编码进来，并在每个使用处引入一个隐式的全局状态与时间依赖。',
'<b>工厂</b>：当对象需要在运行时（而不是启动时）创建，且应用需要控制“何时创建”，注入一个工厂（可以就是一个函数）。',
'<b>横切关注点</b>：日志、计时、事务、重试、鉴权会散布在每个函数里。用装饰器、中间件、上下文管理器把它们集中起来，业务函数只保留业务逻辑。',
'<b>演进的架构</b>：不必在第一天设计好一切。只要关注点分得好、依赖方向正确，系统可以从单体逐步演进；过早引入复杂框架反而会锁死选择。']
S1=('组合根','所有对象在一个地方创建，再沿着依赖关系注入。')
A1=[('自己创建依赖','OrderService 内部读取环境变量、连接数据库、创建邮件客户端。',[('s','OrderService','bad',0,60,170),('d','os.environ → 连接 DB','bad',230,0,220),('m','SMTP()','bad',230,120,220)]),
('组合根','main() 读取配置，创建所有具体对象。',[('r','main(config)','sig',0,60,150),('d','PgOrderRepo(url)','',200,0,190),('m','SmtpNotifier(host)','',200,120,190)]),
('注入','把具体对象传给 OrderService 的构造函数。',[('r','main(config)','sig',0,60,150),('d','PgOrderRepo(url)','',200,0,190),('m','SmtpNotifier(host)','',200,120,190),('s','OrderService(repo, notifier)','ok',420,60,250)]),
('测试','测试有自己的“组合根”：注入内存实现。',[('t','test','ok',0,60,150),('d','InMemoryRepo()','ok',200,0,190),('m','RecordingNotifier()','ok',200,120,190),('s','OrderService(repo, notifier)','ok',420,60,250)])]
S2=('动手：依赖从哪里来？','选择一段代码。')
CHI=[('在构造函数里创建','class OrderService:\n    def __init__(self):\n        self.db = psycopg.connect(os.environ["DB_URL"])\n        self.mailer = SmtpMailer("smtp.example.com")','bad','构造与使用混在一起。测试必须设置环境变量、连接真实数据库。改为 <code>__init__(self, orders, mailer)</code>。'),
('延迟初始化','def get_service(self):\n    if self._svc is None:\n        self._svc = RealService(load_config())\n    return self._svc','bad','具体类型与配置加载被硬编码；第一次调用的时机决定了行为（时间依赖）。启动时创建并注入。'),
('模块级全局','# db.py\nconnection = psycopg.connect(os.environ["DB_URL"])\n\n# orders.py\nfrom db import connection','bad','导入模块就会连接数据库，导入顺序与环境变量成为隐式依赖，测试很难替换。'),
('构造函数注入','class OrderService:\n    def __init__(self, orders: OrderRepository, notifier: Notifier):\n        self._orders = orders\n        self._notifier = notifier','ok','依赖一目了然，测试时传入替身。'),
('注入工厂','class Importer:\n    def __init__(self, open_reader: Callable[[Path], Reader]):\n        self._open_reader = open_reader\n\n    def run(self, paths):\n        for p in paths:\n            with self._open_reader(p) as r: ...','ok','需要在运行时多次创建对象时，注入一个工厂函数，而不是在内部写死具体类。'),
('装饰器','@retry(times=3, on=(TimeoutError,))\n@timed("notifier.notify")\ndef notify(...):\n    ...  # 仅对契约允许重试的调用使用','ok','重试可以集中实现，但是否能重试由业务契约决定；超时后可能已产生副作用，需幂等键或去重，不能无条件重试整个下单流程。')]
CHH='选择一段代码。'
S3=('横切关注点的位置','在 Python 中常用的几种分离方式。','''<table class="tbl"><tr><th>关注点</th><th>机制</th><th>例子</th></tr>
<tr><td>计时、日志、重试</td><td>装饰器</td><td><code>@retry</code>、<code>@timed</code></td></tr>
<tr><td>事务、锁、临时目录</td><td>上下文管理器</td><td><code>with unit_of_work() as uow:</code></td></tr>
<tr><td>鉴权、请求日志、异常转换</td><td>Web 框架中间件 / 依赖</td><td>Django 中间件、FastAPI <code>Depends</code></td></tr>
<tr><td>配置</td><td>在组合根读取一次，注入值对象</td><td><code>Settings.from_env()</code></td></tr></table>
<pre class="cmd" style="overflow-x:auto;white-space:pre"># composition root：唯一知道所有具体类的地方
def build_app(settings: Settings) -> App:
    orders = PgOrderRepository(settings.db_url)
    notifier = SmtpNotifier(settings.smtp_host)
    service = OrderService(orders, notifier)
    return App(order_service=service)

if __name__ == "__main__":
    build_app(Settings.from_env()).run()</pre>
<p>对于大多数 Python 项目，这样一个手写的组合根比 DI 容器更透明：读者可以直接看到对象图。项目很大、对象很多时，才考虑容器或框架提供的依赖注入。</p>''')
S4=('装饰器把横切逻辑集中','一个重试装饰器的运行效果。')
TERM=[['python3 -c "from orders import build_service; build_service().place(42, \'ann@example.com\')"', '[retry] notify 失败 TimeoutError，第 1 次重试\n[retry] notify 失败 TimeoutError，第 2 次重试\n-> ann@example.com: 订单 42 已提交', '与下方练习一致：保存只执行一次，重试位于通知适配器。本模拟在发送前失败；真实通知超时需先确认幂等契约。']]
S5=('在你的电脑上练习','把一个“自己创建依赖”的服务改为构造函数注入，加一个组合根和一个重试装饰器。')
PRAC=[('业务与基础设施分开，依赖由外部注入。本例只重试通知调用，且模拟的超时发生在发送之前；times=3 是总尝试 3 次。真实网络超时不代表对方未发送，必须先明确幂等键或去重契约，不能把整个 place() 无条件重试，否则可能重复保存订单。通知与保存跨系统的一致性还需 Outbox 等设计，本例不实现它。','cat > orders.py <<\'EOF\'\nimport functools\n\ndef retry(times, on):\n    if type(times) is not int or times < 1:\n        raise ValueError("times 必须是至少为 1 的总尝试次数")\n    def wrap(fn):\n        @functools.wraps(fn)\n        def inner(*args, **kwargs):\n            for attempt in range(1, times + 1):\n                try:\n                    return fn(*args, **kwargs)\n                except on as e:\n                    if attempt == times:\n                        raise\n                    print(f"[retry] {fn.__name__} 失败 {type(e).__name__}，第 {attempt} 次重试")\n        return inner\n    return wrap\n\nclass OrderService:\n    def __init__(self, orders, notifier):\n        self._orders = orders\n        self._notifier = notifier\n\n    def place(self, order_id, email):\n        self._orders.save(order_id)\n        self._notifier.notify(email, f"订单 {order_id} 已提交")\n\nclass InMemoryOrders:\n    def __init__(self):\n        self.saved = []\n    def save(self, order_id):\n        self.saved.append(order_id)\n\nclass FlakyNotifier:\n    """教学模拟：前两次在发送前失败，第三次才发送。"""\n    def __init__(self):\n        self.calls = 0\n    @retry(times=3, on=(TimeoutError,))\n    def notify(self, email, text):\n        self.calls += 1\n        if self.calls < 3:\n            raise TimeoutError()\n        print(f"-> {email}: {text}")\n\ndef build_service():\n    return OrderService(InMemoryOrders(), FlakyNotifier())\nEOF\npython3 -c "from orders import build_service; build_service().place(42, \'ann@example.com\')"',None),
('测试有自己的组装：注入记录型替身，不需要任何真实服务。','cat > test_orders.py <<\'EOF\'\nimport unittest\nfrom orders import OrderService, InMemoryOrders\n\nclass RecordingNotifier:\n    def __init__(self):\n        self.sent = []\n    def notify(self, email, text):\n        self.sent.append((email, text))\n\nclass OrderServiceTest(unittest.TestCase):\n    def test_placing_order_saves_and_notifies(self):\n        orders, notifier = InMemoryOrders(), RecordingNotifier()\n        OrderService(orders, notifier).place(7, "bob@example.com")\n        self.assertEqual(orders.saved, [7])\n        self.assertEqual(notifier.sent, [("bob@example.com", "订单 7 已提交")])\n\nif __name__ == "__main__":\n    unittest.main(argv=["x", "-v"])\nEOF\npython3 test_orders.py',None)]
CHAL=('找出隐式依赖','下面的函数有几个隐式依赖？重写它，使所有依赖都显式：<pre class="cmd">def send_daily_digest():\n    users = User.objects.filter(subscribed=True)\n    today = datetime.date.today()\n    for u in users:\n        items = requests.get(f"{os.environ[\'API\']}/items?since={today}").json()\n        smtplib.SMTP("localhost").sendmail("bot@x.com", u.email, render(items))</pre>',
'<p>隐式依赖：ORM 全局查询、当前日期、环境变量、HTTP 库、SMTP 服务器（还在循环里重复连接）。</p><pre class="cmd">def send_daily_digest(*, subscribers: SubscriberSource, items: ItemFeed,\n                      mailer: Mailer, today: date) -> int:\n    new_items = items.since(today)          # 只取一次，不在循环里\n    body = render(new_items)\n    count = 0\n    for user in subscribers.subscribed():\n        mailer.send(user.email, body)\n        count += 1\n    return count\n\n# 组合根\nsend_daily_digest(subscribers=DjangoSubscribers(), items=HttpItemFeed(settings.api_url),\n                  mailer=SmtpMailer(settings.smtp_host), today=date.today())</pre><p>显式依赖之后，重构也暴露了一个 bug：原代码在循环内重复请求相同的 API 数据并为每个用户新建 SMTP 连接。</p>')
QUIZ=[['组合根的作用是？',['在一个地方创建并连接所有具体对象','存放业务规则','定义数据库表'],0,''],
['构造函数中读取环境变量并连接数据库的问题？',['构造与使用混合，难以测试与替换','运行更快','没有问题'],0,''],
['需要在运行时多次创建对象时应注入？',['工厂（可以是函数）','全局变量','单例'],0,''],
['重试、计时这类横切关注点适合用？',['装饰器','复制到每个函数','注释'],0,''],
['大多数 Python 项目实现 DI 的方式？',['手写组合根与构造函数注入','必须使用 DI 框架','全局变量'],0,'']]
