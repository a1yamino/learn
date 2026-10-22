const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={n1:B('节点 1','主 · 任期 2','sig'),n2:B('节点 2','从 · 任期 2'),n3:B('节点 3','从 · 任期 2'),c:P('写入 x=5 → 日志第 8 条','sig'),m:P('2/3 已持久化 → 已提交','ok'),v:P('节点 2 超时 → 任期 3，请求投票','sig'),w:P('获得 2 票（多数）→ 新主','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'追加',p:'主节点把请求追加到自己的日志，并发送给从节点。',set:{n1:[0,0],n2:[200,0],n3:[400,0],c:[0,70]}},
 {t:'多数提交',p:'包括主节点在内有 2 个节点持久化了第 8 条：达到多数，已提交，可以应用并返回成功。',d:3600,set:{n1:[0,0,B('节点 1','主 · 日志 8','sig')],n2:[200,0,B('节点 2','日志 8','ok')],n3:[400,0,B('节点 3','日志 7（慢）')],m:[0,70]}},
 {t:'主节点故障',p:'节点 1 宕机。节点 2 一段时间没收到心跳，任期加一，成为候选人。',d:3400,set:{n1:[0,0,B('节点 1','宕机','bad')],n2:[200,0,B('节点 2','候选人 · 任期 3','sig')],n3:[400,0],v:[0,70]}},
 {t:'当选',p:'节点 3 的日志不比节点 2 新，投赞成票。节点 2 获得多数，成为任期 3 的主节点；已提交的第 8 条不会丢失。',d:3800,set:{n1:[0,0,B('节点 1','宕机','bad')],n2:[200,0,B('节点 2','主 · 任期 3','sig')],n3:[400,0,B('节点 3','从 · 追上日志 8','ok')],w:[0,70]}}]});
const e2={a1:B('A：写 x','(1,A)'),a2:B('A：发送 m','(2,A)'),b1:B('B：本地事件 ×3','(1..3,B)'),b2:B('B：收到 m','max(3,2)+1 = (4,B)','ok'),n:P('因果：(2,A) < (4,B) ✓；但 (1,A) 与 (1,C) 是并发的，Lamport 时间戳看不出来','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'各自计数',p:'每个节点每发生一个事件，计数加一。',set:{a1:[0,0],b1:[220,0]}},
 {t:'带上计数',p:'A 发送消息时附带自己的计数 2。',d:3000,set:{a1:[0,0],a2:[0,70],b1:[220,0]}},
 {t:'追上',p:'B 收到消息，把计数更新为 max(本地, 收到) + 1。',d:3200,set:{a1:[0,0],a2:[0,70],b1:[220,0],b2:[220,70]}},
 {t:'全序',p:'按 (计数, 节点) 排序得到全序，与因果一致。',d:3400,set:{a1:[0,0],a2:[0,70],b1:[220,0],b2:[220,70],n:[0,140]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [[3,1],[3,2],[5,2],[5,3],[4,2]].forEach(([n,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=`${n} 个节点，${f} 个故障`;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  const maj=Math.floor(n/2)+1,alive=n-f,ok=alive>=maj;p.textContent=`多数 = ${maj}\n存活 = ${alive}\n最多可容忍故障：${n-maj} 个`;
  m.className='msg '+(ok?'ok':'bad');m.innerHTML=ok?'存活节点构成多数：可以选主、提交写入。':(n%2===0?'不可用。注意 4 个节点和 3 个节点一样只能容忍 1 个故障：集群大小通常取奇数。':'不可用：少数派无法选主，也无法提交（这是为了安全：避免脑裂）。')});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择集群大小与故障数。'})();
Term(document.getElementById('t4'),[
['etcdctl lock /locks/job -- sh -c \'echo 我持有锁; sleep 5\'','我持有锁','基于租约的锁；另一个终端同时执行会等待。'],
['etcdctl watch /config/mode','PUT\n/config/mode\ngreen','变更通知：其他客户端修改时立即收到。'],
['etcdctl get /config/mode -w json','{"header":{…,"revision":5,"raft_term":3},"kvs":[{"key":"…","create_revision":2,"mod_revision":5,"version":3,…}]}','全局单调递增的 revision 给所有修改排了全序，可用作 fencing 令牌。']]);
Quiz(document.getElementById('qs'),[
['Lamport 时间戳能做到？',['判断两个事件是否并发','给出与因果一致的全序','保证唯一性约束'],1,''],
['为什么逻辑时钟不足以实现用户名唯一？',['时间戳会重复','节点处理请求时无法知道是否有更小时间戳的并发请求','太慢'],1,''],
['Raft 中条目何时算已提交？',['写入主节点日志时','被多数节点持久化时','被所有节点持久化时'],1,''],
['5 个节点的 Raft 集群最多容忍几个故障？',['1','2','3'],1,''],
['协调服务（etcd）通常不适合？',['选主','存放大量业务数据','服务发现'],1,'']]);
