const S=(t,s,c='',w=170)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const G={base:[0,120],deps:[210,120],test:[420,40],build:[420,200],docs:[210,280],fin:[630,200]};
Player(document.getElementById('p1'),{els:{base:S('base','FROM golang'),deps:S('deps','go mod download'),test:S('test','go test ./...'),build:S('build','go build'),docs:S('docs','生成文档'),fin:S('final','distroless + /app'),
 n:{w:800,cls:'tag'},tg:{cls:'pill mute'}},scenes:[
 {t:'一个多阶段 Dockerfile',p:'五个阶段：test 和 build 都依赖 deps；docs 是另一个独立阶段；final 只需要 build 的产物。',set:{...G}},
 {t:'旧构建器：从上到下',p:'旧的构建器按顺序执行每个阶段，包括最终镜像根本用不到的 test 和 docs。',d:3600,set:{...G,n:[0,360,{html:'base → deps → test → build → docs → final　<b>依次执行</b>'}]}},
 {t:'BuildKit：只构建需要的',p:'目标是 final。BuildKit 从 final 往回找依赖：build ← deps ← base。test 和 docs 不在路径上，<b>跳过</b>。',d:3800,set:{...G,test:[420,40,{cls:'blk dim'}],docs:[210,280,{cls:'blk dim'}],base:[0,120,{cls:'blk sig'}],deps:[210,120,{cls:'blk sig'}],build:[420,200,{cls:'blk sig'}],fin:[630,200,{cls:'blk sig'}],tg:[630,140,{html:'--target final'}]}},
 {t:'并行',p:'<code>--target test</code> 只构建 test 及其依赖，不会顺带构建独立的 build 阶段。要同时构建两个目标，可用 <code>docker buildx bake test build</code>，在 Bake 文件中分别定义目标；资源允许时，互不依赖的工作可并行执行。',set:{...G,test:[420,40,{cls:'blk sig'}],build:[420,200,{cls:'blk sig'}],deps:[210,120,{cls:'blk sig'}],base:[0,120,{cls:'blk sig'}],n:[0,360,{html:'test 与 build <b>并行</b>'}]}}]});
Player(document.getElementById('p2'),{els:{ly:S('层：RUN pip install','缓存失效','dim',260),cm:{w:260,h:120,cls:'frame',html:'<i>缓存目录 /root/.cache/pip</i>'},w1:{cls:'pill mute',html:'numpy.whl'},w2:{cls:'pill mute',html:'pandas.whl'},w3:{cls:'pill sig',html:'requests.whl（新）'},n:{w:560,cls:'tag'},img:S('最终镜像','不含缓存目录','',260)},scenes:[
 {t:'普通 RUN：全部重新下载',p:'requirements.txt 加了一行，这一层缓存失效。pip 从零开始，重新下载 numpy、pandas…',set:{ly:[0,0],n:[0,80,{html:'下载 <b>所有</b>包'}]}},
 {t:'加上缓存挂载',p:'<code>RUN --mount=type=cache,target=/root/.cache/pip</code>。BuildKit 在构建之间保留这个目录。',set:{ly:[0,0],cm:[320,-30],w1:[340,10],w2:[340,50]}},
 {t:'只下载新的包',p:'层仍然重建，但 pip 在缓存目录里找到了已下载的 wheel，只下载新增的 requests。',d:3600,set:{ly:[0,0,{cls:'blk sig',html:'层：RUN pip install<br><span style="font-size:11px;opacity:.7">重建，但很快</span>'}],cm:[320,-30],w1:[340,10],w2:[340,50],w3:[440,30]}},
 {t:'缓存不进入镜像',p:'缓存目录只在 RUN 期间挂载，不属于任何层。镜像不会因此变大，所以也不需要 <code>--no-cache-dir</code>。',set:{ly:[0,0],cm:[320,-30],w1:[340,10],w2:[340,50],w3:[440,30],img:[0,130]}}]});
(()=>{let cm=false,pl='one',how='qemu';const mk=(id,list,get,set)=>{const el=document.getElementById(id);list.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)})};
 mk('o1',[['off','普通 RUN'],['on','缓存挂载']],0,v=>cm=v==='on');mk('o2',[['one','只构建 amd64'],['two','amd64 + arm64']],0,v=>pl=v);mk('o3',[['qemu','arm64：QEMU 模拟'],['cross','arm64：交叉编译']],0,v=>how=v);
 const bars=document.getElementById('bars'),bm=document.getElementById('bm');
 function draw(){[['o1',cm?'on':'off'],['o2',pl],['o3',how]].forEach(([id,v])=>document.querySelectorAll('#'+id+' .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===v)));
  document.querySelectorAll('#o3 .btn').forEach(b=>b.disabled=pl==='one');
  const dl=cm?3:40,amd=dl+30,arm=how==='qemu'?dl*(cm?1:1.3)+180:dl+32;const rows=[['amd64',amd]];if(pl==='two')rows.push(['arm64',arm]);const total=Math.max(...rows.map(r=>r[1]));
  bars.innerHTML=rows.map(([l,s])=>`<div style="display:grid;grid-template-columns:70px 1fr 64px;gap:12px;align-items:center;margin:6px 0;font:500 13px/1 var(--m)"><span>${l}</span><span style="height:12px;border-radius:6px;background:var(--sig);transform-origin:0 50%;transform:scaleX(${s/260});transition:transform 420ms var(--e-out)"></span><span style="text-align:right">${Math.round(s)} 秒</span></div>`).join('')+`<div class="tot">总计约 ${Math.round(total)} 秒</div>`;
  let m=cm?'缓存挂载：下载 120 个模块里只有 1 个是新的，下载从 40 秒降到 3 秒。':'普通 RUN：加一个依赖，120 个模块全部重新下载（40 秒）。';
  if(pl==='two')m+=how==='qemu'?' arm64 在 QEMU 里模拟执行，编译慢 5 到 10 倍。':' 交叉编译：编译器在本机架构上运行，只是输出 arm64 的二进制，几乎和 amd64 一样快。两个平台并行，总时间取较慢的那个。';
  bm.className='msg';bm.innerHTML=m}draw()})();
Term(document.getElementById('t4'),[
['docker buildx ls','NAME/NODE        DRIVER/ENDPOINT    STATUS    PLATFORMS\ndefault*         docker\n \\_ default       \\_ default        running   linux/amd64, linux/amd64/v2, linux/386\nmulti            docker-container\n \\_ multi0        \\_ unix:///var/run/docker.sock  running  linux/amd64, linux/arm64, …','<b>docker</b> 驱动：内置构建器，结果直接进入本地镜像列表；多平台能力取决于是否启用 containerd 镜像存储。<b>docker-container</b> 驱动：在容器里运行完整的 BuildKit，支持多平台、远程缓存导出。'],
['docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/alice/api:1.0 --push .',' => [linux/arm64 builder 6/6] RUN go build …   31.2s\n => [linux/amd64 builder 6/6] RUN go build …   29.8s\n => pushing manifest for ghcr.io/alice/api:1.0@sha256:…','两个平台并行构建，推送时自动生成 index。多平台结果不能直接 <code>--load</code> 到本地（除非开启 containerd 镜像存储），通常直接推送。'],
['docker buildx build --cache-to type=registry,ref=ghcr.io/alice/api:buildcache,mode=max --cache-from type=registry,ref=ghcr.io/alice/api:buildcache .',' => importing cache manifest from ghcr.io/alice/api:buildcache\n => CACHED [builder 4/6] RUN go mod download','把构建缓存存到仓库里，下次（另一台 CI 机器）先导入。<code>mode=max</code> 连中间阶段的层也导出。GitHub Actions 里常用 <code>type=gha</code>。第 23 课会用到。'],
['docker buildx build --ssh default -t app .',' => [3/5] RUN --mount=type=ssh git clone git@github.com:acme/private-lib.git','<code>RUN --mount=type=ssh</code> 把本机的 SSH agent 转发给这一条 RUN，用来拉私有仓库。私钥不进入镜像。'],
['docker build --check .','WARNING: JSONArgsRecommended - JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 9)\nWARNING: SecretsUsedInArgOrEnv - Do not use ARG or ENV instructions for sensitive data (ARG "NPM_TOKEN") (line 3)','只检查不构建。第 4 课（exec 形式的 CMD）和第 9 课（ARG 密钥）的问题都能被自动发现。适合放进 CI。']]);
Quiz(document.getElementById('qs'),[
['构建目标是 final 时，一个 final 不依赖的阶段会怎样？',['照常构建','被 BuildKit 跳过','构建失败'],1,'BuildKit 按依赖图构建。'],
['RUN --mount=type=cache 的缓存目录会让镜像变大吗？',['会','不会，它不属于任何层','只在多平台构建时会'],1,'只在 RUN 执行期间挂载。'],
['在 amd64 机器上为 arm64 构建 Go 程序，最快的方式是？',['QEMU 模拟整个构建','FROM --platform=$BUILDPLATFORM 交叉编译','买一台 arm64 机器'],1,'编译器原生运行，只改目标架构。'],
['CI 每次都在新机器上构建，层缓存总是为空。怎么办？',['--no-cache','--cache-to / --cache-from 存到仓库或 CI 缓存','把 node_modules 提交到 git'],1,'远程缓存。']]);
