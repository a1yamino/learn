const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=170)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={p:{w:260,h:170,cls:'frame',html:'<i>主库</i>'},s:{w:260,h:170,cls:'frame',html:'<i>备库（hot_standby，只读）</i>'},be:B('后端','写入 WAL','',100),ws:B('walsender','读 pg_wal 发送','',120),wr:B('walreceiver','写入备库 pg_wal','',120),st:B('startup','重放 WAL 到数据页','',120),f1:P('WAL 记录','sig'),rd:P('只读查询','ok'),fb:P('回报 write / flush / replay 位置','mute'),sl:P('复制槽 replica1：保留 restart_lsn 之后的 WAL','sig')};
const L={p:[0,0],s:[340,0],be:[15,30],ws:[125,30],wr:[355,30],st:[480,30]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'两个实例',p:'备库从 pg_basebackup 得到的数据目录启动，standby.signal 让它进入恢复模式，按 primary_conninfo 连接主库。',set:L},
 {t:'流式发送',p:'主库每产生一段 WAL，walsender 就把它发给备库的 walreceiver。复制的单位是 WAL 字节，不是 SQL。',d:4000,set:{...L,f1:[260,90],ws:[125,30,{cls:'blk sig'}],wr:[355,30,{cls:'blk sig'}]}},
 {t:'重放与只读',p:'startup 进程像崩溃恢复一样持续重放 WAL。备库可以执行只读查询，看到的是重放到某一时刻的一致状态。',d:4000,set:{...L,st:[480,30,{cls:'blk ok'}],rd:[355,100]}},
 {t:'反馈与复制槽',p:'备库定期回报已写入、刷盘和重放的位置。复制槽记下备库需要的最早位置，主库不会删除之后的 WAL。',d:4000,set:{...L,fb:[260,130],sl:[0,180]}}]});
const e2={c:B('COMMIT','主库','',110),w:B('主库 WAL 刷盘','local','',130),r1:B('备库收到并写入','remote_write','',140),r2:B('备库刷盘','on（同步时默认）','',140),r3:B('备库已重放','remote_apply','',140),a:P('local：等本地刷盘；off：不等待刷盘','mute'),lat:P('每多等一步，提交延迟增加一次往返','sig'),ok:P('remote_apply：立刻读备库也能看到刚写入的数据','ok')};
const S2={c:[0,40],w:[120,40]};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'异步',p:'主库本地 WAL 刷盘后就返回成功，不等备库。主库此时崩溃，备库可能还没收到这笔事务。',set:{...S2,w:[120,40,{cls:'blk ok'}],a:[0,110]}},
 {t:'remote_write',p:'等备库收到并写入操作系统缓存。主备同时断电才会丢。',d:3600,set:{...S2,r1:[260,40,{cls:'blk ok'}],lat:[0,110]}},
 {t:'on',p:'等备库把 WAL 刷到磁盘。任一台机器单独故障都不丢已提交事务。',d:3600,set:{...S2,r1:[260,40],r2:[410,40,{cls:'blk ok'}],lat:[0,110]}},
 {t:'remote_apply',p:'等备库重放完成。适合“写主库后马上从备库读”的场景，延迟最高。',d:3800,set:{...S2,r1:[260,40],r2:[410,40],r3:[560,40,{cls:'blk ok'}],ok:[0,110]}}]});
(()=>{const H=' application_name |   state   | sync_state |  sent_lsn   | flush_lsn   | replay_lsn  | replay_lag\n------------------+-----------+------------+-------------+-------------+-------------+------------\n';const Q=[['正常',H+' r1               | streaming | async      | 3/1A0021F8  | 3/1A0021F8  | 3/1A0021F8  | 00:00:00.0004','ok','三个位置相同，延迟不到 1 ms。'],
['重放落后',H+' r1               | streaming | async      | 3/9C000000  | 3/9C000000  | 3/41200000  | 00:07:12.3','sig','WAL 已经到达并刷盘，但重放落后 1.4 GB、7 分钟。常见原因：备库上的长查询与重放冲突，max_standby_streaming_delay 设得很大，重放在等查询结束；或备库 I/O 较弱。备库上看 pg_stat_database_conflicts。'],
['网络或备库写入慢',H+' r1               | streaming | async      | 3/9C000000  | 3/52000000  | 3/52000000  | 00:03:40.1','sig','flush 就已落后：瓶颈在网络或备库磁盘。'],
['备库断开',"SELECT * FROM pg_stat_replication;\n(0 rows)\n\nSELECT slot_name, active, pg_size_pretty(pg_current_wal_lsn() - restart_lsn) AS retained\nFROM pg_replication_slots;\n slot_name | active | retained\n-----------+--------+----------\n replica1  | f      | 186 GB",'bad','备库已断开，但复制槽还在，主库为它保留了 186 GB WAL，磁盘迟早会满。修复备库，或确认不再需要后删除复制槽；设置 max_slot_wal_keep_size 兜底。'],
['同步备库挂了',"SHOW synchronous_standby_names;  → r1\n"+H+" (0 rows)\n\n应用：所有写请求卡在 COMMIT",'bad','只配置了一个同步备库，它挂了，主库的提交都在等待。至少配置两个候选：ANY 1 (r1, r2)；紧急时把 synchronous_standby_names 设为空并 reload（会降级为异步）。'],
['同步复制正常',"SHOW synchronous_standby_names;  → ANY 1 (r1, r2)\n"+H+" r1               | streaming | quorum     | 3/1A0021F8  | 3/1A0021F8  | 3/1A0021F0  | 00:00:00.001\n r2               | streaming | quorum     | 3/1A0021F8  | 3/1A001000  | 3/1A000F00  | 00:00:00.004",'ok','法定数量同步：任一备库确认即可提交，单个备库故障不影响写入。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='在主库上执行 SELECT application_name, state, sync_state, sent_lsn, flush_lsn, replay_lsn, replay_lag FROM pg_stat_replication;'})();
Term(document.getElementById('t4'),[
['SELECT pg_is_in_recovery();',' pg_is_in_recovery\n-------------------\n t','在备库上为 t。'],
['SELECT now() - pg_last_xact_replay_timestamp() AS lag;','       lag\n-----------------\n 00:00:00.41','备库上：最后重放的事务的提交时间距今多久。主库空闲时这个值会一直变大，不代表真的落后。'],
['SELECT * FROM pg_stat_wal_receiver;',' status   | received_tli | written_lsn | flushed_lsn | sender_host | …\n----------+--------------+-------------+-------------+-------------+\n streaming |            1 | 3/1A0021F8  | 3/1A0021F8  | pg          |','备库上：接收进程的状态。'],
['ALTER SYSTEM SET max_slot_wal_keep_size = \'50GB\';','ALTER SYSTEM','复制槽最多保留 50 GB WAL，超过后槽失效（备库需要重建），但主库不会因磁盘满而停机。'],
['SELECT * FROM pg_stat_database_conflicts WHERE datname = \'shop\';',' datname | confl_tablespace | confl_lock | confl_snapshot | confl_bufferpin | confl_deadlock\n---------+------------------+------------+----------------+-----------------+---------------\n shop    |                0 |          0 |             41 |               2 |             0','备库上因重放冲突被取消的查询数。'],
['SELECT subname, received_lsn, latest_end_lsn, last_msg_receipt_time FROM pg_stat_subscription;','…','逻辑复制订阅端的状态。']]);
Quiz(document.getElementById('qs'),[
['物理复制传输的是？',['SQL 语句','WAL 记录','行变更'],1,''],
['备库长期断开且有复制槽，主库会？',['自动删除槽','持续保留 WAL，磁盘增长','停止写入'],1,''],
['跨大版本迁移通常用？',['物理流复制','逻辑复制','pg_basebackup'],1,''],
['synchronous_commit = remote_apply 的好处？',['提交最快','提交后立即从备库读能看到','不需要备库'],1,''],
['逻辑复制会复制 ALTER TABLE 吗？',['会','不会','只在 18 会'],1,'DDL 需要手动在两边执行。']]);
