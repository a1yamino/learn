const S=(t,s,c='',w=200)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const L=['非 root 用户','USER 1000','no-new-privileges','阻止 setuid 提权','capabilities','14 项 → 最少','seccomp','过滤系统调用','namespace','隔离视图','userns / rootless','root → 普通用户'];
const els={x:{cls:'pill bad',html:'攻击'},n:{w:560,cls:'tag'}};for(let i=0;i<6;i++)els['l'+i]=S(L[i*2],L[i*2+1],'',260);
const pos=(c={})=>{const o={};for(let i=0;i<6;i++)o['l'+i]=c[i]?[0,i*62,{cls:'blk '+c[i]}]:[0,i*62];return o};
Player(document.getElementById('p1'),{els,scenes:[
 {t:'纵深防御',p:'每一层都独立地限制容器能做的事。单独一层可能有漏洞，叠在一起，攻击者需要同时突破所有层。',set:pos()},
 {t:'应用被攻破',p:'攻击者在容器里拿到了进程的控制权。如果它是 root、有全部默认能力、没有 seccomp，下一步就是尝试逃逸。',d:3600,set:{...pos(),x:[320,0]}},
 {t:'一层层拦截',p:'非 root：没法改系统文件。删掉 capabilities：没法 mount、没法改网络。seccomp：危险系统调用直接返回 EPERM。',d:4000,set:{...pos({0:'sig',2:'sig',3:'sig'}),x:[320,130]}},
 {t:'即使逃逸',p:'rootless 或 userns-remap 把容器 uid 映射为宿主机非 root 身份，降低越界访问的权限。它们不能保证抵御内核提权漏洞，仍需纵深防御。',d:3600,set:{...pos({0:'sig',1:'sig',2:'sig',3:'sig',4:'sig',5:'sig'}),x:[320,310,{cls:'pill mute',html:'uid 100000'}]}},
 {t:'反面：--privileged',p:'<code>--privileged</code> 一次性关闭 capabilities 限制、seccomp、AppArmor，并开放所有设备。几乎等于宿主机 root。',d:3600,set:{...pos({1:'dim',2:'dim',3:'dim'}),x:[320,130,{cls:'pill bad',html:'--privileged'}]}}]});
Player(document.getElementById('p2'),{els:{c:{w:260,h:120,cls:'frame',html:'<i>容器（user namespace）</i>'},h:{w:260,h:120,cls:'frame',html:'<i>宿主机</i>'},u0:{cls:'pill sig',html:'uid 0 (root)'},u1:{cls:'pill mute',html:'uid 1000'},h0:{cls:'pill bad',html:'uid 0'},h1:{cls:'pill ok',html:'uid 100000'},h2:{cls:'pill ok',html:'uid 101000'},n:{w:640,cls:'tag'}},scenes:[
 {t:'默认：同一个 uid 0',p:'没有 user namespace 时，容器里的 root 和宿主机的 root 是同一个 uid。',set:{c:[0,0],h:[340,0],u0:[20,40],h0:[360,40]}},
 {t:'映射',p:'启用 user namespace 后，容器的 uid 0 在宿主机上对应 100000，uid 1000 对应 101000。映射来自 <code>/etc/subuid</code>。',d:3800,set:{c:[0,0],h:[340,0],u0:[20,30],u1:[20,70],h1:[360,30],h2:[360,70]}},
 {t:'两种方式',p:'<b>userns-remap</b>：守护进程仍是 root，容器使用映射。<b>rootless 模式</b>：连 dockerd 本身都以普通用户运行，攻击面最小。',d:3800,set:{c:[0,0],h:[340,0],u0:[20,30],h1:[360,30],n:[0,150,{html:'容器里是 root，宿主机上不是'}]}},
 {t:'代价',p:'rootless 下不能绑定 1024 以下端口（除非调整 sysctl）、部分存储驱动和网络功能受限、性能略有差异。多数服务可以接受。',set:{c:[0,0],h:[340,0],u0:[20,30],h1:[360,30]}}]});
(()=>{const C=[['CHOWN','改文件属主'],['SETUID','切换用户 id'],['SETGID','切换组 id'],['NET_BIND_SERVICE','绑定 <1024 端口'],['NET_RAW','原始套接字'],['SYS_ADMIN','mount 等大量操作'],['NET_ADMIN','改网络配置'],['DAC_OVERRIDE','绕过文件权限']];
 const need=['CHOWN','SETUID','SETGID','NET_BIND_SERVICE'];const on=new Set();const el=document.getElementById('caps'),cl=document.getElementById('cl'),m=document.getElementById('cmg');
 C.forEach(([c,d])=>{const b=document.createElement('button');b.className='btn';b.innerHTML=`${c} <span style="opacity:.6">${d}</span>`;b.dataset.v=c;b.addEventListener('click',()=>{on.has(c)?on.delete(c):on.add(c);draw()});el.appendChild(b)});
 function draw(){el.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',on.has(b.dataset.v)));
  const steps=[['NET_BIND_SERVICE','bind() 0.0.0.0:80'],['CHOWN','chown /var/cache/nginx/client_temp → nginx'],['SETGID','setgid(101)'],['SETUID','setuid(101)']];
  const out=['$ docker run --sysctl net.ipv4.ip_unprivileged_port_start=1024 --cap-drop ALL'+[...on].map(c=>' --cap-add '+c).join('')+' web'];let fail=null;
  for(const[c,a]of steps){if(on.has(c))out.push('✓ '+a);else{out.push(`<b style="color:var(--bad)">✗ ${a}: Operation not permitted</b>`);fail=c;break}}
  if(!fail)out.push('✓ worker 以 nginx 用户运行，监听 :80');cl.innerHTML=out.map(x=>`<div>${x}</div>`).join('');
  const extra=[...on].filter(c=>!need.includes(c));
  if(fail){m.className='msg bad';m.innerHTML=`缺少 <b>${fail}</b>。看报错的那一步需要哪项能力。`}
  else if(extra.length){m.className='msg';m.innerHTML=`能运行，但多给了 <b>${extra.join('、')}</b>。服务用不到它们，被攻破时却能被利用。`+(extra.includes('SYS_ADMIN')?' SYS_ADMIN 几乎等于 root，是容器逃逸最常用的能力。':'')}
  else{m.className='msg ok';m.innerHTML='正好四项，最小权限。对比默认的 14 项，攻击者能用的少了一大半。'}}draw()})();
Term(document.getElementById('t4'),[
['docker inspect web -f "{{.HostConfig.CapDrop}} {{.HostConfig.CapAdd}} {{.HostConfig.SecurityOpt}}"','[ALL] [CHOWN SETUID SETGID NET_BIND_SERVICE] [no-new-privileges]','审计现有容器的安全配置。'],
['grep Cap /proc/$(docker inspect -f {{.State.Pid}} web)/status','CapPrm:\t00000000000004c1\nCapEff:\t00000000000004c1\nCapBnd:\t00000000000004c1','从宿主机直接看进程的能力位图，<code>capsh --decode=04c1</code> 解码成名字。Bnd 是上限，后续再怎么提权也超不过它。'],
['docker run --rm --security-opt seccomp=profile.json app','','使用自定义 seccomp 配置。可以从 Docker 默认配置（moby 仓库 profiles/seccomp/default.json）出发再删减。<code>seccomp=unconfined</code> 会完全关闭过滤，只在调试时用。'],
['docker run --rm --security-opt no-new-privileges alpine grep NoNewPrivs /proc/self/status','NoNewPrivs:\t1','NoNewPrivs=1 表示不能通过 exec 的 setuid 位或文件 capabilities 获得额外权限；它不会撤销进程已有的 root 权限。以 root 执行 su nobody 不能证明它阻止了提权。'],
['dockerd-rootless-setuptool.sh install','[INFO] Installed docker.service successfully.\n[INFO] export DOCKER_HOST=unix:///run/user/1000/docker.sock','以当前用户安装 rootless Docker。之后 <code>docker info</code> 的 SecurityOptions 里会出现 <code>rootless</code>。'],
['cat /etc/docker/daemon.json','{ "userns-remap": "default", "no-new-privileges": true }','守护进程级别默认：所有容器启用 user namespace 映射和 no-new-privileges。']]);
Quiz(document.getElementById('qs'),[
['容器里的 root（未启用 user namespace）在宿主机上是？',['普通用户','uid 0，只是受到限制','nobody'],1,'限制来自 capabilities、seccomp 等。'],
['最稳妥的 capabilities 用法是？',['保持默认','--cap-add ALL','--cap-drop ALL 再按需添加'],2,'最小权限。'],
['--privileged 会怎样？',['只开放网络','关闭大部分隔离，接近宿主机 root','只允许 ping'],1,'不要用于普通服务。'],
['rootless 模式的主要好处是？',['更快','dockerd 本身以普通用户运行，降低权限暴露','可以绑定 80 端口'],1,'dockerd 本身也不是 root。']]);
