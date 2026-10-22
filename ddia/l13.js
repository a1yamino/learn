const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=160)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('主节点 · 上海','title = "A"'),b:B('主节点 · 法兰克福','title = "A"'),u1:B('用户 1','改为 "B"'),u2:B('用户 2','改为 "C"'),x:P('异步互相复制','sig'),c:P('冲突：B 还是 C？','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'两个主节点',p:'每个区域一个主节点，区域间异步复制。',set:{a:[0,60],b:[360,60],x:[190,75]}},
 {t:'本地写入',p:'两个用户几乎同时在各自区域修改同一条记录，都立即成功。',d:3400,set:{u1:[0,0],u2:[360,0],a:[0,60,B('主节点 · 上海','title = "B"','ok')],b:[360,60,B('主节点 · 法兰克福','title = "C"','ok')],x:[190,75]}},
 {t:'复制',p:'变更异步到达对方：两个节点发现同一字段有两个并发值。',d:3400,set:{a:[0,60,B('主节点 · 上海','B ↔ C','bad')],b:[360,60,B('主节点 · 法兰克福','C ↔ B','bad')],c:[180,140]}},
 {t:'收敛',p:'必须用相同的规则解决，所有副本才会收敛到同一个值（LWW 会丢掉其中一个）。',d:3400,set:{a:[0,60,B('主节点 · 上海','title = "C"（LWW）')],b:[360,60,B('主节点 · 法兰克福','title = "C"（LWW）')],c:[180,140,P('用户 1 的修改被静默丢弃','bad')]}}]});
const C=(t,c='')=>({w:46,h:40,cls:'blk '+c,html:t});
const e2={h:C('h'),i:C('i'),x:C('!','ok'),y:C('?','sig'),n1:P('A 在 i 之后插入 “!”（标识 A:3，排在 i 后）','ok'),n2:P('B 在 i 之后插入 “?”（标识 B:3）','sig'),n3:P('按标识确定的顺序合并：两边都得到 hi!?','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'初始',p:'文档内容 "hi"，每个字符有唯一稳定的标识。',set:{h:[0,0],i:[56,0]}},
 {t:'并发插入',p:'两个用户同时在同一位置插入。',d:3400,set:{h:[0,0],i:[56,0],n1:[0,60],n2:[0,100]}},
 {t:'合并',p:'插入位置由“紧跟哪个字符”加确定的平局规则决定，与到达顺序无关。',d:3600,set:{h:[0,0],i:[56,0],x:[112,0],y:[168,0],n3:[0,60]}}]});
(()=>{const S=[['最后写入者胜（LWW）',['A 离线：删除“牛奶”（10:01）','B 离线：添加“面包”（10:02），整个清单作为一个值写入','合并：取时间戳较大的 B 的整个清单','结果：[牛奶, 鸡蛋, 面包] —— A 的删除丢失'],'bad','并发写入被静默丢弃。'],['保留兄弟值，让用户选',['合并后有两个版本：','  版本 1：[鸡蛋]','  版本 2：[牛奶, 鸡蛋, 面包]','应用提示用户手动合并'],'sig','不丢数据，但把问题交给了用户。'],['OR-Set（CRDT）',['A 删除“牛奶”的标签 t1','B 添加“面包”（标签 t3）','合并：adds − removes','结果：[鸡蛋, 面包] —— 两个修改都保留'],'ok','自动合并，所有副本收敛到同一结果。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,msg])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent='初始：[牛奶, 鸡蛋]\n'+r.join('\n');m.className='msg '+c;m.innerHTML=msg});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一种策略。'})();
Term(document.getElementById('t4'),[
['-- 两个 PostgreSQL 互相做逻辑复制（双向），同时修改同一行之后：\nSELECT subname, confl_update_origin_differs FROM pg_stat_subscription_stats;','  subname   | confl_update_origin_differs\n------------+-----------------------------\n sub_from_b |                           1','PostgreSQL 18 会统计逻辑复制中检测到的冲突；默认的处理方式是应用远端的更新（实际上是“后到者胜”）。'],
['-- 避免冲突：每个用户的数据只在其“主区域”写入\nSELECT home_region FROM users WHERE id = 42;',' home_region\n-------------\n shanghai','把写入路由到固定的主节点，就不会产生并发写冲突。']]);
Quiz(document.getElementById('qs'),[
['多主复制的典型场景？',['单机房小应用','多区域部署、离线客户端、协作编辑','只读报表'],1,''],
['LWW 的问题？',['速度慢','静默丢弃并发写入','无法收敛'],1,''],
['CRDT 的合并必须满足？',['交换律、结合律、幂等','只能合并一次','需要中心服务器'],0,''],
['OR-Set 中并发的添加与删除？',['删除胜出','添加胜出','随机'],1,''],
['避免冲突的最简单方法？',['同一记录的写入总是路由到同一个主节点','使用 LWW','关闭复制'],0,'']]);
