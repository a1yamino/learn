const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=480)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('固定窗口','INCR rl:u:15:30 → 计数 ≤ 100','',480),a2:P('边界问题：15:30:59 来 100 次、15:31:00 又 100 次 → 1 秒内 200 次','bad'),b:B('滑动窗口日志','ZSET 记录每个请求的时间，删除 60 秒前的再计数','',480),b2:P('精确，但每个请求一个成员','sig'),c:B('令牌桶','tokens 按时间补充，请求消耗 1 个','',480),c2:P('允许短时突发（桶容量），平均速率受限','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'固定窗口',p:'每个时间窗口一个计数键。',set:{a:[0,0],a2:[0,52]}},
 {t:'滑动窗口',p:'窗口随每个请求滑动，没有边界突发。',d:3600,set:{a:[0,0],a2:[0,52],b:[0,96],b2:[0,148]}},
 {t:'令牌桶',p:'在 Lua 中根据经过的时间补充令牌并扣减。',d:3600,set:{a:[0,0],a2:[0,52],b:[0,96],b2:[0,148],c:[0,192],c2:[0,244]}}]});
(()=>{let tk=5,ts=performance.now();const L=[];const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const refill=()=>{const now=performance.now();tk=Math.min(5,tk+(now-ts)/1000);ts=now};
 const show=()=>{refill();p.textContent='令牌：'+'●'.repeat(Math.floor(tk))+'○'.repeat(5-Math.floor(tk))+'  ('+tk.toFixed(2)+')\n'+L.slice(-4).join('\n')};
 [['请求',()=>{refill();const ok=tk>=1;if(ok)tk-=1;L.push((ok?'允许':'拒绝（429）')+'，剩余 '+tk.toFixed(2));show();m.className='msg '+(ok?'ok':'bad');m.innerHTML=ok?'消耗一个令牌。':'令牌不足。'}],['连发 8 个',()=>{let a=0;for(let i=0;i<8;i++){refill();if(tk>=1){tk-=1;a++}}L.push('连发 8 个：允许 '+a+'，拒绝 '+(8-a));show();m.className='msg sig';m.innerHTML='突发最多到桶的容量。'}],['刷新',()=>{show();m.className='msg';m.innerHTML='每秒恢复 1 个。'}]].forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 show();m.className='msg';m.innerHTML='点击“请求”。'})();
const row=(n,s,r,c='')=>({w:300,h:36,cls:'blk '+c,html:`${r}. ${n} &nbsp; <span style="opacity:.7">${s}</span>`});
const e2={r1:row('bob',300,1),r2:row('carol',200,2),r3:row('alice',120,3),op:P('','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'排序',p:'有序集合按分数排序，ZREVRANGE 0 2 取前三。',set:{r1:[0,0],r2:[0,44],r3:[0,88]}},
 {t:'加分',p:'ZINCRBY rank 200 alice：alice 变为 320，跳表中重新定位，O(log N)。',d:3800,set:{r3:[0,0,row('alice',320,1,'ok')],r1:[0,44,row('bob',300,2)],r2:[0,88,row('carol',200,3)],op:[320,0,P('ZINCRBY rank 200 alice','sig')]}},
 {t:'名次',p:'ZREVRANK rank carol → 2（从 0 开始），显示为第 3 名。',d:3400,set:{r3:[0,0,row('alice',320,1)],r1:[0,44,row('bob',300,2)],r2:[0,88,row('carol',200,3,'sig')],op:[320,88,P('ZREVRANK → 2','sig')]}}]});
Term(document.getElementById('t4'),[
['ZREVRANGE rank:week 0 9 WITHSCORES','1) "bob"\n2) "300"\n…','前 10 名。'],
['ZRANGE rank:week +inf -inf BYSCORE REV LIMIT 10 10','…','按分数倒序分页：第 11–20 名。'],
['ZSCORE rank:week alice','"120"','查分数。'],
['ZCOUNT rank:week (200 +inf','(integer) 1','分数高于 200 的人数（分片榜求名次时用）。'],
['ZREMRANGEBYRANK rank:week 0 -10001','(integer) 0','只保留分数最高的 10000 名。']]);
Quiz(document.getElementById('qs'),[
['固定窗口的问题？',['内存大','窗口边界附近可能通过两倍流量','不能用 INCR'],1,''],
['令牌桶为什么要用 Lua？',['读、计算、写必须原子','更快','Lua 才有 TIME'],0,''],
['ZREVRANK 返回 0 表示？',['不存在','第一名','最后一名'],1,''],
['同分先到达者在前的做法？',['把时间编码进分数','用 LIST','依赖插入顺序'],0,''],
['极高频计数减少写入的方法？',['应用内聚合后 INCRBY','每次 SET','用 HLL'],0,'']]);
