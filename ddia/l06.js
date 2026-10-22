const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={w:B('写入 cat=3','客户端'),wal:B('WAL','顺序追加，防崩溃','',150),m:B('内存表','有序：apple, cat, dog','sig'),s1:B('SSTable L0','刚刷盘'),s2:B('SSTable L1','较旧、较大'),bf:P('布隆过滤器：不在这里 → 跳过','ok'),r:B('读取 bird','')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'写 WAL',p:'先顺序追加到预写日志，崩溃后可以重放。',set:{w:[0,0],wal:[200,0]}},
 {t:'内存表',p:'再写入内存中的有序结构。写入到此完成，非常快。',d:3000,set:{w:[0,0],wal:[200,0],m:[200,70]}},
 {t:'刷盘',p:'内存表满了：按顺序写成一个不可变的 SSTable 文件。',d:3200,set:{w:[0,0],wal:[200,0],m:[200,70,B('内存表','（新的、空的）')],s1:[400,70,B('SSTable L0','apple, cat, dog','ok')],s2:[400,140]}},
 {t:'读取',p:'读取依次查内存表、L0、L1……布隆过滤器帮助跳过不包含该键的文件。',d:3600,set:{r:[0,140],m:[200,70],s1:[400,70],s2:[400,140],bf:[150,210]}}]});
const C=(t,c)=>({w:200,h:30,cls:'blk '+(c||''),html:t});
const e2={a:C('段 1：apple=1 cat=1 dog=1'),b:C('段 2：apple=2 bird=2 dog=✝'),c:C('段 3：cat=3 eel=3'),r:C('合并：apple=2 bird=2 cat=3 eel=3','ok'),n:P('dog 被墓碑删除，旧值被丢弃','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'三个段',p:'每个段内部按键排序；编号越大越新。',set:{a:[0,0],b:[0,45],c:[0,90]}},
 {t:'归并',p:'像归并排序一样同时顺序读取三个段，同一个键取最新的值。',d:3400,set:{a:[0,0],b:[0,45],c:[0,90],r:[250,45]}},
 {t:'墓碑',p:'墓碑表示删除：合并后该键消失，旧段可以删除。',d:3200,set:{a:[0,0],b:[0,45],c:[0,90],r:[250,45],n:[250,100]}}]});
(()=>{let mem={},segs=[],n=0;const keys=['apple','bird','cat','dog','eel'];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const show=(msg,c)=>{p.textContent='内存表: '+JSON.stringify(mem)+'\n'+(segs.map((s,i)=>`段 ${i+1}: `+Object.keys(s).sort().map(k=>k+'='+(s[k]===null?'✝':s[k])).join(' ')).reverse().join('\n')||'（磁盘上还没有段）');m.className='msg '+(c||'');m.innerHTML=msg};
 const A=[['写入 3 个键',()=>{for(let i=0;i<3;i++){n++;mem[keys[(n*2)%5]]=n}show('写入只改内存表（并追加 WAL）。','ok')}],
 ['删除 cat',()=>{mem.cat=null;show('删除也是一次写入：写一个墓碑 ✝。','sig')}],
 ['刷盘',()=>{if(!Object.keys(mem).length)return show('内存表为空。');segs.push(mem);mem={};show('内存表排序后写成新的段（最新的在最上面）。','ok')}],
 ['读取 cat',()=>{let v,where;if('cat' in mem){v=mem.cat;where='内存表'}else for(let i=segs.length-1;i>=0;i--)if('cat' in segs[i]){v=segs[i].cat;where='段 '+(i+1);break}show(where?`在${where}找到：cat = ${v===null?'（已删除）':v}`:'所有段都没有 cat（布隆过滤器可以避免逐个读取）',where?'ok':'sig')}],
 ['合并所有段',()=>{if(segs.length<2)return show('至少需要两个段。');const r={};segs.forEach(s=>Object.assign(r,s));Object.keys(r).forEach(k=>r[k]===null&&delete r[k]);segs=[r];show('合并：每个键只保留最新值，墓碑与被覆盖的值被丢弃。','ok')}]];
 A.forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});show('依次点击：写入 → 刷盘 → 写入 → 删除 → 刷盘 → 合并。')})();
Term(document.getElementById('t4'),[
['python3 -c "\nimport hashlib\nM, K = 64, 3                     # 64 位，3 个哈希函数\nbits = 0\ndef h(x, i): return int(hashlib.md5(f\'{i}{x}\'.encode()).hexdigest(), 16) % M\nfor k in [\'apple\', \'cat\', \'dog\']:\n    for i in range(K): bits |= 1 << h(k, i)\nfor k in [\'cat\', \'bird\', \'zebra\']:\n    print(k, all(bits >> h(k, i) & 1 for i in range(K)))\n"','cat True\nbird False\nzebra False','布隆过滤器说 False 时一定不存在；说 True 时可能误报（概率取决于位数和哈希函数数）。']]);
Quiz(document.getElementById('qs'),[
['为什么只追加日志写入很快？',['数据压缩','顺序写磁盘','不需要文件系统'],1,''],
['哈希索引的主要限制？',['键必须放进内存，且不支持范围查询','不能更新','不能删除'],0,''],
['SSTable 相比无序段的优势？',['写入更快','合并简单、可用稀疏索引、支持范围查询','不需要合并'],1,''],
['LSM 中删除一个键？',['立即从所有段中删除','写入墓碑，合并时清理','修改段文件'],1,''],
['布隆过滤器回答“不存在”时？',['可能出错','一定正确','需要再查一次索引'],1,'误报只会发生在“可能存在”的一侧。']]);
