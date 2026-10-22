const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={p:B('生产者','Avro 序列化器'),sr:B('Schema Registry','orders-value v1 → ID 1','sig',180),k:B('Kafka','orders'),c:B('消费者','Avro 反序列化器'),r:P('① 注册/查询 schema → ID 1（之后缓存）','sig'),w:P('② 消息 = 0x00 | 00 00 00 01 | Avro 二进制','sig'),f:P('③ 读到 ID 1 → 从 Registry 取 schema（缓存）→ 解码','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'注册',p:'生产者第一次使用某个 schema 时向 Registry 注册（或查询）得到 ID。',set:{p:[0,0],sr:[180,0],r:[0,70]}},
 {t:'写入',p:'每条消息只携带 5 字节的头，不携带整个 schema。',d:3600,set:{p:[0,0],sr:[180,0],k:[0,110],w:[0,170]}},
 {t:'读取',p:'消费者按 ID 取得写入时使用的 schema，再按自己的读取 schema 解析（Avro 的 schema 解析规则）。',d:4000,set:{sr:[180,0],k:[0,110],c:[180,110],f:[0,170]}}]});
(()=>{const C=[['新增 coupon（有默认值）',{BACKWARD:1,FORWARD:1,FULL:1},'新读者读旧数据时用默认值；旧读者读新数据时忽略新字段。'],['新增 coupon（无默认值）',{BACKWARD:0,FORWARD:1,FULL:0},'新读者读旧数据时找不到该字段，也没有默认值。'],['删除 currency（有默认值）',{BACKWARD:1,FORWARD:1,FULL:1},'旧读者读新数据时缺失字段用默认值。'],['删除 amount（无默认值）',{BACKWARD:1,FORWARD:0,FULL:0},'新读者忽略多余字段；旧读者读新数据时缺少必填字段。'],['amount 改为 string',{BACKWARD:0,FORWARD:0,FULL:0},'类型不兼容（Avro 只允许 int→long→float→double 等提升）。'],['amount 改为 float→double 提升（假设原为 float）',{BACKWARD:1,FORWARD:0,FULL:0},'新读者可以把 float 提升为 double；反过来不行。'],['字段改名 id → order_id',{BACKWARD:0,FORWARD:0,FULL:0},'Avro 按名字匹配，改名等于删除加新增（可用 aliases 处理读者端）。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 C.forEach(([t,r,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=Object.entries(r).map(([k,v])=>`${k.padEnd(9)} ${v?'✓ 兼容':'✗ 不兼容'}`).join('\n')+(r.BACKWARD?'\nBACKWARD 下：先升级消费者，再升级生产者':r.FORWARD?'\nFORWARD 下：先升级生产者，再升级消费者':'');m.className='msg '+(r.FULL?'ok':r.BACKWARD||r.FORWARD?'sig':'bad');m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个变更。'})();
const bar=(t,n,c)=>({w:Math.max(60,n*2.2),h:36,cls:'blk '+c,html:`${t} · ${n} B`});
const e2={j:bar('JSON',138,''),a:bar('Avro',27,'ok'),pb:bar('Protobuf',29,'ok'),n:P('{"id":"o-1001","user_id":42,"amount":99.5,"currency":"CNY","items":3,"created_at":1761124800000}','sig'),z:P('压缩后差距缩小（字段名重复适合压缩），但 schema 带来的类型检查和演进规则仍然有价值','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'消息',p:'一条订单消息。',set:{n:[0,0]}},
 {t:'体积',p:'JSON 每条都带字段名；Avro 依靠 schema 只写值；Protobuf 写字段编号和值。',d:4000,set:{n:[0,0],j:[0,50],a:[0,94],pb:[0,138]}},
 {t:'压缩',p:'批次压缩能大幅减小 JSON 的体积。选择格式时更重要的是契约与演进。',d:3800,set:{j:[0,50],a:[0,94],pb:[0,138],z:[0,190]}}]});
Term(document.getElementById('t4'),[
['curl -s localhost:8081/subjects/orders-value/versions','[1,2]','某个 subject 的版本列表。'],
['curl -s localhost:8081/schemas/ids/1','{"schema":"{\\"type\\":\\"record\\",\\"name\\":\\"Order\\",…}"}','按全局 ID 取 schema。'],
['curl -s -X PUT -H "Content-Type: application/json" localhost:8081/config/orders-value -d \'{"compatibility":"FULL_TRANSITIVE"}\'','{"compatibility":"FULL_TRANSITIVE"}','设置某个 subject 的兼容性。'],
['curl -s localhost:8081/config','{"compatibilityLevel":"BACKWARD"}','全局默认兼容性。'],
['curl -s -X DELETE localhost:8081/subjects/orders-value/versions/2','2','软删除一个版本（加 ?permanent=true 才是硬删除）。']]);
Quiz(document.getElementById('qs'),[
['Schema Registry 序列化的消息头包含？',['完整 schema','魔数 + 4 字节 schema ID','主题名'],1,''],
['BACKWARD 兼容时应该先升级？',['生产者','消费者','同时'],1,''],
['BACKWARD 下允许的变更？',['新增无默认值的字段','新增有默认值的字段','改字段类型'],1,''],
['*_TRANSITIVE 的含义？',['与所有历史版本比较','跨集群','自动迁移'],0,''],
['字段改名的安全做法？',['直接改','新增字段、双写、迁移后删除旧字段','改兼容性为 NONE'],1,'']]);
