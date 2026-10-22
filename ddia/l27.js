const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={app:B('应用','写入'),db:B('记录系统','PostgreSQL','ok'),log:B('变更日志','全序','sig',150),v1:B('搜索索引','派生'),v2:B('缓存','派生'),v3:B('数据仓库','派生'),v4:B('客户端订阅','推送更新'),n:P('一个派生视图故障，只会让它暂时落后','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'写入',p:'应用只写记录系统。',set:{app:[0,60],db:[170,60]}},
 {t:'日志',p:'变更以全序的日志流出（CDC 或事件溯源）。',d:3000,set:{app:[0,60],db:[170,60],log:[340,60]}},
 {t:'派生',p:'每个派生系统订阅日志、按相同的顺序更新：相当于数据库内部的索引与物化视图被拆成了独立组件。',d:3600,set:{db:[0,60],log:[170,60],v1:[360,0],v2:[360,60],v3:[360,120],v4:[360,180]}},
 {t:'松耦合',p:'没有分布式事务：派生系统故障时写入不受影响，恢复后从日志位置继续。',d:3400,set:{db:[0,60],log:[170,60],v1:[360,0],v2:[360,60,B('缓存','故障 → 稍后追赶','bad')],v3:[360,120],v4:[360,180],n:[0,190]}}]});
const e2={r1:B('请求 r1','注册 alice'),r3:B('请求 r3','注册 alice'),r2:B('请求 r2','注册 bob'),p0:{w:200,h:80,cls:'frame',html:'<i>分区 hash(alice)</i><br>r1 → r3'},p1:{w:200,h:60,cls:'frame',html:'<i>分区 hash(bob)</i><br>r2'},o1:P('r1 成功','ok'),o3:P('r3 拒绝：alice 已被占用','bad'),o2:P('r2 成功','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'追加',p:'请求按用户名的哈希追加到日志：同一用户名的请求在同一个分区，有确定的顺序。',set:{r1:[0,0],r3:[0,60],r2:[0,140],p0:[180,0],p1:[180,120]}},
 {t:'顺序处理',p:'每个分区由一个处理器顺序处理：第一个请求胜出，不需要锁。',d:3600,set:{p0:[0,0],p1:[0,120],o1:[220,10],o3:[220,45],o2:[220,135]}}]});
(()=>{const S=[['刚发的评论 2 秒后才出现在搜索结果中',['违反：及时性','可恢复：等一等就好'],'ok'],['转账后，收款方账户 1 秒后才看到这笔钱',['违反：及时性（只要钱最终到账）','可恢复：中间状态'],'ok'],['同一笔订单因客户端重试被扣款两次',['违反：完整性','永久：需要人工退款；用端到端请求 ID 预防'],'bad'],['缓存中的商品价格与数据库永久不同',['违反：完整性（派生数据损坏）','需要发现并重建：定期审计'],'bad'],['库存被超卖 1 件',['违反：约束','可以事后补偿（道歉、补货），取决于业务能否接受'],'sig']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'暂时的，可以容忍。':c==='bad'?'永久的错误：必须在设计上预防。':'取决于业务：有些约束可以用补偿代替协调。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个现象。'})();
Term(document.getElementById('t4'),[
['# 浏览器：const rid = crypto.randomUUID()  // 生成一次，重试时复用\nPOST /transfers  Idempotency-Key: 0b6d3c1e-…','201 Created','第一次请求。'],
['POST /transfers  Idempotency-Key: 0b6d3c1e-…   # 网络超时后重试','200 OK（返回第一次的结果，没有再次转账）','请求 ID 在数据库中作为唯一键：只有端点才能真正去重。']]);
Quiz(document.getElementById('qs'),[
['用日志派生多个系统相比分布式事务的优势？',['更快的读取','松耦合：派生系统故障不影响写入','不需要存储'],1,''],
['端到端原则意味着？',['TCP 足以去重','去重必须由端点（如请求 ID）实现','数据库事务足以防止重复'],1,''],
['如何在不使用分布式事务的情况下实现唯一性？',['按唯一值分区写入日志并顺序处理','用 LWW','加缓存'],0,''],
['及时性与完整性，哪个违反通常是永久的？',['及时性','完整性','都不是'],1,''],
['“信任但要验证”的做法？',['相信数据库不会出错','定期审计：校验和、对比源与派生数据','只做备份'],1,'']]);
