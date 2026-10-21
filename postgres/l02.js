const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{v:{w:200,h:40,cls:'blk',html:'金额 19.99 × 3'},f:S('float8','59.97000000000000','',200),nm:S('numeric(12,2)','59.97','',200),ts:{w:200,h:40,cls:'blk',html:'2026-10-21 08:00 台北'},t1:S('timestamp','2026-10-21 08:00','',200),t2:S('timestamptz','2026-10-21 00:00 UTC','',200),i:{w:200,h:40,cls:'blk',html:'第 2,147,483,648 个订单'},i1:S('int','ERROR: integer out of range','',200),i2:S('bigint','2147483648','',200),n:{w:700,cls:'tag'}},scenes:[
 {t:'金额',p:'float 是二进制浮点数，0.1、19.99 这样的十进制小数无法精确表示，累加后误差会出现在对账里。numeric 按十进制精确存储和计算。',d:4000,set:{v:[0,30],f:[260,0,{cls:'blk bad'}],nm:[260,70,{cls:'blk ok'}]}},
 {t:'时间',p:'timestamp 只记录“墙上时间”，不知道是哪个时区。timestamptz 把输入按会话时区换算成绝对时刻存储，任何时区读出来都是同一时刻。',d:4200,set:{ts:[0,30],t1:[260,0,{cls:'blk bad'}],t2:[260,70,{cls:'blk ok'}]}},
 {t:'标识',p:'int 最大 2,147,483,647。高写入量的表几年内就可能用完，到时修改列类型需要重写整张表。主键直接用 bigint，多 4 字节换来不用担心。',d:4000,set:{i:[0,30],i1:[260,0,{cls:'blk bad'}],i2:[260,70,{cls:'blk ok'}]}}]});
const C=[['nn','NOT NULL','23502'],['ck','CHECK','23514'],['uq','UNIQUE / 主键','23505'],['fk','外键','23503']];
const e2={row:{w:300,h:40,cls:'blk',html:'INSERT INTO orders (user_id, amount) VALUES (7, -5)'},def:P('先填默认值：status = pending, created_at = now()','mute'),ix:P('唯一性通过唯一索引检查','mute'),fkq:P('在 users 中查找 id = 7（并加 KEY SHARE 锁）','mute'),bad:P('ERROR 23514: violates check constraint "orders_amount_check"','bad'),n:{w:700,cls:'tag'}};C.forEach(([k,t,s])=>e2[k]=S(t,'SQLSTATE '+s,'',150));
const cs=(h,c='sig')=>{const o={row:[0,0]};C.forEach(([k],i)=>o[k]=[i*165,90,{cls:h.includes(k)?'blk '+c:'blk'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'默认值',p:'没有给出的列先填入 DEFAULT。identity 列从序列取下一个值。',set:{...cs([]),def:[0,50]}},
 {t:'逐行检查',p:'NOT NULL 和 CHECK 只看这一行本身。amount = -5 不满足 amount &gt; 0，整条语句失败并回滚，已经插入的其他行也会撤销。',d:4200,set:{...cs(['ck'],'bad'),bad:[0,170]}},
 {t:'唯一与外键',p:'UNIQUE 和主键依赖唯一索引：插入索引项时发现重复就报错。外键在 users 中查找被引用的行，并加锁防止它被同时删除。被引用的列必须有唯一约束；引用方的列最好也建索引（删除 users 时需要查找 orders）。',d:4600,set:{...cs(['uq','fk']),ix:[0,170],fkq:[0,210]}},
 {t:'延迟检查',p:'UNIQUE 和外键可以声明为 DEFERRABLE，在事务提交时才检查，适合需要临时违反约束的批量调整（如交换两行的排序号）。NOT NULL 和 CHECK 总是立即检查。',d:4200,set:cs(['uq','fk'])}]});
(()=>{const DDL=`users:  id bigint 主键 · email text NOT NULL UNIQUE · name text NOT NULL
        已有行：(1, 'li@example.com', '李雷')
orders: id bigint identity 主键 · user_id bigint NOT NULL REFERENCES users(id)
        amount numeric(12,2) NOT NULL CHECK (amount > 0)
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','cancelled'))`;document.getElementById('ddl').textContent=DDL;
 const Q=[["INSERT INTO orders (user_id, amount) VALUES (1, 59.97);",1,'INSERT 0 1','通过全部检查。status 取默认值 pending，id 由 identity 生成。'],
  ["INSERT INTO orders (user_id, amount) VALUES (1, 0);",0,'ERROR:  23514: new row for relation "orders" violates check constraint "orders_amount_check"\nDETAIL:  Failing row contains (2, 1, 0.00, pending, …).','CHECK (amount > 0) 不满足。'],
  ["INSERT INTO orders (user_id, amount, status) VALUES (1, 10, 'PAID');",0,'ERROR:  23514: new row for relation "orders" violates check constraint "orders_status_check"','字符串比较区分大小写，\'PAID\' 不在列表中。'],
  ["INSERT INTO orders (user_id, amount) VALUES (2, 10);",0,'ERROR:  23503: insert or update on table "orders" violates foreign key constraint "orders_user_id_fkey"\nDETAIL:  Key (user_id)=(2) is not present in table "users".','users 中没有 id = 2。'],
  ["INSERT INTO orders (user_id, amount) VALUES (NULL, 10);",0,'ERROR:  23502: null value in column "user_id" of relation "orders" violates not-null constraint','外键本身允许 NULL（表示“没有关联”），所以这里还需要 NOT NULL。'],
  ["INSERT INTO orders (user_id, amount) VALUES (1, 12.345);",1,'INSERT 0 1\n-- 存储为 12.35','numeric(12,2) 会四舍五入到 2 位小数，不报错。超过 12 位总精度才报错（22003 numeric field overflow）。需要拒绝多余小数时应在应用层校验。'],
  ["INSERT INTO orders (id, user_id, amount) VALUES (100, 1, 10);",0,'ERROR:  428C9: cannot insert a non-DEFAULT value into column "id"\nDETAIL:  Column "id" is an identity column defined as GENERATED ALWAYS.\nHINT:  Use OVERRIDING SYSTEM VALUE to override.','GENERATED ALWAYS 禁止手动指定 id，避免和序列冲突。迁移数据时可用 OVERRIDING SYSTEM VALUE。'],
  ["INSERT INTO users (email, name) VALUES ('LI@example.com', '李雷');",1,'INSERT 0 1','UNIQUE 区分大小写，LI@ 和 li@ 被视为不同的邮箱。要不区分大小写，可以建唯一表达式索引 ON users (lower(email))，或使用 citext 类型。']];
 const ins=document.getElementById('ins'),ir=document.getElementById('ir'),im=document.getElementById('im');
 Q.forEach(([q],i)=>{const b=document.createElement('button');b.className='btn';b.dataset.v=i;b.textContent=q;b.style.cssText='white-space:normal;height:auto;text-align:left;line-height:1.5';b.addEventListener('click',()=>{ins.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const [,ok,out,why]=Q[i];ir.textContent=out;im.className='msg '+(ok?'ok':'bad');im.innerHTML=why});ins.appendChild(b)});
 im.className='msg';im.innerHTML='先自己判断，再点击。'})();
Term(document.getElementById('t4'),[
['\\d+ users','                                   Table "public.users"\n   Column   |           Type           | Storage  | …\n------------+--------------------------+----------+\n id         | bigint                   | plain    |\n email      | text                     | extended |\n…\nAccess method: heap','加 + 显示存储方式等更多信息。'],
['SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = \'orders\'::regclass;','       conname        | contype |              pg_get_constraintdef\n----------------------+---------+------------------------------------------------\n orders_amount_check  | c       | CHECK ((amount > (0)::numeric))\n orders_pkey          | p       | PRIMARY KEY (id)\n orders_user_id_fkey  | f       | FOREIGN KEY (user_id) REFERENCES users(id)','表上的所有约束。'],
['ALTER TABLE orders ADD COLUMN note text;','ALTER TABLE','加可空列或带常量默认值的列只修改目录，瞬间完成。'],
['ALTER TABLE orders ALTER COLUMN amount TYPE numeric(14,2);','ALTER TABLE','改类型通常需要重写整张表并持有排他锁，大表上要谨慎（第 25 课）。'],
['CREATE UNIQUE INDEX users_email_lower ON users (lower(email));','ERROR:  could not create unique index "users_email_lower"\nDETAIL:  Key (lower(email))=(li@example.com) is duplicated.','不区分大小写的唯一性。已有重复数据时需要先清理。'],
['SELECT \'{"channel":"app","tags":["a"]}\'::jsonb -> \'tags\' ->> 0 AS first_tag, \'{"a":1}\'::jsonb ? \'a\' AS has_a;',' first_tag | has_a\n-----------+-------\n a         | t','jsonb 的取值和判断运算符；GIN 索引见第 11 课。']]);
Quiz(document.getElementById('qs'),[
['存储订单金额应该用？',['float8','numeric(12,2)','text'],1,'float 有二进制误差。'],
['记录事件发生的时刻，应该用？',['timestamp','timestamptz','text'],1,'存储绝对时刻。'],
['varchar(100) 和 text 加 CHECK (length(x) &lt;= 100) 在性能上？',['varchar 快很多','基本相同','text 慢很多'],1,'存储方式一样。'],
['给大表直接 ADD CONSTRAINT … CHECK 的主要风险？',['约束不生效','持锁扫描全表，长时间阻塞读写','会删除不满足的行'],1,'先 NOT VALID 再 VALIDATE。']]);
