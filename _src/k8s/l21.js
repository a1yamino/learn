const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{pod:S('Pod','privileged: true, hostPath: /','',200),pr:S('privileged','ns: legacy','',150),bl:S('baseline','ns: shop','',150),rs:S('restricted','ns: payments','',150),a:P('允许','ok'),b:P('拒绝：privileged、hostPath','bad'),c:P('拒绝：还需要 runAsNonRoot、drop ALL…','bad'),w:P('warn / audit：只提示或记录，不拒绝','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'一个危险的 Pod',p:'它以特权模式运行并挂载宿主机根目录：等于拿到整个节点。',set:{pod:[0,40,{cls:'blk bad'}]}},
 {t:'privileged',p:'命名空间标签 <code>pod-security.kubernetes.io/enforce=privileged</code>：不做限制。只用于系统组件（CNI、CSI node、监控代理）。',d:3600,set:{pod:[0,40],pr:[260,0,{cls:'blk sig'}],a:[440,14]}},
 {t:'baseline',p:'禁止已知的提权途径：privileged、hostNetwork/hostPID、hostPath、添加危险 capabilities。普通应用几乎都能通过。',d:3800,set:{pod:[0,40],pr:[260,0],bl:[260,80,{cls:'blk sig'}],a:[440,14],b:[440,94]}},
 {t:'restricted',p:'在 baseline 之上要求加固：非 root、禁止提权、drop ALL、seccomp RuntimeDefault、只允许部分卷类型。可以先用 warn 和 audit 模式观察，再改为 enforce。',d:4200,set:{pod:[0,40],pr:[260,0],bl:[260,80],rs:[260,160,{cls:'blk sig'}],a:[440,14],b:[440,94],c:[440,174],w:[0,240]}}]});
const A=[['au','认证 / 授权','第 20 课'],['mu','变更准入','默认值、注入 sidecar'],['sc','schema 校验',''],['va','校验准入','PSA、VAP、Kyverno'],['et','写入 etcd','']];
const e2={y:P('image: nginx（无标签）','mute'),y2:P('+ istio-proxy sidecar、默认 requests','sig'),x:P('拒绝：镜像不能是 latest','bad'),n:{w:700,cls:'tag'}};A.forEach(([k,t,s])=>e2[k]=S(t,s,'',140));
const on=(h,c='sig')=>{const o={};A.forEach(([k],i)=>o[k]=[i*150,40,{cls:k===h?'blk '+c:'blk'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'变更',p:'通过认证授权后，先运行 mutating 准入：MutatingWebhook、内置插件（如给没有 storageClassName 的 PVC 填默认值）。它们可以修改对象。',d:4000,set:{...on('mu'),y:[150,130],y2:[150,170]}},
 {t:'校验 schema',p:'变更后的对象再按 API schema 校验一次。',set:{...on('sc')}},
 {t:'校验准入',p:'validating 准入只能同意或拒绝，不能修改：Pod Security Admission、ValidatingAdmissionPolicy（CEL，内置于 API Server）、ValidatingWebhook（Kyverno、Gatekeeper）。任何一个拒绝，请求就失败。',d:4400,set:{...on('va','bad'),x:[450,130]}},
 {t:'webhook 的代价',p:'webhook 是 API Server 同步调用的外部服务：它挂了，相应的请求就会失败（failurePolicy: Fail）或绕过校验（Ignore）。简单规则优先用 ValidatingAdmissionPolicy。',d:4200,set:{...on('et','ok')}}]});
(()=>{const C=[['web','api',8080],['api','db',5432],['web','db',5432],['prom','api',9090],['api','dns',53],['api','外部',443]];
 const NS={web:'shop',api:'shop',db:'shop',prom:'monitoring',dns:'kube-system','外部':'internet'};
 const POL=[['deny','shop：默认拒绝入站','in',['web','api','db'],()=>false],['web-api','api：允许来自 web 的 8080','in',['api'],(s,p)=>s==='web'&&p===8080],['api-db','db：允许来自 api 的 5432','in',['db'],(s,p)=>s==='api'&&p===5432],['mon','shop：允许 monitoring 命名空间的 9090','in',['web','api','db'],(s,p)=>NS[s]==='monitoring'&&p===9090],['egress','api：出站只允许 db 和 DNS','out',['api'],(d,p)=>d==='db'&&p===5432||d==='dns'&&p===53]];
 const on={};const np=document.getElementById('np'),ng=document.getElementById('ng'),nm=document.getElementById('nm');
 POL.forEach(([k,t])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent=t;b.addEventListener('click',()=>{on[k]=!on[k];b.classList.toggle('pri',on[k]);draw(k)});np.appendChild(b)});
 function check(s,d,p){const act=POL.filter(x=>on[x[0]]);const inP=act.filter(x=>x[2]==='in'&&x[3].includes(d));const outP=act.filter(x=>x[2]==='out'&&x[3].includes(s));
  if(outP.length&&!outP.some(x=>x[4](d,p)))return [0,'出站被限制（'+s+' 的 Egress 已被选中）'];if(inP.length&&!inP.some(x=>x[4](s,p)))return [0,d+' 的入站已被选中，没有规则放行'];
  return [1,inP.length||outP.length?'有策略放行':'没有策略选中，默认放行']}
 function draw(k){const R=C.map(([s,d,p])=>[s,d,p,...check(s,d,p)]);
  ng.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:14px 0">'+R.map(([s,d,p,ok,why])=>`<div class="blk ${ok?'ok':'bad'}" style="display:block;height:auto;padding:10px;text-align:left;font-size:12px;line-height:1.6"><b>${s} → ${d}:${p}</b><br><span style="opacity:.85">${ok?'✓ 通':'✗ 不通'} · ${why}</span></div>`).join('')+'</div>';
  const M={deny:'选中了 shop 里所有 Pod 的入站，却没有任何放行规则：命名空间内外的连接全部被挡。出站不受影响。',
   'web-api':'只放行到 api 的 8080。策略是叠加的：与默认拒绝一起生效时，api 只接受来自 web 的流量。',
   'api-db':'db 只接受来自 api 的连接。web → db 仍不通，这就是分层隔离。',
   mon:'跨命名空间放行要用 namespaceSelector。监控抓取一般需要这样一条规则，否则开启默认拒绝后指标就断了。',
   egress:'api 的 Egress 被选中后只能访问列出的目标。DNS 必须显式放行，否则连 Service 名都解析不了。'};
  nm.className='msg';nm.innerHTML=k?(on[k]?M[k]:'已关闭这条策略。'):'当前没有任何策略：所有连接都通。依次启用策略。'}
 draw()})();
Term(document.getElementById('t4'),[
['kubectl get ns -L pod-security.kubernetes.io/enforce','NAME          STATUS   AGE   ENFORCE\ndefault       Active   12d\nkube-system   Active   12d\nsecure        Active   3m    restricted','各命名空间的 Pod Security 级别。'],
['kubectl label ns shop pod-security.kubernetes.io/warn=restricted pod-security.kubernetes.io/audit=restricted','namespace/shop labeled','先只警告和审计，观察一段时间再 enforce。'],
['kubectl get networkpolicy -A','NAMESPACE   NAME           POD-SELECTOR   AGE\nsecure      allow-client   app=good       2m\nsecure      default-deny   <none>         3m','<none> 表示选中命名空间中的所有 Pod。'],
['kubectl describe networkpolicy allow-client -n secure | sed -n "/Allowing ingress/,/Not affecting/p"','  Allowing ingress traffic:\n    To Port: 8080/TCP\n    From:\n      PodSelector: role=client\n  Not affecting egress traffic','describe 会把规则翻译成可读的形式。'],
['kubectl get validatingadmissionpolicies,validatingwebhookconfigurations','NAME                                                           VALIDATIONS\nvalidatingadmissionpolicy.admissionregistration.k8s.io/no-latest   1\n\nNAME                                                              WEBHOOKS\nvalidatingwebhookconfiguration.admissionregistration.k8s.io/kyverno-resource-validating-webhook-cfg   1','集群里所有校验准入规则。'],
['kubectl run x --image=nginx:1.27 --dry-run=server','pod/x created (server dry run)','server dry-run 会经过全部准入控制，但不写入。']]);
Quiz(document.getElementById('qs'),[
['一个 Pod 没有被任何 NetworkPolicy 选中，它的入站？',['全部拒绝','全部允许','只允许同命名空间'],1,'选中后才会受限。'],
['两条策略都选中同一个 Pod，一条放行 A，一条放行 B，结果？',['只有 A','A 和 B 都放行','都不放行'],1,'策略叠加，取并集。'],
['给 Pod 加了 Egress 默认拒绝后访问 Service 名失败，最可能缺少？',['ClusterIP','到 kube-dns 53 端口的放行','RBAC'],1,'DNS 也是出站流量。'],
['只做校验、不修改对象，又不想部署 webhook 服务，用？',['MutatingWebhook','ValidatingAdmissionPolicy','PriorityClass'],1,'CEL 表达式，内置。']]);
