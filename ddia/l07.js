const P=(t,c='sig')=>({cls:'pill '+c,html:t});const G=(t,c='',w=200)=>({w,h:34,cls:'blk '+c,html:t});
const e={r:G('根：| 100 | 200 | 300 |'),i1:G('内部：| 210 | 230 | 260 |'),l1:G('叶：231 232 235 … 259'),l2:G('叶：260 … 279',''),q:P('查找 251','sig'),s:P('页满 → 分裂成两页，父页增加一个键','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'根页',p:'查找 251：在根页中 200 ≤ 251 < 300，进入对应子页。',set:{q:[0,0],r:[150,0,G('根：| 100 | 200 | 300 |','sig')]}},
 {t:'内部页',p:'230 ≤ 251 < 260，继续向下。',d:3000,set:{q:[0,0],r:[150,0],i1:[150,60,G('内部：| 210 | 230 | 260 |','sig')]}},
 {t:'叶子页',p:'到达叶子页，找到 251 或确定它不存在。只读了 3 个页。',d:3000,set:{q:[0,0],r:[150,0],i1:[150,60],l1:[150,120,G('叶：231 … 251 … 259','ok')]}},
 {t:'分裂',p:'向满的叶子页插入时，它分裂成两页，父页新增一个分隔键；修改先写入 WAL。',d:3800,set:{r:[150,0],i1:[150,60,G('内部：| 210 | 230 | 245 | 260 |','sig')],l1:[40,120,G('叶：231 … 244','ok',180)],l2:[240,120,G('叶：245 … 259','ok',180)],s:[60,180]}}]});
const B=(t,s,c='',w=170)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e2={q:P('WHERE user_id = 42','sig'),ix:B('二级索引 user_id','42 → 行位置 (17,3)'),hp:B('堆表','第 17 页第 3 行'),cv:B('覆盖索引','42 → amount=9.9','ok'),n:P('Index Only Scan：不回表','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'普通二级索引',p:'索引中存的是行的位置。',set:{q:[0,0],ix:[0,50]}},
 {t:'回表',p:'取 amount 还要再去堆表读一次页面。',d:3000,set:{q:[0,0],ix:[0,50],hp:[220,50]}},
 {t:'覆盖索引',p:'INCLUDE (amount) 把需要的列放进索引，只读索引即可。',d:3400,set:{q:[0,0],cv:[0,120],n:[220,130]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [[1e6,300],[1e9,300],[1e9,10],[1e12,500]].forEach(([N,b])=>{const t=document.createElement('button');t.className='btn';t.textContent=`${N.toExponential(0)} 行 · 分支 ${b}`;t.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===t));
  const d=Math.ceil(Math.log(N)/Math.log(b));p.textContent=`深度 ≈ ⌈log_${b}(${N.toExponential(0)})⌉ = ${d}\n一次查找读取 ${d} 个页\n上面 ${Math.max(d-1,1)} 层通常常驻缓存，实际只需约 1 次磁盘读取`;m.className='msg '+(d<=4?'ok':'sig');m.innerHTML=d<=4?'分支因子大，树很浅。':'分支因子小会让树变深、查找变慢。'});q.appendChild(t)});
 m.className='msg';m.innerHTML='选择数据量与分支因子。'})();
Term(document.getElementById('t4'),[
['SELECT root, level FROM bt_metap(\'orders_pkey\');',' root | level\n------+-------\n  412 |     2','level = 根所在的层数（叶子为 0）。'],
['SELECT itemoffset, data FROM bt_page_items(\'orders_pkey\', 412) LIMIT 3;',' itemoffset |          data\n------------+-------------------------\n          1 |\n          2 | 09 d0 02 00 00 00 00 00\n          3 | 11 a0 05 00 00 00 00 00','根页中的分隔键（小端编码的 bigint）。第一项没有键，表示“负无穷”。']]);
Quiz(document.getElementById('qs'),[
['B 树查找通常读几个页？',['与行数成正比','3–4 个','1 个'],1,'分支因子几百，树很浅。'],
['B 树如何保证页分裂中途崩溃不损坏？',['预写日志或写时复制','不需要','每次写都 fsync 全部页'],0,''],
['相比 LSM，B 树的优点？',['写放大更小','每个键只在一处，读取可预测','无需 WAL'],1,''],
['覆盖索引的作用？',['减小表大小','查询只读索引即可得到所需列','加快写入'],1,''],
['索引 (a, b) 不能高效支持？',['WHERE a = 1','WHERE a = 1 AND b = 2','WHERE b = 2'],2,'最左前缀。']]);
