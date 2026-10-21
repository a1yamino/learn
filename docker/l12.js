const F=(t,c='',w=300)=>({w,h:40,cls:'blk '+c,html:'<span style="padding:0 12px;width:100%;text-align:left;font-size:12px">'+t+'</span>'});
Player(document.getElementById('p1'),{els:{
 r:F('/sys/fs/cgroup','ink'),s:F('system.slice',''),d:F('docker-7c1f4a2e….scope','sig',320),u:F('user.slice','dim'),
 m:F('memory.max = 268435456','hatch',280),c:F('cpu.max = 50000 100000','hatch',280),p:F('pids.max = 50','hatch',280),pr:F('cgroup.procs = 48213 48251','hatch',280),
 cmd:{cls:'pill mute',html:'$ docker run -m 256m --cpus 0.5 --pids-limit 50 nginx'}},scenes:[
 {t:'一棵目录树',p:'cgroup v2 是一个虚拟文件系统。每个目录是一个组，systemd 把系统服务放在 system.slice，用户会话放在 user.slice。',set:{r:[0,0],s:[40,60],u:[40,240]}},
 {t:'每个容器一个目录',p:'Docker 为每个容器创建一个 cgroup 目录。容器里的所有进程都被写入它的 <code>cgroup.procs</code>。',set:{r:[0,0],s:[40,60],u:[40,240],d:[80,120],pr:[440,120]}},
 {t:'限制就是写文件',p:'<code>docker run</code> 的参数被写成这个目录里的文件。内核按这些值执行限制，同时在 memory.current、cpu.stat 里统计实际用量。',d:3800,set:{r:[0,0],s:[40,60],u:[40,240],d:[80,120],pr:[440,120],m:[440,0],c:[440,40],p:[440,80],cmd:[0,-50]}}]});
const bar=(w,c)=>({w,h:26,cls:'blk '+c,html:''});
Player(document.getElementById('p2'),{els:{lim:{w:4,h:120,cls:'blk ink'},ll:{cls:'tag',w:120},m1:bar(120,'sig'),m2:bar(220,'sig'),m3:bar(270,'sig'),kill:{cls:'pill bad',html:'OOM killer → 退出码 137'},
 c1:{w:600,h:30,cls:'blk',html:'<div style="display:flex;width:100%;height:100%"><span style="flex:1;height:100%;background:var(--sig)"></span><span style="flex:1;height:100%;background:var(--soft)"></span><span style="flex:1;height:100%;background:var(--sig)"></span><span style="flex:1;height:100%;background:var(--soft)"></span><span style="flex:1;height:100%;background:var(--sig)"></span><span style="flex:1;height:100%;background:var(--soft)"></span><span style="flex:1;height:100%;background:var(--sig)"></span><span style="flex:1;height:100%;background:var(--soft)"></span></div>'},cl:{w:600,cls:'tag'},lab:{w:300,cls:'tag'}},scenes:[
 {t:'内存：用量增长',p:'限制 256 MB。进程不断申请内存。',set:{lab:[0,-36,{html:'<b>内存</b> · --memory 256m'}],lim:[250,-10],ll:[258,-10,{html:'256 MB'}],m1:[0,40]}},
 {t:'内存：碰到上限',p:'内核先尝试回收页缓存。回收不了，就触发 OOM killer。',set:{lab:[0,-36,{html:'<b>内存</b> · --memory 256m'}],lim:[250,-10],ll:[258,-10,{html:'256 MB'}],m2:[0,40]}},
 {t:'内存：进程被杀死',p:'内存是不可压缩的资源，超出就杀。容器退出码 137（128 + SIGKILL 的 9）。',d:3600,set:{lab:[0,-36,{html:'<b>内存</b> · --memory 256m'}],lim:[250,-10],ll:[258,-10,{html:'256 MB'}],m3:[0,40,{cls:'blk dim'}],kill:[0,80]}},
 {t:'CPU：限流，不杀',p:'<code>--cpus 0.5</code>：每 100ms 周期最多运行 50ms，用完就等下一个周期。程序不会出错，只是变慢。CPU 是可压缩的资源。',d:4000,set:{lab:[0,-36,{html:'<b>CPU</b> · --cpus 0.5'}],c1:[0,20],cl:[0,64,{html:'<span style="color:var(--sig)">■</span> 运行 50ms　<span style="opacity:.5">■</span> 被限流 50ms　每个周期 100ms'}]}}]});
(()=>{let m='none',c='none';const lg=document.getElementById('lg');
 const mk=(id,list,set)=>{const el=document.getElementById(id);list.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)})};
 mk('mm',[['none','不限制'],['128','128m'],['256','256m'],['512','512m']],v=>m=v);mk('cc',[['none','不限制'],['0.5','0.5'],['1','1'],['2','2']],v=>c=v);
 function draw(){document.querySelectorAll('#mm .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===m));document.querySelectorAll('#cc .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===c));
  const flags=(m!=='none'?' -m '+m+'m':'')+(c!=='none'?' --cpus '+c:'');let h=`<b>$ docker run -d --name svc${flags} svc:1.0</b>\n`;
  if(m==='128'||m==='256'){h+=`<span class="e">加载缓存… 已用 ${m} MB，达到 memory.max\n容器退出 · Exited (137) · OOMKilled=true</span>\n\n300 MB 的缓存放不进 ${m} MB。服务反复崩溃；如果设置了 --restart，会不停重启。`;lg.innerHTML=h;return}
  const t=c==='none'?1:c==='0.5'?2:1,th=c==='0.5';
  h+=`<span class="o">启动成功 · 内存 ${m==='none'?'300 MB（无上限）':'300 MB / '+m+' MB'}</span>\n请求耗时 ${t.toFixed(1)} 秒${th?'（cpu.stat 里 nr_throttled 持续增长）':''}\n\n`;
  h+=m==='none'?'<span class="e">没有内存上限：如果缓存出 bug 无限增长，会吃光宿主机内存，影响同一台机器上的所有服务。</span>\n':'内存留了约 200 MB 余量。\n';
  h+=c==='none'?'<span class="e">没有 CPU 上限：一个死循环就能占满所有核心。</span>':c==='0.5'?'0.5 核：单个请求被限流，耗时翻倍。适合不在乎延迟的后台任务。':c==='1'?'1 核：单线程请求刚好不被限流。':'2 核：单个请求仍然是 1 秒（单线程用不到第二个核），但能同时处理两个请求。';
  lg.innerHTML=h}draw()})();
Term(document.getElementById('t4'),[
['docker run -d --name api -m 512m --cpus 1.5 --pids-limit 200 api-demo:1.0','5e1d…','三项最常用的限制。<code>-m</code> 不设 <code>--memory-swap</code> 时，可用的 swap 等于内存限制（总共 1GB）；设成和 -m 相同则禁止使用 swap。'],
['docker exec api cat /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.max','97546240\n536870912','在容器里读自己 cgroup 的文件：当前用了 93 MB，上限 512 MB。cgroup namespace 让容器看到的 /sys/fs/cgroup 就是它自己的那一个目录。'],
['cat /sys/fs/cgroup/system.slice/docker-$(docker inspect -f {{.Id}} api).scope/cpu.max','150000 100000','在宿主机上（Linux，使用 systemd cgroup 驱动）找到同一个目录。1.5 核 = 每 100ms 用 150ms（跨多个核）。'],
['docker stats --no-stream','CONTAINER ID   NAME   CPU %    MEM USAGE / LIMIT   MEM %   PIDS\n5e1d…          api    0.31%    93MiB / 512MiB      18.2%   9','数据来自 cgroup 文件。MEM USAGE 不含页缓存中可以回收的部分。'],
['docker inspect -f "{{.State.OOMKilled}} {{.State.ExitCode}} {{.RestartCount}}" api','true 137 4','排查“容器总是重启”时先看这三个值。137 + OOMKilled=true 就是内存不够。注意：容器里的子进程被 OOM 杀死时，主进程可能还活着，OOMKilled 不一定为 true，要看 <code>dmesg</code> 或 memory.events。']]);
Quiz(document.getElementById('qs'),[
['容器超出 --memory 限制，会怎样？',['变慢','进程被 OOM killer 杀死，退出码 137','写入 swap 后继续正常运行'],1,'内存不可压缩。'],
['容器超出 --cpus 限制，会怎样？',['被杀死','被限流，变慢','自动扩容'],1,'CPU 可压缩。'],
['--cpus 0.5 在 cgroup v2 里写成了什么？',['cpu.max = 50000 100000','cpu.weight = 50','memory.max = 0.5'],0,'每 100000 微秒周期内最多 50000 微秒。'],
['用什么防止容器里的 fork 炸弹拖垮宿主机？',['--memory','--pids-limit','--read-only'],1,'限制进程数。']]);
