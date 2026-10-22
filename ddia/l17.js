const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('账户 1','100'),b:B('账户 2','0'),s1:P('① 账户 2 +50','sig'),s2:P('② 账户 1 −50','sig'),x:P('② 之前崩溃','bad'),r:P('ROLLBACK：撤销 ①','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'开始',p:'转账 50：两步写入组成一个事务。',set:{a:[0,0],b:[200,0]}},
 {t:'第一步',p:'账户 2 增加 50。',d:3000,set:{a:[0,0],b:[200,0,B('账户 2','50（未提交）','sig')],s1:[0,70]}},
 {t:'故障',p:'执行第二步之前进程崩溃。',d:3000,set:{a:[0,0],b:[200,0,B('账户 2','50（未提交）','sig')],s1:[0,70],x:[0,110]}},
 {t:'中止',p:'事务没有提交，数据库撤销已执行的写入：结果与什么都没发生一样，可以放心重试。',d:3600,set:{a:[0,0,B('账户 1','100','ok')],b:[200,0,B('账户 2','0','ok')],r:[0,70]}}]});
const e2={m:B('emails 表','插入新邮件','sig'),c:B('unread 计数','+1'),u:B('用户界面','列表 3 封未读，计数显示 2','bad',220),ok:P('同一事务中：另一个用户要么看到两者都更新，要么都没更新','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'两个对象',p:'新邮件和未读计数（反规范化的派生值）必须一起更新。',set:{m:[0,0],c:[200,0]}},
 {t:'没有隔离',p:'另一个请求在两次写入之间读取：看到了新邮件，计数却还是旧的。',d:3400,set:{m:[0,0,B('emails 表','已插入','ok')],c:[200,0],u:[0,80]}},
 {t:'事务',p:'把两次写入放进一个事务，中间状态对其他事务不可见。',d:3400,set:{m:[0,0,B('emails 表','已插入','ok')],c:[200,0,B('unread 计数','+1','ok')],ok:[0,80]}}]});
(()=>{const S=[['第 1 步之前',['有事务：什么都没发生 ✓','无事务：什么都没发生 ✓'],'ok'],['第 1 步之后、第 2 步之前',['有事务：自动回滚，余额 100 / 0 ✓','无事务：余额 100 / 50，凭空多出 50 ✗'],'bad'],['第 2 步之后、COMMIT 之前',['有事务：回滚，余额 100 / 0 ✓','无事务：余额 50 / 50 ✓（碰巧完整）'],'sig'],['COMMIT 已执行、确认未收到',['有事务：已提交，余额 50 / 50；客户端不知道 → 重试会再转一次 ✗（需要幂等）','无事务：同上'],'bad']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent='转账 50：① 账户 2 +50 ② 账户 1 −50\n'+r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'两种方式结果相同。':c==='bad'?'这里会出问题。':'事务保证了无论在哪里崩溃，结果都是完整的。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择崩溃的位置。'})();
Term(document.getElementById('t4'),[
['BEGIN; … COMMIT;','BEGIN\n…\nCOMMIT','显式事务。psql 默认每条语句单独自动提交。'],
['SHOW synchronous_commit;',' synchronous_commit\n--------------------\n on','on：提交时等待 WAL 刷盘（持久）。设为 off 可提速，但崩溃时可能丢失最近几百毫秒已“提交”的事务。'],
['SELECT * FROM acct WHERE id = 1 FOR UPDATE;',' id | balance\n----+---------\n  1 |      71','在事务中锁住这一行，防止并发修改（第 18 课）。']]);
Quiz(document.getElementById('qs'),[
['ACID 中的原子性更准确地说是？',['并发控制','可中止性：出错时撤销全部写入','数据不会丢'],1,''],
['ACID 中的一致性主要由谁负责？',['数据库','应用（定义并维护不变式）','操作系统'],1,''],
['经典意义上的隔离性是指？',['可串行化','读已提交','快照'],0,''],
['事务提交成功但确认丢失，客户端重试会怎样？',['什么都不会发生','可能重复执行，需要幂等','数据库自动去重'],1,''],
['下列哪种错误不应该重试？',['序列化失败','死锁','违反唯一约束'],2,'']]);
