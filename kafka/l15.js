const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={src:B('Source','orders'),f:B('filter','status≠test'),mv:B('mapValues','加 amount_cny'),sp:B('split','三个分支','sig'),o1:B('Sink','orders-large','ok'),o2:B('Sink','orders-intl','ok'),o3:B('Sink','orders-normal','ok'),r:P('一条记录依次经过每个处理器，处理完再取下一条（深度优先）','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'源',p:'源处理器从 orders 的分区读取记录。',set:{src:[0,60]}},
 {t:'处理',p:'记录依次经过 filter 和 mapValues。',d:3400,set:{src:[0,60],f:[145,60],mv:[290,60]}},
 {t:'分流',p:'split 按顺序匹配分支，写入不同的主题。',d:3600,set:{src:[0,60],f:[145,60],mv:[290,60],sp:[435,60],o1:[435,0],o2:[435,120],o3:[290,140]}},
 {t:'执行',p:'每个任务处理一个输入分区，拓扑在任务内同步执行。',d:3400,set:{src:[0,60],f:[145,60],mv:[290,60],sp:[435,60],o1:[435,0],o2:[435,120],o3:[290,140],r:[0,200]}}]});
(()=>{const recs=[['u42','银卡'],['u7','普通'],['u42','金卡'],['u7','银卡'],['u42','黑卡']];let n=0;const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const show=()=>{const s=recs.slice(0,n);const t={};s.forEach(([k,v])=>t[k]=v);p.textContent='已到达：'+(s.map(([k,v])=>k+'='+v).join('  ')||'（无）')+'\n\nKStream（事件流）：'+s.length+' 条独立事件\n  count() → '+s.length+'\n\nKTable（变更流）：每个 key 的最新值\n  '+(Object.entries(t).map(([k,v])=>k+' = '+v).join('\n  ')||'（空）')+'\n  count() → '+Object.keys(t).length};
 [['下一条',()=>{if(n<recs.length)n++;show();m.className='msg sig';m.innerHTML=n?`${recs[n-1][0]}=${recs[n-1][1]}：KStream 多一个事件；KTable 中 ${recs[n-1][0]} 被更新。`:''}],['全部',()=>{n=recs.length;show();m.className='msg ok';m.innerHTML='5 个事件，但只有 2 个用户的当前状态。'}],['重置',()=>{n=0;show();m.className='msg';m.innerHTML='记录：用户等级变更。'}]].forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 show();m.className='msg';m.innerHTML='记录：用户等级变更。'})();
const e2={i0:B('orders-0','key=订单号'),i1:B('orders-1','key=订单号'),t0:B('任务 0_0','selectKey(user)','sig'),t1:B('任务 0_1','selectKey(user)','sig'),rp:B('app-…-repartition','按 user 分区','sig',170),a0:B('任务 1_0','groupByKey.count'),a1:B('任务 1_1','groupByKey.count'),n:P('子拓扑 0 写入重分区主题；子拓扑 1 从它读取，相同 user 进入同一任务','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'任务',p:'每个输入分区一个任务。',set:{i0:[0,0],i1:[0,60],t0:[150,0],t1:[150,60]}},
 {t:'改 key',p:'selectKey 之后，同一个用户的订单可能分散在两个任务中。',d:3400,set:{i0:[0,0],i1:[0,60],t0:[150,0],t1:[150,60]}},
 {t:'重分区',p:'groupByKey 需要相同 key 在一起：写入内部重分区主题，再由第二个子拓扑读取。',d:4200,set:{i0:[0,0],i1:[0,60],t0:[150,0],t1:[150,60],rp:[300,30],a0:[490,0],a1:[490,60],n:[0,130]}}]});
Term(document.getElementById('t4'),[
['builder.stream("orders").filter((k, v) -> v.amount > 0)','（DSL）','保留满足条件的记录；filterNot 相反。'],
['stream.flatMapValues(line -> Arrays.asList(line.split(" ")))','（DSL）','一条变多条，不改变 key。'],
['stream.selectKey((k, v) -> v.userId)','（DSL）','改变 key；后续有状态操作会触发重分区。'],
['stream.split().branch(isLarge, Branched.as("large")).defaultBranch()','（DSL，返回 Map<String, KStream>）','分流。'],
['builder.table("users", Materialized.as("users-store"))','（DSL）','把压缩主题读成 KTable。'],
['System.out.println(builder.build().describe())','Topologies:\n   Sub-topology: 0\n    Source: KSTREAM-SOURCE-0000000000 (topics: [orders])\n      --> KSTREAM-FILTER-0000000001\n    …','打印拓扑，排查重分区。']]);
Quiz(document.getElementById('qs'),[
['application.id 同时用作？',['消费者组 ID 和内部主题前缀','Broker ID','事务 ID'],0,''],
['KTable 中同 key 的新记录？',['追加为新事件','覆盖旧值','被丢弃'],1,''],
['为什么优先使用 mapValues？',['更快','不改 key，避免重分区','可以改 key'],1,''],
['Streams 应用的最大并行度？',['线程数','输入主题的分区数','实例数'],1,''],
['改 key 后直接 to() 会产生内部重分区主题吗？',['会','不会','只有在 EOS 下会'],1,'']]);
