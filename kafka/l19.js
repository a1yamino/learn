const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:B('客户端','svc-orders'),b:B('Broker','CLIENT 监听器 SASL_SSL'),t:P('① TLS 握手：校验 Broker 证书与主机名，建立加密通道','sig'),s:P('② SASL 认证（SCRAM/OAUTHBEARER）→ 主体 User:svc-orders','sig'),a:P('③ 每个请求：StandardAuthorizer 检查 ACL（Produce → Topic:Write）','sig'),q:P('④ 配额检查：超出则延迟响应','sig'),ok:P('允许 → 处理请求','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'加密',p:'先建立 TLS 连接。',set:{c:[0,0],b:[300,0],t:[0,70]}},
 {t:'认证',p:'在加密通道上进行 SASL 认证，确定主体。',d:3400,set:{c:[0,0],b:[300,0],t:[0,70],s:[0,110]}},
 {t:'授权',p:'每个请求都按主体、操作和资源检查 ACL。',d:3400,set:{c:[0,0],b:[300,0],t:[0,70],s:[0,110],a:[0,150]}},
 {t:'配额',p:'最后检查配额。',d:3200,set:{c:[0,0],b:[300,0],t:[0,70],s:[0,110],a:[0,150],q:[0,190],ok:[0,230]}}]});
(()=>{const R=[['Write orders.created',1,'匹配前缀 orders. 的 ALLOW Write。'],['Write orders.audit',0,'有一条 DENY Write orders.audit：拒绝优先。'],['Read orders.created（组 billing）',1,'主题 Read 与组 Read 都被允许。'],['Read orders.paid（组 billing）',0,'没有 orders.paid 的 Read ACL：默认拒绝。'],['Read orders.created（组 risk）',0,'组 risk 没有 Read ACL。消费需要同时有主题和组的权限。'],['Write payments.created',0,'不匹配任何 ACL。'],['Create 主题 orders.new',0,'只授予了 Write；kafka-acls --producer 才会附带 Create 与 Describe。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 R.forEach(([t,ok,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=`User:alice → ${t}\n${ok?'允许':'拒绝：*AuthorizationException'}`;m.className='msg '+(ok?'ok':'bad');m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个请求。'})();
const e2={c:B('svc-connect','夜间重读 300 MB/s','sig'),b:B('Broker','consumer_byte_rate = 100 MB/s'),t:P('计算超出的量 → 在响应中返回 throttle_time_ms，并暂停该连接','sig'),r:P('客户端实际速率被压到约 100 MB/s，其他客户端不受影响','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'超出',p:'客户端拉取速度超过了配额。',set:{c:[0,0],b:[300,0]}},
 {t:'限流',p:'Broker 不返回错误，而是把响应延迟一段时间。',d:3600,set:{c:[0,0],b:[300,0],t:[0,70]}},
 {t:'效果',p:'客户端指标中可以看到 fetch-throttle-time-avg 上升。',d:3400,set:{c:[0,0,B('svc-connect','≈ 100 MB/s','ok')],b:[300,0],t:[0,70],r:[0,110]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-acls.sh $A --add --allow-principal User:svc-risk --consumer --topic orders. --group risk- --resource-pattern-type prefixed','Adding ACLs for resource …','一次添加消费者需要的规则。'],
['bin/kafka-acls.sh $A --list --principal User:alice','Current ACLs for principal `User:alice`:\n …(principal=User:alice, host=*, operation=WRITE, permissionType=ALLOW) …','列出某个主体的 ACL。'],
['bin/kafka-acls.sh $A --add --deny-principal User:alice --operation Write --topic orders.audit','…','拒绝规则。'],
['bin/kafka-configs.sh $A --describe --entity-type users','SCRAM credential configs for user-principal \'alice\' are SCRAM-SHA-512=iterations=4096','查看 SCRAM 用户（只显示迭代次数）。'],
['bin/kafka-configs.sh $A --alter --add-config consumer_byte_rate=104857600 --entity-type users --entity-name svc-connect','Completed updating config for user svc-connect.','设置配额。'],
['openssl s_client -connect broker1:9093 -servername broker1 </dev/null 2>/dev/null | openssl x509 -noout -subject -enddate','subject=CN = broker1\nnotAfter=Oct 22 00:00:00 2027 GMT','检查 Broker 证书与过期时间。']]);
Quiz(document.getElementById('qs'),[
['SASL_PLAINTEXT 的问题？',['不认证','认证但不加密','不授权'],1,''],
['KRaft 中的授权器？',['AclAuthorizer','StandardAuthorizer','ZooKeeper ACL'],1,''],
['ALLOW 与 DENY 冲突时？',['ALLOW 优先','DENY 优先','按添加顺序'],1,''],
['消费者需要哪些权限？',['主题 Read + 组 Read','只要主题 Read','Cluster Alter'],0,''],
['客户端超出配额时？',['连接被断开','响应被延迟（限流）','消息被丢弃'],1,'']]);
