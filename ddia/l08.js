const P=(t,c='sig')=>({cls:'pill '+c,html:t});const G=(t,c='',w=260)=>({w,h:30,cls:'blk '+c,html:t});
const e={r1:G('行 1：2026-01-03 | 北京 | 120 | 品类 7 | …'),r2:G('行 2：2026-01-03 | 上海 |  80 | 品类 2 | …'),r3:G('行 3：2026-01-04 | 北京 | 300 | 品类 7 | …'),c1:G('日期列：01-03 01-03 01-04','',220),c2:G('城市列：北京 上海 北京','',220),c3:G('金额列：120 80 300','',220),c4:G('品类列：7 2 7','',220),q:P('SELECT sum(金额) …','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'行存',p:'一行的所有列连续存放。',set:{r1:[0,0],r2:[0,40],r3:[0,80]}},
 {t:'行存读取',p:'只求金额之和，也要把每行的全部列读入内存。',d:3200,set:{q:[0,130],r1:[0,0,G('行 1：2026-01-03 | 北京 | 120 | 品类 7 | …','bad')],r2:[0,40,G('行 2：2026-01-03 | 上海 |  80 | 品类 2 | …','bad')],r3:[0,80,G('行 3：2026-01-04 | 北京 | 300 | 品类 7 | …','bad')]}},
 {t:'列存',p:'每列单独存放，各列中的第 k 个值属于第 k 行。',d:3200,set:{c1:[0,0],c2:[0,40],c3:[0,80],c4:[0,120]}},
 {t:'列存读取',p:'只读金额这一列。',d:3200,set:{q:[260,85],c1:[0,0],c2:[0,40],c3:[0,80,G('金额列：120 80 300','ok',220)],c4:[0,120]}}]});
const e2={v:G('城市：北 上 北 北 广 上 北','',260),b1:G('北京位图：1 0 1 1 0 0 1','',260),b2:G('上海位图：0 1 0 0 0 1 0','',260),r:G('排序后：北北北北 上上 广 → (北,4)(上,2)(广,1)','ok',300),n:P('WHERE 城市 IN (北京,上海) → 两个位图做 OR','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'原始列',p:'城市列只有几个不同的值。',set:{v:[0,0]}},
 {t:'位图',p:'每个不同的值一个位图；过滤条件变成位运算。',d:3200,set:{v:[0,0],b1:[0,40],b2:[0,80],n:[0,125]}},
 {t:'游程编码',p:'按该列排序后，相同值连续，游程编码把一百万行压缩成几个数对。',d:3400,set:{v:[0,0],r:[0,40]}}]});
(()=>{const C=60,S=[['sum(金额) 全表',1],['按日期、城市统计数量',2],['5 个指标按 3 个维度',8],['SELECT * 取一行',60]];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,k])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  if(k===C){p.textContent=`表：10 亿行 × ${C} 列，每列平均 8 字节\n按主键定位 1 行：逻辑结果约 ${C*8} 字节\n行存：取得 1 行；列存：从 ${C} 列中取得该行的值\n实际 I/O 取决于索引、页/列块大小与缓存，不能按十亿行全表扫描计算`;m.className='msg sig';m.innerHTML='按键读取完整记录通常更适合行存；这里比较访问布局，不推算实际磁盘读取量。';return}
  p.textContent=`表：10 亿行 × ${C} 列，每列平均 8 字节\n行存读取：${(1e9*C*8/1e12).toFixed(2)} TB（全部列）\n列存读取：${(1e9*k*8/1e12).toFixed(3)} TB（${k} 列，压缩前）`;
  m.className='msg '+(k<C?'ok':'bad');m.innerHTML=k<C?`列存少读 ${(100-k/C*100).toFixed(0)}%，压缩后更少。`:'按行取完整记录是行存的强项：列存要从 60 个文件里各取一个值。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个查询。'})();
Term(document.getElementById('t4'),[
['SELECT user_id % 3 seg, sum(amount) FROM orders GROUP BY ROLLUP (1) ORDER BY 1;',' seg |    sum\n-----+-----------\n   0 | …\n   1 | …\n   2 | …\n     | …（总计）','ROLLUP/CUBE/GROUPING SETS 一次计算多个层次的汇总。'],
['SELECT to_tsvector(\'english\', \'merge sort and log files\');','\'file\':5 \'log\':4 \'merg\':1 \'sort\':2','分词、去停用词、词干化后得到词项及其位置；GIN 索引把每个词项映射到文档列表。']]);
Quiz(document.getElementById('qs'),[
['列存为什么适合分析查询？',['写入更快','只读取查询涉及的列，且压缩率高','支持事务'],1,''],
['列存中如何知道哪些值属于同一行？',['每个值带行 ID','各列文件按相同的行顺序存储','用外键'],1,''],
['列存通常如何处理写入？',['原地更新每个列文件','先写入内存缓冲，再批量转换成列式段','不支持写入'],1,''],
['向量化执行的含义？',['一次处理一批列值的紧凑循环','把数据转为向量嵌入','并行连接数据库'],0,''],
['向量索引（HNSW）用于？',['精确匹配','近似最近邻的语义搜索','范围扫描'],1,'']]);
