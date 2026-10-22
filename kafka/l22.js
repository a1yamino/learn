const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={e1:B('Opened','+100'),e2:B('Withdrawn','−50'),e3:B('Deposited','+20'),st:B('余额','0','sig',120)};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'空状态',p:'状态从初始值开始。',set:{e1:[0,0],e2:[170,0],e3:[340,0],st:[170,110]}},
 {t:'Opened',p:'应用第一个事件。',d:3000,set:{e1:[0,0,B('Opened','+100','ok')],e2:[170,0],e3:[340,0],st:[170,110,B('余额','100','sig',120)]}},
 {t:'Withdrawn',p:'应用第二个事件。',d:3000,set:{e1:[0,0,B('Opened','+100','ok')],e2:[170,0,B('Withdrawn','−50','ok')],e3:[340,0],st:[170,110,B('余额','50','sig',120)]}},
 {t:'Deposited',p:'状态 = fold(事件)。',d:3000,set:{e1:[0,0,B('Opened','+100','ok')],e2:[170,0,B('Withdrawn','−50','ok')],e3:[340,0,B('Deposited','+20','ok')],st:[170,110,B('余额','70','sig',120)]}}]});
const e2={c:B('命令','Withdraw(A1, 50)'),w:B('写端','校验余额'),k:B('account-events','key = 账户','ok',170),r1:B('余额视图','Redis'),r2:B('对账单','PostgreSQL'),r3:B('风控','窗口聚合')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'命令',p:'命令请求做某事，可能被拒绝。',set:{c:[0,0],w:[0,80]}},
 {t:'事件',p:'校验通过，写端产生事件：已经发生的事实。',d:3200,set:{c:[0,0],w:[0,80],k:[200,80]}},
 {t:'多个读模型',p:'每个读模型是一个消费者组，各自优化查询，最终一致。',d:3600,set:{c:[0,0],w:[0,80],k:[200,80],r1:[400,0],r2:[400,80],r3:[400,160]}}]});
(()=>{const ev=[['Opened',100],['Withdrawn',-50],['Deposited',20],['Withdrawn',-30],['Deposited',15]];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 for(let i=0;i<=ev.length;i++){const b=document.createElement('button');b.className='btn';b.textContent='offset '+(i-1<0?'—':i-1);b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));let s=0;const L=[];ev.slice(0,i).forEach(([t,a],j)=>{s+=a;L.push(`${j}  ${t.padEnd(10)} ${a>0?'+':''}${a}   → ${s}`)});p.textContent=L.join('\n')||'（尚未应用事件）';m.className='msg ok';m.innerHTML='该时刻余额：<b>'+s+'</b>。'});q.appendChild(b)}
 m.className='msg';m.innerHTML='选择重放到的位置。'})();
Term(document.getElementById('t4'),[
['bin/kafka-configs.sh --bootstrap-server localhost:9092 --alter --entity-type topics --entity-name account-events --add-config retention.ms=-1','Completed updating config for topic account-events.','事件永久保留。'],
['bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group balance-view --topic account-events --reset-offsets --to-datetime 2026-10-01T00:00:00.000 --execute','GROUP         TOPIC          PARTITION  NEW-OFFSET\nbalance-view  account-events 0          1834','把读模型重放到某个时间点之后（需先清空视图）。'],
['bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic account-snapshots','… Configs: cleanup.policy=compact','快照主题：每个 key 只保留最新快照。']]);
Quiz(document.getElementById('qs'),[
['事件溯源中当前状态是？',['单独存储的事实来源','事件按顺序 fold 的结果','最新的一条事件'],1,''],
['同一聚合的事件有序依赖？',['相同的 key → 同一分区','单分区主题','时间戳'],0,''],
['Kafka 作为事件存储的局限？',['不能永久保留','不能按 key 高效读取单个聚合','不能重放'],1,''],
['新增一个读模型如何获得历史？',['新建消费者组从最早位置重放','从数据库导出','不可能'],0,''],
['发现历史事件写错了？',['修改原消息','追加补偿事件','删除主题'],1,'']]);
