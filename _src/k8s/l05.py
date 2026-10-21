TITLE='Service：服务发现与负载均衡';DESC='Pod 会被替换，IP 会变。Service 给一组 Pod 一个稳定的名字和虚拟 IP，并把流量分发给它们。本课讲标签选择器与 EndpointSlice、集群 DNS、四种 Service 类型，以及就绪状态如何影响流量。';NEXT='ConfigMap 与 Secret';MIN=45
SUM=['Service 通过<b>标签选择器</b>找到 Pod。匹配且<b>就绪</b>的 Pod 的 IP 写进 EndpointSlice；不就绪的 Pod 不接收流量。',
'ClusterIP（默认）：一个只在集群内可达的虚拟 IP。它不属于任何网卡，由每个节点上的 kube-proxy 规则转发（第 14 课）。',
'DNS：<code>web</code>（同命名空间）、<code>web.shop</code>、<code>web.shop.svc.cluster.local</code>。',
'NodePort：每个节点的 30000–32767 端口转发到 Service。LoadBalancer：再由云平台创建外部负载均衡器指向它。外部 HTTP 流量通常用 Ingress / Gateway（第 8 课）。',
'Headless（<code>clusterIP: None</code>）：没有虚拟 IP，DNS 直接返回各 Pod 的 IP，用于 StatefulSet（第 17 课）。',
'<code>port</code> 是 Service 的端口，<code>targetPort</code> 是容器端口，可以用端口名。']
def secs(prac,E):
    return [
('稳定的入口','Pod 来来去去，Service 不变。','<div id="p1"></div>'),
('四种类型','从集群内到集群外。','<div id="p2"></div>'),
('动手：选择器与端点','Service 的选择器是 <code>app=api</code>。修改各个 Pod 的标签和就绪状态，看哪些 Pod 会收到流量。','<div class="chal"><div class="cmds" id="sel"></div><div id="pl"></div><div class="log" id="ep" style="height:auto;min-height:0"></div><div class="msg" id="sm"></div></div>'),
('相关命令','创建、查看端点、DNS、调试。','<div id="t4"></div>'),
('在你的电脑上练习','在 kind 集群里验证 Service 的行为。',prac([
 ('部署 3 个副本的 echo 服务（返回自己的主机名），并创建 Service。','kubectl create deployment api --image=registry.k8s.io/e2e-test-images/agnhost:2.52 --replicas=3 -- /agnhost serve-hostname --port 8080\nkubectl expose deployment api --port 80 --target-port 8080\nkubectl get svc api','NAME   TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE\napi    ClusterIP   10.96.142.37   <none>        80/TCP    2s'),
 ('端点：3 个 Pod 的 IP。','kubectl get endpointslices -l kubernetes.io/service-name=api -o jsonpath="{.items[0].endpoints[*].addresses}"','["10.244.1.7"] ["10.244.2.5"] ["10.244.2.6"]'),
 ('从集群内多次请求，看到负载均衡。','kubectl run c --rm -it --image=busybox --restart=Never -- sh -c \'for i in 1 2 3 4 5 6; do wget -qO- api; echo; done\'','api-5c7d9b8f6-8kq2x\napi-5c7d9b8f6-tq9ps\napi-5c7d9b8f6-8kq2x\napi-5c7d9b8f6-h8zmw\n…'),
 ('DNS 解析。','kubectl run c --rm -it --image=busybox --restart=Never -- nslookup api.default.svc.cluster.local | tail -2','Name:\tapi.default.svc.cluster.local\nAddress: 10.96.142.37'),
 ('把一个 Pod 的标签改掉：它离开 Service，Deployment 也会补一个新的。','P=$(kubectl get pod -l app=api -o name | head -1)\nkubectl label $P app=debug --overwrite\nkubectl get pods -L app','NAME                  READY   STATUS    APP\napi-5c7d9b8f6-8kq2x   1/1     Running   debug\napi-5c7d9b8f6-h8zmw   1/1     Running   api\napi-5c7d9b8f6-tq9ps   1/1     Running   api\napi-5c7d9b8f6-zz4n1   1/1     Running   api'),
 ('NodePort：从宿主机通过 kind 节点访问。','kubectl patch svc api -p \'{"spec":{"type":"NodePort"}}\'\nPORT=$(kubectl get svc api -o jsonpath="{.spec.ports[0].nodePort}")\ndocker exec learn-control-plane curl -s localhost:$PORT','api-5c7d9b8f6-tq9ps')],
 ('Headless 与 Pod 直连','为 api 再建一个 headless Service <code>api-h</code>（<code>clusterIP: None</code>，同样的选择器）。分别 nslookup <code>api</code> 和 <code>api-h</code>，对比结果，并说明哪些场景需要 headless。',
 '<pre class="cmd">kubectl apply -f - <<\'EOF\'\napiVersion: v1\nkind: Service\nmetadata: { name: api-h }\nspec:\n  clusterIP: None\n  selector: { app: api }\n  ports: [{ port: 8080 }]\nEOF\nkubectl run c --rm -it --image=busybox --restart=Never -- sh -c "nslookup api | tail -2; echo ---; nslookup api-h | grep Address | tail -3"</pre><pre class="out">Name:\tapi.default.svc.cluster.local\nAddress: 10.96.142.37\n---\nAddress: 10.244.2.6\nAddress: 10.244.1.9\nAddress: 10.244.2.5</pre><p>普通 Service 返回一个虚拟 IP，由 kube-proxy 负载均衡；headless 直接返回所有就绪 Pod 的 IP，由客户端自己选择。需要 headless 的场景：数据库集群要直连特定成员（配合 StatefulSet 得到 <code>db-0.db</code> 这样的稳定名字）、客户端自己做负载均衡（如 gRPC 长连接）、服务发现组件需要成员列表。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
