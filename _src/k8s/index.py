G=[('基础',['为什么需要 Kubernetes','本地集群与 kubectl','Pod：最小的部署单元','Deployment：滚动更新与回滚','Service：服务发现与负载均衡','ConfigMap 与 Secret','存储：PV、PVC 与 StorageClass','Ingress 与 Gateway API','健康检查、资源请求与限制','命名空间、标签与 kubectl 进阶']),
('原理',['控制平面：API Server、etcd、调度器、控制器','声明式 API 与控制循环','kubelet、CRI 与 Pod 的一生','集群网络：CNI、kube-proxy 与 DNS','调度深入：亲和性、污点、拓扑分布、优先级','存储原理：CSI 与卷的生命周期']),
('工作负载与扩展',['StatefulSet、DaemonSet、Job 与 CronJob','自动扩缩容：HPA、VPA 与节点扩缩','扩展 Kubernetes：CRD 与 Operator']),
('生产',['安全一：RBAC 与 ServiceAccount','安全二：Pod Security、NetworkPolicy 与准入控制','Helm 与 Kustomize','GitOps 与 CI/CD','可观测性：日志、指标与追踪','生产排障','高可用、升级与备份']),
('综合项目',['综合项目：从零到生产'])]
import sys;LIVE=int(sys.argv[1]) if len(sys.argv)>1 else 0
items='';n=0
for g,ls in G:
    items+=f'<li class="grp">{g}</li>'
    for t in ls:
        n+=1;on=n<=LIVE
        items+=f'<li><a href="l{n:02d}.html"{"" if on else " class=\"off\""}><span class="n">{n:02d}</span><span><div class="t">{t}</div></span><span class="s">{"" if on else "未上线"}</span><span class="ar">→</span></a></li>'
head=open('/workspace/learn/docker/index.html').read().split('<main')[0].replace('Docker · 课程目录','Kubernetes · 课程目录').replace('<span class="crumb">Docker</span>','<span class="crumb">Kubernetes</span>')
open('/workspace/learn/k8s/index.html','w').write(head+f'<main class="wrap"><section class="lede"><div class="k">课程</div><h1>Kubernetes</h1><p>{n} 节课：基础、原理、工作负载与扩展、生产、综合项目。每课包含在自己电脑上做的练习和一个挑战。建议先学完 Docker 课程。</p></section>\n<ul class="list" style="border-top:0">{items}</ul><footer class="foot"><a href="../index.html">← 学习</a><span>代码 MIT · 内容 CC BY 4.0</span></footer></main><script src="../assets/play.js"></script></body></html>\n')
print(n)
