const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={cl:B('客户端','本地 CRDT 副本'),ss:B('会话主节点','每个文档一个','sig'),md:B('元数据库','PostgreSQL 分片','ok'),dl:B('更新日志','快照 + 增量','ok'),k:B('Kafka','变更事件','sig'),s:B('搜索索引','派生'),n:B('通知','派生'),a:B('分析仓库','派生'),et:B('etcd','租约 + fencing',''),}
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'客户端',p:'每个客户端都有一个本地副本，离线也能编辑（多主）。',set:{cl:[0,60]}},
 {t:'实时协作',p:'客户端连接到该文档的会话主节点，它合并、广播并持久化更新；主节点的分配由 etcd 租约决定。',d:3600,set:{cl:[0,60],ss:[170,60],et:[170,150],dl:[340,0],md:[340,120]}},
 {t:'派生数据',p:'记录系统的变更进入事件日志，派生出搜索、通知、分析。',d:3600,set:{cl:[0,60],ss:[170,60],dl:[340,0],md:[340,120],k:[340,190],s:[0,190],n:[170,220],a:[0,250]}}]});
const e2={a:P('① 按键：本地 CRDT 立即生效','ok'),b:P('② WebSocket 发送更新（带客户端 ID 与序号）','sig'),c:P('③ 会话主节点合并，广播给同伴（< 1 s）','sig'),d:P('④ 批量追加到更新日志（多数副本确认）','ok'),e:P('⑤ 变更事件 → Kafka','sig'),f:P('⑥ 搜索、通知、分析各自消费（秒级到分钟级）','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'本地',p:'编辑先在本地生效：不依赖网络。',set:{a:[0,0]}},
 {t:'同步',p:'更新发往会话主节点并广播。',d:3000,set:{a:[0,0],b:[0,40],c:[0,80]}},
 {t:'持久化',p:'批量写入复制的更新日志：已确认的内容不会丢。',d:3000,set:{a:[0,0],b:[0,40],c:[0,80],d:[0,120]}},
 {t:'派生',p:'下游异步更新：及时性放宽，完整性由日志保证。',d:3200,set:{a:[0,0],b:[0,40],c:[0,80],d:[0,120],e:[0,160],f:[0,200]}}]});
(()=>{const S=[['文档内容用什么模型存储？','CRDT（Yjs/Automerge）快照 + 增量更新日志。\n理由：离线编辑、多人并发、自动收敛。\n课程：第 6 课（日志结构）、第 13 课（CRDT）'],['元数据如何分片？','按 workspace_id 分片（多租户）。\n理由：权限检查与列表查询都在一个分片内；按租户备份、迁移、删除。\n课程：第 15、16 课'],['“空间至少保留一个管理员”怎么保证？','SERIALIZABLE 事务（SSI），或对 spaces 行 SELECT … FOR UPDATE 后再检查。\n理由：典型的写偏斜。\n课程：第 19 课'],['如何保证同一文档只有一个会话主节点？','etcd 租约选主 + fencing 令牌，持久化写入时检查令牌。\n理由：进程暂停与网络分区下的脑裂。\n课程：第 22、24 课'],['搜索索引如何与内容保持同步？','CDC/更新日志 → Kafka → 索引消费者；按 doc_id 有序；可重放重建。\n理由：避免双写的竞争条件。\n课程：第 26、27 课'],['区域故障怎么办？','元数据跨区域异步副本 + 手动/半自动提升；客户端本地副本继续离线编辑，恢复后同步。\n理由：多区域的可用性与 RPO 取舍。\n课程：第 11、13、23 课（CAP）'],['重复的评论通知如何避免？','客户端生成请求 ID，评论表与通知服务按 ID 幂等。\n理由：端到端原则。\n课程：第 10、27 课']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');let seen=new Set();
 S.forEach(([t,r],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));seen.add(i);p.textContent=r;m.className='msg '+(seen.size===S.length?'ok':'sig');m.innerHTML=seen.size===S.length?'评审完成：所有问题都有对应的设计。':`已评审 ${seen.size}/${S.length}。`});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个评审问题。'})();
Term(document.getElementById('t4'),[
['python3 -c "print(2e9 * 30e3 / 1e12, \'TB 快照\')"','60.0 TB 快照','20 亿文档 × 30 KB。'],
['python3 -c "print(200000 / 10, \'次/秒持久化写入（每 10 次按键合并一次）\')"','20000.0 次/秒持久化写入（每 10 次按键合并一次）','会话主节点批量合并更新，把按键级别的写入降一个数量级。'],
['python3 -c "print(50000 * 30e3 * 8 / 1e9, \'Gbit/s 打开文档的带宽\')"','12.0 Gbit/s 打开文档的带宽','热门公开文档应由 CDN 缓存只读快照。']]);
Quiz(document.getElementById('qs'),[
['离线编辑后的合并靠什么保证收敛？',['LWW','CRDT','两阶段提交'],1,''],
['为什么元数据按 workspace_id 分片？',['均匀随机','相关数据在同一分片，便于事务、隔离与按租户管理','因为文档多'],1,''],
['搜索索引不应由应用双写，因为？',['双写有竞争条件与部分失败','搜索引擎太慢','索引不重要'],0,''],
['会话主节点防脑裂的关键？',['更短的超时','租约 + fencing 令牌','更多副本'],1,''],
['新增语义搜索功能最简单的做法？',['停机迁移','新建消费者从头重放日志构建向量索引','让用户重新保存文档'],1,'']]);
