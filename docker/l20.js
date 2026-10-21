const S=(t,s,c='',w=170)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
Player(document.getElementById('p1'),{els:{img:{w:200,h:170,cls:'frame',html:'<i>镜像</i>'},a:{cls:'pill mute',html:'openssl 3.0.11'},b:{cls:'pill mute',html:'zlib 1.2.13'},c:{cls:'pill mute',html:'requests 2.31.0'},db:S('漏洞库','CVE + 受影响版本','',200),r1:{cls:'pill bad',html:'CVE-2024-5535 HIGH · 修复 3.0.14'},r2:{cls:'pill sig',html:'CVE-2023-45853 CRITICAL · 无修复'},r3:{cls:'pill bad',html:'CVE-2024-35195 MEDIUM · 修复 2.32.0'},n:{w:640,cls:'tag'}},scenes:[
 {t:'1. 列出软件包',p:'扫描器读取镜像里的包管理器数据库（dpkg、apk）和语言依赖文件（requirements、package-lock、go 二进制），得到每个组件的名字和版本。这份清单就是 SBOM。',d:3800,set:{img:[0,0],a:[20,40],b:[20,80],c:[20,120]}},
 {t:'2. 对比漏洞库',p:'每个组件的版本和漏洞库里的受影响范围比较。',set:{img:[0,0],a:[20,40],b:[20,80],c:[20,120],db:[440,60]}},
 {t:'3. 结果',p:'每条结果有严重程度和<b>修复版本</b>。有修复版本：升级即可。无修复：评估是否被用到，记录并持续关注。',d:4000,set:{img:[0,0],a:[20,40],b:[20,80],c:[20,120],r1:[250,40],r2:[250,80],r3:[250,120]}},
 {t:'漏洞多半来自基础镜像',p:'你的应用代码只有几个依赖，但 <code>python:3.12</code> 带着完整的 Debian：编译器、图片库、几百个包。换成 slim 或 distroless，大部分结果直接消失。',d:3800,set:{img:[0,0],a:[20,40],b:[20,80],c:[20,120,{cls:'pill ok',html:'requests 2.32.3'}],n:[0,200,{html:'应用依赖 ≪ 基础镜像的包'}]}}]});
Player(document.getElementById('p2'),{els:{ci:S('CI 构建','私钥 / OIDC','',150),reg:{w:220,h:110,cls:'frame',html:'<i>仓库</i>'},im:{cls:'pill mute',html:'api@sha256:9f2c…'},sg:{cls:'pill sig',html:'签名（9f2c…）'},ev:{cls:'pill bad',html:'api:1.0 → sha256:66ab…'},dp:S('部署','公钥验证','',150),n:{w:640,cls:'tag'}},scenes:[
 {t:'签名的是 digest',p:'CI 构建并推送镜像，然后用私钥对镜像的 <b>digest</b> 签名。签名作为一个附属对象也存进仓库。',d:3600,set:{ci:[0,40],reg:[220,10],im:[240,40],sg:[240,80]}},
 {t:'部署时验证',p:'部署前用公钥验证：签名对得上 digest，说明内容就是 CI 构建的那个。',set:{ci:[0,40],reg:[220,10],im:[240,40],sg:[240,80],dp:[500,40,{cls:'blk sig'}],n:[0,160,{html:'verify → 通过'}]}},
 {t:'标签被篡改',p:'有人拿到仓库写权限，把 <code>api:1.0</code> 指向另一个镜像。它没有对应的签名，验证失败，部署被拒绝。',d:3800,set:{ci:[0,40],reg:[220,10],ev:[240,40],sg:[240,80],dp:[500,40,{cls:'blk dim'}],n:[0,160,{html:'verify → no matching signatures'}]}},
 {t:'来源证明',p:'<code>--provenance</code> 再附加一份证明：哪个仓库、哪个提交、哪个 CI 任务构建了它。配合签名，部署方可以只接受“来自 main 分支 CI”的镜像。',d:3800,set:{ci:[0,40],reg:[220,10],im:[240,40],sg:[240,80],dp:[500,40,{cls:'blk sig'}]}}]});
(()=>{const B={full:['python:3.12',[15,172,410,520],'约 1.0 GB，完整 Debian，带编译器和大量库。'],slim:['python:3.12-slim',[0,3,22,48],'约 130 MB，只保留运行 Python 需要的包。'],dl:['distroless/python3',[0,1,6,9],'约 55 MB，没有 shell 和包管理器。调试不便，攻击面最小。'],old:['python:3.9-slim（旧版）',[2,28,61,70],'旧的 Python 版本，很多漏洞已在新版本修复。']};
 const fixed={full:[12,151,300,190],slim:[0,0,9,4],dl:[0,0,2,1],old:[2,25,40,30]};let cur='full',unf=false;const bs=document.getElementById('bs');
 Object.entries(B).forEach(([k,[l]])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=k;b.addEventListener('click',()=>{cur=k;draw()});bs.appendChild(b)});
 const t=document.createElement('button');t.className='btn';t.textContent='--ignore-unfixed';t.addEventListener('click',()=>{unf=!unf;draw()});bs.appendChild(t);
 const cv=document.getElementById('cv'),vm=document.getElementById('vm'),L=['CRITICAL','HIGH','MEDIUM','LOW'];
 function draw(){bs.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===cur||(b===t&&unf)));
  const v=unf?fixed[cur]:B[cur][1];
  cv.innerHTML=L.map((l,i)=>`<div style="display:grid;grid-template-columns:90px 1fr 50px;gap:12px;align-items:center;margin:6px 0;font:500 13px/1 var(--m)"><span>${l}</span><span style="height:12px;border-radius:6px;background:${i<2?'var(--bad)':'var(--ink3,#777)'};transform-origin:0 50%;transform:scaleX(${Math.max(Math.sqrt(v[i]/520),0.004)});transition:transform 420ms var(--e-out)"></span><span style="text-align:right">${v[i]}</span></div>`).join('');
  const hc=v[0]+v[1];vm.className='msg '+(hc===0?'ok':'');
  vm.innerHTML=B[cur][2]+(unf?' 只显示<b>有修复版本</b>的漏洞：这些是你能马上处理的。':'')+(hc===0?' 没有可修复的高危或严重漏洞，CI 的门禁可以通过。':` 还有 ${hc} 个高危或严重。`)}draw()})();
Term(document.getElementById('t4'),[
['docker scout quickview api:1.0','  Target     │  api:1.0       │    0C     2H     7M    21L\n    digest   │  9f2c1a7e…     │\n  Base image │  python:3.12-slim │ 0C 2H 7M 21L\n  Updated base image │ python:3.13-slim │ 0C 0H 3M 19L','Docker 内置的扫描。会指出漏洞来自基础镜像，并推荐更新的基础镜像。<code>docker scout cves</code> 列出明细。'],
['trivy image --severity HIGH,CRITICAL --ignore-unfixed api:1.0','python-pkg (requirements)\nTotal: 1 (HIGH: 1, CRITICAL: 0)\n│ requests │ CVE-2024-35195 │ HIGH │ 2.31.0 │ 2.32.0 │','开源扫描器，也能扫描文件系统、git 仓库、Kubernetes 配置。'],
['docker buildx build --sbom=true --provenance=mode=max -t ghcr.io/alice/api:1.0 --push .',' => [attestations] generating SBOM\n => [attestations] generating provenance\n => pushing manifest list','SBOM 和来源证明作为 attestation 附在镜像 index 上，不影响镜像本身。'],
['docker buildx imagetools inspect ghcr.io/alice/api:1.0 --format "{{json .SBOM.SPDX.packages}}" | jq length','112','从仓库里直接读取附加的 SBOM。'],
['cosign sign --yes ghcr.io/alice/api@sha256:9f2c…','Generating ephemeral keys...\nRetrieving signed certificate...\ntlog entry created with index: 142857\nPushing signature to: ghcr.io/alice/api','无密钥签名：在 GitHub Actions 里用 OIDC 身份换取临时证书，签名记录在公共透明日志 Rekor 里。没有需要保管的私钥。'],
['cosign verify --certificate-identity-regexp "https://github.com/alice/api/.*" --certificate-oidc-issuer https://token.actions.githubusercontent.com ghcr.io/alice/api@sha256:9f2c…','Verification for ghcr.io/alice/api@sha256:9f2c… --\n  - The cosign claims were validated\n  - Existence of the claims in the transparency log was verified offline','验证签名来自 alice/api 仓库的 GitHub Actions。Kubernetes 里可以用准入控制器强制执行（K8s 课程会讲）。']]);
Quiz(document.getElementById('qs'),[
['镜像的大部分漏洞通常来自？',['你的应用代码','基础镜像里的系统包','Dockerfile 语法'],1,'换更小、更新的基础镜像收益最大。'],
['一个 CRITICAL 漏洞没有修复版本，常见做法是？',['永久阻塞发布','评估是否被用到，记录并持续关注','删除漏洞库'],1,'--ignore-unfixed 让门禁只针对能处理的问题。'],
['新漏洞公布，想知道哪些已发布的镜像受影响，最快的方式是？',['查询 SBOM','重新构建所有镜像','看 Dockerfile'],0,'SBOM 记录了每个镜像的组件和版本。'],
['签名绑定的是？',['标签','digest','仓库名'],1,'标签可以被改指向，digest 不会。']]);
