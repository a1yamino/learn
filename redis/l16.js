const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={app:B('应用','',''),rc:B('Redis','缓存'),db:B('数据库',''),s1:P('① GET → (nil)','sig'),s2:P('② SELECT …','sig'),s3:P('③ SET key v EX 600','ok'),s4:P('GET → 命中，直接返回','ok'),w1:P('① UPDATE …','sig'),w2:P('② DEL key','sig'),w3:P('下次读取未命中，重新加载新值','ok')};
const N={app:[0,60],rc:[200,0],db:[200,120]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'未命中',p:'先查缓存，没有。',set:{...N,s1:[350,10]}},
 {t:'回源',p:'查数据库得到结果。',d:3000,set:{...N,s1:[350,10],s2:[350,130]}},
 {t:'填充',p:'写回缓存并设置 TTL，然后返回。',d:3200,set:{...N,s1:[350,10],s2:[350,130],s3:[350,50]}},
 {t:'命中',p:'之后的读取直接从缓存返回。',d:3000,set:{...N,rc:[200,0,B('Redis','有值','ok')],s4:[350,10]}},
 {t:'写',p:'更新数据库，然后删除缓存（而不是更新缓存）。',d:3600,set:{...N,w1:[350,130],w2:[350,10]}},
 {t:'重新加载',p:'下一次读取按未命中流程加载新值。',d:3200,set:{...N,rc:[200,0,B('Redis','已删除','sig')],w3:[350,10]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [0,50,80,90,95,99].forEach(h=>{const b=document.createElement('button');b.className='btn';b.textContent=h+'%';b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const r=h/100,lat=r*0.5+(1-r)*20.5,db=Math.round(20000*(1-r));p.textContent=`命中率 ${h}%\n平均延迟 ≈ ${lat.toFixed(2)} ms\n回源到数据库：${db} QPS（上限 3000）`;const ok=db<=3000;m.className='msg '+(ok?'ok':'bad');m.innerHTML=ok?'数据库可以承受。':'数据库会被压垮：命中率要至少 85%。缓存失效或冷启动时同样会出现这种情况。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择命中率。'})();
const e2={h:P('模式 | 读未命中由谁回源 | 写入时','sig'),a:B('Cache-Aside','应用回源；写库后删缓存','',460),b:B('Read-Through','缓存层回源','',460),c:B('Write-Through','同步写缓存和数据库','',460),d:B('Write-Behind','先写缓存，异步批量写库','sig',460)};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'Cache-Aside',p:'最常用：应用控制一切，缓存故障可以降级读数据库。',set:{h:[0,0],a:[0,40,B('Cache-Aside','应用回源；写库后删缓存','ok',460)]}},
 {t:'Read/Write-Through',p:'应用只访问缓存层，由它负责回源和同步写入；代码简单，但需要一个具备这种能力的缓存层。',d:4000,set:{h:[0,0],a:[0,40],b:[0,94],c:[0,148]}},
 {t:'Write-Behind',p:'写入只到缓存，后台合并后写数据库：写吞吐高，但缓存宕机会丢失尚未写回的数据。',d:4000,set:{h:[0,0],a:[0,40],b:[0,94],c:[0,148],d:[0,202]}}]});
Term(document.getElementById('t4'),[
['SET k v EX 600 NX','OK','只在不存在时写入，常用于防止覆盖。'],
['GETEX k EX 600','"v"','读取同时刷新过期时间（滑动过期）。'],
['MGET shop:product:1 shop:product:2','1) "{…}"\n2) (nil)','批量读，减少往返。'],
['OBJECT FREQ shop:product:1001:v1','(integer) 5','LFU 策略下查看访问频率。'],
['CLIENT TRACKING on BCAST PREFIX shop:product:','OK','（RESP3）这些前缀的键变化时通知客户端，使本地缓存失效。']]);
Quiz(document.getElementById('qs'),[
['Cache-Aside 写数据时推荐？',['更新缓存再更新库','更新库再删除缓存','只更新缓存'],1,''],
['命中率从 90% 到 99%，回源请求？',['减少 9%','减少到 1/10','不变'],1,''],
['为什么每个缓存键都要设 TTL？',['提高命中率','一致性兜底和回收内存','Redis 要求'],1,''],
['Write-Behind 的风险？',['读延迟高','缓存故障丢失未写回的数据','不能批量'],1,''],
['缓存实例推荐的淘汰策略？',['noeviction','allkeys-lru 或 allkeys-lfu','volatile-ttl'],1,'']]);
