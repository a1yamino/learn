const S=(t,s,c='',w=110)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const St=[['ck','检查','lint / --check'],['bd','构建','buildx + 缓存'],['ts','测试','--target test'],['sc','扫描','trivy'],['ps','推送','ghcr.io'],['sg','签名','cosign'],['dp','部署','按 digest']];
const els={gp:{cls:'pill mute',html:'git push'},n:{w:900,cls:'tag'}};St.forEach(([k,t,s])=>els[k]=S(t,s));const G={gp:[0,-50]};St.forEach(([k],i)=>G[k]=[i*125,0]);
const on=(cls,...ks)=>{const o={...G};ks.forEach(k=>o[k]=[G[k][0],0,{cls:'blk '+cls}]);return o};
Player(document.getElementById('p1'),{els,scenes:[
 {t:'七步',p:'每次推送触发。每一步都是一个门禁：失败就停下，后面的不执行。',set:G},
 {t:'构建一次',p:'镜像只构建一次。测试、扫描、推送、部署用的都是<b>同一个</b>镜像，不在不同步骤里重复构建。',d:3600,set:on('sig','ck','bd')},
 {t:'测试失败',p:'测试不通过，扫描、推送、部署都不会执行。仓库里不会出现坏镜像。',d:3600,set:{...on('sig','ck','bd'),ts:[250,0,{cls:'blk',html:'测试<br><span style="font-size:11px">✗ 1 failed</span>'}],sc:[375,0,{cls:'blk dim'}],ps:[500,0,{cls:'blk dim'}],sg:[625,0,{cls:'blk dim'}],dp:[750,0,{cls:'blk dim'}]}},
 {t:'全部通过',p:'推送后对 digest 签名，部署步骤拿到这个 digest。部署的就是刚测试过、扫描过、签过名的那个镜像。',d:3800,set:{...on('sig','ck','bd','ts','sc','ps','sg','dp'),n:[0,80,{html:'build → digest sha256:4b1e… → deploy'}]}}]});
Player(document.getElementById('p2'),{els:{d:{w:260,h:52,cls:'blk sig',html:'sha256:4b1e…<br><span style="font-size:11px;opacity:.7">镜像内容</span>'},t1:{cls:'pill ok',html:'sha-a1b2c3d'},t2:{cls:'pill mute',html:'1.4.2'},t3:{cls:'pill mute',html:'1.4'},t4:{cls:'pill bad',html:'latest'},t5:{cls:'pill mute',html:'main'},n:{w:640,cls:'tag'}},scenes:[
 {t:'一个镜像',p:'内容由 digest 唯一确定。标签只是指向它的名字，可以有多个。',set:{d:[0,60]}},
 {t:'每个提交',p:'<code>sha-a1b2c3d</code>：对应 git 提交，永不改变，用于追溯。<code>main</code>：分支最新一次构建，会移动。',d:3600,set:{d:[0,60],t1:[320,30],t5:[320,90]}},
 {t:'发布版本',p:'推送 git 标签 v1.4.2 时，同时打 <code>1.4.2</code> 和 <code>1.4</code>。用户可以固定补丁版本，也可以跟随 1.4 的更新。',d:3600,set:{d:[0,60],t1:[320,0],t2:[320,40],t3:[320,80],t5:[320,120]}},
 {t:'部署用 digest',p:'<code>latest</code> 和 <code>1.4</code> 会被下一次发布移动。部署配置里写 digest，回滚就是换回上一个 digest。',d:3800,set:{d:[0,60],t1:[320,0],t2:[320,40],t3:[320,80],t4:[320,120],n:[0,180,{html:'deploy: api@sha256:4b1e…'}]}}]});
(()=>{const O=[['cache','构建缓存（type=gha）',false],['once','测试用同一个镜像',false],['gate','测试失败时停止',false],['tag','标签：sha + 版本号',false],['cred','凭证：GITHUB_TOKEN',false],['digest','部署按 digest',false]];const st={};O.forEach(([k,,v])=>st[k]=v);
 const pc=document.getElementById('pc'),pl=document.getElementById('pl'),pm=document.getElementById('pm');
 O.forEach(([k,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=k;b.addEventListener('click',()=>{st[k]=!st[k];draw()});pc.appendChild(b)});
 function draw(){pc.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',st[b.dataset.v]));const L=[],P=[];
  L.push(st.cache?'build      28s   (#7 CACHED)':'build      4m10s (每次从零构建)');if(!st.cache)P.push('没有缓存：CI 每次都是新机器，每次推送都要 4 分钟。');
  L.push(st.once?'test       docker run app:sha-a1b2c3d pytest':'test       pip install && pytest （在 runner 上直接跑）');if(!st.once)P.push('测试没有在镜像里跑：测的是 runner 的环境，镜像里缺依赖也测不出来。');
  L.push(st.gate?'test       ✗ 1 failed → 后续步骤 skipped':'test       ✗ 1 failed（continue-on-error）→ 继续推送');if(!st.gate)P.push('<b>测试失败仍然推送和部署</b>，坏版本上线。');
  L.push(st.tag?'push       :sha-a1b2c3d  :1.4.2  :1.4':'push       :latest');if(!st.tag)P.push('只有 latest：无法知道线上是哪个提交，也无法回滚到某个版本。');
  L.push(st.cred?'login      ${{ secrets.GITHUB_TOKEN }}（packages: write）':'login      -p "ghp_9fK2…"  （写在 workflow 文件里）');if(!st.cred)P.push('<b>令牌写在仓库里</b>，任何能读代码的人都能推送镜像。立即吊销。');
  L.push(st.digest?'deploy     api@sha256:4b1e…':'deploy     api:latest');if(!st.digest)P.push('部署 latest：拉取时可能已被另一次构建覆盖，部署的不一定是刚测试过的镜像。');
  pl.innerHTML=L.map(x=>`<div>${x.replace(/</g,'&lt;')}</div>`).join('');
  if(P.length){pm.className='msg bad';pm.innerHTML=`还有 ${P.length} 个问题：`+P[0]}else{pm.className='msg ok';pm.innerHTML='全部修好：快、只发布测试通过的镜像、可追溯、凭证安全、部署确定。'}}draw()})();
Term(document.getElementById('t4'),[
['# 触发和权限','on:\n  push:\n    branches: [main]\n    tags: ["v*"]\n  pull_request:\n\npermissions:\n  contents: read\n  packages: write\n  id-token: write','推送到 main、推送 v 开头的标签、PR 时运行。权限只给需要的：读代码、写包、OIDC 令牌（无密钥签名用）。'],
['# 准备','jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: docker/setup-qemu-action@v3\n      - uses: docker/setup-buildx-action@v3\n      - uses: docker/login-action@v3\n        with:\n          registry: ghcr.io\n          username: ${{ github.actor }}\n          password: ${{ secrets.GITHUB_TOKEN }}','buildx 是 docker-container 驱动的构建器（第 17 课）。登录用平台自动提供的 GITHUB_TOKEN，不需要自己创建令牌。'],
['# 标签','      - id: meta\n        uses: docker/metadata-action@v5\n        with:\n          images: ghcr.io/${{ github.repository }}\n          tags: |\n            type=sha\n            type=ref,event=branch\n            type=semver,pattern={{version}}\n            type=semver,pattern={{major}}.{{minor}}','根据事件自动生成标签：提交 → sha-xxxxxxx 和 main；标签 v1.4.2 → 1.4.2 和 1.4。还生成 OCI 标准 labels（来源仓库、提交）。'],
['# 测试','      - uses: docker/build-push-action@v6\n        with:\n          target: test\n          cache-from: type=gha\n          cache-to: type=gha,mode=max','用 Dockerfile 的 test 阶段跑测试。失败则整个任务失败，后面的步骤不执行。和下一步共享缓存，不会重复构建公共层。'],
['# 构建并推送','      - id: build\n        uses: docker/build-push-action@v6\n        with:\n          platforms: linux/amd64,linux/arm64\n          push: ${{ github.event_name != \'pull_request\' }}\n          tags: ${{ steps.meta.outputs.tags }}\n          labels: ${{ steps.meta.outputs.labels }}\n          sbom: true\n          provenance: mode=max\n          cache-from: type=gha','PR 只构建不推送（外部 PR 拿不到写权限）。多平台、SBOM、来源证明（第 17、20 课）。'],
['# 签名','      - uses: sigstore/cosign-installer@v3\n      - if: github.event_name != \'pull_request\'\n        run: cosign sign --yes ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }}','无密钥签名，按 digest。身份是这个仓库的这个 workflow。']]);
Quiz(document.getElementById('qs'),[
['CI 每次构建都要很久，因为？',['机器太慢','每次都是新机器，本地没有构建缓存','Dockerfile 写错了'],1,'用 cache-to/cache-from。'],
['推送镜像的凭证应该放在？',['workflow 文件里','CI 平台的 secrets 或 GITHUB_TOKEN','Dockerfile 里'],1,'不要提交到仓库。'],
['部署时为什么按 digest 而不是 latest？',['digest 更短','保证部署的就是测试过的那个镜像','latest 不能拉取'],1,'标签会移动。'],
['PR 触发的流水线通常？',['构建并推送','只构建和测试，不推送','直接部署'],1,'外部贡献者的代码不应获得写权限。']]);
