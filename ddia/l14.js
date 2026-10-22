const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:B('客户端','写 x=7（版本 7）'),n1:B('副本 1','x=6 v6'),n2:B('副本 2','x=6 v6'),n3:B('副本 3','宕机','bad'),r:B('读者','读 r=2'),ok:P('2 个确认 ≥ w=2 → 成功','ok'),rr:P('读修复：把 v7 写回副本 3','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'并行写',p:'客户端把写入发给全部 3 个副本。副本 3 宕机。',set:{c:[0,60],n1:[220,0],n2:[220,60],n3:[220,120]}},
 {t:'w 个确认',p:'副本 1、2 确认：达到 w=2，写入成功。',d:3200,set:{c:[0,60],n1:[220,0,B('副本 1','x=7 v7','ok')],n2:[220,60,B('副本 2','x=7 v7','ok')],n3:[220,120],ok:[0,190]}},
 {t:'恢复',p:'副本 3 恢复了，但它错过了这次写入。',d:3000,set:{n1:[220,0,B('副本 1','x=7 v7','ok')],n2:[220,60,B('副本 2','x=7 v7','ok')],n3:[220,120,B('副本 3','x=6 v6（旧）')]}},
 {t:'读 r=2',p:'读者从两个副本读取：至少有一个是新值，按版本号取 v7。',d:3400,set:{r:[420,60],n1:[220,0],n2:[220,60,B('副本 2','x=7 v7','ok')],n3:[220,120,B('副本 3','x=6 v6（旧）','bad')],ok:[0,190,P('取版本最大的：x=7','ok')]}},
 {t:'读修复',p:'读者发现副本 3 是旧值，顺便把新值写回去。',d:3200,set:{r:[420,60],n1:[220,0],n2:[220,60],n3:[220,120,B('副本 3','x=7 v7','ok')],rr:[0,190]}}]});
const e2={a:B('客户端 A 写','[A:1]'),b:B('客户端 B 写','[A:1] 之后 → [A:1,B:1]'),c:B('客户端 C 写','也基于 [A:1] → [A:2]'),x:P('[A:1] ≤ [A:1,B:1]：先后关系，可覆盖','ok'),y:P('[A:1,B:1] 与 [A:2] 互不包含：并发！','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'第一次写',p:'副本 A 处理了一次写入：版本向量 [A:1]。',set:{a:[0,0]}},
 {t:'先后',p:'B 读到 [A:1] 后写入：新向量在每个分量上都 ≥ 旧向量，可以覆盖。',d:3400,set:{a:[0,0],b:[180,0,B('客户端 B 写','[A:1,B:1]','ok')],x:[0,70]}},
 {t:'并发',p:'C 也基于 [A:1] 写入（它没看到 B 的写入）：两个向量互不包含，是并发写入，要保留为兄弟值。',d:3800,set:{a:[0,0],b:[180,0,B('客户端 B 写','[A:1,B:1]','ok')],c:[360,0,B('客户端 C 写','[A:2]','bad')],x:[0,70],y:[0,110]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [[1,1],[2,1],[2,2],[3,1],[1,3]].forEach(([w,r])=>{const b=document.createElement('button');b.className='btn';b.textContent=`w=${w} r=${r}`;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  const ok=w+r>3;p.textContent=`n=3  w=${w}  r=${r}  w+r=${w+r} ${ok?'> 3':'≤ 3'}\n容忍不可用节点：写 ${3-w} 个，读 ${3-r} 个\n${ok?'读到的副本中必有一个含最新已确认写入':'读到的副本可能全部是旧值'}`;
  m.className='msg '+(ok?'ok':'bad');m.innerHTML=ok?(w==3?'写入要求所有节点在线，任何一个节点故障都会让写失败。':r==3?'读取要求所有节点在线。':'平衡的配置。'):'可能读到旧值：只适合可以容忍过期数据的场景。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择 w 与 r（n=3）。'})();
Term(document.getElementById('t4'),[
['CONSISTENCY LOCAL_QUORUM;\nINSERT INTO sessions(id, user_id) VALUES (\'s1\', 42);','Consistency level set to LOCAL_QUORUM.','只等待本区域副本中的多数确认。'],
['CONSISTENCY ONE;\nSELECT * FROM sessions WHERE id = \'s1\';',' id | user_id\n----+---------\n s1 |      42','r=1：最快，但可能读到旧值。'],
['nodetool repair ks sessions','[…] Repair completed successfully','手动触发反熵修复：用 Merkle 树比较副本差异。']]);
Quiz(document.getElementById('qs'),[
['n=3 时，下列哪个配置满足 Quorum 条件？',['w=1 r=1','w=2 r=1','w=2 r=2'],2,'w + r > n。'],
['读修复的作用？',['读取时把旧副本更新为新值','修复磁盘','重建索引'],0,''],
['满足 w+r>n 就一定线性一致吗？',['是','否，仍有多种边界情况会读到旧值','只要用 LWW 就是'],1,''],
['两个写入“并发”是指？',['发生在同一毫秒','彼此不知道对方的存在','写入同一个节点'],1,''],
['版本向量 [A:2] 与 [A:1,B:1] 的关系？',['前者在后','后者在后','并发'],2,'互不包含。']]);
