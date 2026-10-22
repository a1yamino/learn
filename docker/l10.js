const P=(t,c='')=>({cls:'pill '+c,html:t});
const parts=[['reg','ghcr.io','仓库地址'],['ns','acme','命名空间'],['repo','shop-api','仓库名'],['tag',':1.4.2','标签'],['dg','@sha256:4f1e…','摘要']];
const els={};let x=0;const X={};parts.forEach(([k,t,l])=>{els[k]={w:Math.max(110,t.length*11+24),h:48,cls:'blk',html:t};els[k+'L']={w:110,cls:'tag',html:l};X[k]=x;x+=els[k].w+10});
els.d1={w:600,cls:'tag'};
const all=(hl,extra={})=>{const s={};parts.forEach(([k])=>{s[k]=[X[k],0,hl.includes(k)?{cls:'blk sig'}:{cls:'blk'}];if(hl.includes(k))s[k+'L']=[X[k],62]});return {...s,...extra}};
Player(document.getElementById('p1'),{els,scenes:[
 {t:'完整的引用',p:'<code>ghcr.io/acme/shop-api:1.4.2@sha256:4f1e…</code>。平时写的 <code>nginx</code> 其实是 <code>docker.io/library/nginx:latest</code>。',set:all([])},
 {t:'仓库地址和命名空间',p:'省略仓库地址时默认是 Docker Hub（<code>docker.io</code>）。官方镜像在 <code>library</code> 命名空间下。公司镜像通常放在私有仓库：GHCR、ECR、Harbor 等。',d:3600,set:all(['reg','ns'])},
 {t:'仓库名和标签',p:'仓库名是一组镜像的名字，标签区分版本。省略标签时默认 <code>latest</code>。',set:all(['repo','tag'])},
 {t:'摘要',p:'摘要是镜像清单内容的 SHA-256。写了摘要，Docker 会忽略标签，严格按内容拉取。',set:all(['dg'])}]});
Player(document.getElementById('p2'),{els:{t1:P(':1.4','sig'),t2:P(':latest','sig'),a:{w:240,h:56,cls:'blk',html:'sha256:4f1e…<br><span style="font-size:11px;opacity:.7">构建于 10 月 1 日</span>'},b:{w:240,h:56,cls:'blk hatch',html:'sha256:9b07…<br><span style="font-size:11px;opacity:.7">构建于 10 月 20 日</span>'},n:{w:520,cls:'tag'},dp:P('部署：shop-api@sha256:4f1e…','mute')},scenes:[
 {t:'标签指向一个摘要',p:':1.4 和 :latest 都指向 4f1e… 这份内容。',set:{a:[0,80],t1:[0,0],t2:[110,0]}},
 {t:'重新推送同一个标签',p:'修了一个 bug，重新构建并推送 :1.4 和 :latest。两个标签<b>移动</b>到新的摘要 9b07…。旧内容还在仓库里，只是没有标签指向它了。',d:3800,set:{a:[0,80],b:[320,80],t1:[320,0],t2:[430,0],n:[0,160,{html:'昨天能跑的 <b>:1.4</b>，今天拉到的是另一份内容。'}]}},
 {t:'按摘要固定',p:'部署时写摘要，拉到的永远是同一份内容。标签方便人读，摘要保证可重复。',set:{a:[0,80],b:[320,80],t1:[320,0],t2:[430,0],dp:[0,160]}}]});
(()=>{const C={'1.2.0':'#7aa2f7','1.2.1':'#43b873','1.3.0':'#e0af68','2.0.0':'#ff6b2e'},D={'1.2.0':'a1f3','1.2.1':'5c0e','1.3.0':'d872','2.0.0':'e91b'};const T={},seq=[];const rel=document.getElementById('rel'),tg=document.getElementById('tg'),tm=document.getElementById('tm');
 const tags=v=>{const[a,b]=v.split('.');return[v,a+'.'+b,a,'latest']};
 Object.keys(C).forEach(v=>{const b=document.createElement('button');b.className='btn';b.textContent='发布 '+v;b.addEventListener('click',()=>{if(seq.includes(v)){shake(b);return}seq.push(v);const moved=[];tags(v).forEach(t=>{if(T[t]&&T[t]!==v)moved.push(t);T[t]=v});b.disabled=true;draw(v,moved)});rel.appendChild(b)});
 const chip=v=>`<span class="pill" style="background:${C[v]};color:#111">sha256:${D[v]}… (${v})</span>`;
 function draw(v,moved){const order=['latest','2','1','2.0','1.3','1.2','2.0.0','1.3.0','1.2.1','1.2.0'].filter(t=>T[t]);
  tg.innerHTML=order.map(t=>`<div style="display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:center;padding:6px 0;border-top:1px solid var(--line)" class="${moved&&moved.includes(t)?'enter':''}"><b style="font:600 13px var(--m)">:${t}</b><span>${chip(T[t])}</span></div>`).join('')+
  `<div style="margin-top:16px;display:grid;gap:6px;font-size:14px;color:var(--ink2)"><div>服务 A 部署 <code>shop-api:1.2</code> → ${T['1.2']?chip(T['1.2']):'—'}</div><div>服务 B 部署 <code>shop-api:latest</code> → ${T.latest?chip(T.latest):'—'}</div><div>服务 C 部署 <code>shop-api@sha256:a1f3…</code> → ${T['1.2.0']?chip('1.2.0'):'—'}</div></div>`;
  if(!v){tm.textContent='';return}tm.className='msg';tm.innerHTML=moved.length?`标签 <b>${moved.map(x=>':'+x).join('、')}</b> 移动了。`+(v==='2.0.0'?' 服务 B 下次拉取 latest 并重建容器时会使用 2.0.0，一个不兼容的大版本。单纯 docker restart 不会拉取新镜像。这就是生产不用 latest 的原因。':moved.includes('1.2')?' 服务 A 再次拉取 :1.2 并重建后会使用补丁版本；仅重启不会更新镜像。':''):'新的版本，新的标签。'}draw()})();
Term(document.getElementById('t4'),[
['echo "$TOKEN" | docker login ghcr.io -u alice --password-stdin','Login Succeeded','凭据保存在 <code>~/.docker/config.json</code>，或者交给系统钥匙串（credential helper）。不要用 <code>-p 密码</code>，它会留在 shell 历史和进程列表里。'],
['docker tag api-demo:1.0 ghcr.io/alice/api-demo:1.0.0','','没有输出。tag 只是给同一个镜像 ID 加一个名字，不复制数据。推送目标由名字的第一段决定。'],
['docker push ghcr.io/alice/api-demo:1.0.0','The push refers to repository [ghcr.io/alice/api-demo]\n5f70bf18a086: Pushed\nd3e1b7a2c4f9: Pushed\n7d3e1c9a0b12: Mounted from library/python\n1.0.0: digest: sha256:4f1e8c… size: 1990','<b>Mounted from</b>：仓库里已经有这一层（来自 python 基础镜像），直接引用，不重复上传。最后一行就是摘要。'],
['docker images --digests ghcr.io/alice/api-demo','REPOSITORY               TAG     DIGEST            IMAGE ID\nghcr.io/alice/api-demo   1.0.0   sha256:4f1e8c…    a1b2c3d4e5f6','注意 DIGEST 和 IMAGE ID 不同：摘要是清单（manifest）的哈希，镜像 ID 是配置的哈希。拉取和部署时用摘要。'],
['docker buildx imagetools inspect nginx:1.27','Name:      docker.io/library/nginx:1.27\nMediaType: application/vnd.oci.image.index.v1+json\nDigest:    sha256:28402db6…\n\nManifests:\n  Name:      …@sha256:b5d3f3e1…\n  Platform:  linux/amd64\n  Name:      …@sha256:7a1c56f8…\n  Platform:  linux/arm64','一个标签可以指向一个<b>索引</b>，里面列出不同 CPU 架构的镜像。Docker 自动选择和本机匹配的那一个。第 13、17 课会深入。']]);
Quiz(document.getElementById('qs'),[
['docker pull redis 实际拉取的是？',['docker.io/library/redis:latest','redis.io/redis:stable','本地的 redis'],0,'省略的部分都有默认值。'],
['同一个标签，昨天和今天拉取，内容一定相同吗？',['一定相同','不一定，标签可以被重新推送','只有 latest 会变'],1,'要保证相同，用摘要。'],
['docker tag 会占用多少额外磁盘？',['和镜像一样大','几乎为 0，只是多一个名字','取决于层数'],1,'指向同一个镜像 ID。'],
['推送时显示 “Layer already exists”，说明？',['推送失败','仓库里已经有相同内容的层，跳过上传','需要先删除旧镜像'],1,'层按内容寻址，可以在镜像之间共享。']]);
