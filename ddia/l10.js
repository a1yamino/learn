const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=170)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={n:B('新版本代码','写入 name + email','ok'),db:B('数据库','{name, email}','',200),o:B('旧版本代码','只认识 name'),o2:P('读出 → 解码成对象 → 改 name → 整体写回','sig'),bad:B('数据库','{name}（email 丢失）','bad',200)};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'新代码写入',p:'滚动升级中，新版本写入了带 email 的记录。',set:{n:[0,0],db:[220,0]}},
 {t:'旧代码读取',p:'一个仍在运行的旧版本读出这条记录，解码成只有 name 的对象。',d:3200,set:{n:[0,0],db:[220,0],o:[0,90],o2:[0,150]}},
 {t:'写回',p:'它修改 name 后把整个对象写回：email 不见了。',d:3400,set:{n:[0,0],o:[0,90],o2:[0,150],db:[220,0,{w:200,h:44,cls:'blk bad',html:'数据库<br><span style="font-size:11px;opacity:.7">{name}（email 丢失）</span>'}]}}]});
const e2={c:{w:200,h:110,cls:'frame',html:'<i>工作流代码</i><br>reserve()<br>charge()<br>ship()'},j:B('持久日志','reserve ✓ charge ✓'),x:P('进程崩溃','bad'),r:P('新进程：重放 reserve、charge，执行 ship','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'执行',p:'每完成一步，框架把结果写入持久日志。',set:{c:[0,0],j:[240,30]}},
 {t:'崩溃',p:'执行到 ship 时进程崩溃。',d:3000,set:{c:[0,0],j:[240,30],x:[240,100]}},
 {t:'恢复',p:'在另一台机器上从头执行代码：已记录的步骤直接返回结果，不再调用外部服务。',d:3600,set:{c:[0,0],j:[240,30,B('持久日志','reserve ✓ charge ✓ ship ✓','ok')],r:[0,130]}}]});
(()=>{const S=[['移动端获取个人资料',['服务调用（REST / gRPC）','需要即时响应的请求—响应'],'ok'],['下单后通知库存、积分、推荐三个系统',['事件（消息代理）','一对多、发送方不必等待、接收方可暂时不可用'],'ok'],['跨 5 个服务、持续数天的退款审批流程',['持久化执行 / 工作流引擎','长时间运行、需要在崩溃后从中断处继续'],'ok'],['五年后的报表要读今天的订单',['经过数据库','数据比代码活得久：注意模式演进与归档格式'],'ok']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg ok';m.innerHTML='推荐：'+r[0]+'。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个场景。'})();
Term(document.getElementById('t4'),[
['curl -m 2 -X POST https://pay.internal/charges -d \'{"order_id":1001,"amount":9900}\'','curl: (28) Operation timed out after 2000 milliseconds with 0 bytes received','超时：请求可能没到达、可能已执行但响应丢失，也可能还在执行。'],
['curl -m 2 -X POST https://pay.internal/charges -H \'Idempotency-Key: order-1001-charge\' -d \'{"order_id":1001,"amount":9900}\'','{"charge_id":"ch_88","status":"succeeded","replayed":true}','带幂等键重试：服务端识别出这是同一个操作，返回第一次的结果。']]);
Quiz(document.getElementById('qs'),[
['“数据比代码活得久”意味着？',['数据库要定期删除旧数据','多年前写入的数据仍以旧格式存在，读取代码要能处理','代码不应升级'],1,''],
['旧代码读改写导致新字段丢失，对策是？',['禁止滚动升级','保留不认识的字段或只更新修改的列','使用 pickle'],1,''],
['RPC 超时后？',['请求一定失败了','结果未知，重试需要幂等','服务端一定执行了'],1,''],
['持久化执行要求工作流代码？',['确定性','无状态','只用一种语言'],0,'重放时必须走同样的路径。'],
['消息代理相比直接 RPC 的好处？',['更低延迟','解耦、缓冲、一对多投递','不需要编码'],1,'']]);
