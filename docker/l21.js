const S=(t,s,c='',w=160)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const bar=(w,c='var(--sig)')=>({w,h:24,cls:'',html:`<div style="width:${w}px;height:24px;border-radius:5px;background:${c}"></div>`});
Player(document.getElementById('p1'),{els:{lim:{w:4,h:180,cls:'',html:'<div style="width:3px;height:180px;background:var(--bad)"></div>'},ll:{cls:'pill bad',html:'--memory 256m'},u1:bar(140),u2:bar(230),u3:bar(300,'var(--bad)'),k:{cls:'pill bad',html:'OOMKilled · exit 137'},n:{w:640,cls:'tag'}},scenes:[
 {t:'限制是一条线',p:'<code>--memory 256m</code> 把容器 cgroup 的 <code>memory.max</code> 设为 256 MB。容器里所有进程加起来不能超过它。',set:{lim:[260,0],ll:[220,-40],u1:[0,60]}},
 {t:'接近上限',p:'内存增长到接近上限时，内核先回收页缓存（文件缓存）。应用本身用的匿名内存无法回收。',set:{lim:[260,0],ll:[220,-40],u2:[0,60]}},
 {t:'越过上限：OOM',p:'回收不够，内核的 OOM killer 杀掉 cgroup 里占用最多的进程。主进程被杀，容器退出码 137（128+9，SIGKILL）。',d:3800,set:{lim:[260,0],ll:[220,-40],u3:[0,60],k:[0,110]}},
 {t:'应用要知道上限',p:'有些运行时按<b>宿主机</b>内存决定堆大小。新版 JVM、Node 能读取 cgroup 限制，但最好显式设置（<code>-XX:MaxRAMPercentage=75</code>、<code>--max-old-space-size</code>）。',d:3800,set:{lim:[260,0],ll:[220,-40],u1:[0,60],n:[0,120,{html:'堆上限 < 容器上限，留出非堆内存'}]}}]});
const seg=(on,w)=>({w,h:28,cls:'',html:`<div style="width:${w}px;height:28px;border-radius:4px;background:${on?'var(--sig)':'transparent'};border:1px solid var(--line)"></div>`});
const P={};for(let i=0;i<4;i++){P['a'+i]={...seg(true,50),cls:'cpu-run'};P['b'+i]={...seg(false,50),cls:'cpu-wait'}}
const burst={};for(let i=0;i<4;i++){burst['a'+i]=[i*110,40,{cls:'cpu-run is-burst'}];burst['b'+i]=[i*110+14.5,40,{cls:'cpu-wait is-burst'}]}
Player(document.getElementById('p2'),{els:{...P,lb:{w:640,cls:'tag'},th:{cls:'pill bad',html:'节流'},n:{w:640,cls:'tag'}},scenes:[
 {t:'周期与配额',p:'<code>--cpus 0.5</code> = 每 100 ms 周期里最多运行 50 ms（<code>cpu.max = 50000 100000</code>）。',d:3600,set:{a0:[0,40],b0:[52,40],a1:[110,40],b1:[162,40],a2:[220,40],b2:[272,40],a3:[330,40],b3:[382,40],lb:[0,0,{html:'每格 50 ms：橙色运行，空白等待'}]}},
 {t:'多线程更快用完',p:'有 4 个线程同时运行时，50 ms 的配额在 12.5 ms 内就用完。剩下的 87.5 ms 全部等待。',d:3800,set:{...burst,th:[30,80],lb:[0,0,{html:'每周期 100 ms：运行 12.5 ms，等待 87.5 ms'}]}},
 {t:'延迟变高',p:'一个本来 20 ms 完成的请求，碰上节流可能要 100 ms 以上。平均 CPU 使用率看起来不高，P99 延迟却很差。',d:3800,set:{a0:[0,40],b0:[52,40],a1:[110,40],b1:[162,40],th:[30,80],n:[0,120,{html:'查看 cpu.stat：nr_throttled、throttled_usec'}]}},
 {t:'怎么处理',p:'给足突发需要的配额，或改用 <code>--cpu-shares</code>（只在争抢时按比例分配，空闲时可以用满）。延迟敏感的服务用 <code>--cpuset-cpus</code> 固定核心。',d:3800,set:{a0:[0,40],a1:[110,40],a2:[220,40],a3:[330,40]}}]});
(()=>{let mem='256',cpu='0.5';const M=[['256','256m'],['512','512m'],['2048','2g'],['0','不限制']],C=[['0.5','--cpus 0.5'],['2','--cpus 2'],['0','不限制']];
 const mk=(id,lab,list,set)=>{const el=document.getElementById(id);el.innerHTML=`<span style="font:500 13px var(--m);margin-right:6px">${lab}</span>`;list.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)})};
 mk('r1','内存：',M,v=>mem=v);mk('r2','CPU：',C,v=>cpu=v);const rl=document.getElementById('rl'),rm=document.getElementById('rm');
 function draw(){document.querySelectorAll('#r1 .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===mem));document.querySelectorAll('#r2 .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===cpu));
  const L=['平时：180 MB，0.3 核 → 正常'];const bad=[],warn=[];
  if(mem==='256'){L.push('<b style="color:var(--bad)">批量请求：内存 420 MB > 256 MB → OOMKilled，exit 137</b>');bad.push('内存上限低于峰值，批量请求时被杀。')}
  else L.push('批量请求：内存 420 MB → 正常');
  if(cpu==='0.5'){L.push('<b style="color:var(--bad)">突发：需要 1.5 核，配额 0.5 → 节流，200 ms 的工作变成 600 ms</b>');bad.push('CPU 配额低于突发需求，延迟变成三倍。')}
  else L.push('突发：1.5 核持续 200 ms → 正常');
  if(mem==='2048')warn.push('2g 远高于峰值，内存泄漏时要很久才被发现，同一台机器能放的容器也更少。');
  if(mem==='0')warn.push('不限制内存：一个泄漏就可能耗尽宿主机内存，连带其他容器和系统进程。');
  if(cpu==='0')warn.push('不限制 CPU 本身不危险（空闲时可以用满），但争抢时没有保障；可以配合 --cpu-shares。');
  rl.innerHTML=L.map(x=>`<div>${x}</div>`).join('');
  if(bad.length){rm.className='msg bad';rm.innerHTML=bad.join(' ')}else if(warn.length){rm.className='msg';rm.innerHTML='能运行。'+warn.join(' ')}
  else{rm.className='msg ok';rm.innerHTML='512m 高于峰值 420 MB，约 20% 余量；2 核覆盖突发需求。合适。'}}draw()})();
Term(document.getElementById('t4'),[
['docker stats --no-stream','CONTAINER   NAME   CPU %    MEM USAGE / LIMIT   MEM %   NET I/O        BLOCK I/O     PIDS\n3f2a9c1b    api    32.4%    188MiB / 512MiB     36.7%   1.2MB / 3.4MB  0B / 12MB     23','实时资源占用。LIMIT 显示内存上限。'],
['docker exec api cat /sys/fs/cgroup/memory.peak /sys/fs/cgroup/memory.events','440401920\nlow 0\nhigh 0\nmax 12\noom 0\noom_kill 0','<code>memory.peak</code>：历史峰值。<code>memory.events</code> 里 <code>max</code> 表示碰到上限的次数，<code>oom_kill</code> 表示被杀的次数。'],
['docker update --memory 512m --memory-swap 512m --cpus 2 api','api','不重启就修改限制。<code>--memory-swap</code> 等于 <code>--memory</code> 表示不使用 swap。'],
['docker run -d --cpu-shares 512 --cpuset-cpus 2,3 batch','','shares 默认 1024，512 表示争抢时只拿一半份额。cpuset 限定只在 2、3 号核心上运行。'],
['docker run -d --network host nginx','','跳过 docker0、veth 和 NAT（第 15 课），网络延迟最低，但端口直接占用宿主机，失去网络隔离。'],
['cat /etc/docker/daemon.json','{ "log-driver": "local", "log-opts": { "max-size": "10m", "max-file": "3" } }','全局日志默认值。<code>local</code> 驱动有压缩和轮转；默认的 json-file 不轮转，日志多的服务会把磁盘写满。']]);
Quiz(document.getElementById('qs'),[
['容器退出码 137、OOMKilled=true，说明？',['应用代码报错','超过内存上限被内核杀掉','CPU 不够'],1,'137 = 128 + SIGKILL(9)。'],
['--cpus 0.5 的容器 CPU 平均只有 30%，但延迟很高。最可能是？',['内存不足','CPU 节流','磁盘满'],1,'突发时配额用完，看 cpu.stat。'],
['哪个设置只在 CPU 争抢时生效？',['--cpus','--cpu-shares','--cpuset-cpus'],1,'空闲时可以用满。'],
['默认的 json-file 日志驱动的主要风险是？',['太慢','不轮转，可能写满磁盘','不能用 docker logs'],1,'设置 max-size 或改用 local。']]);
