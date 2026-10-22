const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={bb:B('基础备份','周日 02:00','sig',130),line:{w:640,h:4,cls:'blk mute',html:''},w1:B('WAL','周日','',80),w2:B('WAL','周一','',80),w3:B('WAL','周二','',80),w4:B('WAL','周三 14:29','',100),x:P('14:29:03 DROP TABLE','bad'),r:P('恢复 = 基础备份 + 重放 WAL 到 14:29:02','ok'),ar:P('archive_command：每个写满的段复制到对象存储','sig'),stop:P('recovery_target_time：重放到这里停下','ok')};
const L={bb:[0,50],line:[0,110]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'基础备份',p:'某一时刻的数据目录拷贝。备份期间仍有写入，单靠它无法得到一致状态。',set:{...L}},
 {t:'持续归档 WAL',p:'之后每一个 WAL 段都被归档。基础备份加上这条完整的 WAL 链，就记录了从备份时刻起的每一次修改。',d:4000,set:{...L,w1:[150,120],w2:[240,120],w3:[330,120],w4:[420,120],ar:[0,180]}},
 {t:'事故',p:'周三 14:29:03 有人误执行了 DROP TABLE。复制把它同步到了所有备库。',d:3400,set:{...L,w1:[150,120],w2:[240,120],w3:[330,120],w4:[420,120,{cls:'blk bad'}],x:[400,50]}},
 {t:'恢复到任意时间点',p:'恢复基础备份，按顺序重放归档的 WAL，到 DROP 之前停止。恢复出的是一个新的实例，可以从中导出被删的表，或者直接切换过去。',d:4400,set:{...L,bb:[0,50,{cls:'blk ok'}],w1:[150,120,{cls:'blk ok'}],w2:[240,120,{cls:'blk ok'}],w3:[330,120,{cls:'blk ok'}],w4:[420,120,{cls:'blk ok'}],stop:[400,50],r:[0,180]}}]});
const S=[['发现','14:35 · 客服报告订单页报错','bad'],['定位时间点','日志 / pg_stat_statements：DROP 在 14:29:03','sig'],['恢复到新实例','pgbackrest restore --type=time --target=…','sig'],['验证','行数、最近订单、业务检查','sig'],['导回数据','pg_dump -t orders 旧实例 | psql 生产','ok'],['补齐','14:29 之后的订单在生产中已因报错失败，无需合并','ok']];
const e2={};S.forEach(([t,s,c],i)=>e2['s'+i]=B(t,s,'',300));e2.n=P('关键：在新实例上恢复，不要覆盖生产库——之后的其他数据还在那里','sig');
const st=n=>{const o={};for(let i=0;i<n;i++)o['s'+i]=[0,i*50,{cls:'blk '+S[i][2]}];return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'发现与定位',p:'找到错误发生的精确时间。可以用 log_statement = \'ddl\' 的日志、审计记录，或者 pg_waldump 在 WAL 中找到那条事务。',set:st(2)},
 {t:'恢复到新实例',p:'在另一台机器上执行 PITR，目标是错误之前。生产库保持运行（如果它还能工作），其他表的新数据不会丢。',d:4200,set:{...st(3),n:[320,100]}},
 {t:'验证并导回',p:'确认恢复的数据正确后，只把受影响的表导回生产。整个库都损坏时，才把新实例提升为生产。',d:4200,set:st(6)}]});
(()=>{const Q=[['DELETE 少了 WHERE（10 分钟前）',"方案：PITR 到 DELETE 之前，恢复到临时实例\n      从临时实例导出被删的行，INSERT 回生产\n结果：误删的行恢复；其他表和该表在之后的正常写入保留",'ok','最常见的情况。需要连续的 WAL 归档。'],
['主库磁盘损坏',"方案：故障切换到备库（第 19 课）\n结果：几十秒内恢复，异步复制可能丢失最近几秒",'ok','硬件故障首选复制，不需要动用备份。'],
['错误的迁移脚本改坏了 3 张表的数据（2 小时前）',"方案：PITR 到迁移开始前的时间点（或用 recovery_target_name：迁移前执行 SELECT pg_create_restore_point('before_mig_42')）\n      对比 3 张表在恢复实例与生产中的差异，按业务规则修复\n结果：需要人工合并 2 小时内的新数据",'sig','迁移前打一个恢复点，定位目标时最精确。'],
['只有每天一次的 pg_dump，下午误删了表',"方案：恢复昨晚的 pg_dump\n结果：丢失今天到删除为止的所有修改",'bad','pg_dump 只是快照，RPO 是一天。生产必须有 WAL 归档。'],
['勒索软件加密了服务器，并删除了同账号下的 S3 备份',"方案：无可用备份\n结果：数据无法恢复",'bad','备份必须与生产隔离：独立账号、只写不删的凭据、对象锁定（WORM），以及异地副本。'],
['归档已经 3 天失败没人发现',"SELECT archived_count, failed_count, last_failed_wal, last_failed_time FROM pg_stat_archiver;\n failed_count | last_failed_wal          | last_failed_time\n--------------+--------------------------+---------------------------\n        51233 | 00000001000003A2000000C1 | 2026-10-22 14:30:00+08\n此时需要 PITR：只能恢复到 3 天前",'bad','而且 pg_wal 会因为无法归档而持续增长直到磁盘满。监控 pg_stat_archiver 的 failed_count 和最后成功时间。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='默认配置：每周全量 + 每天差异备份，连续 WAL 归档到另一区域的对象存储，一主两备。'})();
Term(document.getElementById('t4'),[
['pg_dump -Fc -d shop -f shop.dump && pg_restore -l shop.dump | head','…\n; Selected TOC Entries:\n3401; 1259 16401 TABLE public orders postgres\n…','自定义格式，可以列出内容、选择性恢复。'],
['pg_restore -d shop_restore -j 8 -t orders shop.dump','','并行恢复，只恢复 orders 表。'],
['SELECT * FROM pg_stat_archiver;',' archived_count |    last_archived_wal     |      last_archived_time       | failed_count\n----------------+--------------------------+-------------------------------+-------------\n          12044 | 0000000100000002000000F3 | 2026-10-22 14:31:00.11+08     |            0','归档状态。'],
['SELECT pg_create_restore_point(\'before_migration_42\');',' pg_create_restore_point\n-------------------------\n 2/F4000090','命名的恢复点，配合 recovery_target_name 使用。'],
['pgbackrest --stanza=main --type=diff backup\npgbackrest --stanza=main info','stanza: main\n    status: ok\n    db (current)\n        full backup: 20261019-020001F\n        diff backup: 20261019-020001F_20261022-020003D\n            database size: 2.0TB, database backup size: 180GB','pgBackRest：执行差异备份并列出备份。'],
['pgbackrest --stanza=main --delta --type=time --target="2026-10-22 14:29:02+08" --target-action=promote restore','…','恢复到指定时间点。--delta 只替换有变化的文件。']]);
Quiz(document.getElementById('qs'),[
['能恢复到任意一秒的备份方式是？',['pg_dump','基础备份 + WAL 归档','流复制'],1,''],
['同步复制能防止误删数据吗？',['能','不能，DROP 会被复制','只有 remote_apply 能'],1,''],
['archive_timeout 的作用？',['限制归档速度','低流量时强制切换段，缩短等待归档的时间','超时后删除 WAL'],1,'它只控制切段；归档积压、传输和目标存储持久化的延迟仍会影响实际 RPO。'],
['恢复误删的表，通常应该？',['在生产库上原地 PITR','恢复到新实例，再导回该表','重启数据库'],1,''],
['真实的 RTO 应该怎么得到？',['估算','定期做恢复演练并计时','看工具文档'],1,'']]);
