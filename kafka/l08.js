const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=46)=>({w,h:40,cls:'blk '+c,html:t});
const e={};for(let i=0;i<8;i++)e['m'+i]=B(String(40+i));e.cm=P('已提交：42','sig');e.pr=P('处理到 45','sig');e.x=P('崩溃','bad');e.r=P('重启：从已提交的 42 开始 → 42–45 被重复处理','sig');
const L={};for(let i=0;i<8;i++)L['m'+i]=[i*52,0];
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'已提交',p:'处理完 41 后提交 42：表示“下一条从 42 开始”。',set:{...L,m0:[0,0,B('40','ok')],m1:[52,0,B('41','ok')],cm:[0,60]}},
 {t:'继续处理',p:'处理了 42–45，下一次提交还没发生。',d:3400,set:{...L,m0:[0,0,B('40','ok')],m1:[52,0,B('41','ok')],m2:[104,0,B('42','sig')],m3:[156,0,B('43','sig')],m4:[208,0,B('44','sig')],m5:[260,0,B('45','sig')],cm:[0,60],pr:[0,100]}},
 {t:'崩溃',p:'进程崩溃，42–45 的处理结果已经生效，但偏移量没有提交。',d:3200,set:{...L,m2:[104,0,B('42','sig')],m3:[156,0,B('43','sig')],m4:[208,0,B('44','sig')],m5:[260,0,B('45','sig')],cm:[0,60],x:[0,100]}},
 {t:'重放',p:'新的消费者从 42 开始：至少一次。处理逻辑需要幂等。',d:3800,set:{...L,cm:[0,60],r:[0,100]}}]});
(()=>{const S=[['自动提交（同步处理）','上一次 poll 后自动提交了 100（本批开始前）\n崩溃时 100–105 已处理\n重启后从 100 开始 → 100–105 重复','sig','至少一次：最多重复约一个提交间隔的数据。'],['每条处理后 commitSync','提交到 106（105 处理完之后）\n重启后从 106 开始 → 无重复、无丢失（除非崩溃发生在处理与提交之间：重复 1 条）','ok','几乎没有重复，但每条一次同步提交，吞吐很低。'],['批处理完成后提交','本批未完成，没有提交，已提交位置仍是 100\n重启后从 100 开始 → 100–105 重复','sig','至少一次，最常用。重复量最多一个批次。'],['先提交 110 再处理','poll 后立即提交 110\n崩溃时 106–109 还没处理\n重启后从 110 开始 → 106–109 丢失','bad','至多一次：会丢消息。'],['异步线程处理 + 自动提交','poll 线程把消息交给线程池后继续 poll，自动提交了 110\n线程池只处理到 105 时崩溃\n重启后从 110 开始 → 106–109 丢失','bad','自动提交只适合在 poll 线程中同步处理。'],['偏移量与结果写入同一数据库事务','数据库中记录已处理到 105（偏移量 106）\n重启后 seek(106)\n→ 无重复、无丢失','ok','精确一次（对这个数据库而言）。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r;m.className='msg '+c;m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择提交方式。'})();
const e2={lg:{w:440,h:40,cls:'frame',html:'<span style="font-family:monospace">最早 1200 ………………………… 末尾 9800</span>'},q:P('组 new 第一次读取 P0，没有已提交偏移量','sig'),l:P('latest → 从 9800 开始，只读之后的新消息','sig'),er:P('earliest → 从 1200 开始，读取全部保留的数据','sig'),o:P('已提交 800，但 1200 之前已被删除 → 超出范围 → 同样按 auto.offset.reset 处理','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'没有偏移量',p:'新组或偏移量已过期。',set:{lg:[0,0],q:[0,60]}},
 {t:'latest / earliest',p:'默认 latest：上线新服务时不会处理历史数据；需要历史时设 earliest。',d:3800,set:{lg:[0,0],q:[0,60],l:[0,100],er:[0,140]}},
 {t:'超出范围',p:'消费者停机时间超过保留期，已提交位置的数据已被删除，也会按这个配置重新选择起点，可能悄悄跳过数据。',d:4200,set:{lg:[0,0],o:[0,60]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-consumer-groups.sh $B --group g --all-topics --reset-offsets --to-earliest --dry-run','GROUP TOPIC PARTITION NEW-OFFSET\ng     jobs  0         0 …','dry-run 只显示结果。'],
['bin/kafka-consumer-groups.sh $B --group g --topic jobs:0,1 --reset-offsets --to-offset 5000 --execute','…','只重置指定分区。'],
['bin/kafka-consumer-groups.sh $B --group g --topic jobs --reset-offsets --to-datetime 2026-10-22T08:00:00.000+08:00 --execute','…','按时间点（使用时间索引）。'],
['bin/kafka-consumer-groups.sh $B --group g --topic jobs --reset-offsets --to-latest --execute','Error: Assignments can only be reset if the group \'g\' is inactive, but the current state is Stable.','组有活跃成员时不能重置。'],
['bin/kafka-consumer-groups.sh $B --group g --topic jobs --delete-offsets','Request succeed for deleting offsets from group g.','删除组在某主题上的偏移量。']]);
Quiz(document.getElementById('qs'),[
['处理完偏移量 41 后应提交？',['41','42','40'],1,''],
['先处理后提交是什么语义？',['至多一次','至少一次','精确一次'],1,''],
['commitAsync 为什么不自动重试？',['避免旧提交覆盖新提交','性能','不支持'],0,''],
['新组默认从哪里开始读？',['最早','最新（latest）','报错'],1,''],
['重置偏移量的前提？',['组没有活跃成员','Broker 重启','主题为空'],0,'']]);
