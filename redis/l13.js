const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={m:B('主库','offset 1000','',140),r:B('副本','空','',140),ps:P('PSYNC ? -1','sig'),fr:P('+FULLRESYNC replid 1000','sig'),rdb:P('RDB 快照（fork 或无盘直接发送）','sig'),buf:B('副本输出缓冲区','期间新写入','sig',160),ok:P('加载 RDB → 执行缓冲命令 → 持续接收命令流','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'请求',p:'副本不知道主库的历史，发送 PSYNC ? -1。',set:{m:[0,0],r:[360,0],ps:[160,60]}},
 {t:'快照',p:'主库回复 FULLRESYNC 和当前 offset，开始生成并发送 RDB。',d:3600,set:{m:[0,0],r:[360,0],fr:[160,60],rdb:[160,100]}},
 {t:'缓冲',p:'发送 RDB 期间的写命令进入该副本的输出缓冲区。',d:3600,set:{m:[0,0,B('主库','offset 1350','',140)],r:[360,0,B('副本','加载 RDB…','sig',140)],rdb:[160,100],buf:[0,140]}},
 {t:'追上',p:'副本加载完成后执行缓冲的命令，偏移量与主库一致，此后增量接收。',d:3800,set:{m:[0,0,B('主库','offset 1350','',140)],r:[360,0,B('副本','offset 1350','ok',140)],ok:[0,140]}}]});
const e2={bl:{w:520,h:44,cls:'frame',html:'<i>积压缓冲区（环形）</i> 覆盖 offset 2000 – 3000'},r:B('副本','offset 2600','',140),r2:B('副本','offset 1500','bad',140),cp:P('+CONTINUE：补发 2600–3000','ok'),fr:P('1500 已被覆盖 → +FULLRESYNC','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'短暂断线',p:'副本重连，发送 PSYNC replid 2601。所需数据仍在缓冲区。',set:{bl:[0,0],r:[0,70],cp:[170,80]}},
 {t:'断线太久',p:'另一个副本缺的数据已被环形缓冲区覆盖，只能全量同步。',d:4200,set:{bl:[0,0],r2:[0,70],fr:[170,80]}}]});
(()=>{const S=[1,64,256],D=[1,10,60,300];const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');let s=64,d=10;
 const upd=()=>{const need=d*2;const ok=need<=s;p.textContent=`积压缓冲区 ${s} MB，断线 ${d} 秒\n断线期间产生命令流约 ${need} MB`;m.className='msg '+(ok?'ok':'bad');m.innerHTML=ok?'部分同步：只补发 '+need+' MB。':'需要的数据已被覆盖 → 全量同步：主库 fork、传输整个 RDB，副本清空后重新加载。';q.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v==s+'MB'||b.dataset.v==d+'s'))};
 S.forEach(v=>{const b=document.createElement('button');b.className='btn';b.dataset.v=v+'MB';b.textContent='缓冲区 '+v+' MB';b.addEventListener('click',()=>{s=v;upd()});q.appendChild(b)});
 D.forEach(v=>{const b=document.createElement('button');b.className='btn';b.dataset.v=v+'s';b.textContent='断线 '+v+' 秒';b.addEventListener('click',()=>{d=v;upd()});q.appendChild(b)});upd()})();
Term(document.getElementById('t4'),[
['INFO replication','role:slave\nmaster_host:m\nmaster_link_status:up\nmaster_last_io_seconds_ago:1\nmaster_sync_in_progress:0\nslave_repl_offset:5321\nslave_read_repl_offset:5321\n…','在副本上执行：链接状态与偏移。'],
['INFO stats','…\nsync_full:3\nsync_partial_ok:12\nsync_partial_err:1\n…','全量/部分同步次数：sync_full 不断增长要检查积压缓冲区。'],
['REPLICAOF NO ONE','OK','把副本提升为主库（手动切换）。'],
['CONFIG GET min-replicas-*','1) "min-replicas-to-write"\n2) "0"\n3) "min-replicas-max-lag"\n4) "10"','默认不限制。'],
['ROLE','1) "master"\n2) (integer) 5321\n3) 1) 1) "172.18.0.3"\n      2) "6379"\n      3) "5321"','简洁的角色信息。']]);
Quiz(document.getElementById('qs'),[
['短暂断线后重连，通常执行？',['全量同步','部分同步','不同步'],1,''],
['积压缓冲区太小的症状？',['sync_full 频繁增长','内存不足','READONLY'],0,''],
['主库 SET 返回 OK 后立即崩溃，这次写入？',['一定在副本上','可能丢失','会自动重试'],1,'复制是异步的。'],
['WAIT 1 100 的作用？',['等待 100 ms','等待至少 1 个副本确认，最多 100 ms','延迟复制'],1,''],
['用户刚改完资料就要看到新值，应该？',['读副本','读主库','清空副本'],1,'']]);
