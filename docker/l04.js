const ln=(t,c='')=>({w:520,h:36,cls:'blk '+c,html:'<span style="padding:0 14px;width:100%;text-align:left">'+t+'</span>'});
const D=['FROM python:3.12-slim','ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1','WORKDIR /app','COPY requirements.txt .','RUN pip install --no-cache-dir -r requirements.txt','COPY . .','RUN useradd --create-home --uid 10001 app','USER app','EXPOSE 8000','CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]'];
const els={};D.forEach((t,i)=>els['d'+i]=ln(t));els.n={w:300,cls:'tag'};
const pos=i=>[0,i*44];const allD={};D.forEach((_,i)=>allD['d'+i]=pos(i));
const hl=(ix,note,y)=>{const s={...allD};ix.forEach(i=>s['d'+i]=[0,i*44,{cls:'blk sig'}]);s.n=[560,y,{html:'<div style="white-space:normal;width:300px;font-size:13px;line-height:1.6">'+note+'</div>'}];return s};
Player(document.getElementById('p1'),{els,scenes:[
 {t:'基础镜像：slim',p:'<code>python:3.12-slim</code> 约 130 MB，基于 Debian，兼容性好。完整版 <code>python:3.12</code> 约 1 GB，带了编译工具，运行时用不到。',set:hl([0],'<b>slim</b> ≈ 130 MB<br>完整版 ≈ 1 GB',0)},
 {t:'两个环境变量',p:'<code>PYTHONUNBUFFERED=1</code>：日志立刻写到 stdout，<code>docker logs</code> 能马上看到。<code>PYTHONDONTWRITEBYTECODE=1</code>：不生成 .pyc 文件。',set:hl([1],'日志不缓冲<br>不写 .pyc',44)},
 {t:'依赖和代码',p:'第 3 课的顺序：先依赖，后代码。<code>--no-cache-dir</code> 不保存 pip 下载缓存，镜像小几十 MB。',set:hl([3,4,5],'先依赖，后代码<br>不留 pip 缓存',176)},
 {t:'非 root 用户',p:'默认以 root 运行。创建普通用户并用 <code>USER</code> 切换，之后的指令和容器进程都以这个用户运行。',set:hl([6,7],'uid 10001<br>不是 root',264)},
 {t:'EXPOSE 与 CMD',p:'<code>EXPOSE</code> 只是说明，不会打开端口。<code>CMD</code> 用 JSON 数组（exec 形式），监听 <b>0.0.0.0</b>。原因见后面两节。',d:3600,set:hl([8,9],'EXPOSE 只是文档<br>监听 0.0.0.0',352)}]});
/* 02 networking toggle */
(()=>{let h='127.0.0.1',p='none';const H=document.getElementById('h2'),PP=document.getElementById('pp2'),net=document.getElementById('net2'),o=document.getElementById('o2');
 const opts=(el,list,get,set)=>list.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)});
 opts(H,[['127.0.0.1','127.0.0.1'],['0.0.0.0','0.0.0.0']],()=>h,v=>h=v);opts(PP,[['none','不加 -p'],['8000:8000','-p 8000:8000'],['8000:80','-p 8000:80']],()=>p,v=>p=v);
 function draw(){[...H.children].forEach(b=>b.classList.toggle('pri',b.dataset.v===h));[...PP.children].forEach(b=>b.classList.toggle('pri',b.dataset.v===p));
  const okP=p==='8000:8000',okH=h==='0.0.0.0',seg=(t,ok)=>`<span class="pill ${ok===null?'mute':ok?'ok':'bad'}">${t}</span>`;
  net.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${seg('宿主机 localhost:8000',null)} → ${seg(p==='none'?'没有端口映射':'映射到容器 :'+p.split(':')[1],okP)} → ${seg('容器 eth0 172.17.0.2',okP?okH:null)} → ${seg('uvicorn @ '+h+':8000',okP&&okH)}</div>`;
  let r;if(p==='none')r='<span class="e">curl: (7) Failed to connect to localhost port 8000: Connection refused</span>\n没有 -p，宿主机的 8000 端口上什么都没有。EXPOSE 不会自动映射。';
  else if(p==='8000:80')r='<span class="e">curl: (56) Recv failure: Connection reset by peer</span>\n请求被转发到容器的 80 端口，但应用监听的是 8000。冒号右边是<b>容器</b>端口。';
  else if(!okH)r='<span class="e">curl: (56) Recv failure: Connection reset by peer</span>\n请求从 eth0 进入容器，但应用只监听容器自己的回环地址 127.0.0.1。容器有自己的网络命名空间，它的 127.0.0.1 不是宿主机的。';
  else r='<b>$ curl localhost:8000/health</b>\n<span class="o">{"ok":true}</span>\n宿主机端口 → 容器端口 → 监听所有网卡的应用，全部接通。';
  o.innerHTML=r}draw()})();
/* 03 PID 1 */
const B=(t,c,w=230)=>({w,h:44,cls:'blk '+c,html:t});
Player(document.getElementById('p3'),{els:{stop:{cls:'pill mute',html:'$ docker stop api'},sig:{cls:'pill sig',html:'SIGTERM'},kill:{cls:'pill bad',html:'10 秒后 SIGKILL'},
 sh:B('PID 1 · /bin/sh -c "uvicorn …"','dim',300),app:B('uvicorn','',230),app1:B('PID 1 · uvicorn','',300),res:{w:320,cls:'tag'},lab:{w:300,cls:'tag'}},scenes:[
 {t:'shell 形式：CMD uvicorn …',p:'不写成 JSON 数组时，Docker 用 <code>/bin/sh -c</code> 启动命令。图中模拟 shell 保留为 PID 1、应用为子进程的情形；某些 shell 会优化为 exec，应先查看真实进程树。',set:{lab:[0,-40,{html:'<b>CMD uvicorn main:app …</b>'}],sh:[0,0],app:[70,70]}},
 {t:'信号停在 sh',p:'本例停止信号为 SIGTERM。若 PID 1 的 shell 没有 exec 或转发它，uvicorn 就收不到停止请求。停止信号可以由 STOPSIGNAL 或运行参数覆盖。',set:{lab:[0,-40,{html:'<b>CMD uvicorn main:app …</b>'}],stop:[400,8],sig:[310,8],sh:[0,0],app:[70,70]}},
 {t:'10 秒后被强制杀死',p:'超时后 Docker 发 SIGKILL。正在处理的请求被中断，数据库连接没有正常关闭。',d:3600,set:{lab:[0,-40,{html:'<b>CMD uvicorn main:app …</b>'}],kill:[310,8],sh:[0,0,{cls:'blk dim',html:'PID 1 · sh（被杀死）'}],app:[70,70,{cls:'blk dim',html:'uvicorn（被杀死）'}],res:[0,140,{html:'停止耗时 <b>10 秒</b>'}]}},
 {t:'exec 形式：CMD ["uvicorn", …]',p:'JSON 数组形式不经过 shell，uvicorn 自己就是 PID 1，直接收到 SIGTERM：停止接收新请求、处理完当前请求后退出。',d:3600,set:{lab:[0,-40,{html:'<b>CMD ["uvicorn","main:app",…]</b>'}],stop:[400,8],sig:[310,8],app1:[0,0],res:[0,70,{html:'应用收到信号；还需验证请求完成与清理日志'}]}}]});
Term(document.getElementById('t4'),[
['docker build -t api-demo:1.0 .','[+] Building 18.3s (11/11) FINISHED\n => [4/7] RUN pip install --no-cache-dir -r requirements.txt   12.9s\n => [6/7] RUN useradd --create-home --uid 10001 app             0.4s\n => naming to docker.io/library/api-demo:1.0','标签用版本号，不要只用 latest。第 10 课会讲标签策略。'],
['docker run -d --name api -p 8000:8000 --env-file .env api-demo:1.0','9e2c7d1a5f60b3…','<code>--env-file</code> 从文件读取环境变量（数据库地址等）。配置在运行时注入，同一个镜像可以用于测试和生产。第 9 课详细讲。'],
['docker logs api','INFO:     Started server process [1]\nINFO:     Waiting for application startup.\nINFO:     Application startup complete.\nINFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)','注意 <b>process [1]</b>：uvicorn 是 PID 1。<b>0.0.0.0:8000</b>：监听所有网卡。'],
['docker exec api id','uid=10001(app) gid=10001(app) groups=10001(app)','进程以非 root 用户运行。'],
['docker port api','8000/tcp -> 0.0.0.0:8000\n8000/tcp -> [::]:8000','查看端口映射。<code>0.0.0.0:8000</code> 表示宿主机所有网卡的 8000 端口都会转发进来。只想本机访问时用 <code>-p 127.0.0.1:8000:8000</code>。']]);
Quiz(document.getElementById('qs'),[
['容器运行正常，docker logs 显示 “Uvicorn running on http://127.0.0.1:8000”，宿主机访问 localhost:8000 失败。原因？',['没写 EXPOSE','应用只监听容器自己的回环地址','端口被宿主机防火墙拦截'],1,'改成 --host 0.0.0.0。'],
['Dockerfile 里写了 EXPOSE 8000，但运行时没加 -p。宿主机能访问吗？',['能','不能，EXPOSE 只是说明','只能用 HTTP 访问'],1,'需要 -p 或 -P 才会发布端口。'],
['docker stop 总是要等 10 秒，最可能的原因？',['镜像太大','CMD 用了 shell 形式，PID 1 是 sh','容器没有健康检查'],1,'换成 exec 形式，或在入口脚本里用 exec 启动应用。'],
['为什么用非 root 用户运行容器？',['速度更快','限制容器被攻破后的权限','Docker 要求必须这样做'],1,'默认 root。降低权限是纵深防御的一部分，第 19 课会深入。']]);
