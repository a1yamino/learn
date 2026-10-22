const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('客户端 A','WATCH stock','',150),q:{w:180,h:110,cls:'frame',html:'<i>A 的事务队列</i>'},c1:P('DECR stock'),c2:P('INCR sold'),b:B('客户端 B','SET stock 99','sig',150),ex:P('EXEC → 两条命令依次执行，中间无插入','ok'),nil:P('EXEC → (nil)：stock 被改过，什么都不执行','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'入队',p:'MULTI 后的命令只返回 QUEUED，暂存在服务器上这个连接的队列里。',set:{a:[0,0],q:[200,0],c1:[210,30],c2:[210,66]}},
 {t:'执行',p:'EXEC 时按顺序一次执行完，其他客户端的命令只能排在前面或后面。',d:3600,set:{a:[0,0],q:[200,0],c1:[210,30],c2:[210,66],ex:[0,130]}},
 {t:'WATCH 冲突',p:'如果 A 在 MULTI 前 WATCH 了 stock，而 B 在 EXEC 前修改了它，A 的 EXEC 返回 nil，整个事务被放弃，A 应该重新读取再重试。',d:4400,set:{a:[0,0],q:[200,0],c1:[210,30],c2:[210,66],b:[0,60],nil:[0,130]}}]});
(()=>{const Q=[['正常','MULTI → OK\nINCR n → QUEUED\nINCR m → QUEUED\nEXEC → 1) 1  2) 1','ok','全部执行。'],
['运行时错误','MULTI\nINCR n → QUEUED\nLPUSH s x → QUEUED   （s 是字符串）\nINCR n → QUEUED\nEXEC → 1) 1  2) WRONGTYPE…  3) 2','bad','出错的那条失败，其余照常执行，不回滚。'],
['语法错误','MULTI\nINCR n → QUEUED\nINCR → (error) wrong number of arguments\nEXEC → EXECABORT Transaction discarded','sig','入队时就能发现的错误会让整个事务被放弃。'],
['DISCARD','MULTI\nINCR n → QUEUED\nDISCARD → OK\n（什么都没执行）','sig','主动放弃队列。'],
['WATCH 的键被改','WATCH stock\nMULTI\nDECR stock → QUEUED\n（另一个客户端 SET stock 99）\nEXEC → (nil)','sig','乐观锁失败，由客户端重试。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='点击上面的情况。'})();
const e2={s:B('stock','5','',110),a:B('请求 A','扣 3','',110),b:B('请求 B','扣 3','',110),r1:P('非原子：两人都读到 5，都判断够，都扣 → -1','bad'),r2:P('脚本：A 整体执行完（剩 2），B 再执行，判断不够返回 -1','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'两次往返',p:'客户端先 GET 再 DECRBY：两个请求的 GET 可能都在任一 DECRBY 之前执行。',set:{s:[0,0],a:[150,0],b:[150,60],r1:[0,120]}},
 {t:'一个脚本',p:'把读、判断、写放进一个脚本，Redis 单线程执行它，期间不会有别的命令插入。',d:4200,set:{s:[0,0,B('stock','2','ok',110)],a:[150,0],b:[150,60],r2:[0,120]}}]});
Term(document.getElementById('t4'),[
['SCRIPT EXISTS a5260dd66ce02462c5b5231c727b3f7772c0bcc5','1) (integer) 1','脚本是否在缓存中。'],
['FUNCTION LIST','1) 1) "library_name"\n   2) "shop"\n   …','列出已加载的函数库。'],
['FUNCTION DUMP','"\\xf5\\xc3@…"','导出函数库，可用 FUNCTION RESTORE 迁移。'],
['SCRIPT KILL','OK','终止一个还没有写入的长时间脚本。'],
['CONFIG GET busy-reply-threshold','1) "busy-reply-threshold"\n2) "5000"','脚本运行超过这么多毫秒后，其他命令返回 BUSY。']]);
Quiz(document.getElementById('qs'),[
['EXEC 时第二条命令 WRONGTYPE，第三条会执行吗？',['会，不回滚','不会，全部回滚','只执行第一条'],0,''],
['WATCH 的键被修改后 EXEC 返回？',['错误','(nil)','QUEUED'],1,''],
['脚本中的键为什么要通过 KEYS 传入？',['性能','让 Cluster 能路由并检查同槽','语法要求'],1,''],
['Functions 与 EVAL 脚本的主要区别？',['更快','会持久化并复制，按名字调用','可以跨槽'],1,''],
['为什么脚本必须短？',['执行期间阻塞整个服务器','Lua 很慢','会丢数据'],0,'']]);
