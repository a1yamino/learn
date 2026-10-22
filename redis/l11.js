const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={pub:B('发布者','PUBLISH news','',130),ch:B('频道 news','不存储','sig',130),s1:B('订阅者 1','在线','ok'),s2:B('订阅者 2','在线','ok'),s3:B('订阅者 3','断线','bad'),m1:P('消息送达','ok'),m2:P('消息丢失，重连后也收不到','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'发布',p:'PUBLISH 返回收到消息的订阅者数量。',set:{pub:[0,40],ch:[170,40],s1:[340,0],s2:[340,60]}},
 {t:'送达',p:'在线订阅者立即收到。',d:3200,set:{pub:[0,40],ch:[170,40],s1:[340,0],s2:[340,60],m1:[470,10]}},
 {t:'断线',p:'不在线的订阅者错过的消息不会被补发。',d:3600,set:{pub:[0,40],ch:[170,40],s1:[340,0],s2:[340,60],s3:[340,120],m2:[0,180]}}]});
const e2={st:{w:520,h:50,cls:'frame',html:'<i>orders</i> &nbsp; 1-0 | 2-0 | 3-0 | 4-0'},g:B('组 g','last_id','',120),c1:B('c1','PEL','',120),c2:B('c2','PEL','',120),r:P('XREADGROUP &gt; ：分配新消息，记入 PEL','sig'),a:P('XACK：从 PEL 移除','ok'),cl:P('c1 崩溃 → c2 XAUTOCLAIM 认领 2-0','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'追加',p:'消息按 ID 递增追加，保留在 Stream 中，可以被多个组各自读取。',set:{st:[0,0],g:[0,70,B('组 g','last_id 0','',120)]}},
 {t:'分配',p:'组内 c1 读到 1-0、2-0，c2 读到 3-0；组的 last_id 前进到 3-0。每条消息记入读到它的消费者的 PEL。',d:4200,set:{st:[0,0],g:[0,70,B('组 g','last_id 3-0','',120)],c1:[150,70,B('c1','PEL 1-0 2-0','sig',120)],c2:[290,70,B('c2','PEL 3-0','sig',120)],r:[0,140]}},
 {t:'确认',p:'c1 处理完 1-0 后 XACK；c2 确认 3-0。',d:3600,set:{st:[0,0],g:[0,70,B('组 g','last_id 3-0','',120)],c1:[150,70,B('c1','PEL 2-0','sig',120)],c2:[290,70,B('c2','PEL 空','ok',120)],a:[0,140]}},
 {t:'认领',p:'c1 在处理 2-0 时崩溃。c2 发现它空闲太久，认领后处理并确认。',d:4200,set:{st:[0,0],g:[0,70,B('组 g','last_id 3-0','',120)],c1:[150,70,B('c1','崩溃','bad',120)],c2:[290,70,B('c2','PEL 2-0','sig',120)],cl:[0,140]}}]});
(()=>{let pel={c1:[],c2:[]},n=1,dead=false;const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm'),L=[];
 const show=(t,c='sig')=>{L.push(t);p.textContent=L.slice(-5).join('\n')+'\nPEL  c1: ['+pel.c1.join(', ')+']  c2: ['+pel.c2.join(', ')+']';m.className='msg '+c;m.innerHTML=t};
 const A=[['c1 读取一条',()=>{if(dead)return show('c1 已崩溃','bad');const id=n+++'-0';pel.c1.push(id);show('c1 读到 '+id)}],
 ['c1 确认',()=>{if(dead)return show('c1 已崩溃，无法确认','bad');const id=pel.c1.shift();show(id?'c1 XACK '+id:'c1 没有待确认消息',id?'ok':'sig')}],
 ['c1 崩溃',()=>{dead=true;show('c1 崩溃，它的 PEL 中有 '+pel.c1.length+' 条消息没人处理','bad')}],
 ['c2 认领超时消息',()=>{const k=pel.c1.length;pel.c2.push(...pel.c1);pel.c1=[];show(k?'c2 XAUTOCLAIM 认领 '+k+' 条':'没有可认领的消息',k?'ok':'sig')}],
 ['c2 确认全部',()=>{const k=pel.c2.length;pel.c2=[];show('c2 XACK '+k+' 条','ok')}]];
 A.forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 show('点击“c1 读取一条”开始。')})();
Term(document.getElementById('t4'),[
['XINFO GROUPS orders','1) 1) "name" 2) "g"\n   3) "consumers" 4) (integer) 2\n   5) "pending" 6) (integer) 1\n   7) "last-delivered-id" 8) "1761104210456-0"\n   …\n   11) "lag" 12) (integer) 0','lag：组还没读的消息数，即积压。'],
['XPENDING orders g - + 10','1) 1) "1761104210123-0"\n   2) "c1"\n   3) (integer) 75231\n   4) (integer) 3','第 3 项是空闲毫秒数，第 4 项是投递次数。'],
['XINFO STREAM orders','1) "length"\n2) (integer) 3\n…','长度、首尾 ID、组数。'],
['PUBSUB NUMSUB news','1) "news"\n2) (integer) 2','频道的订阅者数量。']]);
Quiz(document.getElementById('qs'),[
['订阅者断线期间的 Pub/Sub 消息？',['重连后补发','丢失','存在 Stream'],1,''],
['XREADGROUP 读出但未 XACK 的消息在哪里？',['已删除','消费者的 PEL','死信队列'],1,''],
['消费者组提供的投递语义？',['最多一次','至少一次','恰好一次'],1,'所以处理要幂等。'],
['两个不同的组读同一个 Stream？',['平分消息','各自得到全部消息','报错'],1,''],
['Cluster 中能按分片扩展的发布订阅？',['PUBLISH','SPUBLISH','XADD'],1,'']]);
