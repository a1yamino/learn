TITLE='安全：ACL、TLS 与危险命令';DESC='暴露在网络上、没有密码的 Redis 是常见的入侵入口：攻击者可以读取全部数据，甚至利用 CONFIG SET 写文件获得服务器权限。本课讲网络隔离与保护模式、Redis 6 起的 ACL 用户与权限、TLS 加密、禁用和限制危险命令，以及最小权限的账户设计。';NEXT='可观测性与调优：延迟、内存与慢日志';MIN=60
SUM=['第一道防线是<b>网络</b>：Redis 只在内网监听（<code>bind 10.0.0.5</code>），用安全组/防火墙只允许应用服务器访问 6379（以及 Cluster 的 16379）；不要映射到公网。<code>protected-mode yes</code>（默认）在没有密码且监听非本地地址时拒绝外部连接。注意 <code>docker run -p 6379:6379</code> 会在所有网卡上开放端口。',
'经典攻击：未授权访问后 <code>CONFIG SET dir /root/.ssh</code> + <code>CONFIG SET dbfilename authorized_keys</code> + <code>SAVE</code> 写入公钥；或者 <code>SLAVEOF</code> 恶意主库加载模块执行代码。Redis 7 起 <code>enable-protected-configs</code> 和 <code>enable-module-command</code> 默认为 no，能阻止运行时修改 dir 等敏感配置和加载模块，但前提仍然是不应让人连上。',
'<b>ACL</b>（Redis 6+）：每个用户有密码、可执行的命令（<code>+@read</code>、<code>-@dangerous</code>、<code>+get</code>）、可访问的键模式（<code>~shop:*</code>，<code>%R~</code> 只读、<code>%W~</code> 只写）和 Pub/Sub 频道（<code>&amp;news:*</code>）。<code>default</code> 用户对应旧的 requirepass，应设置密码或禁用（<code>user default off</code>）。',
'按用途建账户：应用账户只能访问自己的键前缀和需要的命令类别，不能用 <code>@admin</code>、<code>@dangerous</code>；运维账户全部权限，仅从跳板机使用；监控账户只能执行 INFO、PING、SLOWLOG 等。ACL 写在 <code>aclfile</code> 中，用 <code>ACL SAVE</code>/<code>ACL LOAD</code> 管理；<code>ACL LOG</code> 记录被拒绝的访问。',
'<b>TLS</b>：<code>tls-port 6379</code>、<code>port 0</code>，配置证书和 CA；复制和集群总线也可以加密（<code>tls-replication yes</code>、<code>tls-cluster yes</code>）。会增加 CPU 开销，可以用 I/O 线程缓解。云托管服务通常提供传输加密开关。',
'危险命令：<code>FLUSHALL</code>、<code>FLUSHDB</code>、<code>KEYS</code>、<code>CONFIG</code>、<code>DEBUG</code>、<code>SHUTDOWN</code>、<code>MODULE</code>。用 ACL 对应用账户禁止它们（推荐），而不是旧的 <code>rename-command</code>（它会影响复制和 AOF，而且对所有用户生效）。密码等秘密不要写进代码仓库，通过密钥管理服务或环境注入。']
def secs(prac,E):
    return [
('一次未授权访问','从扫描到拿到服务器权限。','<div id="p1"></div>'),
('动手：ACL 检查','用户 app 的规则：<code>on &gt;*** ~shop:* +@read +@write -@dangerous</code>。选择一条命令，看会不会被允许。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:60px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','ACL 管理。','<div id="t4"></div>'),
('在你的电脑上练习','在 redis-cli 中（默认用户此时无密码）。',prac([
 ('创建应用账户。','ACL SETUSER app on >s3cret ~shop:* +@read +@write -@dangerous','OK'),
 ('查看规则。','ACL GETUSER app','1) "flags"\n2) 1) "on"\n…\n5) "commands"\n6) "+@read +@write -@dangerous"\n7) "keys"\n8) "~shop:*"\n…'),
 ('以 app 登录并测试。','AUTH app s3cret\nSET shop:x 1\nSET user:x 1\nFLUSHALL','OK\nOK\n(error) NOPERM No permissions to access a key\n(error) NOPERM User app has no permissions to run the \'flushall\' command'),
 ('切回默认用户，查看被拒绝的日志。','AUTH default ""\nACL LOG 1','OK\n1) 1) "count"\n   2) (integer) 1\n   3) "reason"\n   4) "command"\n   …\n   "object" "flushall"\n   "username" "app"'),
 ('监控账户：只读几个命令。','ACL SETUSER monitor on >m0n +info +ping +slowlog|get +latency|latest','OK'),
 ('给默认用户设置密码（或 ACL SETUSER default off 禁用）。','ACL SETUSER default >Adm1n!pw\nACL WHOAMI','OK\n"default"')],
 ('为三个团队设计 ACL','一个 Redis 实例被三个服务共享：订单服务（键前缀 <code>order:</code>，需要读写、Lua 脚本）、推荐服务（只读 <code>product:</code> 和 <code>rec:</code>，写 <code>rec:</code>）、数据看板（只读所有键的统计信息，不能读取数据）。再加一个运维账户。写出 ACL 规则，并说明默认用户如何处理、密码如何下发。',
 '<pre>user default off\nuser order on #&lt;sha256&gt; ~order:* +@read +@write +@scripting -@dangerous\nuser rec on #&lt;sha256&gt; %R~product:* ~rec:* +@read +@write -@dangerous\nuser board on #&lt;sha256&gt; +info +ping +dbsize +slowlog|get +latency|latest +memory|stats\nuser ops on #&lt;sha256&gt; ~* &amp;* +@all</pre><ul><li>密码以 SHA-256 写入 aclfile（<code>#</code> 后跟哈希），配置文件中不出现明文；应用从密钥管理服务获取明文密码。</li><li><code>%R~product:*</code> 让推荐服务对商品键只读；<code>~rec:*</code> 读写。看板账户没有任何键模式，即使命令允许也读不到数据。</li><li>禁用 default 用户，强制所有客户端用自己的账户认证，便于 <code>ACL LOG</code> 和 <code>CLIENT LIST</code> 中区分来源。</li><li>ops 只从跳板机使用；网络层仅允许三个服务的网段访问。更好的做法是把三个服务拆到不同实例，避免互相影响。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
