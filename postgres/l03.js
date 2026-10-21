const S=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const U=[['u1','李雷','id 1'],['u2','王芳','id 2'],['u3','张伟','id 3']],O=[['o1','订单 1','user 1'],['o2','订单 2','user 1'],['o3','订单 3','user 3'],['o4','订单 4','user 9']];
const e={n:{w:700,cls:'tag'},hu:P('users','mute'),ho:P('orders','mute'),r:{w:300,h:120,cls:'blk',html:''}};U.forEach(([k,t,s])=>e[k]=S(t,s));O.forEach(([k,t,s])=>e[k]=S(t,s));
const lay=(hu,ho,res)=>{const o={hu:[0,0],ho:[170,0]};U.forEach(([k],i)=>o[k]=[0,30+i*52,{cls:hu.includes(k)?'blk sig':'blk mute'}]);O.forEach(([k],i)=>o[k]=[170,30+i*52,{cls:ho.includes(k)?'blk sig':'blk mute'}]);o.r=[360,30,{html:res}]; return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'两张表',p:'王芳没有订单；订单 4 的 user_id 是 9，没有对应的用户（假设没有外键约束）。',set:lay(['u1','u2','u3'],['o1','o2','o3','o4'],'<code style="font-size:12px">ON u.id = o.user_id</code>')},
 {t:'INNER JOIN',p:'只保留两边都能匹配上的组合：李雷 × 2、张伟 × 1。王芳和订单 4 都不出现。',d:3800,set:lay(['u1','u3'],['o1','o2','o3'],'<div style="font:12px/1.7 var(--m);text-align:left">李雷 · 订单 1<br>李雷 · 订单 2<br>张伟 · 订单 3</div>')},
 {t:'LEFT JOIN',p:'左表（users）每行都保留；王芳没有匹配，订单列填 NULL。“找出没有订单的用户”就是筛选这些 NULL 行。',d:4000,set:lay(['u1','u2','u3'],['o1','o2','o3'],'<div style="font:12px/1.7 var(--m);text-align:left">李雷 · 订单 1<br>李雷 · 订单 2<br>王芳 · <b>NULL</b><br>张伟 · 订单 3</div>')},
 {t:'FULL JOIN',p:'两边都保留：既有王芳（订单为 NULL），也有订单 4（用户为 NULL）。数据核对、找孤儿记录时有用。',d:3800,set:lay(['u1','u2','u3'],['o1','o2','o3','o4'],'<div style="font:12px/1.7 var(--m);text-align:left">李雷 · 订单 1<br>李雷 · 订单 2<br>王芳 · NULL<br>张伟 · 订单 3<br>NULL · 订单 4</div>')}]});
const R=[['a','paid',90],['b','paid',50],['c','pending',30],['d','paid',20],['e','pending',60]];const e2={n:{w:700,cls:'tag'},g1:P('paid · count 3 · sum 160','sig'),g2:P('pending · count 2 · sum 90','sig'),gb:P('GROUP BY status：5 行 → 2 行','mute'),w:P('sum(amount) OVER (PARTITION BY status)：5 行仍是 5 行','mute')};
R.forEach(([k,s,a])=>{e2[k]={w:240,h:30,cls:'blk',html:`${s} · ${a}`};e2[k+'w']=P(s==='paid'?'组内合计 160 · 排名 '+({a:1,b:2,d:3})[k]:'组内合计 90 · 排名 '+({e:1,c:2})[k],'ok')});
const rows=(x={})=>{const o={};R.forEach(([k],i)=>o[k]=[0,i*38]);return {...o,...x}};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'5 行订单',p:'每行有 status 和 amount。',set:rows()},
 {t:'GROUP BY',p:'聚合把同一组的行折叠成一行，原始行的细节（哪笔订单）不再可见。',d:3600,set:{...rows(),gb:[280,0],g1:[280,50],g2:[280,90]}},
 {t:'窗口函数',p:'窗口函数对每一行计算“它所在分组”的值，但不折叠行：每行都保留，同时附带组内合计、组内排名（rank() OVER (PARTITION BY status ORDER BY amount DESC)）。',d:4400,set:{...rows(),w:[280,-30],...Object.fromEntries(R.map(([k],i)=>[k+'w',[280,i*38+4]]))}},
 {t:'执行顺序',p:'逻辑顺序：FROM / JOIN → WHERE → GROUP BY → HAVING → 窗口函数 → SELECT → ORDER BY → LIMIT。所以 WHERE 里不能用窗口函数的结果，要先放进子查询或 CTE。',d:4400,set:{...rows(),n:[280,40,{html:'FROM → WHERE → GROUP BY → HAVING → 窗口 → SELECT → ORDER BY → LIMIT'}]}}]});
(()=>{document.getElementById('dt').textContent=`users            orders
 id | name        id | user_id | status
----+------      ----+---------+-----------
  1 | 李雷          1 |       1 | paid
  2 | 王芳          2 |       1 | paid
  3 | 张伟          3 |       1 | pending
                    4 |       3 | cancelled`;
 const Q=[['INNER JOIN … WHERE o.status = \'paid\'',`SELECT u.name, count(*) FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid' GROUP BY u.name;`,' name | count\n------+-------\n 李雷 |     2','bad','INNER JOIN 本来就丢掉没有订单的用户。王芳和张伟不在结果里，“所有用户”的要求没满足。'],
  ['LEFT JOIN … WHERE o.status = \'paid\'',`SELECT u.name, count(*) FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid' GROUP BY u.name;`,' name | count\n------+-------\n 李雷 |     2','bad','经典陷阱：LEFT JOIN 先为王芳生成 status 为 NULL 的行，张伟有一行 cancelled，然后 WHERE 把它们全过滤掉。结果和 INNER JOIN 一样。'],
  ['LEFT JOIN … ON … AND o.status = \'paid\'，count(*)',`SELECT u.name, count(*) FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'
GROUP BY u.name;`,' name | count\n------+-------\n 李雷 |     2\n 王芳 |     1\n 张伟 |     1','bad','条件放进 ON 是对的：没匹配到的用户也保留。但 count(*) 数的是行数，王芳和张伟各有一行“订单列全为 NULL”的行，所以是 1。'],
  ['LEFT JOIN … ON … AND o.status = \'paid\'，count(o.id)',`SELECT u.name, count(o.id) FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'
GROUP BY u.name;`,' name | count\n------+-------\n 李雷 |     2\n 王芳 |     0\n 张伟 |     0','ok','正确。count(列) 不计 NULL。'],
  ['LEFT JOIN，count(*) FILTER (WHERE o.status = \'paid\')',`SELECT u.name, count(*) FILTER (WHERE o.status = 'paid') FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name;`,' name | count\n------+-------\n 李雷 |     2\n 王芳 |     0\n 张伟 |     0','ok','正确。FILTER 只对满足条件的行聚合，一次查询可以同时算出多个状态的计数。'],
  ['相关子查询',`SELECT u.name,
  (SELECT count(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'paid')
FROM users u;`,' name | count\n------+-------\n 李雷 |     2\n 王芳 |     0\n 张伟 |     0','ok','正确且直观。每个用户执行一次子查询，user_id 上有索引时用户数不多的情况下很快；用户很多时 JOIN + GROUP BY 通常更好。']];
 const jq=document.getElementById('jq'),jr=document.getElementById('jr'),jm=document.getElementById('jm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.dataset.v=i;b.textContent=t;b.addEventListener('click',()=>{jq.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const [,sql,out,c,m]=Q[i];jr.textContent=sql+'\n\n'+out;jm.className='msg '+c;jm.innerHTML=m});jq.appendChild(b)});
 jm.className='msg';jm.innerHTML='期望结果：李雷 2、王芳 0、张伟 0。'})();
Term(document.getElementById('t4'),[
['SELECT DISTINCT ON (user_id) user_id, id, created_at FROM orders ORDER BY user_id, created_at DESC LIMIT 2;',' user_id |  id   |          created_at\n---------+-------+-------------------------------\n       1 | 48213 | 2026-10-20 07:41:09.12+00\n       2 | 90117 | 2026-10-19 22:03:55.87+00','PostgreSQL 特有：每组取第一行，比 row_number 更简洁。'],
['SELECT u.name, o.id FROM users u CROSS JOIN LATERAL (SELECT id FROM orders WHERE user_id = u.id ORDER BY created_at DESC LIMIT 2) o LIMIT 4;',' name  |  id\n-------+-------\n 用户1 | 48213\n 用户1 | 30291\n 用户2 | 90117\n 用户2 | 7762','LATERAL：每个用户取最近 2 笔，“每组前 N 条”的常用写法。'],
['SELECT status, count(*), sum(count(*)) OVER () AS total, round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct FROM orders GROUP BY status;','  status   | count | total  | pct\n-----------+-------+--------+------\n paid      | 50012 | 100000 | 50.0\n…','聚合之后再套窗口函数：算占比。'],
['SELECT NULL = NULL AS eq, NULL IS NULL AS is_null, NULL IS DISTINCT FROM NULL AS distinct;',' eq | is_null | distinct\n----+---------+----------\n    | t       | f','NULL 的比较结果是 NULL（显示为空）。'],
['SELECT coalesce(NULL, \'默认\'), nullif(0, 0);',' coalesce | nullif\n----------+--------\n 默认     |','coalesce 取第一个非 NULL；nullif 常用来避免除以 0。'],
['WITH RECURSIVE t(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM t WHERE n < 5) SELECT string_agg(n::text, \',\') FROM t;',' string_agg\n------------\n 1,2,3,4,5','递归 CTE：遍历树形结构（如分类、评论回复）。']]);
Quiz(document.getElementById('qs'),[
['LEFT JOIN 后在 WHERE 中过滤右表的列（非 IS NULL 条件），效果相当于？',['FULL JOIN','INNER JOIN','CROSS JOIN'],1,'NULL 行被过滤掉。'],
['想在分组后只保留订单数大于 10 的组，用？',['WHERE count(*) &gt; 10','HAVING count(*) &gt; 10','LIMIT 10'],1,'WHERE 在分组前执行。'],
['每个用户最近一笔订单，又要保留订单的全部列，最合适？',['GROUP BY user_id + max(created_at)','row_number() OVER (PARTITION BY user_id …) 或 DISTINCT ON','HAVING'],1,'窗口函数不折叠行。'],
['子查询结果中包含 NULL 时，哪种写法会出错（返回空）？',['NOT EXISTS','NOT IN','LEFT JOIN … IS NULL'],1,'与 NULL 比较为未知。']]);
