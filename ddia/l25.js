const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={i1:B('输入块 1','日志行'),i2:B('输入块 2','日志行'),m1:B('map 1','(/, 512) (/cart, 88)…'),m2:B('map 2','(/, 70) (/login, 9)…'),r1:B('reducer 1','/、/cart'),r2:B('reducer 2','/login、/docs'),s:P('shuffle：按键哈希分区 + 排序','sig'),o:B('输出','每个 URL 的统计','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'输入',p:'输入文件被切成多个块，每块交给一个 map 任务（尽量在数据所在的机器上运行）。',set:{i1:[0,0],i2:[0,120]}},
 {t:'map',p:'map 对每条记录输出键值对：(URL, 字节数)。',d:3200,set:{i1:[0,0],i2:[0,120],m1:[160,0],m2:[160,120]}},
 {t:'shuffle',p:'按键的哈希把键值对发往对应的 reducer，并按键排序：同一个键的值聚到一起。',d:3600,set:{m1:[0,0],m2:[0,120],s:[150,70],r1:[320,0],r2:[320,120]}},
 {t:'reduce',p:'reducer 对每个键的所有值调用一次，输出结果。失败的任务只需重跑。',d:3400,set:{r1:[0,0],r2:[0,120],o:[200,60]}}]});
const e2={j:B('批处理作业','构建 v42','sig'),v41:B('数据 v41','线上正在读','ok'),v42:B('数据 v42','新构建中'),sv:B('线上服务','读 current → v41'),c:P('校验通过 → current 指向 v42（原子切换）','ok'),rb:P('发现错误 → 切回 v41','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'构建',p:'作业把结果写到一个新的版本目录，线上服务继续读旧版本。',set:{j:[0,0],v41:[200,0],v42:[200,70],sv:[400,0]}},
 {t:'切换',p:'校验后原子地切换版本指针。',d:3200,set:{j:[0,0],v41:[200,0,B('数据 v41','保留')],v42:[200,70,B('数据 v42','线上正在读','ok')],sv:[400,0,B('线上服务','读 current → v42')],c:[0,150]}},
 {t:'回滚',p:'出了问题，切回旧版本即可：输入不变，作业可以修复后重跑。',d:3400,set:{j:[0,0],v41:[200,0,B('数据 v41','线上正在读','ok')],v42:[200,70,B('数据 v42','有问题','bad')],sv:[400,0],rb:[0,150]}}]});
(()=>{const S=[['日志 10 TB ⋈ 商品表 3 GB',['小表可以放进每台机器的内存','→ 广播哈希连接：把商品表发给每个任务，大表不洗牌'],'ok'],['订单 2 TB ⋈ 用户 1 TB，均未分区',['两边都很大','→ 排序—合并连接（或洗牌哈希连接）：两边都按 user_id 洗牌'],'sig'],['订单 ⋈ 用户，两表都按 user_id 分成 256 个桶',['分区方式相同','→ 分区哈希连接：第 k 个桶只与第 k 个桶连接，无需洗牌'],'ok'],['行为日志 ⋈ 用户，某个用户占 20% 的行',['热点键：一个任务处理 20% 的数据','→ 倾斜连接：把热点键拆到多个任务，另一侧对应的行复制过去'],'bad']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='bad'?'需要特殊处理倾斜。':'选择合适的算法可以避免或减少洗牌。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个连接场景。'})();
Term(document.getElementById('t4'),[
['awk \'{print $7}\' access.log | sort | uniq -c | sort -r -n | head -n 3','  59860 /\n  50355 /docs/ddia\n  30034 /login','awk 提取 URL（map），sort 让相同的 URL 相邻（shuffle），uniq -c 计数（reduce）。'],
['sort -S 100M --parallel=4 big.txt > sorted.txt','','sort 在内存不够时自动溢写到磁盘并多路归并：能处理远大于内存的数据。']]);
Quiz(document.getElementById('qs'),[
['批处理作业为什么可以放心重跑？',['输入不可变、输出原子提交','有事务','数据很小'],0,''],
['MapReduce 中 shuffle 的作用？',['压缩数据','把同一个键的值送到同一个 reducer 并排序','删除重复'],1,''],
['一个输入很小时适合？',['排序—合并连接','广播哈希连接','嵌套循环'],1,''],
['数据流引擎相比 MapReduce 的改进？',['不需要容错','不必把每步中间结果写入分布式存储','只支持 SQL'],1,''],
['批处理向线上服务交付数据的推荐方式？',['逐条写线上数据库','构建新的数据文件并原子切换','发邮件'],1,'']]);
