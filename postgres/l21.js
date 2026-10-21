const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=110)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={pb:B('PgBouncer','pool_mode = transaction','sig',170),pg:B('PostgreSQL','5 个后端进程','',170),s:P('客户端连接很便宜：每个约 2 KB','mute'),q:P('没有空闲服务端连接时，客户端排队（cl_waiting）','sig'),f:P('事务一结束，服务端连接立即还给池','ok')};for(let i=0;i<5;i++)e['c'+i]=B('客户端 '+(i+1),i<2?'事务中':'空闲','',100);
const C=(a)=>{const o={};for(let i=0;i<5;i++)o['c'+i]=[0,i*50,{cls:'blk '+(a.includes(i)?'ok':'mute'),html:'客户端 '+(i+1)+'<br><span style="font-size:11px;opacity:.7">'+(a.includes(i)?'事务中':'空闲')+'</span>'}];return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'大量客户端',p:'几千个客户端连接到 PgBouncer，大部分时间都是空闲的（等待用户请求、处理业务逻辑）。',set:{...C([]),pb:[160,90],pg:[380,90],s:[160,170]}},
 {t:'事务开始时分配',p:'客户端发送 BEGIN 或第一条语句时，PgBouncer 从池中取一个服务端连接给它。',d:3800,set:{...C([0,1]),pb:[160,90],pg:[380,90,{cls:'blk ok'}]}},
 {t:'事务结束时归还',p:'COMMIT 后，服务端连接马上分给下一个有请求的客户端。5 个服务端连接可以服务成百上千个客户端。',d:4000,set:{...C([2,4]),pb:[160,90],pg:[380,90,{cls:'blk ok'}],f:[160,170]}},
 {t:'排队',p:'同时在事务中的客户端多于池大小时，其余的在 PgBouncer 中排队。数据库的并发保持在可控的范围。',d:3800,set:{...C([0,1,2,3,4]),pb:[160,90,{cls:'blk sig'}],pg:[380,90,{cls:'blk ok'}],q:[160,170]}}]});
const e2={a:B('客户端 A','',''),b:B('客户端 B','',''),s1:B('服务端连接 1','',''),x1:P("A: SET search_path = tenant_a",'sig'),x2:P('A 的事务结束，连接 1 归还','mute'),x3:P('B 拿到连接 1：search_path 仍是 tenant_a','bad'),x4:P('B 读写了 tenant_a 的数据','bad'),ok:P('SET LOCAL：只在当前事务内有效，事务结束自动恢复','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'A 修改会话设置',p:'客户端 A 在事务模式下执行了会话级 SET。这个设置附着在服务端连接 1 上，而不是客户端 A 上。',set:{a:[0,0],s1:[200,40,{cls:'blk sig'}],x1:[0,100]}},
 {t:'连接被复用',p:'A 的事务结束，连接 1 回到池中。',d:3400,set:{a:[0,0],s1:[200,40],x2:[0,100]}},
 {t:'B 继承了设置',p:'B 的下一个事务恰好拿到连接 1，带着 A 的 search_path。B 以为自己在操作 tenant_b。',d:4000,set:{a:[0,0],b:[400,0],s1:[200,40,{cls:'blk bad'}],x3:[0,100],x4:[0,140]}},
 {t:'修复',p:'把会话级状态限制在事务内：SET LOCAL、set_config(…, true)。PgBouncer 的 server_reset_query 只在 session 模式下执行，事务模式不会替你清理。',d:4200,set:{a:[0,0],b:[400,0],s1:[200,40,{cls:'blk ok'}],ok:[0,100]}}]});
(()=>{const Q=[['单条 SELECT',"cur.execute('SELECT * FROM orders WHERE id = %s', (1,))",'ok','每条语句（autocommit）或每个事务独立，没有会话状态，完全兼容。'],
['显式事务',"with conn.transaction():\n    cur.execute('UPDATE accounts …')\n    cur.execute('UPDATE accounts …')",'ok','整个事务在同一个服务端连接上执行。'],
['会话级 SET',"cur.execute(\"SET statement_timeout = '2s'\")\n...\ncur.execute('SELECT …')   # 可能在另一个连接上，超时未生效",'bad','改用 SET LOCAL（在事务内），或在 PgBouncer 中通过 connect_query / 角色级设置统一配置。'],
['SET LOCAL',"with conn.transaction():\n    cur.execute(\"SET LOCAL statement_timeout = '2s'\")\n    cur.execute('SELECT …')",'ok','设置只在本事务内有效。'],
['会话级咨询锁',"cur.execute('SELECT pg_advisory_lock(42)')\nrun_job()\ncur.execute('SELECT pg_advisory_unlock(42)')  # 可能发到另一个连接",'bad','锁挂在第一次拿到的服务端连接上，解锁可能发到别处失败，锁一直不释放。用 pg_try_advisory_xact_lock 并把任务放在同一事务中。'],
['LISTEN',"cur.execute('LISTEN orders_changed')\nfor n in conn.notifies(): ...",'bad','LISTEN 需要持续占有一个会话。用单独的直连连接。'],
['临时表',"cur.execute('CREATE TEMP TABLE t AS SELECT …')\ncur.execute('SELECT * FROM t')   # relation \"t\" does not exist",'bad','临时表属于会话。可以用 ON COMMIT DROP 并在同一个事务内用完，或改用 CTE。'],
['协议级预备语句',"# psycopg 3：同一 SQL 执行 5 次后自动 PREPARE\nfor i in range(100):\n    cur.execute('SELECT * FROM orders WHERE id = %s', (i,))",'sig','PgBouncer 1.21+ 设置 max_prepared_statements = 200 后，它会跟踪并在需要时在服务端连接上重新准备，可以正常工作。旧版本会报 prepared statement "_pg3_0" does not exist，需要在驱动中关闭自动准备。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='pool_mode = transaction，PgBouncer 1.23。'})();
Term(document.getElementById('t4'),[
['SHOW POOLS;',' database | user | cl_active | cl_waiting | sv_active | sv_idle | maxwait\n----------+------+-----------+------------+-----------+---------+---------\n shop     | api  |       812 |          0 |        14 |       6 |       0','cl_waiting 与 maxwait（秒）是最重要的指标。'],
['SHOW STATS;',' database | total_xact_count | total_query_count | avg_xact_time | avg_query_time | avg_wait_time\n----------+------------------+-------------------+---------------+----------------+--------------\n shop     |         98123410 |         301233012 |          1840 |            512 |           31','时间单位为微秒。avg_wait_time 是客户端平均排队时间。'],
['SHOW CLIENTS;','…','每个客户端连接的状态和来源地址。'],
['SHOW SERVERS;','…','每个服务端连接：状态、连接的客户端、建立时间。'],
['RELOAD;','RELOAD','重新读取配置文件，不断开连接。'],
['PAUSE shop; -- 维护 -- RESUME shop;','PAUSE\nRESUME','等待当前事务结束后暂停分配服务端连接，客户端排队而不是报错。用于主库切换或重启：切换后 RESUME，客户端几乎无感。']]);
Quiz(document.getElementById('qs'),[
['最常用的 PgBouncer 池模式是？',['session','transaction','statement'],1,''],
['事务模式下会话级 SET 的风险？',['语法错误','设置泄漏给其他客户端或丢失','性能下降'],1,''],
['SHOW POOLS 中 cl_waiting 持续大于 0 说明？',['客户端在排队等待服务端连接','PgBouncer 宕机','连接泄漏'],0,''],
['LISTEN/NOTIFY 通过事务池时？',['正常','LISTEN 不可用，需要直连','NOTIFY 不可用'],1,''],
['PAUSE 命令的用途？',['停止 PgBouncer','维护时让客户端排队而不报错','清空池'],1,'']]);
