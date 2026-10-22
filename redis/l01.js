const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={cl:B('客户端','GET user:42'),net:P('RESP over TCP · ~0.1–1 ms 往返','mute'),ev:B('事件循环','epoll 发现可读','',150),ex:B('执行命令','查哈希表 · ~1 µs','',150),mem:B('内存','键空间（字典）','',150),rep:P('回复写回 socket','ok'),q:P('网络往返远大于执行时间','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'发送',p:'客户端把命令编码为 RESP：*2\\r\\n$3\\r\\nGET\\r\\n$7\\r\\nuser:42\\r\\n，通过 TCP 发出。',set:{cl:[0,40,{cls:'blk sig'}],net:[170,0]}},
 {t:'读取与解析',p:'服务器的事件循环用 epoll 等待所有连接，这个连接可读时读出数据，解析出命令和参数。',d:3800,set:{cl:[0,40],net:[170,0],ev:[200,40,{cls:'blk sig'}]}},
 {t:'执行',p:'在内存中的字典里查找键，取出值。单线程依次执行，不需要加锁。',d:3600,set:{cl:[0,40],ev:[200,40],ex:[380,40,{cls:'blk sig'}],mem:[380,110,{cls:'blk ok'}]}},
 {t:'回复',p:'结果写入该连接的输出缓冲区，再发送给客户端。整个过程服务器只花了几微秒，客户端感受到的延迟主要来自网络。',d:4000,set:{cl:[0,40,{cls:'blk ok'}],ev:[200,40],ex:[380,40],mem:[380,110],rep:[170,0],q:[0,170]}}]});
const e2={a:B('内存访问','~100 ns，没有磁盘 I/O','ok',200),b:B('I/O 多路复用','一个线程监听上万连接','ok',200),c:B('没有锁和上下文切换','命令串行执行','ok',200),d:B('高效的数据结构','按大小切换编码（第 4 课）','ok',200),x:P('瓶颈通常是网络和内存，而不是 CPU','sig'),y:P('一条 O(N) 的大命令会让所有人等待','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'内存',p:'所有数据都在内存中，读一个值不需要等待磁盘。',set:{a:[0,0]}},
 {t:'多路复用',p:'一个线程同时管理大量连接：只处理“已经准备好”的那些，不会因为某个慢客户端而阻塞。',d:3800,set:{a:[0,0],b:[220,0]}},
 {t:'没有锁',p:'只有一个线程执行命令，就不需要锁，也没有线程切换的开销。单条命令天然原子。',d:3800,set:{a:[0,0],b:[220,0],c:[440,0],d:[0,60],x:[0,130]}},
 {t:'代价',p:'单线程意味着执行时间长的命令会阻塞后面所有命令。使用 Redis 的第一条规则：避免在大集合上执行 O(N) 命令。',d:4000,set:{a:[0,0],b:[220,0],c:[440,0,{cls:'blk bad'}],y:[0,130]}}]});
(()=>{const Q=[['SISMEMBER users:all u:42','耗时：0.002 ms · O(1)\n其他客户端：无感知','ok','哈希表查找，与集合大小无关。'],
['SCARD users:all','耗时：0.001 ms · O(1)\n(integer) 1000000','ok','元素个数直接存储，不需要遍历。'],
['SMEMBERS users:all','耗时：约 180 ms · O(N)\n返回 100 万个元素（约 20 MB 回复）\n其他客户端：这 180 ms 内全部排队，p99 延迟飙升','bad','一次性取出全部成员。改用 SSCAN 分批遍历，或者重新设计，让业务不需要取全集。'],
['SSCAN users:all 0 COUNT 100','耗时：0.03 ms\n返回下一个游标和约 100 个元素','ok','每次只处理一小批，循环直到游标回到 0。期间其他命令可以穿插执行。'],
['KEYS user:*','耗时：约 400 ms（遍历整个键空间 500 万个键）\n其他客户端：全部阻塞','bad','生产环境禁止使用 KEYS（第 22 课用 ACL 禁用它）。用 SCAN 0 MATCH user:* COUNT 1000。'],
['DEL users:all','耗时：约 90 ms · 释放 100 万个元素的内存\n其他客户端：阻塞','bad','删除大 key 本身就是 O(N)。用 UNLINK：在主线程只把键从字典摘除，内存由后台线程释放（第 19 课）。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='> '+Q[i][0]+'\n\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='users:all 有 100 万个成员，键空间共 500 万个键。'})();
Term(document.getElementById('t4'),[
['redis-cli -h 127.0.0.1 -p 6379','127.0.0.1:6379>','连接到指定主机和端口。有密码时加 -a 或用 AUTH 命令。'],
['INFO server','redis_version:8.10.2\nredis_mode:standalone\nprocess_id:1\nuptime_in_seconds:3021','服务器信息。INFO 不带参数时输出全部分区。'],
['DBSIZE','(integer) 5','当前数据库中的键数量，O(1)。'],
['CLIENT LIST','id=5 addr=172.17.0.1:52044 … name= age=12 idle=0 … cmd=client|list','所有连接。'],
['MONITOR','OK\n1761101233.120 [0 172.17.0.1:52044] "GET" "greeting"','实时打印服务器收到的每条命令。会严重拖慢服务器，只在开发环境短时间使用。'],
['redis-cli --stat','------- data ------ --------------------- load -------------------- - child -\nkeys       mem      clients blocked requests            connections\n5          1.00M    2       0       21 (+0)             8','每秒刷新的概览。']]);
Quiz(document.getElementById('qs'),[
['Redis 执行命令的主线程是？',['多线程并行','单线程，命令依次执行','每个连接一个线程'],1,''],
['为什么生产环境不能用 KEYS *？',['结果不准','遍历全部键，阻塞其他客户端','需要管理员权限'],1,''],
['Redis 8 的许可证是？',['BSD-3-Clause','RSALv2 / SSPLv1 / AGPLv3 三选一','只有 AGPLv3'],1,''],
['Valkey 是？',['Redis 的商业版','从 Redis 7.2.4 分叉的 BSD 许可项目','一个客户端库'],1,''],
['客户端感受到的 Redis 延迟主要来自？',['命令执行','网络往返','磁盘读取'],1,'']]);
