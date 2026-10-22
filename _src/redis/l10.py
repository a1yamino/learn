TITLE='事务、Lua 脚本与 Functions';DESC='多个命令要一起执行时，Redis 提供三种工具：MULTI/EXEC 事务、WATCH 乐观锁、在服务器端原子执行的 Lua 脚本，以及 Redis 7 引入、可以持久保存的 Functions。本课讲它们各自保证什么、不保证什么，以及如何写一个安全的脚本。';NEXT='发布订阅与 Stream';MIN=60
SUM=['<code>MULTI</code> 之后的命令进入队列，<code>EXEC</code> 时一次性按顺序执行，期间不会插入其他客户端的命令。但 Redis 事务<b>没有回滚</b>：某条命令运行时出错（如对字符串做 LPUSH），其余命令照样执行；只有入队时的语法错误会让整个事务被放弃。',
'事务里不能根据读到的值做判断，因为命令在 EXEC 时才执行。“读—判断—写”用 <code>WATCH</code>：EXEC 前被 WATCH 的键被其他客户端修改，EXEC 返回 nil，客户端重试（乐观锁）。',
'<code>EVAL script numkeys key… arg…</code> 在服务器端原子地执行 Lua 脚本，可以在脚本内读、判断、写，一次往返。脚本执行期间整个服务器被它占用，所以脚本必须短；超过 <code>busy-reply-threshold</code>（默认 5 秒）后其他客户端收到 BUSY，只能 <code>SCRIPT KILL</code>（未写入时）或 <code>SHUTDOWN NOSAVE</code>。',
'所有用到的键都要通过 KEYS 传入，不要在脚本里拼键名：这是 Cluster 能把脚本路由到正确节点的前提（键必须在同一个槽）。<code>EVALSHA</code> 用 SHA1 调用已缓存的脚本，省去传输脚本正文；脚本缓存在重启或 <code>SCRIPT FLUSH</code> 后丢失，客户端要处理 NOSCRIPT。',
'Redis 7 的 <b>Functions</b>：<code>FUNCTION LOAD</code> 加载一个库，函数有名字，会随 RDB/AOF 持久化并复制到副本，用 <code>FCALL</code> 调用。适合作为服务器端的“存储过程”长期使用；临时脚本仍可用 EVAL。只读函数可声明 <code>no-writes</code> 标志，用 <code>FCALL_RO</code> 在副本上执行。',
'选择：简单的批量写用 MULTI/EXEC（或 pipeline）；需要条件判断且冲突少用 WATCH；需要原子的“读—判断—写”优先用 Lua/Functions。']
def secs(prac,E):
    return [
('MULTI/EXEC 与 WATCH','排队，一次执行；被别人改了就放弃。','<div id="p1"></div>'),
('动手：事务里出错会怎样','选择一种情况，看 EXEC 的结果。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('Lua 脚本：原子的读—判断—写','脚本执行时没有其他命令能插进来。','<div id="p2"></div>'),
('相关命令','脚本与函数管理。','<div id="t4"></div>'),
('在你的电脑上练习','在 redis-cli 中。',prac([
 ('事务：两个命令一起执行。','MULTI\nINCRBY acct:a -30\nINCRBY acct:b 30\nEXEC','OK\nQUEUED\nQUEUED\n1) (integer) -30\n2) (integer) 30'),
 ('运行时错误不回滚。','SET s hello\nMULTI\nINCR n\nLPUSH s x\nINCR n\nEXEC','OK\nOK\nQUEUED\nQUEUED\nQUEUED\n1) (integer) 1\n2) (error) WRONGTYPE Operation against a key holding the wrong kind of value\n3) (integer) 2'),
 ('WATCH：另开一个终端在 EXEC 前执行 SET stock 99。','SET stock 100\nWATCH stock\nMULTI\nDECR stock\nEXEC','OK\nOK\nOK\nQUEUED\n(nil)'),
 ('Lua：库存足够才扣减。','EVAL "local s=tonumber(redis.call(\'GET\',KEYS[1])) if s and s>=tonumber(ARGV[1]) then return redis.call(\'DECRBY\',KEYS[1],ARGV[1]) end return -1" 1 stock 3','(integer) 96'),
 ('缓存脚本并用 SHA 调用。','SCRIPT LOAD "return redis.call(\'GET\',KEYS[1])"\nEVALSHA 620cd258c2c9c88c9d10db67812ccf663d96bdc6 1 stock','"620cd258c2c9c88c9d10db67812ccf663d96bdc6"\n"96"'),
 ('Functions：加载一个库并调用。','FUNCTION LOAD "#!lua name=shop\nredis.register_function(\'take\', function(k,a) local s=tonumber(redis.call(\'GET\',k[1]) or 0) if s<tonumber(a[1]) then return -1 end return redis.call(\'DECRBY\',k[1],a[1]) end)"\nFCALL take 1 stock 5','"shop"\n(integer) 91')],
 ('写一个原子的“转账”脚本','两个账户余额存在 <code>acct:{ledger}:u1</code> 和 <code>acct:{ledger}:u2</code>（字符串）。写一个 Lua 脚本：从 KEYS[1] 转 ARGV[1] 到 KEYS[2]，余额不足返回错误，不能出现负数；说明为什么键名里用了花括号，以及为什么用 MULTI/EXEC 做不到同样的事。',
 '<pre>local max = 9007199254740991  -- 示例只接受 53 位内的非负整数\nlocal function integer(s)\n  if not s or not string.match(s, "^%d+$") then return nil end\n  if s ~= "0" and string.sub(s, 1, 1) == "0" then return nil end\n  local n = tonumber(s)\n  if n &gt; max then return nil end\n  return n\nend\nlocal amt = integer(ARGV[1])\nlocal bal = integer(redis.call("GET", KEYS[1]) or "0")\nlocal dest = integer(redis.call("GET", KEYS[2]) or "0")\nif KEYS[1] == KEYS[2] or not amt or amt == 0 or not bal or not dest then\n  return redis.error_reply("bad account or amount")\nend\nif bal &lt; amt then return redis.error_reply("insufficient") end\nif dest &gt; max - amt then return redis.error_reply("balance overflow") end\nredis.call("DECRBY", KEYS[1], ARGV[1])\nredis.call("INCRBY", KEYS[2], ARGV[1])\nreturn bal - amt</pre><p>调用：<code>EVAL "…" 2 acct:{ledger}:u1 acct:{ledger}:u2 30</code>。示例先读取两边余额并校验金额、整数格式和目标上限，避免目标账户类型错误、非整数或溢出造成先扣后报错。Lua 原子执行不等于出错会回滚；生产账户还需持久化账本和幂等约束。花括号是哈希标签：Cluster 只用 <code>{}</code> 里的部分计算槽，保证两个键在同一节点，否则脚本报 CROSSSLOT（第 15 课）。本例两键共享标签 <code>{ledger}</code>；不能把不同用户 ID 分别放进标签后误以为同槽。集中所有账户也会造成热点，应按业务选择账本分组或数据库事务。MULTI/EXEC 里的命令在 EXEC 时才执行，无法根据余额决定是否扣减；用 WATCH 可以实现，但冲突时要重试，而脚本一次往返就完成。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
