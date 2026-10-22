const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('发送方','等待响应……','sig'),b:B('接收方',''),x1:P('① 请求丢失','bad'),x2:P('② 请求在排队','sig'),x3:P('③ 接收方崩溃','bad'),x4:P('④ 接收方暂停（GC）','sig'),x5:P('⑤ 已处理，响应丢失','bad'),x6:P('⑥ 响应在排队','sig'),q:P('发送方看到的都一样：没有响应','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'发出请求',p:'发送方发出请求，然后等待。',set:{a:[0,60],b:[380,60]}},
 {t:'可能的情况',p:'请求和响应在路上可能遇到各种问题。',d:3800,set:{a:[0,60],b:[380,60],x1:[160,0],x2:[160,40],x3:[160,80],x4:[160,120],x5:[160,160],x6:[160,200]}},
 {t:'无法区分',p:'从发送方的角度看，这六种情况完全一样：没有收到响应。超时之后也不知道请求是否被处理了。',d:4000,set:{a:[0,60,B('发送方','超时','bad')],b:[380,60,B('接收方','？')],q:[100,140]}}]});
const e2={s:B('发送方','',''),sw:B('交换机队列','多个端口同时发往同一目标'),os:B('内核接收队列','CPU 全忙时排队'),vm:B('虚拟机调度','其他虚拟机占用 CPU'),app:B('应用','GC 停顿 / 线程池满'),n:P('每一层的排队都可能无限增长：延迟没有上界','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'网络',p:'多个发送方同时向一个目标发送，交换机端口排队；队列满了就丢包，TCP 重传又增加延迟。',set:{s:[0,0],sw:[160,0]}},
 {t:'接收端',p:'包到达后，可能在内核队列、虚拟机调度器中等待。',d:3400,set:{s:[0,0],sw:[160,0],os:[320,0],vm:[320,70]}},
 {t:'应用',p:'应用自己也可能在 GC 或排队等待线程。',d:3200,set:{s:[0,0],sw:[160,0],os:[320,0],vm:[320,70],app:[320,140],n:[0,150]}}]});
(()=>{const S=[[5,'3.0%'],[50,'1.1%'],[527,'0.001%'],[5000,'约 0']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,fa])=>{const b=document.createElement('button');b.className='btn';b.textContent=`超时 ${t} ms`;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  p.textContent=`响应时间：p50 2 ms，p99 67 ms，p99.9 264 ms（来自 to.py）\n健康节点的请求被判为超时的比例：${fa}\n节点真的宕机时，发现故障至少需要 ${t} ms（通常还要连续多次超时）`;
  m.className='msg '+(t<100?'bad':t>3000?'sig':'ok');m.innerHTML=t<100?'太短：健康但暂时变慢的节点被频繁判为死亡，引发不必要的故障切换。':t>3000?'太长：节点真的宕机时，用户要等很久。':'约为 p99.9 的两倍：误判很少，发现也不算慢。应根据测得的分布调整。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择超时时间。'})();
Term(document.getElementById('t4'),[
['curl -m 2 http://10.0.0.7:8080/health','curl: (7) Failed to connect to 10.0.0.7 port 8080: Connection refused','明确的反馈：机器在，但端口上没有进程（收到 RST）。'],
['curl -m 2 http://10.0.0.8:8080/health','curl: (28) Connection timed out after 2001 milliseconds','不明确：机器宕机？网络分区？防火墙丢包？只知道没有响应。'],
['curl -m 2 http://10.0.0.9:8080/slow','curl: (28) Operation timed out after 2000 milliseconds with 0 bytes received','连接成功、请求已发出，但没有响应：请求可能已经在执行。']]);
Quiz(document.getElementById('qs'),[
['部分失效的特点？',['整个系统同时崩溃','一部分失效、另一部分正常，且结果不确定','只发生在硬件上'],1,''],
['请求超时后，发送方能确定什么？',['请求没有被处理','请求已被处理','什么都不能确定'],2,''],
['TCP 的确认说明了什么？',['对方应用已处理','对方内核收到了数据包','对方已持久化'],1,''],
['超时设得太短的风险？',['故障发现太慢','健康节点被误判死亡，可能引发级联故障','没有风险'],1,''],
['数据中心网络延迟没有上界的主要原因？',['光速','分组交换网络中的排队','TCP 校验和'],1,'']]);
