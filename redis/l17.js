const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=250)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('先更新缓存，再更新数据库','缓存写成功、数据库失败 → 缓存是不存在的值','bad'),b:B('先更新数据库，再更新缓存','并发写顺序颠倒 → 缓存永久是旧值','bad'),c:B('先删缓存，再更新数据库','删后到提交前被读请求回填旧值','sig'),d:B('先更新数据库，再删缓存','罕见竞态 + 删除失败 → 需重试/延迟双删','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'更新缓存',p:'更新缓存的两种顺序都可能让缓存长期保持错误的值。',set:{a:[0,0],b:[270,0]}},
 {t:'删除缓存',p:'删除缓存后由下一次读取重新加载。先删缓存的窗口是整个数据库事务；先更新数据库的窗口小得多。',d:4600,set:{a:[0,0],b:[270,0],c:[0,70],d:[270,70]}}]});
(()=>{const S={'先删缓存 → 更新数据库':[['W','DEL cache'],['R','GET cache → 未命中'],['R','读数据库 → v1（W 还没提交）'],['W','UPDATE db = v2，提交'],['R','SET cache = v1'],['=','数据库 v2，缓存 v1，直到 TTL 过期','bad']],
'更新数据库 → 删缓存':[['R','GET cache → 未命中'],['R','读数据库 → v1'],['W','UPDATE db = v2，提交'],['W','DEL cache'],['R','SET cache = v1（R 被拖慢了）'],['=','不一致，但需要 R 的“读库+写缓存”跨过整个写操作，罕见','sig']],
'更新数据库 → 删缓存（常见情况）':[['W','UPDATE db = v2，提交'],['W','DEL cache'],['R','GET cache → 未命中'],['R','读数据库 → v2'],['R','SET cache = v2'],['=','一致','ok']],
'延迟双删':[['R','GET cache → 未命中'],['R','读数据库 → v1'],['W','UPDATE db = v2，提交'],['W','DEL cache'],['R','SET cache = v1'],['W','500 ms 后再次 DEL cache'],['R','下一次读取 → 未命中 → v2'],['=','此时间线中第二次删除清除了旧值；500 ms 不是通用上界，慢回填和复制延迟仍可能越过它','ok']],
'更新数据库 → 更新缓存（两个写）':[['W1','UPDATE db = A'],['W2','UPDATE db = B'],['W2','SET cache = B'],['W1','SET cache = A'],['=','数据库 B，缓存 A，没有任何操作会纠正它（直到 TTL）','bad']]};
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Object.keys(S).forEach(k=>{const b=document.createElement('button');b.className='btn';b.textContent=k;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const s=S[k],r=s[s.length-1];p.textContent=s.slice(0,-1).map((x,i)=>`${i+1}. [${x[0]}] ${x[1]}`).join('\n');m.className='msg '+r[2];m.innerHTML=r[1]});q.appendChild(b)});
 m.className='msg';m.innerHTML='W 是写请求，R 是读请求。'})();
const e2={app:B('业务服务','UPDATE 价格','',150),db:B('MySQL','binlog','',150),cdc:B('Canal / Debezium','解析变更','sig',150),mq:B('消息队列','可重试','',150),inv:B('失效服务','DEL 缓存','ok',150),r:B('Redis','',''  ,150)};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'提交',p:'业务只负责写数据库（也可以顺手删一次缓存）。',set:{app:[0,0],db:[0,70]}},
 {t:'捕获',p:'CDC 组件伪装成从库读取 binlog，把每一行变更发到消息队列。',d:3600,set:{app:[0,0],db:[0,70],cdc:[180,70],mq:[360,70]}},
 {t:'删除',p:'失效服务根据表和主键算出缓存键并删除，失败就重试；可在一段延迟后再删一次。所有写入入口都被覆盖，包括后台脚本和人工改数据。',d:4600,set:{app:[0,0],db:[0,70],cdc:[180,70],mq:[360,70],inv:[360,140],r:[180,140]}}]});
Term(document.getElementById('t4'),[
['HSET pv:1 ver 3 data \'{…}\'','(integer) 2','缓存值中保存版本号。'],
['EVAL "…比较 ver…" 1 pv:1 2 \'{…}\'','(integer) 0','回填的版本更旧，拒绝写入。'],
['UNLINK p:1 p:2 p:3','(integer) 3','批量删除，大值在后台线程释放。'],
['DEL p:1','(integer) 0','删除不存在的键也不会报错，重试是安全的（幂等）。']]);
Quiz(document.getElementById('qs'),[
['推荐的写顺序？',['先删缓存再更新数据库','先更新数据库再删缓存','先更新缓存再更新数据库'],1,''],
['为什么删除缓存而不是更新缓存？',['更快','避免并发写导致缓存停在旧值，也避免无用计算','Redis 不支持更新'],1,''],
['延迟双删的第二次删除针对？',['删除失败','读请求在更新期间回填的旧值','内存不足'],1,''],
['binlog 订阅的主要优点？',['覆盖所有写入来源并可靠重试','零延迟','不需要数据库'],0,''],
['下单使用的价格应来自？',['缓存','数据库主库','从库'],1,'']]);
