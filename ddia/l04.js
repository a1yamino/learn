const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={u:B('users','id=1 张三 city_id=2'),c:B('cities','id=2 上海'),j:B('jobs','user_id=1 甲公司 / 乙公司'),d:{w:220,h:130,cls:'frame',html:'<i>文档</i><br>{ name: 张三,<br>&nbsp;city: 上海,<br>&nbsp;jobs: [甲公司, 乙公司] }'},x:P('一次读取，局部性好','ok'),y:P('城市名重复存放','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'关系',p:'用户、城市、工作经历分在三张表，用 ID 引用。',set:{u:[0,0],c:[0,70],j:[0,140]}},
 {t:'读取',p:'读一份完整档案要连接三张表。',d:3000,set:{u:[0,0,B('users','id=1 张三 city_id=2','sig')],c:[0,70,B('cities','id=2 上海','sig')],j:[0,140,B('jobs','user_id=1 甲公司 / 乙公司','sig')]}},
 {t:'文档',p:'同一份档案作为一棵树存放：一对多的工作经历直接嵌套。',d:3400,set:{u:[0,0],c:[0,70],j:[0,140],d:[220,10],x:[220,155]}},
 {t:'代价',p:'多对一的城市被复制进每份文档：改名要改所有文档。',d:3400,set:{u:[0,0],c:[0,70],j:[0,140],d:[220,10],x:[220,155],y:[220,195]}}]});
const e2={f:{w:180,h:100,cls:'frame',html:'<i>fact_sales</i><br>date_key, product_key,<br>store_key, qty, price'},d1:B('dim_date','日期、星期、节假日','',140),d2:B('dim_product','名称、品类、品牌','',140),d3:B('dim_store','城市、面积','',140),s:B('dim_category','雪花：再拆一层','sig',140)};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'事实表',p:'每行一个事件：一次销售。行数巨大。',set:{f:[170,60]}},
 {t:'维度表',p:'事实表的外键指向维度：何时、什么商品、哪家店。',d:3200,set:{f:[170,60],d1:[0,0],d2:[380,0],d3:[0,150]}},
 {t:'雪花',p:'维度再规范化出子维度，就是雪花模式。',d:3200,set:{f:[170,60],d1:[0,0],d2:[380,0],d3:[0,150],s:[380,150]}}]});
(()=>{const S=[['规范化（cities 表）',['UPDATE cities SET name=\'沪\' WHERE id=2;','修改 1 行；所有用户读取时自动看到新名字'],'ok'],['反规范化（每份文档存城市名）',['UPDATE profiles SET doc=jsonb_set(…) WHERE doc->>\'city\'=\'上海\';','修改 500 行；更新期间有的文档是新名、有的是旧名'],'bad'],['反规范化 + 漏改',['某个服务的缓存里还存着“上海”','不同页面显示不同城市名：数据不一致'],'bad']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'写时只改一处，读时需要连接。':'读时更快，写时要负责同步所有副本。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择存储方式。'})();
Term(document.getElementById('t4'),[
['SELECT doc->>\'name\' FROM profiles WHERE doc @> \'{"city":"沪"}\' LIMIT 2;',' ?column?\n----------\n 张三\n 用户2','@> 判断包含关系，可以使用 GIN 索引。'],
['SELECT jsonb_array_elements(doc->\'jobs\')->>\'org\' FROM profiles WHERE id = 1;',' ?column?\n----------\n 甲公司\n 乙公司','把嵌套数组展开成行，再和关系表一起查询。']]);
Quiz(document.getElementById('qs'),[
['文档模型最适合哪种数据？',['大量多对多关系','自包含的一对多树结构','需要频繁连接的数据'],1,''],
['规范化的主要好处？',['读取更快','同一事实只存一份，修改时不会不一致','不需要索引'],1,''],
['反规范化的数据本质上是？',['记录系统','派生数据','临时数据'],1,'它是从规范化数据复制而来的，需要维护一致。'],
['schema-on-read 类似于？',['静态类型','动态类型','没有类型'],1,''],
['星型模式中心是？',['维度表','事实表','索引'],1,'']]);
