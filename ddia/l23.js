const P=(t,c='sig')=>({cls:'pill '+c,html:t});const L=(t,c='',w=200)=>({w,h:34,cls:'blk '+c,html:t});
const e={ax:L('A：写 x = 1 ━━━━━━━━━━━━━━━','sig',380),b:L('B：读 → 1','ok',120),c:L('C：读 → 0','bad',120),c2:L('C：读 → 1','ok',120),pt:P('线性化点：写入在此刻生效','sig'),n:P('B 已经读到 1，之后开始的 C 不能再读到 0','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'写入进行中',p:'A 发起写入，在它返回之前，写入可能在任何时刻生效。',set:{ax:[0,0]}},
 {t:'有人读到新值',p:'B 的读返回 1：写入已经在某个时刻生效了。',d:3200,set:{ax:[0,0],b:[60,60],pt:[0,110]}},
 {t:'违反',p:'在 B 之后开始的 C 读到旧值 0：时间倒流，违反线性一致性（即使 A 的写入还没返回）。',d:3600,set:{ax:[0,0],b:[60,60],c:[200,60],n:[0,110]}},
 {t:'正确',p:'线性一致的系统中，C 必须读到 1。',d:3000,set:{ax:[0,0],b:[60,60],c2:[200,60]}}]});
const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e2={w:B('Web 服务器','上传新图片'),s1:B('存储主节点','新图片 ✓','ok'),s2:B('存储从节点','旧图片（复制中）'),mq:B('消息队列','“生成缩略图”'),r:B('缩略图服务','从从节点读'),x:P('读到旧图片：缩略图与原图不一致','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'写入',p:'Web 服务器把图片写入存储。',set:{w:[0,60],s1:[200,0],s2:[400,0]}},
 {t:'通知',p:'同时通过消息队列通知缩略图服务。',d:3000,set:{w:[0,60],s1:[200,0],s2:[400,0],mq:[200,120]}},
 {t:'竞争',p:'消息比存储复制先到：缩略图服务从落后的副本读到了旧图片。两条通道之间的竞争需要线性一致的存储来消除。',d:3800,set:{w:[0,60],s1:[200,0],s2:[400,0,B('存储从节点','旧图片','bad')],mq:[200,120],r:[400,120],x:[200,190]}}]});
(()=>{const H=[['A 写 1 [0–10]，B 读 1 [5–6]，C 读 1 [7–8]','可线性化：A:w(1) → B:r(1) → C:r(1)','ok'],['A 写 1 [0–10]，B 读 1 [2–3]，C 读 0 [4–5]','不可线性化：B 读到 1 后，写入已生效；C 在 B 结束后开始，却读到 0','bad'],['A 写 1 [0–10]，B 读 1 [2–3]，C 读 0 [1–2]','可线性化：C:r(0) → A:w(1) → B:r(1)（C 与 B 重叠，可以排在写入之前）','ok'],['A 写 1 [0–2]，B 读 0 [3–4]','不可线性化：写入已经完成，之后的读必须看到它','bad']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 H.forEach(([t,r,c],i)=>{const b=document.createElement('button');b.className='btn';b.textContent='历史 '+(i+1);b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=t.replace(/，/g,'\n')+'\n\n'+r;m.className='msg '+c;m.innerHTML=c==='ok'?'存在一个与实时顺序相容、且每次读都读到最近写入的顺序。':'找不到合法的顺序。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一段历史（方括号内是开始–结束时间）。寄存器初始为 0。'})();
Term(document.getElementById('t4'),[
['etcdctl put /leader node-1 && etcdctl get /leader','OK\n/leader\nnode-1','etcd 的写入与默认读取都是线性一致的（经过 Raft 多数确认）。'],
['etcdctl get /leader --consistency=s','/leader\nnode-1','可串行化读（s）：直接读本地副本，更快，但可能是旧值。'],
['INSERT INTO users(name) VALUES (\'lin\');  -- name 上有唯一索引','ERROR:  duplicate key value violates unique constraint "users_name_key"','单主数据库上的唯一约束：一种线性一致的检查。']]);
Quiz(document.getElementById('qs'),[
['线性一致性保证的是？',['事务的串行等价','单对象读写的新近性：像只有一个副本','最终收敛'],1,''],
['可串行化与线性一致性？',['同一个概念','前者关于事务，后者关于单对象的实时顺序','后者包含前者'],1,''],
['哪种复制方式不是线性一致的？',['共识算法','多主复制','从主节点读的单主复制'],1,''],
['CAP 定理说明？',['三个属性选两个','网络分区时在线性一致与可用之间选择','分区可以避免'],1,''],
['很多系统放弃线性一致性的主要原因？',['性能（延迟）','代码复杂','许可证'],0,'']]);
