TITLE='Pod：最小的部署单元';DESC='Kubernetes 不直接调度容器，而是调度 Pod。本课讲 Pod 里的容器共享什么、什么时候把多个容器放进一个 Pod、init 容器和 sidecar、Pod 的生命周期与重启策略，以及如何用 YAML 写一个 Pod。';NEXT='Deployment：滚动更新与回滚';MIN=45
SUM=['Pod 是一组共享<b>网络命名空间</b>（同一个 IP、同一个 localhost）和<b>卷</b>的容器，总是被调度到同一个节点。',
'一个 Pod 通常只有一个主容器。只有<b>必须</b>共享网络或文件、必须一起扩缩容的辅助进程才放进同一个 Pod（sidecar：日志收集、代理）。',
'init 容器按顺序运行并成功退出后，主容器才启动。原生 sidecar 是 <code>restartPolicy: Always</code> 的 init 容器，会和主容器一起运行。',
'阶段：Pending → Running → Succeeded / Failed。容器崩溃后按 <code>restartPolicy</code> 重启，间隔指数增长，表现为 <b>CrashLoopBackOff</b>。',
'Pod 是一次性的：被删除或节点故障后不会自己回来，IP 也会变。生产中几乎不直接创建 Pod，而是用 Deployment 等控制器（第 4 课）。']
def secs(prac,E):
    return [
('Pod 里共享什么','两个容器，一个 IP。','<div id="p1"></div>'),
('Pod 的一生','从创建到结束，以及崩溃时会发生什么。','<div id="p2"></div>'),
('动手：放进同一个 Pod 吗？','对每一组，判断它们应该放在同一个 Pod，还是分成两个 Pod（各自由 Deployment 管理）。','<div class="chal"><div id="pairs"></div><div class="msg" id="pm"></div></div>'),
('相关命令','创建、查看、调试 Pod。','<div id="t4"></div>'),
('在你的电脑上练习','继续使用第 2 课的 kind 集群（<code>kind create cluster --name learn --config kind.yaml</code>）。',prac([
 ('一个双容器 Pod：nginx 提供页面，另一个容器每 5 秒写入页面内容。两者共享一个 emptyDir 卷。','cat > two.yaml <<\'EOF\'\napiVersion: v1\nkind: Pod\nmetadata:\n  name: two\n  labels: { app: two }\nspec:\n  volumes:\n  - name: html\n    emptyDir: {}\n  containers:\n  - name: web\n    image: nginx:alpine\n    volumeMounts: [{ name: html, mountPath: /usr/share/nginx/html }]\n  - name: writer\n    image: busybox\n    command: ["sh","-c","while true; do date > /out/index.html; sleep 5; done"]\n    volumeMounts: [{ name: html, mountPath: /out }]\nEOF\nkubectl apply -f two.yaml && kubectl wait --for=condition=Ready pod/two\nkubectl get pod two','pod/two created\npod/two condition met\nNAME   READY   STATUS    RESTARTS   AGE\ntwo    2/2     Running   0          9s'),
 ('从 writer 容器访问 localhost:80：它和 nginx 共享网络。','kubectl exec two -c writer -- wget -qO- localhost','Mon Oct 21 11:31:05 UTC 2026'),
 ('两个容器看到同一个 IP。','kubectl exec two -c web -- hostname -i; kubectl exec two -c writer -- hostname -i','10.244.1.5\n10.244.1.5'),
 ('制造一个崩溃的 Pod。','kubectl run crash --image=busybox -- sh -c "echo starting; exit 1"\nsleep 40; kubectl get pod crash','NAME    READY   STATUS             RESTARTS      AGE\ncrash   0/1     CrashLoopBackOff   3 (15s ago)   41s'),
 ('看上一次崩溃的日志和退出码。','kubectl logs crash --previous\nkubectl get pod crash -o jsonpath="{.status.containerStatuses[0].lastState.terminated.exitCode}"','starting\n1'),
 ('init 容器：等待一个条件后才启动主容器。','kubectl run waiter --image=nginx:alpine --dry-run=client -o yaml > w.yaml\n# 在 spec 下加入：\n#  initContainers:\n#  - name: wait\n#    image: busybox\n#    command: ["sh","-c","sleep 10"]\nkubectl apply -f w.yaml; kubectl get pod waiter','NAME     READY   STATUS     RESTARTS   AGE\nwaiter   0/1     Init:0/1   0          3s'),
 ('清理。','kubectl delete pod two crash waiter','pod "two" deleted\npod "crash" deleted\npod "waiter" deleted')],
 ('原生 sidecar 与日志','写一个 Pod：主容器 <code>busybox</code> 每秒往 <code>/logs/app.log</code> 追加一行；一个<b>原生 sidecar</b>（initContainers 里 <code>restartPolicy: Always</code>）用 <code>tail -F</code> 把它输出到标准输出。用 <code>kubectl logs</code> 从 sidecar 读到日志。再说明：为什么 sidecar 要写在 initContainers 里？',
 '<pre class="cmd">apiVersion: v1\nkind: Pod\nmetadata: { name: logdemo }\nspec:\n  volumes: [{ name: logs, emptyDir: {} }]\n  initContainers:\n  - name: shipper\n    image: busybox\n    restartPolicy: Always\n    command: ["sh","-c","touch /logs/app.log; tail -F /logs/app.log"]\n    volumeMounts: [{ name: logs, mountPath: /logs }]\n  containers:\n  - name: app\n    image: busybox\n    command: ["sh","-c","i=0; while true; do echo line $i >> /logs/app.log; i=$((i+1)); sleep 1; done"]\n    volumeMounts: [{ name: logs, mountPath: /logs }]</pre><pre class="cmd">kubectl apply -f logdemo.yaml; sleep 5; kubectl logs logdemo -c shipper --tail 2</pre><pre class="out">line 3\nline 4</pre><p>写在 initContainers 里并设 <code>restartPolicy: Always</code>（Kubernetes 1.29 起默认开启）：它<b>先于</b>主容器启动，主容器启动时它已就绪，不会丢掉最早的日志；Pod 结束时它<b>最后</b>停止；对 Job 来说，主容器完成后 sidecar 不会阻止 Pod 结束。普通的第二个容器做不到这些顺序保证。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
