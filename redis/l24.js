const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={gw:B('网关','令牌桶限流'),app:B('商品服务 × 40','本地缓存 2 s'),bf:B('布隆过滤器','挡住不存在的 ID'),rc:B('Redis Cluster','3 主 3 从，LFU'),st:B('库存实例','noeviction + AOF','sig'),db:B('MySQL','主从'),cdc:B('binlog 订阅','删除缓存'),n:P('','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'入口',p:'网关按用户和接口限流，挡住异常流量。',set:{gw:[0,0],app:[0,70]}},
 {t:'本地缓存',p:'热点商品在应用进程内缓存 2 秒，大促时绝大部分读在这里结束。',d:3400,set:{gw:[0,0],app:[0,70],n:[0,140,P('20 万 QPS → Redis 约 3 万 QPS','ok')]}},
 {t:'Redis',p:'未命中本地缓存时查 Redis Cluster；ID 不存在的请求被布隆过滤器挡住。',d:3600,set:{gw:[0,0],app:[0,70],bf:[190,0],rc:[190,70]}},
 {t:'回源',p:'Redis 未命中时互斥重建，回源数据库的并发受限。',d:3400,set:{gw:[0,0],app:[0,70],bf:[190,0],rc:[190,70],db:[380,70]}},
 {t:'一致性',p:'数据变更由 binlog 订阅服务删除缓存，覆盖所有写入来源。',d:3400,set:{gw:[0,0],app:[0,70],bf:[190,0],rc:[190,70],db:[380,70],cdc:[380,140]}},
 {t:'库存',p:'库存放在独立实例，不会被淘汰，开启 AOF。',d:3400,set:{gw:[0,0],app:[0,70],bf:[190,0],rc:[190,70],db:[380,70],cdc:[380,140],st:[190,140]}}]});
const e2={o:B('下单请求','订单 o-1，数量 1'),l:B('Lua 脚本','原子执行','sig'),s:B('stk:{1001}','3 → 2','ok'),set:B('stk:{1001}:orders','+ o-1','ok'),mq:B('消息队列','订单已预扣'),db:B('数据库','扣减库存 + 写订单'),rc:P('定时对账：Redis 库存 + 已预扣 = 数据库库存','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'检查',p:'脚本先检查订单号是否已处理（幂等），再检查库存是否足够。',set:{o:[0,0],l:[190,0]}},
 {t:'扣减',p:'足够则 DECRBY 并记录订单号，整个过程原子完成，不会超卖。',d:3600,set:{o:[0,0],l:[190,0],s:[380,0],set:[380,60]}},
 {t:'落库',p:'预扣成功后发消息，由订单服务在数据库中扣减并创建订单；失败或超时未支付则回补 Redis 库存（同样以订单号幂等）。',d:4400,set:{o:[0,0],l:[190,0],s:[380,0],set:[380,60],mq:[190,120],db:[380,120]}},
 {t:'对账',p:'定时比对 Redis 与数据库，修正差异。数据库是最终依据。',d:3600,set:{s:[380,0],set:[380,60],db:[380,120],rc:[0,190]}}]});
(()=>{const S=[['一个 Redis 主节点宕机',['Cluster 在约 15 秒内把副本提升为主节点','期间该分片的请求失败 → 超时 50 ms 后读本地缓存或回源（受并发限制）','库存实例不受影响'],'ok','高可用 + 降级。'],['热门商品缓存过期',['1 个请求拿到重建锁回源，其他请求读本地缓存/等待重试','数据库只收到 1 次查询'],'ok','防击穿。'],['爬虫请求随机商品 ID',['布隆过滤器判定不存在 → 直接 404','少量误判的 ID 查库后写入空值缓存 60 秒','网关对该来源限流'],'ok','防穿透。'],['所有缓存被误清空（FLUSHALL）',['应用账户 ACL 禁止 FLUSHALL，正常不会发生','如果发生（运维误操作）：命中率归零 → 回源并发上限保护数据库，多数请求返回降级页面','预热脚本按热度榜回填前 1 万商品'],'sig','ACL + 雪崩防护 + 预热。'],['库存实例宕机',['暂停下单，前端提示稍后再试','不回退到数据库直扣（会被大促流量压垮且可能超卖）','切换完成后对账再恢复'],'sig','宁可短暂不可用，也不超卖。'],['数据库改价后详情未更新',['业务代码已删除缓存；binlog 订阅再次删除并 1 秒后延迟双删','最坏情况由 TTL 1 小时兜底；下单时价格从数据库读取'],'ok','最终一致 + 关键路径读主库。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.map(v=>'• '+v).join('\n');m.className='msg '+c;m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个故障。'})();
Term(document.getElementById('t4'),[
['cat stock_reserve.lua','-- 预扣：KEYS[1]=库存 KEYS[2]=已处理订单 ARGV[1]=订单号 ARGV[2]=数量\nif redis.call("SISMEMBER", KEYS[2], ARGV[1]) == 1 then return 2 end\nlocal s = tonumber(redis.call("GET", KEYS[1]) or 0)\nif s < tonumber(ARGV[2]) then return 0 end\nredis.call("DECRBY", KEYS[1], ARGV[2])\nredis.call("SADD", KEYS[2], ARGV[1])\nreturn 1','返回 1 成功，0 库存不足，2 重复请求。'],
['cat stock_release.lua','-- 回补：订单取消或超时\nif redis.call("SREM", KEYS[2], ARGV[1]) == 0 then return 0 end\nreturn redis.call("INCRBY", KEYS[1], ARGV[2])','只有确实预扣过的订单才会回补，重复调用无副作用。'],
['FUNCTION LOAD REPLACE "#!lua name=stock …"','"stock"','生产中用 Functions 保存这两个脚本，随持久化和复制保留。'],
['CLUSTER KEYSLOT stk:{1001}\nCLUSTER KEYSLOT stk:{1001}:orders','(integer) 5634\n(integer) 5634','哈希标签保证两个键在同一槽。']]);
Quiz(document.getElementById('qs'),[
['库存数据为什么与缓存分开部署？',['避免被淘汰并单独配置持久化','更快','ACL 需要'],0,''],
['库存脚本中订单号集合的作用？',['统计','幂等，防止重复扣减','排序'],1,''],
['大促时最能降低 Redis 压力的一层？',['本地缓存','布隆过滤器','AOF'],0,''],
['库存实例宕机时推荐？',['回退到数据库直接扣减','暂停下单，恢复后对账','忽略库存'],1,''],
['最终的数据依据是？',['Redis','数据库','本地缓存'],1,'']]);
