const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('alice 发帖','posts 表'),f1:B('bob 的时间线',''),f2:B('carol 的时间线',''),f3:B('dave 的时间线',''),r:B('bob 打开首页',''),x:P('读时：查 200 个关注对象并归并','bad'),y:P('读一个键','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'读时合并',p:'发帖只写一次；读首页时查询所有关注对象的帖子再排序。',set:{a:[0,0],r:[0,120],x:[150,130]}},
 {t:'写时扇出',p:'发帖时把帖子 ID 写入每个粉丝的时间线缓存。',d:3400,set:{a:[0,0],f1:[200,0,B('bob 的时间线','+1','ok')],f2:[200,60,B('carol 的时间线','+1','ok')],f3:[200,120,B('dave 的时间线','+1','ok')]}},
 {t:'读变便宜',p:'读首页只需读取一个预先算好的列表。',d:3200,set:{a:[0,0],f1:[200,0,B('bob 的时间线','+1','ok')],f2:[200,60],f3:[200,120],r:[400,0],y:[400,60]}},
 {t:'名人',p:'粉丝上亿的账号扇出代价太大：名人帖子在读时单独合并。',d:3600,set:{a:[0,0,B('明星发帖','1 亿粉丝','bad')],f1:[200,0],f2:[200,60],f3:[200,120],x:[0,190,P('扇出 1 亿次写入','bad')]}}]});
const e2={pg:B('页面请求','',''),b1:B('后端 1','10 ms','ok',90),b2:B('后端 2','12 ms','ok',90),b3:B('后端 3','800 ms','bad',90),b4:B('后端 4','9 ms','ok',90),r:P('页面 = 最慢的那个','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'并行调用',p:'一个页面并行调用多个后端服务。',set:{pg:[0,60],b1:[200,0],b2:[200,55],b3:[200,110],b4:[200,165]}},
 {t:'等待最慢',p:'页面要等所有后端返回：只要有一个慢，整个页面就慢。',d:3400,set:{pg:[0,60,B('页面请求','800 ms','bad')],b1:[200,0],b2:[200,55],b3:[200,110],b4:[200,165],r:[320,115]}}]});
(()=>{const F=[30,1000,100000,10000000,80000000];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 F.forEach(f=>{const b=document.createElement('button');b.className='btn';b.textContent=f.toLocaleString()+' 粉丝';b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  p.textContent=`读时合并：发帖写 1 次；每个粉丝刷新时都要查询此账号\n写时扇出：发帖写 ${f.toLocaleString()} 次；粉丝读 1 个键\n若每次时间线写入 0.1 ms、单线程：扇出耗时约 ${(f*0.0001).toLocaleString(undefined,{maximumFractionDigits:1})} 秒`;
  const big=f>=100000;m.className='msg '+(big?'bad':'ok');m.innerHTML=big?'粉丝太多，扇出代价过高：用读时合并处理此账号。':'写时扇出合适。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择粉丝数。'})();
Term(document.getElementById('t4'),[
['python3 lat.py','平均     30.0 ms\np50       20.0 ms\np95       57.1 ms\np99       93.1 ms\np99.9   1620.5 ms','平均值 30 ms 不对应任何真实用户：多数人约 20 ms，千分之一的人要等 1.6 秒。'],
['python3 fan.py','调用   1 个后端：页面变慢的概率 1.0%\n调用  10 个后端：页面变慢的概率 9.6%\n调用 100 个后端：页面变慢的概率 63.4%','假设各后端变慢相互独立，且页面等待全部结果；相关故障时要用实际联合分布估算。']]);
Quiz(document.getElementById('qs'),[
['读远多于写时，哪种时间线方案通常更合适？',['读时合并','写时扇出','两者一样'],1,'把工作从读路径移到写路径。'],
['名人账号的问题本质上是？',['负载分布偏斜','网络慢','缓存太小'],0,'少数账号粉丝极多，扇出代价不成比例。'],
['为什么用百分位而不是平均值？',['平均值计算慢','平均值被极端值拉偏，不反映用户体验','百分位更小'],1,''],
['页面等待全部 100 个后端，各有 1% 慢请求且相互独立，页面变慢概率约为？',['1%','63%','100%'],1,'1 − 0.99^100 ≈ 0.63。'],
['如何汇总多台机器的 p99？',['对各机器 p99 求平均','合并直方图后再计算','取最大值'],1,'百分位不能平均。']]);
