const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={b2:B('Broker 2','Leader'),b3:B('Broker 3','Follower'),b4:B('Broker 4（新）','—'),s1:P('目标副本 [2,4]：先变成 [2,3,4]，4 作为新 Follower 从头复制（受限流）','sig'),s2:P('Broker 4 追上，加入 ISR：[2,3,4]','ok'),s3:P('移除 Broker 3 的副本，删除其日志：[2,4]','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'开始',p:'当前副本 [2,3]，目标 [2,4]。',set:{b2:[0,0],b3:[160,0],b4:[320,0]}},
 {t:'添加副本',p:'控制器把 4 加入副本列表，4 开始复制全部数据。',d:3800,set:{b2:[0,0],b3:[160,0],b4:[320,0,B('Broker 4（新）','复制中…','sig')],s1:[0,70]}},
 {t:'追上',p:'4 追上 Leader 后加入 ISR。',d:3600,set:{b2:[0,0],b3:[160,0],b4:[320,0,B('Broker 4（新）','Follower','ok')],s2:[0,70]}},
 {t:'移除旧副本',p:'3 被移出副本列表，删除本地数据。整个过程中分区始终可读写。',d:3800,set:{b2:[0,0],b3:[160,0,B('Broker 3','已移除','')],b4:[320,0,B('Broker 4','Follower','ok')],s3:[0,70]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [[20,'bad','复制速率 20 MB/s 小于写入 40 MB/s：新副本永远追不上，重分配不会完成。'],[60,'sig',''],[120,'ok',''],[300,'bad','超过空闲带宽 150 MB/s：挤占业务流量，生产和消费延迟上升。']].forEach(([v,c,x])=>{const b=document.createElement('button');b.className='btn';b.textContent='--throttle '+v+' MB/s';b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));const net=v-40;p.textContent=`复制速率 ${v} MB/s，写入 40 MB/s\n净追赶速度 ${net} MB/s`+(net>0?`\n约 ${(600*1024/net/3600).toFixed(1)} 小时完成`:'\n永远无法完成');m.className='msg '+c;m.innerHTML=x||(v===60?'能完成但很慢（约 8.5 小时），期间分区副本不足的风险窗口较长。':'较好的折中：约 1.7 小时，仍在空闲带宽之内。')});q.appendChild(b)});
 m.className='msg';m.innerHTML='限流值必须明显大于分区的写入速率。'})();
const e2={c:B('控制器 ×3','先升级','sig'),b1:B('Broker 1',''),b2:B('Broker 2',''),b3:B('Broker 3',''),ck:P('每台：受控关闭 → 替换二进制 → 启动 → URP = 0 → 下一台','sig'),mv:P('全部完成并观察 → kafka-features.sh upgrade --metadata 4.4','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'控制器',p:'先逐台升级控制器节点。',set:{c:[0,0],b1:[0,70],b2:[150,70],b3:[300,70]}},
 {t:'Broker',p:'逐台升级 Broker，每台等待副本全部回到 ISR。',d:3800,set:{c:[0,0,B('控制器 ×3','4.4','ok')],b1:[0,70,B('Broker 1','4.4','ok')],b2:[150,70,B('Broker 2','升级中','sig')],b3:[300,70],ck:[0,140]}},
 {t:'功能版本',p:'此时集群仍运行在旧的 metadata.version，可以回退二进制。确认稳定后再提升功能版本，启用新功能。',d:4200,set:{c:[0,0,B('控制器 ×3','4.4','ok')],b1:[0,70,B('Broker 1','4.4','ok')],b2:[150,70,B('Broker 2','4.4','ok')],b3:[300,70,B('Broker 3','4.4','ok')],mv:[0,140]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-reassign-partitions.sh $B --list','Current partition reassignments:\nmove-0: replicas: 3,2,1. adding: 3. removing: 1.','进行中的重分配。'],
['bin/kafka-reassign-partitions.sh $B --reassignment-json-file /tmp/plan.json --cancel','Successfully cancelled partition reassignments for: move-0','取消。'],
['bin/kafka-reassign-partitions.sh $B --reassignment-json-file /tmp/dirs.json --execute','…','JSON 中加入 "log_dirs" 字段可以在同一台 Broker 的磁盘之间移动副本。'],
['bin/kafka-cluster.sh unregister $B --id 4','Broker 4 is no longer registered.','下线并注销一台已经没有副本的 Broker。'],
['bin/kafka-broker-api-versions.sh $B | grep -c "id:"','3','能看到的 Broker 数量。']]);
Quiz(document.getElementById('qs'),[
['新加入的 Broker 会自动承担已有分区吗？',['会','不会，需要重分配','重启后会'],1,''],
['限流值低于分区写入速率会怎样？',['更快','新副本永远追不上','数据丢失'],1,''],
['--verify 除了检查进度还会？',['清除限流','删除主题','选举 Leader'],0,''],
['滚动重启时进入下一台的条件？',['上一台进程启动','URP 回到 0','等待 1 分钟'],1,''],
['何时提升 metadata.version？',['升级第一台之前','所有节点升级并稳定之后','不需要'],1,'']]);
