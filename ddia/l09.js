const P=(t,c='sig')=>({cls:'pill '+c,html:t});const G=(t,c='',w=340)=>({w,h:34,cls:'blk '+c,html:t});
const e={r:G('{name: "lin", age: 30, tags: ["db","go"]}','sig'),j:G('JSON：42 字节，字段名在每条记录中'),p:G('Protobuf：15 字节，字段号代替字段名'),a:G('Avro：值按模式顺序拼接，最紧凑'),n:P('没有模式就无法解码二进制格式','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'记录',p:'内存中的一条记录。',set:{r:[0,0]}},
 {t:'JSON',p:'自描述：字段名重复出现在每条记录里。',d:3000,set:{r:[0,0],j:[0,50,G('JSON：42 字节，字段名在每条记录中','bad')]}},
 {t:'Protobuf',p:'每个值前有一个“字段号 + 线类型”的标记字节。',d:3000,set:{r:[0,0],j:[0,50],p:[0,100,G('Protobuf：15 字节，字段号代替字段名','ok')]}},
 {t:'Avro',p:'连字段号都没有：读取时需要写者模式。',d:3200,set:{r:[0,0],j:[0,50],p:[0,100],a:[0,150,G('Avro：值按模式顺序拼接，最紧凑','ok')],n:[0,200]}}]});
const B=(t,s,c='',w=170)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e2={w:{w:170,h:90,cls:'frame',html:'<i>写者模式 v1</i><br>name: string<br>age: int'},rd:{w:190,h:90,cls:'frame',html:'<i>读者模式 v2</i><br>name: string<br>email: string = null'},m1:P('name ↔ name：按名字匹配','ok'),m2:P('age：读者没有 → 忽略','sig'),m3:P('email：写者没有 → 默认值','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'两个模式',p:'数据用 v1 写入；应用现在使用 v2。',set:{w:[0,0],rd:[300,0]}},
 {t:'按名匹配',p:'Avro 按字段名对齐两个模式，字段顺序可以不同。',d:3000,set:{w:[0,0],rd:[300,0],m1:[0,110]}},
 {t:'解析',p:'多出的字段被忽略，缺少的字段取默认值。没有默认值的字段不能这样增删。',d:3600,set:{w:[0,0],rd:[300,0],m1:[0,110],m2:[0,150],m3:[0,190]}}]});
(()=>{const S=[['新增字段 email = 5',['旧代码读新数据：跳过未知字段 5 ✓','新代码读旧数据：email 为空串（默认值） ✓'],'ok'],['删除字段 3（标记 reserved）',['旧代码读新数据：字段 3 缺失，取默认值 ✓（前提是它不是业务必需）','新代码读旧数据：忽略字段 3 ✓'],'ok'],['把字段 2 的类型从 int32 改成 string',['线类型从 0 变成 2：旧代码按错误的类型解析','✗ 不兼容：应该新增一个字段'],'bad'],['复用已删除的字段号 3 表示新含义',['旧数据中的字段 3 会被当成新含义读取','✗ 静默的数据错误：用 reserved 防止'],'bad'],['重命名字段 name → full_name（字段号不变）',['编码中只有字段号，没有名字','✓ Protobuf 兼容（Avro 中需要用 aliases）'],'ok']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'兼容。':'不兼容。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个改动（Protobuf）。'})();
Term(document.getElementById('t4'),[
['0a 03 6c 69 6e','字段 1（0a = 1<<3 | 2），长度 3，"lin"','线类型 2 = 长度前缀。'],
['10 1e','字段 2（10 = 2<<3 | 0），varint 30','线类型 0 = varint：小整数只占 1 字节。'],
['1a 02 64 62 1a 02 67 6f','字段 3 出现两次："db"、"go"','repeated 字段就是同一个字段号重复出现。']]);
Quiz(document.getElementById('qs'),[
['向前兼容是指？',['新代码读旧数据','旧代码读新数据','两者都不是'],1,''],
['Protobuf 中绝对不能做的是？',['新增字段','重命名字段','复用已删除的字段号'],2,''],
['Avro 读取数据时需要？',['只要读者模式','写者模式和读者模式','字段号'],1,''],
['Avro 中能安全新增的字段？',['任何字段','有默认值的字段','只能是字符串'],1,''],
['为什么不应该用 pickle/Java 序列化存储数据？',['太慢','绑定语言、有安全风险、版本兼容差','不能压缩'],1,'']]);
