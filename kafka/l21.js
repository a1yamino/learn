const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={s:B('订单服务',''),db:B('数据库','orders'),k:B('Kafka','orders 主题'),a1:P('① COMMIT 成功','ok'),a2:P('② 崩溃 → send 没有发生','bad'),a3:P('订单存在，事件丢失','bad'),b1:P('① send 成功','ok'),b2:P('② COMMIT 失败 → 回滚','bad'),b3:P('下游收到了不存在的订单','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'先提交',p:'先提交数据库，再发送事件。',set:{s:[0,60],db:[200,0],k:[200,120],a1:[360,10]}},
 {t:'崩溃',p:'两步之间崩溃。',d:3400,set:{s:[0,60,B('订单服务','崩溃','bad')],db:[200,0,B('数据库','有订单','ok')],k:[200,120,B('Kafka','无事件','bad')],a1:[360,10],a2:[360,130],a3:[0,190]}},
 {t:'先发送',p:'换个顺序：先发送，再提交。',d:3400,set:{s:[0,60],db:[200,0],k:[200,120,B('Kafka','有事件','ok')],b1:[360,130]}},
 {t:'回滚',p:'提交失败，事件却已经发出。两种顺序都不可靠。',d:3600,set:{s:[0,60],db:[200,0,B('数据库','无订单','bad')],k:[200,120,B('Kafka','有事件','ok')],b1:[360,130],b2:[360,10],b3:[0,190]}}]});
const e2={s:B('订单服务','一个事务'),db:{w:170,h:100,cls:'frame',html:'<i>数据库</i><br>orders<br>outbox'},wal:B('WAL / binlog','提交的变更'),dz:B('Debezium','Connect Source','sig'),er:B('EventRouter','SMT'),k:B('outbox.event.Order','key = 订单号','ok',170),c:B('消费者','按事件 ID 幂等')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'一个事务',p:'业务行和 outbox 行在同一事务中写入，要么都在要么都不在。',set:{s:[0,0],db:[170,0]}},
 {t:'数据库日志',p:'提交后，变更出现在数据库的复制日志中。',d:3200,set:{s:[0,0],db:[170,0],wal:[370,0]}},
 {t:'CDC',p:'Debezium 读取日志中 outbox 的插入，EventRouter 转成业务事件并按聚合类型路由。',d:3800,set:{s:[0,0],db:[170,0],wal:[370,0],dz:[370,70],er:[200,140]}},
 {t:'发布',p:'事件写入主题，key 为聚合 ID；消费者按事件 ID 幂等处理（至少一次）。',d:3600,set:{s:[0,0],db:[170,0],wal:[370,0],dz:[370,70],er:[200,140],k:[0,210],c:[200,210]}}]});
(()=>{const S=[['写业务表之后、提交之前',['双写：事务回滚，什么也没发生（若 send 在事务内已执行，则事件已发出 → 不一致）','Outbox：事务回滚，业务行和 outbox 行都不存在 → 一致'],'ok'],['提交之后、发送事件之前',['双写：订单存在，事件丢失','Outbox：outbox 行已提交，CDC 会从日志中读到 → 事件稍后发出'],'ok'],['Debezium 发送后、提交 Connect 偏移量之前',['双写：—','Outbox：Connect 重启后从上次的日志位置重读 → 事件重复一次（消费者幂等即可）'],'sig'],['Kafka 整体不可用 10 分钟',['双写：下单接口报错或丢事件','Outbox：下单不受影响；事件积压在数据库日志中，Kafka 恢复后发出（注意 WAL 占用磁盘）'],'ok']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'Outbox 保持一致。':'Outbox 只会多发，不会少发或错发。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择崩溃位置。'})();
Term(document.getElementById('t4'),[
['CREATE TABLE outbox(id uuid PRIMARY KEY, aggregatetype text NOT NULL, aggregateid text NOT NULL, type text NOT NULL, payload jsonb NOT NULL, created_at timestamptz DEFAULT now());','CREATE TABLE','EventRouter 默认使用的列名。'],
['transforms.outbox.route.by.field=aggregatetype\ntransforms.outbox.route.topic.replacement=orders','（连接器配置）','把所有 Order 事件路由到已有的 orders 主题。'],
['SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS lag FROM pg_replication_slots;','slot_name | active | lag\ndebezium  | t      | 24 kB','监控 PostgreSQL 复制槽延迟：连接器停止时这里会不断增长。'],
['DELETE FROM outbox WHERE created_at < now() - interval \'1 day\';','DELETE 18234','清理 outbox。']]);
Quiz(document.getElementById('qs'),[
['双写为什么不可靠？',['太慢','数据库和 Kafka 没有共同的原子提交','Kafka 不支持事务'],1,''],
['Outbox 模式中业务行与事件行？',['分别提交','在同一个数据库事务中写入','只写事件行'],1,''],
['CDC 读取的是？',['业务表的轮询结果','数据库的复制日志','应用日志'],1,''],
['为什么消费者仍需幂等？',['CDC 是至少一次，可能重复','顺序会乱','事件会丢'],0,''],
['PostgreSQL 连接器长时间停止的风险？',['数据丢失','复制槽保留 WAL，占满磁盘','表被锁'],1,'']]);
