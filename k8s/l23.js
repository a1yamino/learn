const S=(t,s,c='',w=130)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{dev:S('开发者','合并请求','',110),app:S('app 仓库','代码','',120),ci:S('CI','测试 · 构建 · 推送','',150),reg:S('镜像仓库','api:sha-3f6c1a2','',150),dep:S('deploy 仓库','image: …sha-3f6c1a2','',170),ar:S('Argo CD','集群内','',130),k:S('集群','Deployment api','',130),n:{w:700,cls:'tag'}},scenes:[
 {t:'代码合并',p:'开发者合并到 main，触发 CI。',set:{dev:[0,20,{cls:'blk sig'}],app:[150,20]}},
 {t:'CI 产出镜像',p:'CI 跑测试，构建镜像，打上提交哈希作为标签，扫描漏洞后推送到镜像仓库。',d:3600,set:{dev:[0,20],app:[150,20],ci:[310,20,{cls:'blk sig'}],reg:[500,20]}},
 {t:'更新配置仓库',p:'CI 修改 deploy 仓库中的镜像标签并提交。这是唯一的“部署动作”，CI 不接触集群。',d:3800,set:{dev:[0,20],app:[150,20],ci:[310,20],reg:[500,20],dep:[310,130,{cls:'blk sig'}]}},
 {t:'集群拉取',p:'Argo CD 轮询（或接收 webhook）发现 deploy 仓库变化，渲染清单，与集群比较，apply 差异。之后 Deployment 滚动更新，从镜像仓库拉新镜像。',d:4200,set:{dev:[0,20],app:[150,20],ci:[310,20],reg:[500,20],dep:[310,130],ar:[310,230,{cls:'blk sig'}],k:[500,230,{cls:'blk ok'}]}}]});
Player(document.getElementById('p2'),{els:{ci:S('CI','','',120),g:S('Git','期望状态','',130),k:S('集群','','',120),cred:P('CI 持有集群管理凭证','bad'),dr:P('有人 kubectl edit：Git 不知道','bad'),ar:S('Argo CD','在集群内','',130),ok1:P('凭证留在集群内','ok'),ok2:P('持续比对：漂移会被发现并修正','ok'),n:{w:700,cls:'tag'}},scenes:[
 {t:'推送模式',p:'传统做法：CI 最后一步 <code>kubectl apply</code>。CI 必须持有集群凭证，CI 被攻破就等于集群被攻破。',d:3800,set:{ci:[0,30],k:[300,30,{cls:'blk sig'}],cred:[0,120]}},
 {t:'推送模式的漂移',p:'部署完成后，没有人再比对 Git 与集群。手动修改、失败的部署都会让两者悄悄不一致。',d:3600,set:{ci:[0,30],k:[300,30,{cls:'blk bad'}],dr:[0,120]}},
 {t:'拉取模式',p:'控制器在集群内运行，只需要 Git 的读权限，持续把集群调和到 Git 中的状态。',d:3600,set:{g:[0,30],ar:[200,30,{cls:'blk sig'}],k:[400,30,{cls:'blk ok'}],ok1:[0,120],ok2:[0,160]}}]});
(()=>{let pol={selfHeal:false,prune:false};let git,live,msg;
 const reset=()=>{git={rep:3,img:'1.4.2',cm:true};live={rep:3,img:'1.4.2',cm:true}};reset();
 const gp=document.getElementById('gp'),ga=document.getElementById('ga'),gs=document.getElementById('gs'),gm=document.getElementById('gm');
 [['selfHeal','selfHeal'],['prune','prune']].forEach(([k,t])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent='自动同步 + '+t;b.addEventListener('click',()=>{pol[k]=!pol[k];b.classList.toggle('pri',pol[k]);gm.className='msg';gm.innerHTML=`${t} ${pol[k]?'已开启':'已关闭'}。自动同步始终开启：Git 有新提交时会自动 apply。`;draw()});gp.appendChild(b)});
 const A=[['push','提交：镜像改为 1.4.3',()=>{git.img='1.4.3';live.img='1.4.3';return ['ok','Git 变化触发自动同步，集群更新到 1.4.3。这是正常的发布路径。']}],
  ['edit','kubectl scale --replicas=6（手动）',()=>{live.rep=6;if(pol.selfHeal){live.rep=git.rep;return ['ok','selfHeal：Argo CD 检测到集群与 Git 不一致，几秒内把副本改回 '+git.rep+'。']}return ['bad','集群里是 6，Git 里是 '+git.rep+'：OutOfSync。没开 selfHeal，Argo CD 只报告漂移，不修改。']}],
  ['rm','提交：删除 configmap.yaml',()=>{git.cm=false;if(pol.prune){live.cm=false;return ['ok','prune：Git 中删除的资源也从集群删除。']}return ['bad','Git 里没有了，集群里还在：OutOfSync（需要 prune）。这类遗留资源时间长了很难判断能不能删。']}],
  ['hpa','HPA 把副本扩到 8',()=>{live.rep=8;if(pol.selfHeal)return ['bad','selfHeal 会把副本改回 '+git.rep+'，和 HPA 互相争夺。用了 HPA 时应从 Git 的 Deployment 中删除 replicas 字段，或在 Application 里对 /spec/replicas 设置 ignoreDifferences。']; return ['bad','OutOfSync：replicas 和 Git 不同。用了 HPA 时应从 Git 的 Deployment 中删除 replicas，或设置 ignoreDifferences。']}],
  ['revert','git revert 上一次提交',()=>{git.img='1.4.2';live.img='1.4.2';return ['ok','回滚就是一个新提交，同步后集群回到 1.4.2，并留下记录。']}],
  ['reset','重置',()=>{reset();return ['','已重置。']}]];
 A.forEach(([k,t,f])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent=t;b.addEventListener('click',()=>{const [c,m]=f();gm.className='msg '+c;gm.innerHTML=m;draw()});ga.appendChild(b)});
 function draw(){const sync=git.rep===live.rep&&git.img===live.img&&git.cm===live.cm;const col=(t,o)=>`<div class="blk" style="display:block;height:auto;padding:10px;text-align:left;font-size:12px;line-height:1.7"><b>${t}</b><br>Deployment api · replicas ${o.rep} · image api:${o.img}<br>${o.cm?'ConfigMap api-config':'<span style="opacity:.5">（无 ConfigMap）</span>'}</div>`;
  gs.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:14px 0;align-items:start">${col('Git（main）',git)}${col('集群',live)}<div class="blk ${sync?'ok':'bad'}" style="display:block;height:auto;padding:10px;text-align:left;font-size:12px;line-height:1.7"><b>Argo CD</b><br>Sync: ${sync?'Synced':'OutOfSync'}<br>Health: Healthy</div></div>`}
 draw();gm.className='msg';gm.innerHTML='先决定是否开启 selfHeal / prune，再点击下面的操作。'})();
Term(document.getElementById('t4'),[
['argocd app list','NAME          SYNC STATUS   HEALTH STATUS   REPO                               PATH\nargocd/shop   OutOfSync     Healthy         https://github.com/acme/deploy     overlays/prod','命令行客户端，需要先 <code>argocd login</code>。'],
['argocd app diff shop','===== apps/Deployment shop/api ======\n<   replicas: 6\n---\n>   replicas: 3','集群与 Git 的具体差异。'],
['argocd app sync shop --prune','Operation:  Sync\nPhase:      Succeeded\nMessage:    successfully synced (all tasks run)','手动触发同步。'],
['argocd app history shop && argocd app rollback shop 4','ID  DATE                 REVISION\n4   2026-10-21 14:02:11  3f6c1a2\n5   2026-10-21 15:30:47  9b2e0d4','回到历史版本（需关闭自动同步，否则会被 Git 再次覆盖）。'],
['flux get kustomizations','NAME   REVISION          SUSPENDED   READY   MESSAGE\nshop   main@sha1:3f6c1a2  False       True    Applied revision: main@sha1:3f6c1a2','Flux 的等价概念：GitRepository + Kustomization。'],
['kubeseal --format yaml < secret.yaml > sealed.yaml','apiVersion: bitnami.com/v1alpha1\nkind: SealedSecret\nspec:\n  encryptedData:\n    password: AgB3k…','用集群的公钥加密，sealed.yaml 可以安全提交到 Git。']]);
Quiz(document.getElementById('qs'),[
['GitOps 中，生产部署的“触发动作”是？',['CI 执行 kubectl apply','向配置仓库合并一个提交','在集群里 helm upgrade'],1,'集群自己拉取。'],
['有人手动改了集群里的资源，Argo CD 开启了 selfHeal，会怎样？',['保留修改','改回 Git 中的状态','删除该资源'],1,'Git 是唯一来源。'],
['为什么镜像不要用 latest 标签？',['无法拉取','Git 不变而内容变化，无法追溯和回滚','Argo CD 不支持'],1,'用提交哈希或摘要。'],
['数据库密码怎么放进 GitOps 仓库？',['base64 编码后提交','用 Sealed Secrets / SOPS 加密，或 External Secrets 引用外部密钥服务','写进 ConfigMap'],1,'base64 不是加密。']]);
