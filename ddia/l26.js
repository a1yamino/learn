const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={p0:B('分区 0','m1 m3 m5'),p1:B('分区 1','m2 m4 m6'),a1:B('analytics 消费者 1','读分区 0','ok',170),a2:B('analytics 消费者 2','读分区 1','ok',170),s:B('search-index','读分区 0 和 1','sig',170),n:P('组内负载均衡，组间扇出','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'主题',p:'一个主题有两个分区，消息按 key 分配到分区。',set:{p0:[0,0],p1:[0,90]}},
 {t:'负载均衡',p:'同一个消费者组内，每个分区只分给一个消费者。',d:3200,set:{p0:[0,0],p1:[0,90],a1:[240,0],a2:[240,90]}},
 {t:'扇出',p:'另一个消费者组独立地读取全部消息，各自维护位移。',d:3400,set:{p0:[0,0],p1:[0,90],a1:[240,0],a2:[240,90],s:[240,180],n:[0,190]}}]});
const T=(t,c='')=>({w:56,h:32,cls:'blk '+c,html:t});
const e2={w0:{w:250,h:110,cls:'frame',html:'<i>窗口 [0,10)</i>'},w1:{w:200,h:110,cls:'frame',html:'<i>窗口 [10,20)</i>'},a:T('t=1'),b:T('t=3'),c:T('t=7'),d:T('t=12'),l:T('t=4','bad'),wm:P('水位线 = 12 − 2 = 10 → 关闭 [0,10)，合计 23','sig'),late:P('事件时间 4 的事件在处理时间 13 才到：迟到','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'按事件时间',p:'事件按发生时间落入窗口，而不是到达时间。',set:{w0:[0,0],w1:[270,0],a:[10,40],b:[75,40],c:[140,40]}},
 {t:'水位线',p:'看到事件时间 12 的事件后，认为 10 之前的事件都已到达（允许 2 秒延迟），关闭第一个窗口。',d:3800,set:{w0:[0,0],w1:[270,0],a:[10,40],b:[75,40],c:[140,40],d:[280,40],wm:[0,130]}},
 {t:'迟到',p:'一个事件时间为 4 的事件现在才到：窗口已经关闭。可以丢弃、发到侧输出，或者发出修正结果。',d:3800,set:{w0:[0,0],w1:[270,0],a:[10,40],b:[75,40],c:[140,40],d:[280,40],l:[190,40],late:[0,130]}}]});
(()=>{const ev=[1,2,8,9,14,31,33,52];const S=[['滚动窗口 10 秒',()=>{const g={};ev.forEach(t=>{const w=Math.floor(t/10)*10;(g[w]=g[w]||[]).push(t)});return Object.entries(g).map(([w,v])=>`[${w},${+w+10}): ${v.join(' ')}`)},'固定长度、互不重叠，每个事件只属于一个窗口。'],['跳跃窗口 20 秒，步长 10 秒',()=>{const L=[];for(let s=-10;s<=50;s+=10){const v=ev.filter(t=>t>=s&&t<s+20);if(v.length)L.push(`[${s},${s+20}): ${v.join(' ')}`)}return L},'窗口相互重叠，一个事件属于多个窗口：适合平滑的趋势。'],['会话窗口，间隔 10 秒',()=>{const L=[];let cur=[ev[0]];for(let i=1;i<ev.length;i++){if(ev[i]-ev[i-1]>10){L.push(cur);cur=[]}cur.push(ev[i])}L.push(cur);return L.map(v=>`会话 [${v[0]},${v[v.length-1]}]: ${v.join(' ')}`)},'没有固定长度：事件之间的空闲超过间隔就切分，适合用户会话分析。'],['滑动窗口 5 秒（以每个事件为终点）',()=>ev.map(t=>`以 ${t} 结尾: ${ev.filter(x=>x>t-5&&x<=t).join(' ')}`),'包含任意时刻前 5 秒内的所有事件：适合“1 分钟内超过 5 次”这类规则。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,f,msg])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent='事件时间：'+ev.join(' ')+'\n'+f().join('\n');m.className='msg ok';m.innerHTML=msg});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择窗口类型。'})();
Term(document.getElementById('t4'),[
['# 客户端 1：db.set(x, A) …… search.set(x, A)\n# 客户端 2：        db.set(x, B) …… search.set(x, B)\n# 实际到达顺序：db: A, B    search: B, A','数据库中 x = B\n搜索索引中 x = A\n（永久不一致，且没有任何错误）','双写的竞争条件：两个系统收到写入的顺序不同。'],
['# CDC：只写数据库，搜索索引按数据库的提交顺序应用变更\ndb.set(x, A); db.set(x, B)  →  变更日志: x=A, x=B  →  search','数据库中 x = B\n搜索索引中 x = B','所有派生系统按同一个顺序处理同一个日志，最终一致。']]);
Quiz(document.getElementById('qs'),[
['基于日志的消息代理与传统代理的主要区别？',['日志式代理读取后不删除消息，可以重放','传统代理更快','日志式代理不保证顺序'],0,''],
['同一个消费者组内的多个消费者？',['每个都收到全部消息','分摊分区（负载均衡）','只有一个能工作'],1,''],
['双写的主要问题？',['太慢','并发写入的到达顺序不同导致永久不一致，且可能部分失败','需要事务'],1,''],
['水位线的作用？',['限流','判断某个事件时间之前的事件大概已经到齐，可以关闭窗口','去重'],1,''],
['流处理结果写入外部数据库时，如何避免重复？',['检查点就够了','原子提交或幂等写入','增加分区'],1,'']]);
