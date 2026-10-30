const R=(t,c,w=180)=>({w,h:40,cls:'blk '+c,html:t});
const lab=(t)=>({w:150,cls:'tag',html:t});
Player(document.getElementById('p1'),{els:{
 L1l:lab('lowerdir 1（底层）'),L2l:lab('lowerdir 2'),Ul:lab('upperdir（容器层）'),Ml:lab('merged（容器看到的）'),
 l1a:R('etc/conf · v1','dim'),l1b:R('app/a.py · v1','dim'),l2a:R('app/a.py · v2','dim'),l2b:R('app/b.py','dim'),
 m1:R('etc/conf','',140),m2:R('app/a.py','',140),m3:R('app/b.py','',140),u1:R('etc/conf · v1 → 改','hatch'),u2:R('app/b.py · whiteout','hatch'),n:{w:600,cls:'tag'}},
 scenes:[
 {t:'几个目录叠在一起',p:'镜像的每一层是一个只读目录（lowerdir）。容器层是可写目录（upperdir）。OverlayFS 把它们合并成一个目录（merged）作为容器的根目录。',d:3600,set:{L1l:[0,220],L2l:[0,160],Ul:[0,100],Ml:[0,0],l1a:[170,212],l1b:[370,212],l2a:[370,152],l2b:[570,152],m1:[170,-8],m2:[330,-8],m3:[490,-8]}},
 {t:'读：从上往下找',p:'app/a.py 在两层里都有。上层的 v2 遮住了下层的 v1，容器读到 v2。',set:{L1l:[0,220],L2l:[0,160],Ul:[0,100],Ml:[0,0],l1a:[170,212],l1b:[370,212,{cls:'blk dim',html:'<span style="opacity:.4">app/a.py · v1</span>'}],l2a:[370,152,{cls:'blk sig'}],l2b:[570,152],m1:[170,-8],m2:[330,-8,{cls:'blk sig',html:'app/a.py · v2'}],m3:[490,-8]}},
 {t:'写：copy-up',p:'修改 etc/conf：先把<b>整个文件</b>复制到 upperdir，再修改副本。下层的原文件不变，其他容器不受影响。',d:3600,set:{L1l:[0,220],L2l:[0,160],Ul:[0,100],Ml:[0,0],l1a:[170,212],l1b:[370,212],l2a:[370,152],l2b:[570,152],u1:[170,92],m1:[170,-8,{cls:'blk sig',html:'etc/conf · 已改'}],m2:[330,-8],m3:[490,-8]}},
 {t:'删：whiteout',p:'删除 app/b.py：下层是只读的，删不掉。于是在 upperdir 里放一个同名的特殊文件（字符设备 0/0），合并视图里就看不到它了。',d:3800,set:{L1l:[0,220],L2l:[0,160],Ul:[0,100],Ml:[0,0],l1a:[170,212],l1b:[370,212],l2a:[370,152],l2b:[570,152],u1:[170,92],u2:[570,92],m1:[170,-8,{cls:'blk sig',html:'etc/conf · 已改'}],m2:[330,-8],n:[0,280,{html:'镜像大小不会因删除而减少：b.py 仍然在 lowerdir 2 里'}]}}]});
const C=(h,b,w=300)=>({w,cls:'card',html:`<h6>${h}</h6><div style="font:400 12px/1.7 var(--m)">${b}</div>`});
Player(document.getElementById('p2'),{els:{
 tag:{cls:'pill sig',html:'nginx:1.27'},ix:C('index · sha256:2840…','linux/amd64 → sha256:b5d3…<br>linux/arm64 → sha256:7a1c…'),
 mf:C('manifest (amd64) · sha256:b5d3…','config → sha256:9a1f…<br>layers → 7 个 sha256'),cf:C('config · sha256:9a1f…','Env, Cmd, User, WorkingDir…<br>rootfs.diff_ids','260'),
 ly:C('layers','sha256:e4fff0779e… 28 MB<br>sha256:2a3e5b8d… 41 MB<br>…（tar.gz）','260'),n:{w:620,cls:'tag'}},scenes:[
 {t:'标签指向 index',p:'仓库把标签解析成一个摘要。对多平台镜像，这个摘要指向一个 <b>index</b>，列出每个平台的 manifest。',set:{tag:[0,0],ix:[140,-20]}},
 {t:'选择本机平台的 manifest',p:'客户端按本机的 OS 和 CPU 架构选一个 manifest。manifest 列出一个 config 和若干个 layer 的摘要。',set:{tag:[0,0],ix:[140,-20],mf:[140,110]}},
 {t:'下载 config 和 layers',p:'config 是 JSON：运行配置（Env、Cmd…）和每层解压后的摘要。layer 是 tar 压缩包。本地已有的摘要直接跳过。',d:3600,set:{tag:[0,0],ix:[140,-20],mf:[140,110],cf:[480,110],ly:[480,240]}},
 {t:'一切按内容寻址',p:'每一项的名字就是它内容的 sha256。内容变一个字节，名字就变，引用它的上一级也跟着变。所以摘要可以保证“拉到的就是这一份”。',d:3800,set:{tag:[0,0],ix:[140,-20],mf:[140,110],cf:[480,110],ly:[480,240],n:[0,380,{html:'<b>tag → index → manifest → config + layers</b>'}]}}]});
(()=>{const L1={'/etc/conf':'v1','/app/a.py':'v1'},L2={'/app/a.py':'v2','/app/b.py':'b'};let U={};const mg=document.getElementById('mg'),up=document.getElementById('up'),om=document.getElementById('om'),op=document.getElementById('op');
 const merged=()=>{const m={};for(const L of [L1,L2])Object.assign(m,L);for(const[k,v]of Object.entries(U)){if(v===null)delete m[k];else m[k]=v}return m};
 const src=k=>U[k]!==undefined?'upper':k in L2?'lower 2':'lower 1';
 const show=(msg)=>{const m=merged();mg.innerHTML=Object.keys(m).sort().map(k=>`${k}  <span style="color:#a9a69f">= ${m[k]}  ← ${src(k)}</span>`).join('\n')||'（空）';
  up.innerHTML=Object.keys(U).sort().map(k=>U[k]===null?`<span class="e">c--------- 0,0  ${k}  (whiteout)</span>`:`<span class="o">${k} = ${U[k]}</span>`).join('\n')||'<span style="opacity:.6">（空）</span>';om.className='msg';om.innerHTML=msg||''};
 const A=[['cat /app/a.py',()=>{const m=merged();show(m['/app/a.py']?`读到 <b>${m['/app/a.py']}</b>，来自 ${src('/app/a.py')}。下层的 v1 被遮住了。`:'文件不存在。')}],
  ['修改 /etc/conf',()=>{const had=U['/etc/conf']!==undefined;U['/etc/conf']='v1-改';show(had?'已经在 upper 里，直接修改，不再复制。':'<b>copy-up</b>：整个文件从 lower 1 复制到 upper，再修改。lower 1 里仍是 v1。')}],
  ['删除 /app/b.py',()=>{if(U['/app/b.py']===null)return show('已经删除了。');U['/app/b.py']=null;show('lower 2 是只读的。upper 里创建了一个 <b>whiteout</b>，合并视图里 b.py 消失，但它仍然占用镜像空间。')}],
  ['新建 /tmp/x',()=>{U['/tmp/x']='new';show('新文件直接写在 upper。')}],
  ['docker rm（删除容器层）',()=>{U={};show('upperdir 被删除。所有修改消失，镜像层原封不动。')}]];
 A.forEach(([l,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.addEventListener('click',f);op.appendChild(b)});show('')})();
Term(document.getElementById('t4'),[
['docker inspect -f "{{json .GraphDriver.Data}}" web | python3 -m json.tool','{\n    "LowerDir": "/var/lib/docker/overlay2/4c1e…-init/diff:/var/lib/docker/overlay2/9f2a…/diff:…",\n    "MergedDir": "/var/lib/docker/overlay2/4c1e…/merged",\n    "UpperDir": "/var/lib/docker/overlay2/4c1e…/diff",\n    "WorkDir": "/var/lib/docker/overlay2/4c1e…/work"\n}','容器的四个目录。LowerDir 用冒号分隔，左边是上层。<b>-init</b> 层是 Docker 放 /etc/hosts、/etc/resolv.conf 等文件的地方。新版 Docker 默认改用 containerd 镜像存储（overlayfs snapshotter），路径不同，原理相同。'],
['mount | grep 4c1e','overlay on /var/lib/docker/overlay2/4c1e…/merged type overlay (rw,relatime,lowerdir=…,upperdir=…,workdir=…)','它就是一个普通的 overlay 挂载。容器的 mount namespace 把 merged 作为根目录。'],
['docker exec web sh -c "echo hi > /tmp/x" && sudo ls /var/lib/docker/overlay2/4c1e…/diff/tmp','x','在容器里写的文件，直接出现在宿主机的 upperdir 里。'],
['docker diff web','C /etc\nC /etc/nginx/conf.d\nA /etc/nginx/conf.d/default.conf.bak\nC /tmp\nA /tmp/x\nD /usr/share/nginx/html/index.html','列出 upperdir 里的变化：A 新增，C 修改，D 删除（whiteout）。快速找出“容器运行时改了什么”。'],
['docker buildx imagetools inspect --raw alpine:3.20 | head -8','{\n  "manifests": [\n    {\n      "mediaType": "application/vnd.oci.image.manifest.v1+json",\n      "digest": "sha256:33735bd6…",\n      "platform": { "architecture": "amd64", "os": "linux" }','直接读取仓库里的 index 原文。crane、skopeo、oras 等工具也能做同样的事，不需要拉取整个镜像。']]);
Quiz(document.getElementById('qs'),[
['容器修改了镜像里一个 500MB 文件的 1 个字节，容器层会增加多少？',['1 字节','约 500MB','0'],1,'copy-up 复制整个文件。'],
['容器删除了镜像里的一个文件，磁盘上发生了什么？',['下层文件被删除','upperdir 里创建了 whiteout','什么都没发生'],1,'下层只读。'],
['docker pull 时，客户端怎样决定下载哪个平台的镜像？',['总是 amd64','从 index 里选和本机匹配的 manifest','随机'],1,'可以用 --platform 指定。'],
['为什么两个不同的镜像可以共享同一层？',['层按内容的 sha256 寻址','Docker 自动合并相似的层','它们来自同一个仓库'],0,'内容相同，摘要相同。']]);
