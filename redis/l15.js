const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={k:P('SET foo bar','sig'),h:P('CRC16("foo") mod 16384 = 12182','sig'),a:B('节点 A','槽 0–5460'),b:B('节点 B','槽 5461–10922'),c:B('节点 C','槽 10923–16383'),mv:P('A：MOVED 12182 → C','bad'),ok:P('客户端更新映射，重发到 C → OK','ok')};
const N={a:[0,90],b:[170,90],c:[340,90]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'计算槽',p:'客户端或节点用 CRC16 计算键的槽。',set:{...N,k:[0,0],h:[0,40]}},
 {t:'问错节点',p:'客户端的映射过时，把请求发给了 A。A 不负责槽 12182，返回 MOVED 和正确地址。',d:4000,set:{...N,a:[0,90,B('节点 A','槽 0–5460','sig')],k:[0,0],mv:[0,150]}},
 {t:'重定向',p:'客户端更新“槽 → 节点”缓存并重发给 C。之后对这个槽的请求直接发往 C。',d:3800,set:{...N,c:[340,90,B('节点 C','槽 10923–16383','ok')],k:[0,0],ok:[0,150]}}]});
const crc=s=>{let c=0;for(const ch of new TextEncoder().encode(s)){c^=ch<<8;for(let i=0;i<8;i++)c=c&0x8000?((c<<1)^0x1021)&0xffff:(c<<1)&0xffff}return c};
const tag=k=>{const a=k.indexOf('{');if(a<0)return k;const b=k.indexOf('}',a+1);if(b<0||b===a+1)return k;return k.slice(a+1,b)};
const slot=k=>crc(tag(k))%16384,node=s=>s<=5460?'A':s<=10922?'B':'C';
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm'),k1=document.getElementById('hk'),k2=document.getElementById('hk2');
 const run=()=>{const a=k1.value,b=k2.value,s1=slot(a),s2=slot(b);p.textContent=`${a}\n  参与计算：${tag(a)}  →  槽 ${s1}  →  节点 ${node(s1)}\n${b}\n  参与计算：${tag(b)}  →  槽 ${s2}  →  节点 ${node(s2)}`;const same=s1===s2;m.className='msg '+(same?'ok':'bad');m.innerHTML=same?'同一个槽：MGET、事务、Lua 可以同时操作这两个键。':'不同的槽：MSET/MGET 两个键会报 CROSSSLOT。'};
 [['计算',()=>run()],['示例：哈希标签',()=>{k1.value='cart:{u42}';k2.value='cart_ver:{u42}';run()}],['示例：无标签',()=>{k1.value='cart:u42';k2.value='cart_ver:u42';run()}],['示例：空标签 {}',()=>{k1.value='a{}x';k2.value='a{}y';run()}]].forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 k1.addEventListener('input',run);k2.addEventListener('input',run);run()})();
const e2={a:B('A','槽 100：MIGRATING'),d:B('D（新）','槽 100：IMPORTING'),ks:P('MIGRATE 一批键 A → D','sig'),q1:P('GET x（还在 A）→ A 直接返回','ok'),q2:P('GET y（已搬走）→ ASK 100 D → ASKING + GET y 发到 D','sig'),dn:P('全部搬完：CLUSTER SETSLOT 100 NODE D，之后返回 MOVED','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'标记',p:'reshard 工具先在 D 上设置 IMPORTING、在 A 上设置 MIGRATING。',set:{a:[0,0],d:[300,0]}},
 {t:'搬键',p:'用 MIGRATE 分批把键从 A 原子地移到 D。',d:3400,set:{a:[0,0],d:[300,0],ks:[0,60]}},
 {t:'ASK',p:'迁移期间：键还在 A 就由 A 处理；已经搬走的键 A 返回 ASK，客户端只对这一次请求转向 D，先发送 ASKING。',d:4600,set:{a:[0,0],d:[300,0],q1:[0,60],q2:[0,100]}},
 {t:'完成',p:'槽归属改为 D 并通过 gossip 传播。',d:3600,set:{a:[0,0,B('A','')],d:[300,0,B('D','槽 100','ok')],dn:[0,60]}}]});
Term(document.getElementById('t4'),[
['CLUSTER INFO','cluster_state:ok\ncluster_slots_assigned:16384\ncluster_slots_ok:16384\ncluster_known_nodes:6\ncluster_size:3\n…','集群整体状态。'],
['CLUSTER SHARDS','1) 1) "slots"\n   2) 1) (integer) 0\n      2) (integer) 5460\n   3) "nodes"\n   …','客户端用来构建槽映射（取代旧的 CLUSTER SLOTS）。'],
['CLUSTER COUNTKEYSINSLOT 12182','(integer) 1','某个槽里有多少键。'],
['redis-cli --cluster check 127.0.0.1:7001','[OK] All nodes agree about slots configuration.\n[OK] All 16384 slots covered.','检查一致性。'],
['redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7001\nredis-cli --cluster rebalance 127.0.0.1:7001 --cluster-use-empty-masters','[OK] New node added correctly.\n>>> Rebalancing across 4 nodes…','加节点并重新平衡槽。']]);
Quiz(document.getElementById('qs'),[
['Redis Cluster 有多少个槽？',['1024','16384','65536'],1,''],
['user:{42}:a 和 user:{42}:b？',['同一个槽','不同槽','取决于节点数'],0,''],
['收到 MOVED 后客户端应？',['只重发这一次','更新槽映射并重发','报错'],1,''],
['ASK 和 MOVED 的区别？',['ASK 只针对这一次请求，不更新映射','没有区别','ASK 表示节点宕机'],0,''],
['Cluster 的故障切换需要 Sentinel 吗？',['需要','不需要，节点间自行投票','只在扩容时需要'],1,'']]);
