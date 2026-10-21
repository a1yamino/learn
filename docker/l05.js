const L=(t,c,w=380,h=40)=>({w,h,cls:'blk '+c,html:t});
/* 01 why images are big */
Player(document.getElementById('p1'),{els:{
 b:L('python:3.12 · 1.0 GB','dim'),a:L('RUN apt-get install gcc … · +180 MB',''),p:L('RUN pip install … · +60 MB',''),r:L('RUN apt-get remove gcc && rm -rf … · +0 MB','sig'),
 tot:{w:380,cls:'tag'},x:{w:380,h:40,cls:'blk hatch',html:'同一个 RUN：安装 → 编译 → 清理 · +60 MB'}},scenes:[
 {t:'每个 RUN 都是一层',p:'安装编译工具，镜像加 180 MB；安装依赖，再加 60 MB。',set:{b:[0,150],a:[0,100],p:[0,50],tot:[0,200,{html:'总计 <b>1.24 GB</b>'}]}},
 {t:'在新的一层里删除',p:'后面的 RUN 删除 gcc，只是在新层里把文件<b>标记为删除</b>。前面那层的 180 MB 仍在镜像里。',d:3600,set:{b:[0,150],a:[0,100],p:[0,50],r:[0,0],tot:[0,200,{html:'总计仍然 <b>1.24 GB</b>'}]}},
 {t:'在同一个 RUN 里清理',p:'安装、使用、清理写在同一条 RUN 里，用 <code>&&</code> 连接，临时文件不会留在任何一层。但编译工具链本身仍然难以干净地去掉。下一节的方法更好。',d:3600,set:{b:[0,150],x:[0,100],tot:[0,200,{html:'总计 <b>1.06 GB</b>'}]}}]});
/* 02 multi-stage */
Player(document.getElementById('p2'),{els:{
 sb:L('golang:1.23 · 880 MB','dim',300),ss:L('源代码 + go mod 缓存','',300),sbin:L('/app · 7 MB','sig',300),lb:{w:300,cls:'tag',html:'<b>阶段 1 · builder</b>'},
 rb:L('distroless/static · 2 MB','dim',300),rbin:L('/app · 7 MB','sig',300),lr:{w:300,cls:'tag',html:'<b>阶段 2 · 最终镜像</b>'},cp:{w:200,cls:'tag',html:'<div style="text-align:center">COPY --from=builder<br><span style="font-size:22px;color:var(--ink)">→</span></div>'},
 tot:{w:300,cls:'tag'},gone:{w:300,cls:'tag'}},scenes:[
 {t:'阶段 1：编译',p:'<code>FROM golang:1.23 AS builder</code>。这里有完整的 Go 工具链，用来编译出一个静态二进制文件。',set:{lb:[0,-30],sb:[0,100],ss:[0,50],sbin:[0,0]}},
 {t:'阶段 2：只拿产物',p:'<code>FROM distroless/static</code> 开始一个新阶段。<code>COPY --from=builder</code> 只复制编译好的 /app。',d:3600,set:{lb:[0,-30],sb:[0,100],ss:[0,50],sbin:[0,0],cp:[340,0],lr:[560,20],rb:[560,100],rbin:[560,50]}},
 {t:'最终镜像只有最后一个阶段',p:'builder 阶段不会出现在最终镜像里。880 MB 的工具链和源码都被丢弃。',d:3600,set:{sb:[0,100,{cls:'blk dim',html:'builder（丢弃）'}],gone:[0,150,{html:'不进入最终镜像'}],lr:[560,20],rb:[560,100],rbin:[560,50],tot:[560,150,{html:'最终镜像 <b>9 MB</b>'}]}}]});
/* 03 base chooser */
(()=>{let mode='multi',base='distroless';const M=document.getElementById('mode'),Bs=document.getElementById('base'),bars=document.getElementById('bars'),bm=document.getElementById('bm');
 const BASE={scratch:['scratch',0,'没有任何文件。没有 shell、CA 证书、时区数据；访问 HTTPS 要自己复制证书。'],distroless:['distroless/static',2,'只有 CA 证书、时区、/etc/passwd 和 nonroot 用户。没有 shell 和包管理器。静态二进制的首选。'],alpine:['alpine:3.20',8,'有 sh 和 apk，方便调试。使用 musl libc：静态 Go 二进制没问题，但部分依赖 glibc 的程序会出错。'],slim:['debian:bookworm-slim',75,'完整的 glibc 和 apt，兼容性最好，也最大，包含的软件包越多，扫描出的漏洞通常越多。']};
 const add=(el,list,set)=>list.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)});
 add(M,[['single','单阶段（golang:1.23）'],['multi','多阶段']],v=>mode=v);add(Bs,Object.entries(BASE).map(([k,v])=>[k,v[0]]),v=>base=v);
 function draw(){[...M.children].forEach(b=>b.classList.toggle('pri',b.dataset.v===mode));[...Bs.children].forEach(b=>{b.classList.toggle('pri',b.dataset.v===base);b.disabled=mode==='single'});
  const rows=[['golang:1.23 单阶段',887],...Object.entries(BASE).map(([k,v])=>[v[0]+' + 二进制',v[1]+7])];const cur=mode==='single'?0:1+Object.keys(BASE).indexOf(base);
  bars.innerHTML=rows.map(([l,s],i)=>`<div style="display:grid;grid-template-columns:minmax(0,250px) 1fr 70px;gap:12px;align-items:center;margin:6px 0;font:500 13px/1 var(--m);color:${i===cur?'var(--ink)':'var(--ink2)'}"><span>${l}</span><span style="height:10px;border-radius:5px;background:${i===cur?'var(--sig)':'var(--line)'};transform-origin:0 50%;transform:scaleX(${Math.max(.01,Math.log10(s+1)/Math.log10(888))});transition:transform 420ms var(--e-out),background-color 200ms ease"></span><span style="text-align:right">${s} MB</span></div>`).join('')+'<div class="tag" style="margin-top:6px">条长按对数刻度</div>';
  bm.className='msg';bm.innerHTML=mode==='single'?'单阶段镜像带着整个 Go 工具链和源码：887 MB，其中运行只需要 7 MB 的二进制文件。':'<b>'+BASE[base][0]+'</b>：'+BASE[base][2]}draw()})();
Term(document.getElementById('t4'),[
['docker build --target builder -t slim:builder .','[+] Building 9.1s (9/9) FINISHED\n => [builder 5/5] RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app .','<code>--target</code> 只构建到指定阶段。常用于在 CI 里跑测试阶段，或调试 builder。'],
['docker images slim','REPOSITORY   TAG       SIZE\nslim         builder   901MB\nslim         multi     7.9MB\nslim         single    880MB','同一份代码，大小相差 100 多倍。'],
['docker history slim:multi','IMAGE          CREATED BY                         SIZE\n3c1d…          ENTRYPOINT ["/app"]                0B\n<missing>      USER nonroot                       0B\n<missing>      COPY /app /app # buildkit          5.6MB\n<missing>      bazel build @distroless…           2.3MB','只有两层有内容：distroless 基础层和你的二进制。'],
['docker run --rm -it --entrypoint sh slim:multi','docker: Error response from daemon: failed to create task for container: exec: "sh": executable file not found in $PATH','distroless 没有 shell。需要调试时可以用 <code>:debug</code> 标签的变体（带 busybox），或用 <code>docker debug</code> / 临时容器共享命名空间，第 22 课详细讲。']]);
Quiz(document.getElementById('qs'),[
['第 2 个 RUN 安装了 200MB 的工具，第 3 个 RUN 把它删掉了。镜像会怎样？',['减少 200MB','不变，第 2 层仍然有 200MB','构建失败'],1,'层只增不减。要在同一个 RUN 里清理，或用多阶段构建。'],
['多阶段构建的最终镜像包含什么？',['所有阶段的层','最后一个阶段的层','第一个阶段的层'],1,'前面的阶段只用于产出文件。'],
['Python 项目用 alpine 做基础镜像，pip install 突然变得很慢。最可能的原因？',['alpine 网络慢','musl libc 下没有预编译 wheel，需要从源码编译','alpine 不支持 pip'],1,'很多 Python 二进制包只为 glibc 提供 wheel。'],
['distroless 镜像的主要取舍？',['更小、攻击面更小，但没有 shell，调试更难','更大但更安全','只能运行 Java'],0,'调试方法见第 22 课。']]);
