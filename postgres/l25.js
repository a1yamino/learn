const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=170)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={r:B('报表查询','已运行 8 分钟','ok'),a:B('ALTER TABLE ADD COLUMN','需要 ACCESS EXCLUSIVE · 等待','sig',220),q:B('之后的 2000 个查询','全部排队','bad',220),i:P('接口超时 8 分钟：一次“毫秒级”的迁移造成的事故','bad'),t:B('ALTER（lock_timeout 2s）','2 秒后放弃，重试','sig',220),ok:B('之后的查询','只等了 2 秒','ok',220),rt:P('第 3 次重试时报表已结束 → 2 ms 完成','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'一个长查询',p:'某个报表查询已经跑了 8 分钟，持有 orders 的 ACCESS SHARE 锁。',set:{r:[0,0]}},
 {t:'迁移开始',p:'部署流水线执行 ADD COLUMN。它本身 2 ms 就能完成，但必须先拿到 ACCESS EXCLUSIVE，只能等报表结束。',d:3800,set:{r:[0,0],a:[200,0]}},
 {t:'所有人都在等',p:'后来的查询排在 ALTER 后面。接口全部超时，直到报表结束。',d:3800,set:{r:[0,0],a:[200,0],q:[200,60],i:[0,130]}},
 {t:'lock_timeout + 重试',p:'设置 2 秒的锁超时：最坏情况只让查询多等 2 秒。脚本隔一会儿重试，总能找到没有长查询的时机。',d:4200,set:{r:[0,0],t:[200,0],ok:[200,60],rt:[0,130]}}]});
const ST=[['1 扩展','加 name 新列（可空）','sig'],['2 双写','新代码同时写 username 和 name；触发器兜底','sig'],['3 回填','分批把 username 复制到 name','sig'],['4 切换读取','代码只读 name','ok'],['5 停止写旧列','代码不再引用 username','ok'],['6 收缩','DROP COLUMN username','ok']];
const e2={bad:P('直接 RENAME COLUMN username TO name：滚动发布期间旧实例全部报 column "username" does not exist','bad'),v:P('每一步都同时兼容正在运行的新旧两个版本','ok')};ST.forEach(([t,s],i)=>e2['s'+i]=B(t,s,'',190));
const S=n=>{const o={};for(let i=0;i<n;i++)o['s'+i]=[(i%3)*200,Math.floor(i/3)*60,{cls:'blk '+ST[i][2]}];return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'直接改名',p:'改名本身瞬间完成，但部署是滚动的：有几分钟新旧代码同时在线，旧代码还在使用旧列名。',set:{bad:[0,0]}},
 {t:'扩展',p:'先只做向后兼容的添加。旧代码不知道新列，不受影响。新代码两边都写。',d:4000,set:S(2)},
 {t:'迁移',p:'回填历史数据。确认新列完整后，发布只读新列的版本。',d:3800,set:S(4)},
 {t:'收缩',p:'所有在线版本都不再使用旧列后，才删除它。整个过程跨越 3 次发布，每一步都可以回滚。',d:4000,set:{...S(6),v:[0,130]}}]});
(()=>{const Q=[["ALTER TABLE orders ADD COLUMN note text",'锁：ACCESS EXCLUSIVE · 耗时：毫秒（只改目录）','ok','安全。仍要设 lock_timeout。'],
["ALTER TABLE orders ADD COLUMN source text DEFAULT 'web'",'锁：ACCESS EXCLUSIVE · 耗时：毫秒\n（11+：默认值存在目录中，读取时补上）','ok','安全。'],
["ALTER TABLE orders ADD COLUMN token uuid DEFAULT gen_random_uuid()",'锁：ACCESS EXCLUSIVE · 耗时：重写整张表，约 40 分钟','bad','volatile 默认值每行不同，必须重写。改为：加可空列 → 设置默认值（只影响新行）→ 分批回填旧行。'],
["ALTER TABLE orders ALTER COLUMN status SET NOT NULL",'锁：ACCESS EXCLUSIVE · 耗时：全表扫描验证，约 3 分钟','bad','先 ADD CONSTRAINT … CHECK (status IS NOT NULL) NOT VALID，VALIDATE（不阻塞读写），再 SET NOT NULL（利用已验证的约束跳过扫描）。'],
["ALTER TABLE orders ALTER COLUMN user_id TYPE bigint",'锁：ACCESS EXCLUSIVE · 耗时：重写表和所有索引，约 2 小时','bad','新列 + 触发器同步 + 分批回填 + 短事务切换。'],
["ALTER TABLE orders ALTER COLUMN note TYPE varchar(500)  -- 原为 varchar(200)",'锁：ACCESS EXCLUSIVE · 耗时：毫秒','ok','扩大 varchar 长度或 varchar → text 不需要重写。缩小长度则需要扫描验证。'],
["CREATE INDEX orders_status_idx ON orders (status)",'锁：SHARE（阻塞所有写入）· 耗时：约 6 分钟','bad','用 CREATE INDEX CONCURRENTLY，不阻塞写入。失败时 DROP INDEX CONCURRENTLY 留下的 INVALID 索引后重试。'],
["ALTER TABLE order_items ADD FOREIGN KEY (order_id) REFERENCES orders (id)",'锁：两张表 SHARE ROW EXCLUSIVE · 耗时：扫描验证全部行','bad','先 NOT VALID 添加（只检查新写入），再 VALIDATE CONSTRAINT。'],
["ALTER TABLE orders DROP COLUMN legacy_flag",'锁：ACCESS EXCLUSIVE · 耗时：毫秒（只标记为已删除，空间在行被重写时回收）','sig','数据库层面安全，但必须先确认所有在线代码都不再引用它（包括 SELECT *  映射到固定字段的 ORM）。'],
["ALTER TABLE orders RENAME COLUMN username TO name",'锁：ACCESS EXCLUSIVE · 耗时：毫秒','sig','数据库层面安全，应用层面危险：滚动发布中的旧实例会立即报错。用扩展—迁移—收缩，或者在过渡期用视图。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][0]+';\n\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='orders：2 亿行，60 GB，持续写入。'})();
Term(document.getElementById('t4'),[
['SET lock_timeout = \'2s\'; SET statement_timeout = \'0\';','SET\nSET','迁移会话：锁等待短，执行本身不限时（例如 VALIDATE）。'],
['ALTER TABLE orders ADD CONSTRAINT c CHECK (x > 0) NOT VALID;\nALTER TABLE orders VALIDATE CONSTRAINT c;','ALTER TABLE\nALTER TABLE','两步加约束。VALIDATE 只拿 SHARE UPDATE EXCLUSIVE，不阻塞读写。'],
['SELECT conname, convalidated FROM pg_constraint WHERE conrelid = \'orders\'::regclass;','   conname    | convalidated\n--------------+--------------\n orders_pkey  | t\n c            | f','尚未验证的约束。'],
['SELECT indexrelid::regclass, indisvalid FROM pg_index WHERE NOT indisvalid;',' indexrelid | indisvalid\n------------+------------\n orders_status_idx | f','CONCURRENTLY 失败留下的无效索引。'],
['SELECT phase, blocks_done, blocks_total FROM pg_stat_progress_create_index;','        phase         | blocks_done | blocks_total\n----------------------+-------------+--------------\n building index: scanning table |      812003 |      7864320','建索引进度。'],
['SELECT pid, locktype, mode, granted, relation::regclass FROM pg_locks WHERE NOT granted;','…','迁移卡住时先看它在等谁。']]);
Quiz(document.getElementById('qs'),[
['迁移会话中最重要的设置是？',['work_mem','lock_timeout','search_path'],1,''],
['PostgreSQL 11+ 中 ADD COLUMN … DEFAULT 常量会重写表吗？',['会','不会','只有大表会'],1,''],
['给 2 亿行的表加 NOT NULL，推荐？',['直接 SET NOT NULL','CHECK … NOT VALID + VALIDATE，再 SET NOT NULL','重建表'],1,''],
['滚动发布时给列改名的安全方式？',['RENAME COLUMN','扩展—迁移—收缩','停机'],1,''],
['大表回填数据应该？',['一条 UPDATE','分批、每批单独提交','用 VACUUM FULL'],1,'']]);
