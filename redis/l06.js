const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={w:B('epoll_wait','等待就绪的连接','',150),f1:B('连接 A 可读','读 → 解析 → 执行 GET','',180),f2:B('连接 B 可读','读 → 解析 → 执行 INCR','',180),f3:B('新连接','accept','',180),t:B('serverCron','过期清理 · rehash · 统计','',200),bs:B('beforeSleep','写回复 · AOF 写入','',180),lp:P('一轮通常远小于 1 ms，然后回到 epoll_wait','ok'),sl:P('如果某条命令执行 200 ms，这一轮就 200 ms，所有连接都在等','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'等待',p:'主线程在 epoll_wait 中等待，直到有套接字就绪或最近的时间事件到期。',set:{w:[0,0,{cls:'blk sig'}]}},
 {t:'文件事件',p:'依次处理就绪的连接：接受新连接、读取请求、解析并执行命令。命令一条一条执行。',d:4000,set:{w:[0,0],f1:[180,0,{cls:'blk sig'}],f2:[180,54,{cls:'blk sig'}],f3:[180,108]}},
 {t:'时间事件',p:'serverCron 按 hz 定期运行：抽样删除过期键、推进 rehash、检查是否需要 BGSAVE、更新统计。',d:3800,set:{w:[0,0],f1:[180,0],f2:[180,54],f3:[180,108],t:[390,0,{cls:'blk sig'}]}},
 {t:'回到等待',p:'进入下一轮等待前，把回复写回客户端。每轮都很短，所以单线程也能服务大量连接。前提是没有任何一步耗时过长。',d:4200,set:{w:[0,0],bs:[390,60,{cls:'blk ok'}],lp:[0,170],sl:[0,210]}}]});
const e2={m:B('主线程','只执行命令','sig',150),io1:B('I/O 线程 1','读 · 解析 · 写回复','',170),io2:B('I/O 线程 2','读 · 解析 · 写回复','',170),io3:B('I/O 线程 3','读 · 解析 · 写回复','',170),c:P('客户端连接按线程分组','mute'),q:P('解析好的命令交给主线程依次执行','ok'),r:P('回复交回 I/O 线程写出','ok'),bio:B('后台线程 bio','close · fsync · lazy free','mute',190),fk:B('子进程（fork）','RDB / AOF 重写','mute',190)};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'只有主线程时',p:'读取套接字、解析协议、写回复这些系统调用都在主线程上，连接多、回复大时，网络处理会占满一个 CPU 核。',set:{m:[200,60,B('主线程','读 · 解析 · 执行 · 写','bad',170)]}},
 {t:'分出 I/O 线程',p:'网络读写和协议解析分配给多个 I/O 线程并行完成。',d:3800,set:{io1:[0,0],io2:[0,60],io3:[0,120],m:[260,60],c:[0,180]}},
 {t:'执行仍然串行',p:'命令依旧由主线程一条一条执行，所以原子性和语义完全不变；吞吐提升来自并行的网络处理。',d:4000,set:{io1:[0,0],io2:[0,60],io3:[0,120],m:[260,60,{cls:'blk ok'}],q:[0,180],r:[260,180]}},
 {t:'其他线程与进程',p:'后台线程负责可能很慢的文件和内存操作；持久化由 fork 出的子进程完成，它和主进程共享内存页，直到某一方写入（写时复制）。',d:4200,set:{m:[260,60],bio:[0,0],fk:[0,120]}}]});
(()=>{const Q=[['SLOWLOG 中有 KEYS *','SLOWLOG GET 1\n  3) (integer) 412003      ← 412 ms\n  4) 1) "KEYS" 2) "*"','bad','O(N) 命令遍历整个键空间。改用 SCAN，并用 ACL 或 rename-command 禁止 KEYS。'],
['尖刺与 BGSAVE 同时出现','INFO stats → latest_fork_usec:118342\nINFO persistence → rdb_last_bgsave_time_sec:41','sig','fork 停顿。关闭透明大页、减少主库上的 fork、缩小单实例内存。'],
['DEL 一个大 Hash 后延迟飙升','SLOWLOG → DEL big:hash  2310 ms\nMEMORY USAGE big:hash（删除前）→ 1.2 GB','bad','删除 2000 万个字段的同步释放。改用 UNLINK，或打开 lazyfree-lazy-user-del yes 让 DEL 也异步释放。'],
['Lua 脚本超时','LATENCY LATEST → "script" 5000 ms\n日志：BUSY Redis is busy running a script','bad','脚本中循环处理大量数据。脚本执行期间主线程不处理其他命令。拆分脚本，或在客户端分批处理。'],
['used_memory 大于物理内存','INFO memory → used_memory_rss_human:30.2G（物理内存 32G）\nvmstat → si/so 持续非零','bad','发生了 swap：访问被换出的页要读磁盘。设置合理的 maxmemory（第 8 课），确保 Redis 完全在内存中。'],
['appendfsync always','INFO persistence → aof_delayed_fsync:0\n磁盘 await 8 ms','sig','每次写命令都等 fsync，延迟受磁盘制约。大多数场景用 everysec（第 9 课）。'],
['大量客户端、CPU 单核 100%','top -H → redis-server 线程 100%，其他核空闲\nINFO stats → instantaneous_ops_per_sec:180000\n平均回复 4 KB','sig','网络处理成为瓶颈，命令本身都很快。开启 io-threads 4（Redis 8 的新实现开销更低），通常能显著提升吞吐。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='p99 正常为 1 ms。'})();
Term(document.getElementById('t4'),[
['CONFIG GET io-threads','1) "io-threads"\n2) "4"','I/O 线程数（包括主线程）。只能在启动时设置。'],
['INFO threads','# Threads\nio_thread_0:clients=12,reads=…,writes=…\nio_thread_1:clients=13,…','Redis 8：各 I/O 线程负责的客户端和读写次数。'],
['LATENCY DOCTOR','Dave, I have observed latency spikes in this Redis instance …','延迟监控的自动分析报告。需要先设置 latency-monitor-threshold。'],
['redis-cli --intrinsic-latency 10','Max latency so far: 1 microseconds.\n…\nMax latency so far: 812 microseconds.','在服务器上运行：测量操作系统和虚拟化自身的调度延迟，这是 Redis 能达到的下限。'],
['INFO stats | grep fork','latest_fork_usec:3120\ntotal_forks:14','最近一次 fork 耗时。'],
['CONFIG SET lazyfree-lazy-user-del yes','OK','让 DEL 的行为与 UNLINK 相同。']]);
Quiz(document.getElementById('qs'),[
['开启 io-threads 后，命令是否并行执行？',['是','否，仍由主线程串行执行','只有读命令并行'],1,''],
['serverCron 默认每秒运行？',['1 次','10 次','100 次'],1,'hz = 10。'],
['UNLINK 与 DEL 的区别？',['UNLINK 在后台释放内存','UNLINK 不删除键','没有区别'],0,''],
['fork 停顿与什么成正比？',['连接数','数据集内存大小（页表）','键的数量'],1,''],
['为什么要关闭透明大页？',['写时复制会复制 2 MB 的页，增加延迟和内存','它会禁用持久化','它占用 CPU'],0,'']]);
