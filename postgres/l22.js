const P=(t,c='sig')=>({cls:'pill '+c,html:t});const Bar=(t,w,c='')=>({w,h:34,cls:'blk '+c,html:t});
const e={a:Bar('报表查询 · 4 s × 20 次 = 80 s',80),b:Bar('订单详情 · 3 ms × 900 万次 = 7.5 h',540),c:Bar('登录 · 0.4 ms × 1200 万次 = 1.3 h',94),d:Bar('购物车 · 1 ms × 300 万次 = 0.8 h',58),l:P('按 total_exec_time 排序','sig'),f:P('订单详情加覆盖索引：3 ms → 0.3 ms，节省 6.7 小时/天的数据库时间','ok'),s:P('慢查询日志最显眼的是报表，但它只占 0.3%','mute')};
const R={a:[0,0],b:[0,44],c:[0,88],d:[0,132]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'慢查询日志',p:'按单次耗时，报表查询最引人注目：每次 4 秒。',set:{a:[0,0,{cls:'blk bad'}],s:[0,60]}},
 {t:'总耗时',p:'pg_stat_statements 中按总耗时看：一条 3 ms 的查询因为调用次数巨大，占用了数据库绝大部分时间。',d:4200,set:{...R,b:[0,44,{cls:'blk sig'}],l:[0,190]}},
 {t:'优化收益',p:'把这条查询降到 0.3 ms，节省的数据库时间远大于把报表优化到 0 秒。先优化总耗时最高的，再看单次最慢的。',d:4200,set:{...R,b:[0,44,Bar('订单详情 · 0.3 ms × 900 万次 = 0.75 h',54,'ok')],f:[0,190]}}]});
const W=[['cpu','CPU（无等待）',6,''],['io','IO: DataFileRead',9,'sig'],['lk','Lock: transactionid',3,''],['wal','LWLock: WALWrite',1,''],['cl','Client: ClientRead',2,'']];
const e2={n:P('采样：16 核服务器上的 21 个活跃会话','mute'),d1:P('大量 DataFileRead：工作集超出内存，或查询在大范围读盘','sig'),d2:P('Lock 堆积：热点行竞争或长事务，查 pg_blocking_pids','sig'),d3:P('WALWrite / WALSync：提交太频繁或 WAL 磁盘慢','sig')};W.forEach(([k,t,n,c])=>e2[k]=Bar(t+' · '+n,60+n*40,c));
const Wl=(h)=>{const o={n:[0,0]};W.forEach(([k],i)=>o[k]=[0,40+i*42,{cls:'blk '+(h===k?'bad':'')}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'采样',p:'每秒执行一次查询，统计活跃会话的 wait_event。没有等待事件表示在 CPU 上运行。',set:Wl('')},
 {t:'IO 等待最多',p:'9 个会话在等读数据文件，比 CPU 上运行的还多。先找出读盘最多的语句（pg_stat_statements 的 shared_blks_read），通常是缺索引或扫描范围过大。',d:4400,set:{...Wl('io'),d1:[0,260]}},
 {t:'锁等待',p:'transactionid 锁表示在等另一个事务结束（行锁）。少量是正常的，持续增长要找阻塞源头。',d:3800,set:{...Wl('lk'),d2:[0,260]}},
 {t:'WAL 等待',p:'WAL 写入是所有提交的串行点。批量写入时合并成更大的事务，或把 WAL 放在更快的磁盘上。',d:3800,set:{...Wl('wal'),d3:[0,260]}}]});
(()=>{const H='  calls   | total_s | mean_ms | rows/call | hit%  | query\n----------+---------+---------+-----------+-------+------------------------------------------\n';const Q=[['1',H+' 9012331 |   27036 |    3.00 |       1.0 | 99.9  | SELECT … FROM orders o JOIN order_items i … WHERE o.id = $1','sig','高频、单次不慢但总量最大。看计划：可能是 order_items 缺 (order_id) 索引而走了别的索引，或者回表太多。优化它的收益最大。'],
['2',H+'      20 |      80 | 4000.00 |   12000.0 | 61.2  | SELECT date_trunc($1, created_at), sum(amount) FROM orders …','','每天 20 次的报表，总量小。可以放到只读副本或用物化视图预计算，不必优先处理。'],
['3',H+' 1203112 |    4812 |    4.00 |    1000.0 | 99.8  | SELECT * FROM products WHERE category_id = $1','bad','每次返回 1000 行，几乎可以肯定应用只显示了前 20 行。加 LIMIT 和分页，或只查需要的列。'],
['4',H+'  800120 |    3201 |    4.00 |       0.0 | 99.9  | SELECT * FROM sessions WHERE token = $1','bad','每次返回 0 行却要 4 ms：很可能没有 token 上的索引，每次扫描整张表找不到。加唯一索引。'],
['5',H+' 30123310 |    3012 |    0.10 |       1.0 | 100.0 | SELECT $1','sig','连接池的健康检查查询，3000 万次。单次很快，但可以降低检查频率或改用 TCP keepalive。'],
['6',H+'   51022 |    2551 |   50.00 |       1.0 | 99.9  | UPDATE counters SET n = n + $1 WHERE id = $2','bad','单行更新要 50 ms：几乎全是等锁时间。热点行，所有请求都在更新同一个计数器。改为分片计数（多行求和）或异步汇总。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent='第 '+t+' 行';b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='统计自上次重置起 24 小时。hit% = shared_blks_hit / (hit + read)。'})();
Term(document.getElementById('t4'),[
['SELECT name, setting, unit, source FROM pg_settings WHERE source NOT IN (\'default\', \'override\') ORDER BY name;','…','所有被修改过的参数及来源（配置文件、ALTER SYSTEM、会话）。'],
['SELECT name, setting, pending_restart FROM pg_settings WHERE pending_restart;','      name      | setting | pending_restart\n----------------+---------+-----------------\n shared_buffers | 16384   | t','已修改但需要重启才生效的参数。'],
['SELECT query, calls, total_exec_time, shared_blks_read, wal_bytes FROM pg_stat_statements ORDER BY shared_blks_read DESC LIMIT 5;','…','读盘最多的语句，对应 IO 等待。'],
['SELECT pg_stat_statements_reset();','…','重置统计。在优化前后各取一个时间窗口对比。'],
['SELECT wait_event_type, wait_event, state, count(*) FROM pg_stat_activity GROUP BY 1, 2, 3 ORDER BY 4 DESC;','…','当前所有会话的状态和等待分布。'],
['SELECT * FROM pg_stat_database WHERE datname = current_database();','… xact_commit | xact_rollback | blks_read | blks_hit | temp_files | temp_bytes | deadlocks …','temp_files/temp_bytes 增长说明排序或哈希溢出到磁盘，work_mem 可能不够。']]);
Quiz(document.getElementById('qs'),[
['优化优先级首先看 pg_stat_statements 的？',['mean_exec_time','total_exec_time','calls'],1,''],
['work_mem 为什么要保守？',['每个排序/哈希节点各分配一份','它是全局共享的','修改需要重启'],0,''],
['等待事件 IO: DataFileRead 占多数通常说明？',['大量读盘，缺索引或内存不足','锁竞争','网络慢'],0,''],
['Client: ClientRead 大量出现在 idle in transaction 会话上说明？',['数据库慢','应用在事务中做别的事，没有及时提交','磁盘满'],1,''],
['SSD 上 random_page_cost 常调为？',['4','1.1','10'],1,'']]);
