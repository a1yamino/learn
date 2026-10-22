const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=110)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={m0:B('#0','ok','ok'),m1:B('#1','毒丸'),m2:B('#2',''),m3:B('#3',''),c:B('消费者','','sig',140),n:P('','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'正常',p:'#0 处理成功，提交位移。',set:{m0:[0,0],m1:[120,0],m2:[240,0],m3:[360,0],c:[120,100]}},
 {t:'失败',p:'#1 无法反序列化。',d:3000,set:{m0:[0,0],m1:[120,0,B('#1','失败','bad')],m2:[240,0],m3:[360,0],c:[120,100,B('消费者','重试 #1','bad',140)]}},
 {t:'卡住',p:'无限重试：#2、#3 永远处理不到，延迟不断增长。',d:3600,set:{m0:[0,0],m1:[120,0,B('#1','失败 ×100','bad')],m2:[240,0],m3:[360,0],c:[120,100,B('消费者','重试 #1','bad',140)],n:[300,110,P('lag ↑','bad')]}},
 {t:'进入 DLQ',p:'不可重试的错误直接送入死信主题，继续处理后续消息。',d:3600,set:{m0:[0,0],m1:[120,0,B('#1','→ DLQ','sig')],m2:[240,0,B('#2','ok','ok')],m3:[360,0,B('#3','ok','ok')],c:[360,100,B('消费者','继续','ok',140)]}}]});
const e2={o:B('orders','主题','',120),r1:B('retry-1m','等待 1 分钟','',120),r2:B('retry-10m','等待 10 分钟','',120),d:B('orders-dlt','人工处理','bad',120),ok:P('成功','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'首次失败',p:'可重试的失败：写入第一级重试主题，提交原位置继续。',set:{o:[0,0],r1:[140,0]}},
 {t:'第一级',p:'重试消费者等待到期后处理，仍失败则送往下一级。',d:3200,set:{o:[0,0],r1:[140,0,B('retry-1m','失败','bad',120)],r2:[280,0]}},
 {t:'第二级',p:'同理。',d:3000,set:{o:[0,0],r1:[140,0,B('retry-1m','失败','bad',120)],r2:[280,0,B('retry-10m','失败','bad',120)],d:[420,0]}},
 {t:'死信',p:'用尽重试进入 DLQ；任何一级成功则结束。代价：同一 key 可能乱序。',d:3600,set:{o:[0,0],r1:[140,0],r2:[280,0],d:[420,0],ok:[160,90]}}]});
(()=>{const S=[['JSON 无法解析',['不可重试','→ 立即进入 DLQ，附带原分区/位移/异常 header'],'bad'],['下游 HTTP 503，持续几秒',['可重试，短暂','→ 阻塞重试，指数退避，总时长 < max.poll.interval.ms'],'ok'],['下游维护 30 分钟，要求有序',['可重试，长时间','→ pause() 分区，保持 poll，恢复后 resume()'],'ok'],['下游 503，不要求顺序',['可重试','→ 非阻塞重试主题链 retry-1m → retry-10m → DLT'],'sig'],['业务校验失败（金额为负）',['不可重试','→ DLQ，或产生一个拒绝事件通知上游'],'bad']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='bad'?'重试没有意义。':'可以重试。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择失败类型。'})();
Term(document.getElementById('t4'),[
['errors.tolerance=all\nerrors.deadletterqueue.topic.name=payments-dlt\nerrors.deadletterqueue.context.headers.enable=true\nerrors.retry.timeout=60000','（Connect 连接器配置）','只对转换器和 SMT 阶段的错误生效，Sink 写入外部系统的错误由连接器自己处理。'],
['default.deserialization.exception.handler=org.apache.kafka.streams.errors.LogAndContinueExceptionHandler','（Streams 配置）','跳过无法反序列化的记录并记日志。'],
['bin/kafka-get-offsets.sh --bootstrap-server localhost:9092 --topic payments-dlt','payments-dlt:0:1','显示各分区末尾偏移量，不等于当前记录数（保留删除、事务标记或压缩会产生差异）；DLQ 告警还需监控新增速率和处理进度。']]);
Quiz(document.getElementById('qs'),[
['无法反序列化的消息应该？',['无限重试','直接进入 DLQ','忽略并不记录'],1,''],
['阻塞重试的主要风险？',['消息乱序','堵住分区并可能超过 max.poll.interval.ms','丢消息'],1,''],
['非阻塞重试主题的代价？',['同一 key 的消息可能乱序','吞吐下降','不能进入 DLQ'],0,''],
['长时间下游故障且要求有序，较好的做法？',['pause 分区，恢复后 resume','送重试主题','跳过'],0,''],
['DLQ 消息应携带？',['原主题、分区、位移与异常信息','只有 value','消费者组名'],0,'']]);
