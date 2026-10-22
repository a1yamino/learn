const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:B('客户端','get k'),n1:B('节点 1','分片 0–3'),n2:B('节点 2','分片 4–7'),n3:B('节点 3','分片 8–11'),r:B('路由层','知道映射','sig'),z:B('协调服务','分片 → 节点','sig',130),x:P('','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'① 任意节点转发',p:'客户端连任意节点；节点不负责该键时转发或返回重定向。',set:{c:[0,60],n1:[200,0,B('节点 1','不是我 → 节点 3','sig')],n2:[200,60],n3:[200,120,B('节点 3','分片 8–11','ok')]}},
 {t:'② 路由层',p:'所有请求先到一个分片感知的路由层。',d:3400,set:{c:[0,60],r:[160,60],n1:[330,0],n2:[330,60],n3:[330,120,B('节点 3','分片 8–11','ok')]}},
 {t:'③ 智能客户端',p:'客户端自己缓存映射，直接连到正确的节点。',d:3400,set:{c:[0,60,B('客户端','缓存映射','sig')],n1:[200,0],n2:[200,60],n3:[200,120,B('节点 3','分片 8–11','ok')]}},
 {t:'映射从哪来',p:'映射表保存在协调服务中，节点和路由层订阅它的变化。',d:3400,set:{z:[380,60],r:[160,60],n1:[0,0],n2:[0,60],n3:[0,120]}}]});
const e2={p0:{w:180,h:90,cls:'frame',html:'<i>分片 0</i><br>车 191 红、306 白<br>本地索引：红→191'},p1:{w:180,h:90,cls:'frame',html:'<i>分片 1</i><br>车 515 红、768 蓝<br>本地索引：红→515'},q:P('WHERE color=红 → 发给所有分片','bad'),g:{w:200,h:70,cls:'frame',html:'<i>全局索引分片（红…）</i><br>红 → 191, 515'},q2:P('只读一个索引分片；写入要异步更新索引','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'本地索引',p:'每个分片只索引自己的数据。',set:{p0:[0,0],p1:[200,0]}},
 {t:'分散—聚集',p:'按颜色查询必须问遍所有分片。',d:3200,set:{p0:[0,0],p1:[200,0],q:[0,110]}},
 {t:'全局索引',p:'索引按值分片：所有“红”的条目在同一个索引分片。',d:3400,set:{p0:[0,0],p1:[200,0],g:[0,110],q2:[0,190]}}]});
(()=>{const S=[['本地索引 · 按分片键查',1,'ok'],['本地索引 · 按二级键查',64,'bad'],['全局索引 · 按二级键查',1,'ok'],['全局索引 · 写入一行（3 个索引）',4,'sig']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,n,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=`64 个分片\n访问分片数：${n}`+(n===64?'\n延迟 = 64 个响应中最慢的那个':'')+(c==='sig'?'\n数据分片 1 个 + 索引分片最多 3 个（通常异步）':'');m.className='msg '+c;m.innerHTML=c==='bad'?'分散—聚集：尾延迟放大。':c==='sig'?'写入变复杂：全局索引一般异步更新。':'只访问一个分片。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一种情况。'})();
Term(document.getElementById('t4'),[
['redis-cli -p 7000 GET user:1001','(error) MOVED 5712 127.0.0.1:7001','槽 5712 不在这个节点：服务端告诉客户端去哪里。智能客户端据此更新本地映射。'],
['redis-cli -c -p 7000 GET user:1001','-> Redirected to slot [5712] located at 127.0.0.1:7001\n"..."','-c 让 redis-cli 自动跟随重定向。']]);
Quiz(document.getElementById('qs'),[
['全自动再平衡的风险？',['太慢','与故障检测结合可能引发级联故障','数据丢失'],1,''],
['分片映射表通常保存在？',['每个客户端的配置文件','协调服务（ZooKeeper/etcd）或通过 gossip 传播','DNS'],1,''],
['本地二级索引按二级键查询需要？',['只访问一个分片','访问所有分片（分散—聚集）','访问协调服务'],1,''],
['全局二级索引的典型缺点？',['读要访问所有分片','写入涉及多个分片，通常异步更新','不能分片'],1,''],
['Redis Cluster 返回 MOVED 属于哪种路由？',['任意节点 + 重定向','路由层','协调服务'],0,'']]);
