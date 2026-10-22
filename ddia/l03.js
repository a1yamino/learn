const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={lb:B('负载均衡','','sig'),a:B('节点 A','正常','ok'),b:B('节点 B','正常','ok'),c:B('节点 C','正常','ok'),u:P('用户：服务正常','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'冗余',p:'三个节点提供相同的服务。',set:{lb:[0,60],a:[200,0],b:[200,60],c:[200,120],u:[380,70]}},
 {t:'故障',p:'节点 B 的磁盘坏了：这是一个故障。',d:3200,set:{lb:[0,60],a:[200,0],b:[200,60,B('节点 B','磁盘故障','bad')],c:[200,120],u:[380,70]}},
 {t:'没有失效',p:'负载均衡把请求转给其他节点，用户无感知：故障没有变成失效。',d:3400,set:{lb:[0,60],a:[200,0,B('节点 A','承担更多','ok')],b:[200,60,B('节点 B','已摘除','bad')],c:[200,120,B('节点 C','承担更多','ok')],u:[380,70]}},
 {t:'相关故障',p:'若同一个软件 bug 击中所有节点，冗余就没有用了。',d:3600,set:{lb:[0,60],a:[200,0,B('节点 A','崩溃','bad')],b:[200,60,B('节点 B','崩溃','bad')],c:[200,120,B('节点 C','崩溃','bad')],u:[380,70,P('用户：服务失效','bad')]}}]});
const e2={m1:{w:150,h:120,cls:'frame',html:'<i>共享内存</i><br>一台大机器<br>CPU × 128'},m2:{w:150,h:120,cls:'frame',html:'<i>共享磁盘</i><br>多台机器<br>→ 同一存储服务'},m3:{w:150,h:120,cls:'frame',html:'<i>无共享</i><br>每个节点自有<br>CPU、内存、磁盘'},n:P('扩展：换更大的机器 → 增加计算节点 → 增加独立节点','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'共享内存',p:'垂直扩展：简单，但有上限，成本超线性增长。',set:{m1:[0,0]}},
 {t:'共享磁盘',p:'计算节点共享存储；云数据仓库常用（存储与计算分离）。',d:3200,set:{m1:[0,0],m2:[170,0]}},
 {t:'无共享',p:'水平扩展：节点间只通过网络协调，可以无限增加，但要处理分布式问题。',d:3400,set:{m1:[0,0],m2:[170,0],m3:[340,0],n:[0,140]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');const AFR=0.02;
 [[1,1],[2,1],[2,7],[3,1],[3,7]].forEach(([r,d])=>{const b=document.createElement('button');b.className='btn';b.textContent=`${r} 副本 · 修复 ${d} 天`;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));
  const pw=AFR*d/365;const pl=Math.pow(pw,r);p.textContent=`单盘在修复窗口内故障的概率：${pw.toExponential(2)}\n${r} 个副本在同一窗口内全部故障：${pl.toExponential(2)}\n一万份数据中预计每个窗口丢失：${(pl*10000).toExponential(2)} 份`;
  m.className='msg '+(r>=3?'ok':r==2?'sig':'bad');m.innerHTML=r>=3?'副本数和修复速度都影响数据安全；注意这里假设故障相互独立。':'副本太少：一块盘坏了，数据就可能丢失。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择副本数和修复时间。'})();
Term(document.getElementById('t4'),[
['python3 disk.py','10000 块盘一年坏 226 块，平均每天 0.62 块\n单块盘某天坏的概率 5.48e-05\n3 副本在同一修复窗口内全坏的概率 1.65e-13','概率极小的前提是故障相互独立；同一批次的磁盘、同一个机柜电源会让故障相关。']]);
Quiz(document.getElementById('qs'),[
['故障（fault）与失效（failure）的区别？',['同义词','故障是组件偏离规格，失效是整个系统不再提供服务','失效更轻'],1,''],
['为什么软件故障常比硬件故障更危险？',['更常见','它们彼此相关，可能同时击中所有节点','更难修复'],1,''],
['减少人为错误的有效方式？',['惩罚出错的人','灰度发布、快速回滚、良好的默认值与监控','禁止变更'],1,''],
['无共享架构的特点？',['所有节点共享一块磁盘','每个节点独立，靠网络协调','只有一台机器'],1,''],
['描述可扩展性应当？',['说“系统可扩展”','说明负载参数增长时性能与资源如何变化','只看 CPU'],1,'']]);
