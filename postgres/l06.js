const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=300)=>({w,h:40,cls:'blk '+c,html:t});
Player(document.getElementById('p1'),{els:{in:P("输入 name = x' OR '1'='1",'mute'),s1:B("f\"… WHERE name = '{name}'\"",'',320),r1:B("WHERE name = 'x' OR '1'='1'",'bad',320),o1:P('解析器把 OR 当作 SQL → 返回所有行','bad'),s2:B('Parse：WHERE name = $1','',320),s3:B("Bind：$1 = \"x' OR '1'='1\"",'',320),o2:P('参数只是值，永远不会被解析 → 0 行','ok')},scenes:[
 {t:'用户输入',p:'攻击者在登录框输入一个带引号的字符串。',set:{in:[0,0]}},
 {t:'拼接字符串',p:'把输入直接拼进 SQL，引号闭合了原来的字符串，后面的 OR \'1\'=\'1\' 变成了 SQL 的一部分。',d:4000,set:{in:[0,0],s1:[0,50],r1:[0,100],o1:[0,150]}},
 {t:'参数化查询',p:'驱动先发送带占位符的 SQL（Parse），再单独发送参数值（Bind）。服务器解析 SQL 时参数还不存在，所以参数里写什么都不会改变语句结构。',d:4600,set:{in:[0,0],s2:[0,50,{cls:'blk ok'}],s3:[0,100,{cls:'blk ok'}],o2:[0,150]}},
 {t:'不能参数化的部分',p:'占位符只能代替值。动态的表名、列名、ORDER BY 方向要用白名单校验或驱动提供的标识符转义（psycopg.sql.Identifier），不能直接拼接用户输入。',d:4000,set:{in:[0,0],s2:[0,50],o2:[0,100,P('ORDER BY 列名：白名单','sig')]}}]});
const e={};for(let i=0;i<6;i++)e['r'+i]=B('请求 '+(i+1),'',90);for(let i=0;i<3;i++)e['c'+i]=B('连接 '+(i+1)+' · 后端进程','',170);
e.pool={w:200,h:150,cls:'frame',html:'<i>连接池</i>'};e.q=P('请求 4–6 排队等待空闲连接','sig');e.n=P('每次请求都新建连接：握手 + fork + 认证，几毫秒','bad');e.m=P('3 个实例 × 池 50 = 150 > max_connections 100 → FATAL: too many clients','bad');
const rq=(n,c)=>{const o={};for(let i=0;i<n;i++)o['r'+i]=[0,i*46,{cls:'blk '+(i<3?c:'mute')}];return o};
Player(document.getElementById('p2'),{els:e,scenes:[
 {t:'没有池',p:'每个请求都打开、关闭一个连接。连接建立的开销甚至可能比查询本身更大，并发高时还会瞬间耗尽 max_connections。',set:{...rq(3,'sig'),n:[120,40]}},
 {t:'连接池',p:'应用启动时建立少量长连接放在池中。请求借用一个连接，用完归还，不关闭。',d:4000,set:{...rq(3,'ok'),pool:[130,0],c0:[145,20],c1:[145,66],c2:[145,112]}},
 {t:'排队',p:'池满时，新的请求等待而不是新建连接。排队比让数据库同时跑过多查询更好：CPU 和磁盘的并行能力有限。',d:4200,set:{...rq(6,'ok'),pool:[130,0],c0:[145,20],c1:[145,66],c2:[145,112],q:[360,180]}},
 {t:'所有实例加起来',p:'池大小是按实例算的。扩容到更多副本时，总连接数也跟着涨。连接很多时要在中间加 PgBouncer（第 21 课）。',d:4000,set:{pool:[130,0],c0:[145,20],c1:[145,66],c2:[145,112],m:[0,180]}}]});
(()=>{const Q=[['每个请求新建连接','高峰 400 req/s：\n  连接建立 ~5 ms/次，后端进程不断 fork/退出\n  某一时刻并发连接 > 100\n  FATAL: sorry, too many clients already','bad','没有池，连接数随流量失控。'],
['4 个实例 × 池 10','总连接 40，活跃查询最多 40\n  CPU 利用率 85%\n  p99 延迟 35 ms\n  池等待偶尔几毫秒','ok','合理：总量约为核数的几倍，留出管理和迁移用的连接余量。'],
['4 个实例 × 池 50','总连接 200 > max_connections 100\n  第 3 个实例启动时：FATAL: too many clients\n  调高 max_connections 到 300 后：\n  上下文切换激增，p99 延迟 400 ms','bad','连接比核数多太多，数据库在切换上浪费时间。把 max_connections 调大不能解决问题，每个连接还占内存。'],
['4 个实例 × 池 2','总连接 8，CPU 利用率 40%\n  请求在池中排队，p99 延迟 220 ms\n  池等待超时：PoolTimeout','','池太小，数据库还有余力，瓶颈在应用排队。'],
['池 10，无 statement_timeout','一个慢报表查询跑了 10 分钟\n  流量高峰时 10 个连接都被慢查询占满\n  其他请求全部 PoolTimeout','bad','没有语句超时，少数慢查询就能占满整个池。给在线接口设 statement_timeout，报表走单独的池或副本。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='8 核，max_connections = 100，应用 4 个实例。'})();
Term(document.getElementById('t4'),[
['SELECT application_name, state, count(*) FROM pg_stat_activity WHERE backend_type = \'client backend\' GROUP BY 1, 2;',' application_name | state  | count\n------------------+--------+-------\n api              | idle   |    36\n api              | active |     4\n psql             | active |     1','按服务和状态统计连接。大量 idle 说明池配得偏大。'],
['SHOW max_connections;',' max_connections\n-----------------\n 100','修改需要重启。superuser_reserved_connections 默认留 3 个给超级用户。'],
['SELECT name, setting FROM pg_settings WHERE name LIKE \'%timeout%\';','                name                 | setting\n-------------------------------------+---------\n idle_in_transaction_session_timeout | 0\n lock_timeout                        | 0\n statement_timeout                   | 0\n …','默认全是 0（不超时）。'],
['ALTER ROLE api SET statement_timeout = \'5s\';','ALTER ROLE','给应用角色设默认超时，新连接生效。'],
['PREPARE q(int) AS SELECT * FROM orders WHERE user_id = $1;\nEXECUTE q(42);','PREPARE\n …','SQL 层的预备语句。驱动通常在协议层自动处理。'],
['SELECT name, statement FROM pg_prepared_statements;',' name |                 statement\n------+-------------------------------------------\n q    | PREPARE q(int) AS SELECT * FROM orders …','当前会话的预备语句。']]);
Quiz(document.getElementById('qs'),[
['参数化查询防注入的根本原因是？',['驱动转义了引号','参数与 SQL 文本分开发送，不参与解析','数据库会检查关键字'],1,'Parse 与 Bind 分离。'],
['能用占位符代替表名吗？',['能','不能，要用白名单或标识符转义','只在 PostgreSQL 18 能'],1,'占位符只能代替值。'],
['4 个实例、每个池 50，max_connections 100，会？',['正常','部分实例连不上','自动排队'],1,'总数超限。'],
['哪个错误适合自动重试整个事务？',['23505 unique_violation','40001 serialization_failure','42P01 undefined_table'],1,'换个时机可能成功。'],
['为什么要设 statement_timeout？',['防止少数慢查询占满连接池','提高单条查询速度','节省磁盘'],0,'']]);
