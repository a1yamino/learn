const L=[['FROM python:3.12-slim','基础镜像层'],['WORKDIR /app','创建目录'],['COPY requirements.txt .','依赖清单'],['RUN pip install -r requirements.txt','安装依赖 · 38 MB'],['COPY . .','源代码'],['CMD ["python","app.py"]','只改配置，不产生层']];
const els={};L.forEach(([c],i)=>{els['d'+i]={w:400,h:40,cls:'blk',html:'<span style="padding:0 14px;width:100%;text-align:left">'+c+'</span>'};els['l'+i]={w:300,h:40,cls:'blk dim',html:L[i][1]}});
els.cfg={w:300,h:40,cls:'blk',html:'配置：CMD python app.py'};els.lab={w:300,cls:'tag',html:'<b>镜像 myapp</b> · 从下往上叠加'};els.arr={w:60,cls:'tag',html:'<div style="text-align:center;font-size:22px;color:var(--ink)">→</div>'};
const df=i=>({['d'+i]:[0,i*50]});const ly=i=>({['l'+i]:[480,330-i*50]});
let sc=[],acc={};for(let i=0;i<6;i++){acc={...acc,...df(i)}}
const hi=(k,i)=>({...acc,['d'+i]:[0,i*50,{cls:'blk sig',html:'<span style="padding:0 14px;width:100%;text-align:left">'+L[i][0]+'</span>'}]});
let built={};const S1=[];[0,1,2,3,4,5].forEach(i=>{if(i<5)built={...built,...ly(i)};const set={...hi('',i),...built,arr:[410,i*50],lab:[480,380]};if(i===5)set.cfg=[480,80];S1.push(set)});
Player(document.getElementById('p1'),{els,scenes:[
 {t:'FROM：基础镜像',p:'从官方的 python:3.12-slim 开始。它本身就是好几层，作为整个镜像的最底层。',set:S1[0]},
 {t:'WORKDIR',p:'设置工作目录，不存在就创建。之后的相对路径都以 /app 为准。',set:S1[1]},
 {t:'COPY requirements.txt',p:'先只复制依赖清单。原因下一节就会看到。',set:S1[2]},
 {t:'RUN pip install',p:'在构建时执行命令，把安装结果保存成一层。这一层最大，也最慢。',set:S1[3]},
 {t:'COPY . .',p:'复制其余代码。代码最常改，所以放在最后。',set:S1[4]},
 {t:'CMD',p:'容器启动时默认执行的命令。它只写进镜像配置，不产生文件层。',set:S1[5]}]});
/* 02 cache */
const all={...acc};for(let i=0;i<5;i++)Object.assign(all,ly(i));
const st=(i,c,t)=>({['d'+i]:[0,i*50,{cls:'blk '+c,html:'<span style="padding:0 14px;width:100%;text-align:left">'+L[i][0]+'  · '+t+'</span>'}]});
const cached=n=>{let o={};for(let i=0;i<n;i++)Object.assign(o,st(i,'',' CACHED'));return o};
const els2=JSON.parse(JSON.stringify(els));els2.note={w:300,cls:'tag'};
Player(document.getElementById('p2'),{els:els2,scenes:[
 {t:'只改了 app.py',p:'Docker 从上往下检查每条指令。前 4 条的指令和输入文件都没变，<b>命中缓存</b>，直接复用，耗时 0 秒。',d:3800,set:{...all,...cached(4),note:[480,380,{html:'<b>前 4 步：CACHED</b>'}]}},
 {t:'COPY . . 失效',p:'app.py 变了，所以 <code>COPY . .</code> 的内容变了，这一层重新生成。总耗时约 1 秒。',set:{...all,...cached(4),...st(4,'sig','重新执行'),l4:[480,130,{cls:'blk hatch',html:'源代码 · 新'}],note:[480,380,{html:'<b>总耗时 ≈ 1 秒</b>'}]}},
 {t:'如果改了 requirements.txt',p:'第 3 步失效。<b>失效层下面的所有层</b>都必须重建，包括最慢的 pip install。',d:4200,set:{...all,...cached(2),...st(2,'sig','重新执行'),...st(3,'sig','重新执行'),...st(4,'sig','重新执行'),l2:[480,230,{cls:'blk hatch',html:'依赖清单 · 新'}],l3:[480,180,{cls:'blk hatch',html:'安装依赖 · 新'}],l4:[480,130,{cls:'blk hatch',html:'源代码 · 新'}],note:[480,380,{html:'<b>总耗时 ≈ 40 秒</b>'}]}}]});
/* 03 reorder */
(()=>{const INIT=['FROM python:3.12-slim','WORKDIR /app','COPY . .','RUN pip install -r requirements.txt','CMD ["python","app.py"]','COPY requirements.txt .'];
 const SEC={'FROM python:3.12-slim':0,'WORKDIR /app':0,'COPY requirements.txt .':0.1,'COPY . .':0.4,'RUN pip install -r requirements.txt':38,'CMD ["python","app.py"]':0};
 let o=[...INIT];const df=document.getElementById('df'),bo=document.getElementById('bo'),tt=document.getElementById('tt'),bm=document.getElementById('bm');
 function draw(){flip(()=>[...df.children],()=>{const old=new Map([...df.children].map(n=>[n.dataset.l,n]));df.innerHTML='';o.forEach((l,i)=>{let n=old.get(l);if(!n){n=document.createElement('div');n.className='ln';n.dataset.l=l;n.innerHTML=`<span>${l}</span><button class="mv" data-d="-1" aria-label="上移">↑</button><button class="mv" data-d="1" aria-label="下移">↓</button>`}
  n.querySelector('[data-d="-1"]').disabled=i===0;n.querySelector('[data-d="1"]').disabled=i===o.length-1;df.appendChild(n)})})}
 df.addEventListener('click',e=>{const b=e.target.closest('.mv');if(!b)return;const l=b.closest('.ln').dataset.l,i=o.indexOf(l),j=i+ +b.dataset.d;[o[i],o[j]]=[o[j],o[i]];draw();bo.innerHTML='';tt.textContent='';bm.textContent=''});
 document.getElementById('rs').addEventListener('click',()=>{o=[...INIT];draw();bo.innerHTML='';tt.textContent='';bm.textContent=''});
 document.getElementById('bd').addEventListener('click',()=>{bm.className='msg';
  if(o[0]!=='FROM python:3.12-slim'){bo.innerHTML='<span class="e">ERROR: failed to solve: no build stage in current context</span>';tt.textContent='';bm.className='msg bad';bm.textContent='FROM 必须是第一条指令。';return}
  const pip=o.indexOf('RUN pip install -r requirements.txt'),req=Math.min(...['COPY requirements.txt .','COPY . .'].map(x=>o.indexOf(x)));
  if(req>pip){bo.innerHTML='<span class="e">ERROR: Could not open requirements file: [Errno 2] No such file or directory: \'requirements.txt\'</span>';tt.textContent='';bm.className='msg bad';bm.textContent='执行 pip install 时，requirements.txt 还没有复制进来。';return}
  let broke=false,t=0,h='';const n=o.length;o.forEach((l,i)=>{if(l==='COPY . .')broke=true;const s=broke?SEC[l]:0;t+=s;h+=`<div class="bl"><span>[${i+1}/${n}] ${l}</span><span class="${broke?'r':'c'}">${broke?s.toFixed(1)+'s':'CACHED'}</span></div>`});
  bo.innerHTML=h;tt.textContent='总计 '+t.toFixed(1)+' 秒';
  if(t<1){bm.className='msg ok';bm.textContent='依赖层命中缓存，只有代码层重新构建。这就是推荐的顺序。'}else{bm.className='msg';bm.textContent='pip install 排在 COPY . . 后面，每次改代码都要重新安装依赖。试着调整顺序。'}});
 draw()})();
Term(document.getElementById('t4'),[
['docker build -t myapp:1.0 .',`[+] Building 1.2s (10/10) FINISHED                     docker:default
 => [internal] load build definition from Dockerfile       0.0s
 => [internal] load .dockerignore                          0.0s
 => [internal] load build context                          0.0s
 => => transferring context: 2.31kB                        0.0s
 => CACHED [2/5] WORKDIR /app                              0.0s
 => CACHED [3/5] COPY requirements.txt .                   0.0s
 => CACHED [4/5] RUN pip install -r requirements.txt       0.0s
 => [5/5] COPY . .                                         0.1s
 => exporting to image                                     0.1s`,'<code>-t</code> 给镜像起名字和标签。最后的 <code>.</code> 是<b>构建上下文</b>：这个目录会被发送给构建器，<code>COPY</code> 只能复制上下文里的文件。注意 “transferring context” 的大小。'],
['docker history myapp:1.0',`IMAGE          CREATED BY                                   SIZE
a1b2c3d4e5f6   CMD ["python" "app.py"]                      0B
<missing>      COPY . . # buildkit                          5.2kB
<missing>      RUN /bin/sh -c pip install -r requirements…  38.4MB
<missing>      COPY requirements.txt . # buildkit           41B
<missing>      WORKDIR /app                                 0B
<missing>      /bin/sh -c #(nop)  CMD ["python3"]           0B
...`,'从上到下是从新到旧。能看出哪一层最大。<code>&lt;missing&gt;</code> 是正常的：BuildKit 构建的中间层没有单独的镜像 ID。'],
['docker image inspect -f "{{json .RootFS.Layers}}" myapp:1.0',`["sha256:7d3e…","sha256:9a1f…","sha256:c42b…","sha256:5e8d…","sha256:1f0a…","sha256:b77c…","sha256:e3d1…"]`,'镜像真正的文件层列表，每层由内容的 SHA-256 标识。内容相同，哈希就相同，所以不同镜像可以共享同一层。第 13 课会深入讲。'],
['docker build --no-cache -t myapp:1.0 .','[+] Building 41.7s (10/10) FINISHED\n => [4/5] RUN pip install -r requirements.txt      38.2s','<code>--no-cache</code> 忽略所有缓存，完整重建。用于怀疑缓存里有过期内容时（例如 <code>apt-get update</code> 的结果被缓存）。']]);
Quiz(document.getElementById('qs'),[
['只修改了源代码，下面哪种 Dockerfile 重建最快？',['COPY . . 然后 RUN pip install','COPY requirements.txt、RUN pip install、再 COPY . .','把 pip install 放在 CMD 里'],1,'依赖层不受代码修改影响，命中缓存。'],
['第 3 层缓存失效后，第 4、5 层会怎样？',['命中缓存','重新构建','被删除'],1,'失效层下面的层都依赖它，必须重建。'],
['CMD 指令会产生多大的文件层？',['和应用一样大','0，它只修改镜像配置','取决于命令的输出'],1,'CMD、ENV、EXPOSE 等只写元数据。'],
['构建上下文里有 2GB 的 node_modules，怎样避免把它发送给构建器？',['在 Dockerfile 里 RUN rm -rf node_modules','写进 .dockerignore','用 --no-cache'],1,'.dockerignore 在发送上下文之前就排除文件。']]);
