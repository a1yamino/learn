const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=110)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={pm:{w:280,h:150,cls:'frame',html:'<i>主进程</i>'},ch:{w:280,h:150,cls:'frame',html:'<i>子进程（fork）</i>'},p1:B('页 A','共享','',100),p2:B('页 B','共享','',100),p3:B('页 C','共享','',100),c1:B('页 A','共享','',100),c2:B('页 B','共享','',100),c3:B('页 C','共享','',100),fk:P('fork：复制页表，物理页共享','sig'),w:P('SET 修改页 B → 内核复制一份','sig'),wr:P('子进程按 fork 时刻的内容写 temp.rdb','ok'),mv:P('写完后 rename 为 dump.rdb','ok')};
const PM={pm:[0,0],p1:[10,30],p2:[10,80],p3:[140,30]},CH={ch:[320,0],c1:[330,30],c2:[330,80],c3:[460,30]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'fork',p:'BGSAVE 调用 fork。子进程得到与父进程相同的内存视图，只复制页表，数据页由两者共享。',set:{...PM,fk:[0,170]}},
 {t:'写时复制',p:'主进程继续处理写命令。修改页 B 时，内核把它复制一份给主进程；子进程看到的仍是旧内容。',d:4000,set:{...PM,...CH,p2:[10,80,B('页 B′','已复制并修改','sig',100)],w:[0,170]}},
 {t:'写出快照',p:'子进程遍历的是 fork 那一刻的数据，写出一致的快照。写入越多，复制的页越多，最坏时内存接近翻倍。',d:4000,set:{...PM,...CH,p2:[10,80,B('页 B′','已复制并修改','sig',100)],wr:[0,170]}},
 {t:'完成',p:'临时文件写完并刷盘后，原子地重命名替换旧的 dump.rdb，子进程退出。',d:3600,set:{...PM,mv:[0,170]}}]});
const e2={cmd:P('SET / INCR / LPUSH …','sig'),buf:B('aof_buf','内存缓冲','',140),inc:B('incr.aof','page cache','',140),dk:B('磁盘','fsync','',140),es:P('everysec：后台线程每秒 fsync 一次','ok'),al:P('always：每次写都 fsync 后才回复','sig'),rw:P('重写：子进程写新的 base；新写入进入新的 incr 文件','sig'),mf:B('manifest','base.2 + incr.3','ok',160)};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'追加',p:'写命令执行后，以 RESP 格式追加到 AOF 缓冲区。',set:{cmd:[0,0],buf:[0,40]}},
 {t:'写入与刷盘',p:'每轮事件循环结束前，缓冲区写入当前 incr 文件（进入操作系统的页缓存）。何时 fsync 到磁盘由 appendfsync 决定。',d:4200,set:{cmd:[0,0],buf:[0,40],inc:[160,40],dk:[320,40],es:[0,110],al:[0,150]}},
 {t:'重写',p:'AOF 越来越大，重写时 fork 子进程把当前数据写成新的 base 文件（默认 RDB 格式）；同时主进程开始写一个新的 incr 文件。',d:4200,set:{inc:[160,40],rw:[0,110]}},
 {t:'切换',p:'完成后更新清单（manifest）指向新 base 和新 incr，删除旧文件。恢复时先加载 base，再重放 incr。',d:3800,set:{inc:[160,40],mf:[320,40],rw:[0,110]}}]});
(()=>{const Q=[['只开 RDB（save 60 1000）','最近一次快照：断电前 45 秒\n重启后：丢失这 45 秒内的所有写入','bad','快照之间的数据全部丢失。'],
['AOF everysec','重启后：丢失最后约 1 秒的写入（这里写入在 2 秒前，通常不丢）\n磁盘卡住时 fsync 可能继续延迟，约 1 秒不是严格的数据丢失上界','ok','默认、最常用的折中。'],
['AOF always','每条写命令 fsync 后才回复客户端\n重启后：所有已确认的写入都在','ok','最安全，写延迟受磁盘制约。'],
['AOF no','由操作系统决定何时写回（Linux 通常 30 秒左右）\n重启后：可能丢失 30 秒','sig','比 everysec 快一点，但丢失窗口不确定。'],
['没有持久化','重启后：空数据库','bad','纯缓存可以接受，但要考虑冷启动时数据库能否扛住回源流量。'],
['主库无持久化 + 自动重启，副本有数据','主库重启后为空 → 副本重新同步 → 副本的数据也被清空','bad','经典事故。主库关闭持久化时，不要配置进程自动重启，或者使用 Sentinel/Cluster 让副本先被提升。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='持续写入，每秒 5000 次。'})();
Term(document.getElementById('t4'),[
['INFO persistence','rdb_changes_since_last_save:812\nrdb_last_bgsave_status:ok\nrdb_last_cow_size:12582912\naof_enabled:1\naof_last_write_status:ok\naof_delayed_fsync:0','rdb_last_cow_size：上次 fork 期间写时复制的内存量。'],
['CONFIG SET appendonly yes','OK','运行中开启 AOF：会先做一次重写生成 base。'],
['CONFIG SET save "3600 1 300 100"','OK','自动快照条件；save "" 关闭。'],
['CONFIG GET auto-aof-rewrite-*','1) "auto-aof-rewrite-percentage"\n2) "100"\n3) "auto-aof-rewrite-min-size"\n4) "67108864"','AOF 比上次重写后增长 100% 且大于 64 MB 时自动重写。'],
['redis-check-aof --fix appendonlydir/appendonly.aof.manifest','…AOF analyzed: … is valid','检查并修复损坏的 AOF。'],
['redis-check-rdb dump.rdb','[offset 0] Checking RDB file dump.rdb\n…\n\\o/ RDB looks OK! \\o/','检查 RDB 文件。']]);
Quiz(document.getElementById('qs'),[
['BGSAVE 期间主进程还能处理写命令吗？',['能，借助写时复制','不能','只能读'],0,''],
['appendfsync everysec 崩溃时最多丢失约？',['0','1 秒','30 秒'],1,''],
['Redis 7 的 AOF 由什么组成？',['单个文件','base + incr 文件 + manifest','只有 RDB'],1,''],
['同时开启 RDB 和 AOF，启动时优先用？',['RDB','AOF','随机'],1,''],
['主库关闭持久化并自动重启的风险？',['性能下降','空数据同步给副本，副本数据被清空','AOF 损坏'],1,'']]);
