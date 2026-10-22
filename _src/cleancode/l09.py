TITLE='边界：包装第三方代码';MIN=40;NEXT='单元测试与 TDD：整洁的测试'
DESC='我们的系统依赖大量不受自己控制的代码：第三方库、HTTP API、云服务。本课讲如何让这些边界保持整洁：不要让第三方类型渗透到整个代码库（把 Map、requests 的 Response、SDK 对象挡在边界之内）；用适配器包装它们，只暴露我们需要的接口；写“学习测试”来探索并锁定第三方行为；在接口尚不存在时先定义我们想要的接口（端口与适配器）；以及如何用假实现测试边界两侧。'
SUM=['<b>第三方接口为通用而设计</b>，我们的需求是具体的。直接在业务代码里到处使用 <code>boto3</code> 客户端或 <code>requests.Response</code>，会让升级、替换和测试都牵一发而动全身。',
'<b>适配器</b>：用一个小类包装第三方代码，只暴露应用需要的操作，用应用的语言命名（<code>FileStore.save(name, data)</code> 而不是 <code>s3.put_object(Bucket=..., Key=..., Body=...)</code>），并把第三方异常翻译成领域异常。',
'<b>学习测试</b>：在使用新库之前，写几个测试验证你对它行为的理解。这些测试免费地成为升级时的回归检查：新版本行为变了，学习测试会先失败。',
'<b>先定义我们想要的接口</b>：依赖的系统还没做好时，先写下理想中的接口（Protocol），用假实现推进开发；真实系统到位后再写适配器。这就是“端口与适配器”（六边形架构）的思想。',
'<b>边界上的测试</b>：业务逻辑用内存假实现（fake）测试，快且稳定；适配器本身用少量集成测试（或契约测试）对真实服务验证。',
'<b>让边界保持很少</b>：一个第三方类型只应出现在少数几个文件里。可以用 <code>grep</code> 检查：<code>import boto3</code> 出现在 30 个文件里就是信号。']
S1=('边界在哪里','第三方类型从一处渗透到整个代码库，再被收回到一个适配器里。')
A1=[('渗透','订单、发票、报表模块都直接调用 SDK，并处理 SDK 的异常。',[('a','orders.py → boto3','bad',0,0,200),('b','invoices.py → boto3','bad',0,60,200),('c','reports.py → boto3','bad',0,120,200),('s','S3','',300,60,100)]),
('SDK 升级','SDK 改了参数名，三处都要改；还要在每处 mock 不同的调用。',[('a','orders.py ✗','bad',0,0,200),('b','invoices.py ✗','bad',0,60,200),('c','reports.py ✗','bad',0,120,200),('s','S3 v2','sig',300,60,100)]),
('适配器','只有 S3FileStore 认识 SDK，其他模块依赖 FileStore 接口。',[('a','orders.py','ok',0,0,160),('b','invoices.py','ok',0,60,160),('c','reports.py','ok',0,120,160),('p','FileStore（接口）','ok',190,60,170),('x','S3FileStore','sig',390,30,140),('s','S3','',390,90,100)]),
('测试','业务测试用 InMemoryFileStore，快且不依赖网络。',[('a','业务测试','ok',0,60,160),('p','FileStore（接口）','ok',190,60,170),('m','InMemoryFileStore','ok',390,60,160)])]
S2=('动手：这个类型该出现在哪里？','选择一段代码。')
CHI=[('def charge(resp: Response)','def total_spent(resp: requests.Response) -> int:\n    return sum(x["amount"] for x in resp.json()["data"])\n\n问题：业务函数依赖 HTTP 响应对象，\n无法在没有 HTTP 的情况下测试','bad','让适配器把响应转换成领域对象：<code>total_spent(charges: list[Charge])</code>。'),
('Map 到处传','sensors = {}  # dict[str, Sensor]，到处传，到处 .clear()\n\n问题：任何拿到它的代码都能清空、\n放入任意类型','bad','书中的例子：用 <code>Sensors</code> 类包装，只暴露 <code>get(sensor_id)</code>，不需要的能力不暴露。'),
('翻译异常','class S3FileStore:\n    def load(self, name):\n        try:\n            obj = self._s3.get_object(Bucket=self._bucket, Key=name)\n        except self._s3.exceptions.NoSuchKey as e:\n            raise FileNotFound(name) from e\n        return obj["Body"].read()','ok','第三方异常在边界被翻译成领域异常，调用方不需要导入 SDK。'),
('学习测试','def test_dateutil_parses_chinese_month_names():\n    # 我们假设它能解析……它能吗？\n    with pytest.raises(ParserError):\n        parse("2026年3月1日")','ok','学习测试揭示了库并不支持这种格式——在写业务代码之前就知道了。升级后若行为改变，这个测试会提醒你。'),
('Protocol','class FileStore(Protocol):\n    def save(self, name: str, data: bytes) -> None: ...\n    def load(self, name: str) -> bytes: ...','ok','我们想要的接口，用应用的语言命名，和任何 SDK 无关。')]
CHH='选择一段代码。'
S3=('端口与适配器','“我们想要的接口”放在中心，第三方代码在外围。','''<table class="tbl"><tr><th>层</th><th>内容</th><th>依赖</th></tr>
<tr><td>领域 / 用例</td><td>订单、发票逻辑；端口（<code>FileStore</code>、<code>PaymentGateway</code> 协议）</td><td>不依赖任何第三方库</td></tr>
<tr><td>适配器</td><td><code>S3FileStore</code>、<code>StripeGateway</code>、<code>InMemoryFileStore</code></td><td>实现端口，依赖 SDK</td></tr>
<tr><td>组装（main）</td><td>根据配置选择适配器并注入</td><td>依赖一切（第 13 课）</td></tr></table>
<p><b>不要过度包装</b>：标准库、语言内置类型和非常稳定的库（如 <code>datetime</code>、<code>pathlib</code>）通常不需要包装。包装的价值与“这个依赖变化或被替换的可能性”以及“它让测试变难的程度”成正比。</p>''')
S4=('检查边界是否泄漏','一条命令统计第三方库渗透到多少文件。')
TERM=[['grep -rl "^import boto3\\|^from boto3" --include=*.py src/ | wc -l','17','17 个文件直接依赖 SDK：边界已经泄漏。'],
['grep -rl "boto3" --include=*.py src/','src/infra/s3_store.py','重构之后：只有适配器认识 SDK。'],
['python3 -m unittest discover -s tests/unit -q','Ran 212 tests in 0.84s\n\nOK','业务测试不需要网络和凭据。']]
S5=('在你的电脑上练习','为一个“天气服务”写学习测试，再用适配器把它包起来。为了不依赖网络，我们用标准库 <code>json</code> 模拟第三方返回的格式。')
PRAC=[('“第三方客户端”：返回嵌套很深的 dict，温度以开尔文表示。','cat > vendor_weather.py <<\'EOF\'\n# 模拟一个第三方 SDK：我们不能修改它\nclass WeatherClient:\n    def fetch(self, q):\n        if q == "nowhere":\n            raise KeyError("city")\n        return {"data": {"current": {"temp_k": 293.15, "cond": [{"txt": "Clear"}]}}}\nEOF',''),
('学习测试：把我们对它的理解写成测试。直接运行并保留失败退出码；不要用 exit=False 或无 pipefail 的 grep 管道把失败伪装成成功。','cat > test_learning.py <<\'EOF\'\nimport unittest\nfrom vendor_weather import WeatherClient\n\nclass LearningWeatherClient(unittest.TestCase):\n    def test_temperature_is_in_kelvin(self):\n        r = WeatherClient().fetch("taipei")\n        self.assertAlmostEqual(r["data"]["current"]["temp_k"], 293.15)\n\n    def test_unknown_city_raises_key_error(self):\n        with self.assertRaises(KeyError):\n            WeatherClient().fetch("nowhere")\n\nif __name__ == "__main__":\n    unittest.main(argv=["x", "-v"])\nEOF\npython3 test_learning.py',None),
('适配器 + 端口 + 假实现：业务代码只认识 <code>Weather</code>。','cat > weather.py <<\'EOF\'\nfrom dataclasses import dataclass\nfrom typing import Protocol\n\n@dataclass(frozen=True)\nclass Weather:\n    celsius: float\n    summary: str\n\nclass CityNotFound(Exception):\n    pass\n\nclass WeatherSource(Protocol):\n    def current(self, city: str) -> Weather: ...\n\nclass VendorWeatherSource:\n    def __init__(self, client):\n        self._client = client\n\n    def current(self, city):\n        try:\n            raw = self._client.fetch(city)\n        except KeyError as e:\n            raise CityNotFound(city) from e\n        now = raw["data"]["current"]\n        return Weather(round(now["temp_k"] - 273.15, 1), now["cond"][0]["txt"])\n\nclass FakeWeatherSource:\n    def __init__(self, table):\n        self._table = table\n\n    def current(self, city):\n        if city not in self._table:\n            raise CityNotFound(city)\n        return self._table[city]\n\ndef clothing_advice(source: WeatherSource, city):\n    w = source.current(city)\n    return "带外套" if w.celsius < 15 else "短袖即可"\nEOF\npython3 -c "\nfrom weather import *\nfrom vendor_weather import WeatherClient\nprint(VendorWeatherSource(WeatherClient()).current(\'taipei\'))\nprint(clothing_advice(FakeWeatherSource({\'oslo\': Weather(3, \'Snow\')}), \'oslo\'))\ntry:\n    VendorWeatherSource(WeatherClient()).current(\'nowhere\')\nexcept CityNotFound as e:\n    print(\'CityNotFound:\', e)"',None)]
CHAL=('设计一个边界','你的应用要发送短信验证码。目前用供应商 A 的 SDK，明年可能换成供应商 B；测试时不能真的发短信；供应商 A 的 SDK 在限流时抛出 <code>AThrottleError</code>，在号码无效时返回 <code>{"code": 4001}</code>。设计端口、适配器与异常。',
'<pre class="cmd">class SmsError(Exception): ...\nclass InvalidPhoneNumber(SmsError): ...\nclass SmsRateLimited(SmsError): ...\n\nclass SmsSender(Protocol):\n    def send_code(self, phone: PhoneNumber, code: str) -> None: ...\n\nclass VendorASmsSender:\n    def send_code(self, phone, code):\n        try:\n            r = self._sdk.send(to=phone.e164, template="verify", params={"code": code})\n        except AThrottleError as e:\n            raise SmsRateLimited() from e\n        if r.get("code") == 4001:\n            raise InvalidPhoneNumber(phone)\n\nclass RecordingSmsSender:      # 测试用\n    def __init__(self): self.sent = []\n    def send_code(self, phone, code): self.sent.append((phone, code))</pre><p>端口用业务语言命名（“发送验证码”，不是“发送模板消息”）；两种不同风格的错误（异常与返回码）在适配器中统一为领域异常；换供应商时只需新增 <code>VendorBSmsSender</code>，并让两个适配器通过同一套契约测试。</p>')
QUIZ=[['为什么要包装第三方 API？',['限制其影响范围，便于升级、替换与测试','让代码更长','提高性能'],0,''],
['学习测试的作用是？',['验证对第三方库的理解，并在升级时充当回归测试','测试自己的业务逻辑','代替文档'],0,''],
['适配器中应该如何处理第三方异常？',['翻译为领域异常并保留因果链','直接抛出','吞掉'],0,''],
['业务逻辑的单元测试最好依赖？',['内存中的假实现','真实云服务','生产数据库'],0,''],
['是否所有依赖都需要包装？',['否，稳定的标准库通常不需要','是','只包装标准库'],0,'']]
