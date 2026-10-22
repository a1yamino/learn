const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=480)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={s:B('扫描','公网 6379 端口开放，无密码','bad'),k:B('读取数据','KEYS * / SCAN → 用户、会话、令牌','bad'),c:B('写文件','CONFIG SET dir /root/.ssh; dbfilename authorized_keys; SAVE','bad'),r:B('服务器被控制','用写入的公钥 SSH 登录','bad'),d:P('防护：内网监听 + 防火墙 + ACL 密码 + 非 root 运行 + 受保护配置','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'发现',p:'自动化扫描器在几分钟内就会找到公网上开放的 Redis。',set:{s:[0,0]}},
 {t:'读数据',p:'没有认证，所有数据都可以读出。',d:3200,set:{s:[0,0],k:[0,54]}},
 {t:'写文件',p:'利用 RDB 写盘把可控内容写到任意路径（Redis 7 默认禁止运行时修改 dir，旧版本没有）。',d:4000,set:{s:[0,0],k:[0,54],c:[0,108]}},
 {t:'失陷',p:'如果 Redis 以 root 运行，攻击者获得服务器权限。',d:3400,set:{s:[0,0],k:[0,54],c:[0,108],r:[0,162]}},
 {t:'防护',p:'每一层都能阻断这条链。',d:3600,set:{s:[0,0],k:[0,54],c:[0,108],r:[0,162],d:[0,216]}}]});
(()=>{const C=[['GET shop:p:1','允许','ok','@read 命令，键匹配 ~shop:*。'],['SET shop:cart:9 x','允许','ok','@write，键匹配。'],['GET user:42','NOPERM No permissions to access a key','bad','键不匹配 ~shop:*。'],['KEYS shop:*','NOPERM … \'keys\' command','bad','KEYS 属于 @dangerous（也属于 @read，但 -@dangerous 在后面，按顺序后者生效）。'],['FLUSHALL','NOPERM … \'flushall\' command','bad','@dangerous。'],['CONFIG SET dir /tmp','NOPERM … \'config|set\' command','bad','@admin/@dangerous。'],['EVAL "…" 1 shop:x','NOPERM … \'eval\' command','bad','EVAL 属于 @scripting，没有授予。'],['INFO','NOPERM … \'info\' command','bad','INFO 属于 @dangerous（会暴露配置信息），需要单独 +info。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 C.forEach(([c,r,k,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=c;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent='app> '+c+'\n'+(k==='ok'?'OK':'(error) '+r);m.className='msg '+k;m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='规则按从左到右的顺序应用。'})();
Term(document.getElementById('t4'),[
['ACL LIST','1) "user app on sanitize-payload #… ~shop:* resetchannels -@all +@read +@write -@dangerous"\n2) "user default on nopass ~* &* +@all"','所有用户的规则。'],
['ACL CAT dangerous','1) "flushall"\n2) "keys"\n3) "config"\n…','某个类别包含的命令。'],
['ACL DRYRUN app GET user:1','"User app has no permissions to access the \'user:1\' key"','不实际执行，检查权限。'],
['ACL SAVE','OK','把当前规则写回 aclfile。'],
['CLIENT LIST','id=12 addr=10.0.1.5:51234 … user=app … cmd=get','每个连接使用的账户。']]);
Quiz(document.getElementById('qs'),[
['最重要的第一道防线？',['改端口','只在内网监听并限制来源','rename-command'],1,''],
['~shop:* 的含义？',['可访问以 shop: 开头的键','可执行 shop 命令','频道'],0,''],
['为什么推荐禁用或设置 default 用户密码？',['它默认无密码且有全部权限','性能','ACL 要求'],0,''],
['禁用危险命令推荐的方式？',['rename-command','ACL -@dangerous','修改源码'],1,''],
['protected-mode 的作用？',['无密码且监听外部地址时拒绝外部连接','加密','限流'],0,'']]);
(()=>{const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='')=>({w:460,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:P('app&gt; SET user:42 x','sig'),u:B('① 认证','AUTH app *** → 用户 app，状态 on'),k:B('② 命令','SET 属于 @write → 允许'),y:B('③ 键','user:42 不匹配 ~shop:*','bad'),r:P('(error) NOPERM No permissions to access a key；记入 ACL LOG','bad')};
Player(document.getElementById('p2'),{els:e,scenes:[
 {t:'认证',p:'连接先以某个用户身份认证，没有 AUTH 时就是 default 用户。',set:{c:[0,0],u:[0,40]}},
 {t:'命令',p:'按规则从左到右计算该用户可执行的命令集合。',d:3400,set:{c:[0,0],u:[0,40],k:[0,94]}},
 {t:'键',p:'命令中的每个键都要匹配某个键模式（%R~/%W~ 还区分读写）。',d:3400,set:{c:[0,0],u:[0,40],k:[0,94],y:[0,148]}},
 {t:'拒绝',p:'任何一步不通过就拒绝执行，并记录在 ACL LOG 中。',d:3400,set:{c:[0,0],u:[0,40],k:[0,94],y:[0,148],r:[0,202]}}]})})();
