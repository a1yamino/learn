const S=(t,s,c='',w=170)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{u:P('https://shop.example.com/api/orders','mute'),lb:S('负载均衡器','一个公网 IP'),ctl:S('入口控制器','Envoy / Traefik …','',180),r:{w:280,h:84,cls:'blk',html:'<span style="font-size:11px;line-height:1.6">shop.example.com/api → api<br>shop.example.com/ → web<br>admin.example.com → admin</span>'},a:S('Service api',''),w:S('Service web',''),ad:S('Service admin',''),tls:P('TLS 在这里终止','ok'),n:{w:640,cls:'tag'}},scenes:[
 {t:'没有入口时',p:'每个要对外的服务都用 LoadBalancer 类型：三个服务，三个公网 IP，三份费用，三套证书。',set:{a:[460,0],w:[460,70],ad:[460,140]}},
 {t:'共用一个入口',p:'只有入口控制器的 Service 是 LoadBalancer。所有外部请求先到它。',set:{lb:[0,70],ctl:[220,70],a:[460,0],w:[460,70],ad:[460,140]}},
 {t:'按规则转发',p:'控制器读取集群里的 Ingress / HTTPRoute 规则，按 Host 头和路径选择后端 Service，直接转发到 Pod。',d:3800,set:{u:[0,0],lb:[0,70],ctl:[220,70,{cls:'blk sig'}],a:[460,0,{cls:'blk sig'}],w:[460,70],ad:[460,140],r:[150,170]}},
 {t:'TLS',p:'HTTPS 在控制器上解密，证书来自 TLS Secret。后端服务只需处理 HTTP。cert-manager 可以自动申请、续期证书。',d:3600,set:{u:[0,0],lb:[0,70],ctl:[220,70,{cls:'blk sig'}],tls:[220,140],a:[460,0],w:[460,70],ad:[460,140]}}]});
Player(document.getElementById('p2'),{els:{gc:S('GatewayClass','基础设施 · 用哪个实现','',200),gw:S('Gateway','运维 · 端口、域名、证书','',200),r1:S('HTTPRoute shop','团队 A · 路由','',200),r2:S('HTTPRoute admin','团队 B · 路由','',200),i:{w:260,h:90,cls:'blk dim',html:'Ingress<br><span style="font-size:11px;opacity:.7">所有东西在一个对象里<br>高级功能靠控制器私有注解</span>'},n:{w:640,cls:'tag'}},scenes:[
 {t:'Ingress 的局限',p:'一个 Ingress 对象混合了监听、证书、路由；权重分流、请求头匹配等常见需求没有标准字段，只能写各控制器不同的注解。',d:3800,set:{i:[0,40]}},
 {t:'GatewayClass',p:'由平台或云厂商提供：这个集群里用哪种实现。',set:{gc:[0,0,{cls:'blk sig'}]}},
 {t:'Gateway',p:'由集群运维创建：在哪些端口监听、哪些域名、用哪个证书、允许哪些命名空间挂路由。',set:{gc:[0,0],gw:[0,90,{cls:'blk sig'}]}},
 {t:'HTTPRoute',p:'由各应用团队在自己的命名空间里创建，挂到 Gateway 上。权重、请求头匹配、重定向、改写都是标准字段，换实现不用改。',d:4000,set:{gc:[0,0],gw:[0,90],r1:[0,180,{cls:'blk sig'}],r2:[240,180,{cls:'blk sig'}],n:[0,260,{html:'职责分离：谁管基础设施，谁管路由'}]}}]});
(()=>{const R=[['shop.example.com','/api','Prefix','api'],['shop.example.com','/api/admin','Prefix','admin'],['shop.example.com','/healthz','Exact','health'],['shop.example.com','/','Prefix','web']];
 const Q=[['shop.example.com','/api/orders'],['shop.example.com','/api/admin/users'],['shop.example.com','/apix'],['shop.example.com','/healthz/'],['shop.example.com','/healthz'],['other.example.com','/api/orders']];
 const rules=document.getElementById('rules'),reqs=document.getElementById('reqs'),rr=document.getElementById('rr');
 rules.innerHTML='<div>HOST                PATH          TYPE    → SERVICE</div>'+R.map((r,i)=>`<div id="r${i}">${r[0].padEnd(20,' ').replace(/ /g,'&nbsp;')}${r[1].padEnd(14,' ').replace(/ /g,'&nbsp;')}${r[2].padEnd(8,' ').replace(/ /g,'&nbsp;')}→ ${r[3]}</div>`).join('');
 const segPrefix=(p,pre)=>pre==='/'||p===pre||p.startsWith(pre.endsWith('/')?pre:pre+'/');
 function route(h,p){const c=R.map((r,i)=>[r,i]).filter(([r])=>r[0]===h&&(r[2]==='Exact'?p===r[1]:segPrefix(p,r[1])));
  c.sort((a,b)=>(b[0][2]==='Exact')-(a[0][2]==='Exact')||b[0][1].length-a[0][1].length);return c[0]}
 Q.forEach(([h,p])=>{const b=document.createElement('button');b.className='btn';b.textContent=h+p;b.addEventListener('click',()=>{reqs.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));
  R.forEach((_,i)=>document.getElementById('r'+i).style.background='');const m=route(h,p);
  if(!m){rr.className='msg bad';rr.innerHTML=`没有规则匹配 → <b>404</b>（或控制器的默认后端）。`+(h!=='shop.example.com'?'规则限定了 host，其他域名不匹配。':'');return}
  document.getElementById('r'+m[1]).style.background='color-mix(in srgb,var(--sig) 25%,transparent)';
  const why={'/apix':'Prefix 按<b>路径段</b>匹配：/api 匹配 /api 和 /api/…，不匹配 /apix。所以落到了 / 规则。','/api/admin/users':'/api 和 /api/admin 都匹配，<b>最长的前缀优先</b>。','/healthz/':'Exact 要求完全相同，多一个斜杠就不匹配，落到了 / 规则。','/healthz':'Exact 精确匹配，优先于前缀。','/api/orders':'/api 前缀匹配。'}[p]||'';
  rr.className='msg ok';rr.innerHTML=`→ <b>${m[0][3]}</b>。${why}`});reqs.appendChild(b)});rr.className='msg';rr.innerHTML='点一个请求。'})();
Term(document.getElementById('t4'),[
['kubectl get ingressclass,gatewayclass','NAME                                    CONTROLLER\ningressclass.networking.k8s.io/traefik   traefik.io/ingress-controller\n\nNAME                                        CONTROLLER                      ACCEPTED\ngatewayclass.gateway.networking.k8s.io/traefik   traefik.io/gateway-controller   True','集群里有哪些控制器。规则里的 <code>ingressClassName</code> / <code>gatewayClassName</code> 指定由谁处理。'],
['kubectl create ingress shop --class=traefik --rule="shop.example.com/*=web:80,tls=shop-tls"','ingress.networking.k8s.io/shop created','<code>tls=</code> 指定证书 Secret。'],
['kubectl describe ingress shop','Rules:\n  Host              Path  Backends\n  ----              ----  --------\n  shop.example.com  /     web:80 (10.244.1.4:8080,10.244.2.3:8080)','Backends 显示实际的 Pod 端点。为空说明 Service 有问题（第 5 课）。'],
['kubectl get httproute shop -o yaml | grep -A4 conditions','    conditions:\n    - reason: Accepted\n      status: "True"\n    - reason: ResolvedRefs\n      status: "True"','Gateway API 把状态写回对象：路由是否被 Gateway 接受、后端引用是否有效。排错比 Ingress 直观。'],
['kubectl get certificate -A','NAMESPACE   NAME       READY   SECRET     AGE\nshop        shop-tls   True    shop-tls   12d','cert-manager 的证书对象：自动从 Let\'s Encrypt 申请并在到期前续期。'],
['ingress2gateway print --providers=ingress-nginx -A','apiVersion: gateway.networking.k8s.io/v1\nkind: HTTPRoute\n…','官方迁移工具：把现有 Ingress（包括 ingress-nginx 的常用注解）转换为 Gateway API 资源，并提示无法转换的配置。']]);
Quiz(document.getElementById('qs'),[
['创建了 Ingress 但完全不起作用，首先检查？',['Pod 日志','集群里有没有对应的入口控制器','etcd'],1,'规则需要控制器来执行。'],
['Prefix 规则 /api 会匹配哪个路径？',['/apix','/api/v1','/ap'],1,'按路径段匹配。'],
['Gateway API 中，应用团队通常管理哪个资源？',['GatewayClass','Gateway','HTTPRoute'],2,'Gateway 由运维管理。'],
['按 90/10 权重分流到两个版本，在 Gateway API 里用？',['控制器私有注解','backendRefs 的 weight 字段','两个 Gateway'],1,'标准字段，换实现也有效。']]);
