const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:B('客户端','写入 x=5'),l:B('主节点','日志 … 41 42','sig'),f1:B('从节点 1（同步）','日志 … 41'),f2:B('从节点 2（异步）','日志 … 40'),ok:P('同步从节点确认后才返回成功','ok'),x:P('主节点故障','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'写入主节点',p:'所有写入都发给主节点，它把变更追加到复制日志（位置 42）。',set:{c:[0,60],l:[180,60],f1:[380,0],f2:[380,120]}},
 {t:'复制',p:'日志发送给从节点。同步从节点确认后，主节点才向客户端返回成功；异步从节点可以落后。',d:3600,set:{c:[0,60],l:[180,60],f1:[380,0,B('从节点 1（同步）','日志 … 41 42','ok')],f2:[380,120,B('从节点 2（异步）','日志 … 41')],ok:[0,190]}},
 {t:'故障',p:'主节点宕机。超时后判定它已死。',d:3000,set:{c:[0,60],l:[180,60,B('主节点','宕机','bad')],f1:[380,0,B('从节点 1（同步）','日志 … 41 42','ok')],f2:[380,120,B('从节点 2（异步）','日志 … 41')],x:[180,130]}},
 {t:'切换',p:'选数据最新的从节点 1 为新主；从节点 2 改为跟随它；客户端改连新主。',d:3800,set:{c:[0,60],l:[180,60,B('旧主','已隔离','bad')],f1:[380,0,B('新主节点','日志 … 41 42','sig')],f2:[380,120,B('从节点 2','从新主追赶到 42','ok')]}}]});
const e2={l:B('主节点','持续写入','sig'),s:B('一致性快照','对应 LSN 0/3000000'),n:B('新从节点','加载快照'),c:B('追赶','从 0/3000000 拉取变更'),d:B('正常从节点','实时复制','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'快照',p:'对主节点做一致性快照，不加锁，记下快照对应的日志位置。',set:{l:[0,0],s:[200,0]}},
 {t:'复制快照',p:'把快照复制到新节点。期间主节点继续接受写入。',d:3000,set:{l:[0,0],s:[200,0],n:[400,0]}},
 {t:'追赶',p:'新节点从记下的位置开始拉取之后的所有变更。',d:3000,set:{l:[0,0],s:[200,0],n:[400,0],c:[400,70]}},
 {t:'完成',p:'追上之后，它就是一个普通的从节点。',d:2800,set:{l:[0,0],d:[400,70]}}]});
(()=>{const W=['w1 下单 #1001','w2 下单 #1002','w3 下单 #1003','w4 下单 #1004'];const rep=[1,1,0.5,0];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [['w2 之后崩溃',2],['w3 之后崩溃',3],['w4 之后崩溃',4]].forEach(([t,k])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  const L=[];let lost=0;for(let i=0;i<k;i++){const ok=i<2||(i===2&&k>3);if(!ok)lost++;L.push(`${W[i]}  主节点已确认 ✓   从节点：${ok?'已复制 ✓':'未复制 ✗'}`)}
  p.textContent=L.join('\n')+'\n→ 提升从节点为新主';m.className='msg '+(lost?'bad':'ok');m.innerHTML=lost?`异步复制：${lost} 笔已向客户端确认的写入在故障切换后丢失。`:'这次运气好：所有已确认的写入都已复制。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择主节点崩溃的时刻（异步复制，从节点落后约一条写入）。'})();
Term(document.getElementById('t4'),[
['SELECT application_name, state, sent_lsn, replay_lsn, replay_lag FROM pg_stat_replication;',' application_name |   state   | sent_lsn  | replay_lsn | replay_lag\n------------------+-----------+-----------+------------+------------\n walreceiver      | streaming | 0/3000148 | 0/3000148  | 00:00:00.0004','在主节点上：每个从节点复制到了哪里。'],
['SELECT pg_is_in_recovery(), pg_last_wal_replay_lsn(), now() - pg_last_xact_replay_timestamp() AS lag;',' pg_is_in_recovery | pg_last_wal_replay_lsn |       lag\n-------------------+------------------------+-----------------\n t                 | 0/3000148              | 00:00:02.31','在从节点上：自己是否为从节点、重放到哪里、落后多久。'],
['ALTER SYSTEM SET synchronous_standby_names = \'ANY 1 (walreceiver)\';\nSELECT pg_reload_conf();','ALTER SYSTEM\n pg_reload_conf\n----------------\n t','把从节点设为同步：之后每次提交都要等它确认。']]);
Quiz(document.getElementById('qs'),[
['单主复制中写入发往？',['任意副本','主节点','所有副本'],1,''],
['同步复制的主要代价？',['可能丢数据','一个同步从节点卡住会阻塞写入','不能读从节点'],1,''],
['添加新从节点的正确方法？',['停机复制数据文件','一致性快照 + 记录日志位置 + 追赶','逐行 SELECT 复制'],1,''],
['异步复制下故障切换的风险？',['新主可能缺少旧主已确认的写入','从节点变慢','无法读取'],0,''],
['基于语句的复制有什么问题？',['日志太大','NOW()、RAND() 等不确定函数在各副本结果不同','不能跨机器'],1,'']]);
