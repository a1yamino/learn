TITLE='为什么需要 Kubernetes';DESC='Docker 管好了一台机器上的容器。当服务要跑在几十台机器上、要自动恢复、要不停机更新时，就需要一个集群级别的系统。本课讲 Kubernetes 解决什么问题、核心思想“声明期望状态”，以及集群由哪些部分组成。';NEXT='本地集群与 kubectl';MIN=35
SUM=['单机 Docker / Compose 的边界：一台机器宕机，服务就停；扩容、分布、更新都要人工完成。',
'Kubernetes 的核心是<b>声明式</b>：你提交“要什么”（3 个副本、这个镜像），系统持续把实际状态调整为期望状态。',
'这个调整由许多<b>控制器</b>完成，每个都在循环：观察 → 比较 → 修正。Docker 第 24 课的 Swarm 也是这个思想。',
'集群 = <b>控制平面</b>（API Server、etcd、调度器、控制器管理器）+ <b>工作节点</b>（kubelet、容器运行时、kube-proxy）。',
'所有操作都通过 API Server。kubectl 只是一个 API 客户端。',
'Kubernetes 不构建镜像，镜像仍然用 Docker / BuildKit 构建并推送到仓库。']
def secs(prac,E):
    return [
('从一台机器到一个集群','手工管理多台机器会遇到什么？','<div id="p1"></div>'),
('集群的组成','控制平面和工作节点各做什么。','<div id="p2"></div>'),
('动手：当一次控制器','期望状态是 3 个副本。下面会随机发生事故。你来执行“观察 → 比较 → 修正”。','<div class="chal"><div class="cmds" id="ev"></div><div id="pods" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;min-height:44px;margin:12px 0"></div><div class="cmds" id="act"></div><div class="msg" id="rm"></div></div>'),
('第一次接触 kubectl','创建一个 Deployment，再看它如何自愈。','<div id="t4"></div>'),
('在你的电脑上练习','用 kind（Kubernetes in Docker）在本机起一个集群。第 2 课会详细讲 kind 和 kubectl，这里先体验。',prac([
 ('安装 kind 和 kubectl（需要 Docker 已运行）。macOS：<code>brew install kind kubectl</code>。Linux 见右侧命令。Windows：<code>winget install Kubernetes.kind Kubernetes.kubectl</code>。','curl -Lo kind https://kind.sigs.k8s.io/dl/v0.24.0/kind-linux-amd64 && chmod +x kind && sudo mv kind /usr/local/bin/\ncurl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/\nkind version && kubectl version --client','kind v0.24.0 go1.22.6 linux/amd64\nClient Version: v1.31.1'),
 ('创建集群（约 1 分钟）。','kind create cluster --name learn','Creating cluster "learn" ...\n ✓ Ensuring node image (kindest/node:v1.31.0) 🖼\n ✓ Starting control-plane 🕹️\nSet kubectl context to "kind-learn"'),
 ('集群里只有一个节点，它本身是一个 Docker 容器。','kubectl get nodes\ndocker ps --format "{{.Names}}"','NAME                  STATUS   ROLES           AGE   VERSION\nlearn-control-plane   Ready    control-plane   60s   v1.31.0\nlearn-control-plane'),
 ('声明：3 个 nginx 副本。','kubectl create deployment web --image=nginx:alpine --replicas=3\nkubectl get pods','NAME                   READY   STATUS    RESTARTS   AGE\nweb-7c5b8d6f9b-4kq2x   1/1     Running   0          8s\nweb-7c5b8d6f9b-h8zmw   1/1     Running   0          8s\nweb-7c5b8d6f9b-tq9ps   1/1     Running   0          8s'),
 ('删掉一个 Pod，马上再看。','kubectl delete $(kubectl get pods -l app=web -o name | head -1)\nkubectl get pods','pod "web-7c5b8d6f9b-4kq2x" deleted\nweb-7c5b8d6f9b-h8zmw   1/1     Running             0   40s\nweb-7c5b8d6f9b-tq9ps   1/1     Running             0   40s\nweb-7c5b8d6f9b-x2v7d   0/1     ContainerCreating   0   1s'),
 ('改期望状态：扩到 5 个。','kubectl scale deployment web --replicas=5\nkubectl get deployment web','NAME   READY   UP-TO-DATE   AVAILABLE   AGE\nweb    5/5     5            5           2m')],
 ('和 docker 对比','在 kind 节点容器里直接用 <code>docker exec</code> 或 <code>crictl</code> 删除一个 web 的容器（不是通过 kubectl 删 Pod）。会发生什么？再对比：用 <code>docker rm -f</code> 删除一个普通 Docker 容器（没有 restart 策略）会发生什么？用你的观察说明“声明式”的含义。',
 '<pre class="cmd">docker exec learn-control-plane crictl ps --name nginx -q | head -1 | xargs -I{} docker exec learn-control-plane crictl rm -f {}\nkubectl get pods</pre><pre class="out">NAME                   READY   STATUS    RESTARTS     AGE\nweb-7c5b8d6f9b-h8zmw   1/1     Running   1 (3s ago)   5m\n…</pre><p>容器没了，但 Pod 对象还在。节点上的 kubelet 发现“这个 Pod 应该有一个运行中的 nginx 容器，但实际没有”，于是重新创建，RESTARTS 加 1。而普通的 <code>docker rm -f</code> 之后，容器就永远不在了，因为 Docker 只执行你的命令，不记得你“想要”什么。声明式：系统保存的是<b>期望状态</b>，并持续让现实符合它。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
