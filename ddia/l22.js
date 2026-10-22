const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c1:B('客户端 1','持有租约（剩 10 秒）','ok'),c2:B('客户端 2','等待租约'),ls:B('锁服务','','sig'),st:B('存储',''),gc:P('GC 停顿 15 秒……','bad'),x:P('两个客户端都以为自己持有锁','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'持有租约',p:'客户端 1 检查：租约还剩 10 秒，足够完成写入。',set:{c1:[0,0],c2:[0,120],ls:[220,60],st:[420,60]}},
 {t:'暂停',p:'就在检查之后，客户端 1 被 GC 暂停了 15 秒。它自己完全不知道。',d:3400,set:{c1:[0,0,B('客户端 1','暂停中','bad')],c2:[0,120],ls:[220,60],st:[420,60],gc:[0,60]}},
 {t:'租约转移',p:'租约过期，锁服务把它授予客户端 2，客户端 2 开始写入。',d:3400,set:{c1:[0,0,B('客户端 1','暂停中','bad')],c2:[0,120,B('客户端 2','持有租约','ok')],ls:[220,60],st:[420,60,B('存储','客户端 2 写入','ok')]}},
 {t:'醒来',p:'客户端 1 醒来，继续执行“已经检查过”的写入：数据损坏。',d:3600,set:{c1:[0,0,B('客户端 1','醒来并写入','bad')],c2:[0,120,B('客户端 2','持有租约','ok')],ls:[220,60],st:[420,60,B('存储','两者交错写入','bad')],x:[150,170]}}]});
const e2={c1:B('客户端 1','令牌 33'),c2:B('客户端 2','令牌 34'),st:B('存储','已见最大令牌：—','sig',170),a:P('写入（令牌 34）→ 接受','ok'),r:P('写入（令牌 33）→ 拒绝','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'令牌',p:'锁服务每次授予锁时给出一个更大的令牌。',set:{c1:[0,0],c2:[0,120],st:[260,60]}},
 {t:'新持有者写入',p:'存储服务记录令牌 34。',d:3000,set:{c1:[0,0],c2:[0,120],st:[260,60,B('存储','已见最大令牌：34','sig',170)],a:[0,180]}},
 {t:'旧持有者被拒',p:'暂停醒来的客户端 1 带着令牌 33 写入，被拒绝。',d:3400,set:{c1:[0,0,B('客户端 1','令牌 33','bad')],c2:[0,120],st:[260,60,B('存储','已见最大令牌：34','sig',170)],a:[0,180],r:[0,60]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [[0,2],[-1,2],[-3,2],[-10,2],[5,2]].forEach(([sk,gap])=>{const b=document.createElement('button');b.className='btn';b.textContent=`B 的时钟 ${sk>0?'+':''}${sk} ms`;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  const ta=1000,tb=1000+gap+sk;const win=tb>ta?2:1;p.textContent=`真实时间 1000 ms：A 写 x=1，时间戳 ${ta}\n真实时间 1002 ms：B 写 x=2，时间戳 ${tb}\nLWW 保留时间戳较大者：x=${win}`;
  m.className='msg '+(win===2?'ok':'bad');m.innerHTML=win===2?'后发生的写入保留下来了。':'后发生的写入被静默丢弃：时钟偏差大于两次写入的间隔。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='A 的时钟准确，选择 B 的时钟偏差（两次写入真实间隔 2 ms）。'})();
Term(document.getElementById('t4'),[
['python3 -c "import time; print(time.time(), time.monotonic())"','1761187200.123456 81234.567890','日历时钟：可与其他机器比较（有误差），可能跳变。单调时钟：只适合在本机测量时长。'],
['timedatectl show -p NTPSynchronized','NTPSynchronized=yes','是否已与 NTP 同步——即使是 yes，误差也可能有几毫秒。']]);
Quiz(document.getElementById('qs'),[
['测量超时应使用？',['日历时钟','单调时钟','NTP 时间'],1,''],
['时钟偏差对 LWW 的影响？',['没有影响','后发生的写入可能被丢弃','只影响读'],1,''],
['进程暂停的危险在于？',['进程自己知道并会补偿','进程不知道自己被暂停过，基于过时的判断行动','只发生在虚拟机'],1,''],
['fencing 令牌由谁检查？',['锁的持有者','受保护的存储服务','NTP 服务器'],1,''],
['“不会出现两个主节点”属于？',['安全性','活性','性能'],0,'']]);
