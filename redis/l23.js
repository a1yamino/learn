const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=110)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:B('客户端','连接池等待'),n:B('网络','RTT'),q:B('排队','等前面的命令'),x:B('执行','SLOWLOG 只测这里','sig'),o:B('返回','输出缓冲区'),t1:P('--latency 测 c→n→q→x→o 全程','ok'),t2:P('前面一条慢命令 = 后面所有请求都变慢','bad')};
const N={c:[0,0],n:[120,0],q:[240,0],x:[360,0],o:[480,0]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'各个环节',p:'客户端看到的延迟是这些部分的总和。',set:N},
 {t:'测量',p:'SLOWLOG 只统计执行时间；redis-cli --latency 测完整往返。',d:3600,set:{...N,t1:[0,70]}},
 {t:'排队',p:'单线程下，一条 50 ms 的命令让同时到达的几百个请求都至少等 50 ms，但它们自己不会出现在 SLOWLOG 中。',d:4400,set:{...N,q:[240,0,B('排队','等 50 ms','bad')],x:[360,0,B('执行','HGETALL 大 key','bad')],t2:[0,70]}}]});
(()=>{const S=[['延迟周期性抖动，SLOWLOG 为空','查：latest_fork_usec、LATENCY LATEST（fork 事件）、透明大页、RDB/AOF 重写时间\n原因：fork 或持久化阻塞','RDB/AOF 重写触发的 fork。'],['某些时刻 SLOWLOG 出现大量 KEYS/HGETALL','查：SLOWLOG GET 的命令和客户端地址\n原因：O(N) 命令或大 key','改用 SCAN、分批读取、拆分大 key。'],['整点时 CPU 突增，expired_keys 暴涨','查：INFO stats expired_keys、LATENCY 中的 expire-cycle\n原因：大量键同时过期','TTL 加随机抖动。'],['used_memory 正常但 RSS 很高','查：mem_fragmentation_ratio、allocator_frag_ratio\n原因：内存碎片','开启 activedefrag。'],['内存不断上涨，键数量不变','查：CLIENT LIST 的 omem、mem_clients_normal、复制输出缓冲区\n原因：慢消费的 Pub/Sub 订阅者或 MONITOR、大量 pipeline 结果','设置 client-output-buffer-limit，找出慢客户端。'],['只有某个应用服务器上慢','查：在该服务器上运行 --latency，对比；检查连接池等待、GC、网络\n原因：客户端侧','与 Redis 无关时不要调 Redis。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r;m.className='msg ok';m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个现象。'})();
Term(document.getElementById('t4'),[
['INFO stats','instantaneous_ops_per_sec:18234\nkeyspace_hits:9123456\nkeyspace_misses:203411\nexpired_keys:…\nevicted_keys:0\nlatest_fork_usec:412233\n…','吞吐、命中、淘汰、fork 耗时。'],
['INFO clients','connected_clients:812\nblocked_clients:0\nmaxclients:10000\n…','连接数。'],
['LATENCY HISTORY fork','1) 1) (integer) 1761115200\n   2) (integer) 412\n…','某类事件的历史（毫秒）。'],
['redis-cli --intrinsic-latency 30','Max latency so far: 1 microseconds.\n…\nMax latency so far: 812 microseconds.','宿主机本身能保证的最低延迟（在服务器上运行）。'],
['redis-cli --stat','------- data ------ --------------------- load --------------------\nkeys       mem      clients blocked requests            connections\n100231     1.21G    812     0       91234123 (+18234)   9123','每秒滚动显示概况。'],
['MEMORY STATS','1) "peak.allocated"\n…\n"dataset.percentage"\n"91.2"\n…','内存组成明细。']]);
Quiz(document.getElementById('qs'),[
['SLOWLOG 记录的时间包括网络和排队吗？',['包括','不包括，只有执行时间','只包括网络'],1,''],
['周期性抖动且 SLOWLOG 为空，首先怀疑？',['fork/持久化','KEYS','网络'],0,''],
['为什么要关闭透明大页？',['fork 后写时复制粒度变成 2 MB，延迟和内存飙升','节省 CPU','TLS 需要'],0,''],
['vm.overcommit_memory=1 的作用？',['避免 fork 时因内存检查失败','提高速度','禁用 swap'],0,''],
['RSS 远高于 used_memory 说明？',['碎片多','内存泄漏一定存在','淘汰太多'],0,'']]);
