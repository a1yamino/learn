const P=(t,c='sig')=>({cls:'pill '+c,html:t});const V=(t,c='')=>({w:84,h:36,cls:'blk '+c,html:t});
const base={cn:[0,0],zj:[0,70],gd:[110,70],hz:[0,140],sz:[110,140],xh:[0,210],jp:[330,0],tk:[330,70],a:[220,210],b:[330,210]};
const e={cn:V('中国'),zj:V('浙江'),gd:V('广东'),hz:V('杭州'),sz:V('深圳'),xh:V('西湖区'),jp:V('日本'),tk:V('东京都'),a:V('小林'),b:V('小王'),n1:P('WITHIN','sig'),n2:P('BORN_IN →','sig'),n3:P('LIVES_IN →','sig')};
const S=(o)=>Object.fromEntries(Object.entries(base).map(([k,v])=>[k,o&&o[k]?[...v,V(e[k].html,o[k])]:v]));
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'顶点',p:'地点和人都是顶点，类型不同也可以放在一张图里。',set:S()},
 {t:'WITHIN 边',p:'地点之间用 WITHIN 边形成层级：区 → 市 → 省 → 国家。',d:3200,set:{...S({zj:'sig',gd:'sig',hz:'sig',sz:'sig',xh:'sig',tk:'sig'}),n1:[200,20]}},
 {t:'人的边',p:'小林出生在西湖区、住在东京都；小王出生在深圳、住在东京都。',d:3400,set:{...S({a:'ok',b:'ok',xh:'sig',sz:'sig',tk:'sig'}),n2:[200,140],n3:[230,110]}},
 {t:'遍历',p:'查询“出生在中国”的人：从中国出发沿 WITHIN 反向走任意步，再找 BORN_IN 指向这些地点的人。',d:3800,set:S({cn:'ok',zj:'ok',gd:'ok',hz:'ok',sz:'ok',xh:'ok',a:'ok',b:'ok'})}]});
const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e2={c:B('命令','加入购物车 B'),ev:{w:170,h:110,cls:'frame',html:'<i>事件日志</i><br>1 added A<br>2 added B<br>3 removed A'},v1:B('购物车视图','{B}','ok'),v2:B('删除分析视图','A 被删除 1 次','ok'),v3:B('新视图','从头重放即可','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'命令 → 事件',p:'命令经过校验后变成不可变事件，追加到日志。',set:{c:[0,0],ev:[180,0]}},
 {t:'读视图',p:'事件被折叠成为读取优化的视图（CQRS 的读端）。',d:3200,set:{c:[0,0],ev:[180,0],v1:[380,0],v2:[380,60]}},
 {t:'新需求',p:'需要新的视图时，从第一个事件重放即可。',d:3200,set:{c:[0,0],ev:[180,0],v1:[380,0],v2:[380,60],v3:[380,120]}}]});
(()=>{const Q=[['出生在中国的人','中国 ← 浙江、广东 ← 杭州、深圳 ← 西湖区\nBORN_IN 指向这些地点：小林（西湖区）、小王（深圳）','2 人'],['住在日本的人','日本 ← 东京都\nLIVES_IN 指向：小林、小王','2 人'],['出生在浙江的人','浙江 ← 杭州 ← 西湖区\nBORN_IN：小林','1 人'],['广东的下级地点','广东 ← 深圳（1 步）','1 个地点']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t,r,n])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r;m.className='msg ok';m.innerHTML='结果：'+n+'。遍历深度事先未知，所以需要递归。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个查询。'})();
Term(document.getElementById('t4'),[
['MATCH (p:Person)-[:BORN_IN]->()-[:WITHIN*0..]->(:Location {name:\'中国\'}),\n      (p)-[:LIVES_IN]->()-[:WITHIN*0..]->(:Location {name:\'东京都\'})\nRETURN p.name','小林\n小王','Cypher：一行模式描述可变长度路径。'],
['WITH RECURSIVE in_china(id) AS (…), in_tokyo(id) AS (…)\nSELECT p.name FROM vertices p JOIN edges … ;','小林\n小王','SQL：同样能做，但需要几十行。'],
['within(L, L).\nwithin(L, Top) :- edge(L, \'within\', Mid), within(Mid, Top).\nanswer(P) :- born_in(P, B), within(B, \'中国\'), lives_in(P, R), within(R, \'东京都\').','answer(小林). answer(小王).','Datalog：用可递归的规则组合出新事实。']]);
Quiz(document.getElementById('qs'),[
['图模型最擅长哪类查询？',['按主键取一行','深度不确定的关系遍历','全表聚合'],1,''],
['Cypher 中 -[:WITHIN*0..]-> 表示？',['恰好一条边','沿 WITHIN 边走零步或多步','禁止 WITHIN'],1,''],
['SQL 中表达可变长度路径用？',['WITH RECURSIVE','GROUP BY','窗口函数'],0,''],
['GraphQL 的定位是？',['图数据库查询语言','客户端声明所需 JSON 结构的 API 查询语言','存储引擎'],1,''],
['事件溯源中新增一个读视图？',['修改历史事件','从头重放事件构建','不可能'],1,'']]);
