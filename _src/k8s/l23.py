TITLE='GitOps 与 CI/CD';DESC='前面的课都是手动 kubectl apply。生产环境里，变更应该可审查、可追溯、可回滚。本课讲 CI 构建镜像、GitOps 控制器（Argo CD、Flux）把 Git 仓库持续同步到集群，以及镜像版本如何从 CI 流到集群、密钥如何在 Git 里安全保存。';NEXT='可观测性：日志、指标与追踪';MIN=55
SUM=['GitOps：Git 仓库是集群期望状态的唯一来源；集群里的控制器<b>拉取</b>并持续调和（第 12 课的控制循环用在整个集群上）。变更 = 提交 + 合并请求，回滚 = git revert。',
'CI 负责测试、构建、扫描、推送镜像，然后修改配置仓库里的镜像标签（或由 Argo CD Image Updater / Flux 镜像自动化完成）。CI 不需要集群凭证。',
'Argo CD 的 Application 指向仓库路径（纯 YAML、Kustomize 或 Helm）。状态有两个维度：<b>Sync</b>（Synced / OutOfSync，Git 与集群是否一致）和 <b>Health</b>（Healthy / Progressing / Degraded）。',
'<code>automated.selfHeal</code> 把手动修改改回 Git 的状态；<code>automated.prune</code> 删除 Git 中已移除的资源。不开 prune 时删掉的文件会在集群里遗留。',
'镜像用不可变的标签或摘要（<code>@sha256:…</code>），不要用 latest：否则 Git 没变但内容变了，无法追溯和回滚。',
'Secret 不能明文进 Git：用 Sealed Secrets（只有集群能解密）、SOPS（加密后提交）或 External Secrets Operator（从 Vault、云密钥服务同步）。']
def secs(prac,E):
    return [
('从提交到运行','CI 和 GitOps 的分工。','<div id="p1"></div>'),
('推送与拉取','为什么让集群自己去拉。','<div id="p2"></div>'),
('动手：漂移与调和','Argo CD 管理 Application shop，仓库里是 Deployment api（3 副本、镜像 1.4.2）和 ConfigMap api-config。先选择同步策略，再做操作，看 Git、集群和 Argo CD 状态。','<div class="chal"><div class="cmds" id="gp"></div><div class="cmds" id="ga"></div><div id="gs"></div><div class="msg" id="gm"></div></div>'),
('相关命令','Argo CD 和 Flux 的日常操作。','<div id="t4"></div>'),
('在你的电脑上练习','在 kind 里安装 Argo CD，让它同步一个公开的示例仓库。',prac([
 ('安装 Argo CD。','kubectl create ns argocd\nkubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml\nkubectl -n argocd rollout status deploy/argocd-server','deployment "argocd-server" successfully rolled out'),
 ('登录 Web 界面（另开终端保持端口转发）。','kubectl -n argocd port-forward svc/argocd-server 8080:443\nkubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo','Forwarding from 127.0.0.1:8080 -> 8080\nq7Xk2mPz9LwR4sYv'),
 ('创建 Application，指向示例仓库的 guestbook 目录，开启自动同步。','kubectl apply -f - <<EOT\napiVersion: argoproj.io/v1alpha1\nkind: Application\nmetadata: {name: guestbook, namespace: argocd}\nspec:\n  project: default\n  source:\n    repoURL: https://github.com/argoproj/argocd-example-apps\n    path: guestbook\n    targetRevision: HEAD\n  destination: {server: https://kubernetes.default.svc, namespace: guestbook}\n  syncPolicy:\n    automated: {prune: true, selfHeal: true}\n    syncOptions: [CreateNamespace=true]\nEOT\nsleep 30; kubectl -n argocd get application guestbook','NAME        SYNC STATUS   HEALTH STATUS\nguestbook   Synced        Healthy'),
 ('手动改副本数：几秒后被改回。','kubectl -n guestbook scale deploy guestbook-ui --replicas=5\nsleep 10; kubectl -n guestbook get deploy guestbook-ui','NAME           READY   UP-TO-DATE   AVAILABLE\nguestbook-ui   1/1     1            1'),
 ('看 Argo CD 记录的同步历史。','kubectl -n argocd get application guestbook -o jsonpath="{range .status.history[*]}{.id} {.revision}{\'\\n\'}{end}"','0 3f6c1a2e9b…'),
 ('清理：删除 Application 时级联删除它管理的资源（需要 finalizer）。','kubectl -n argocd patch application guestbook --type=merge -p \'{"metadata":{"finalizers":["resources-finalizer.argocd.argoproj.io"]}}\'\nkubectl -n argocd delete application guestbook; kubectl get ns guestbook','application.argoproj.io "guestbook" deleted\nError from server (NotFound): namespaces "guestbook" not found')],
 ('设计一条发布流水线','应用代码在 repo app，配置在 repo deploy（Kustomize，overlays/staging 与 overlays/prod）。要求：每次合并到 main 自动发布到 staging；prod 需要人工审批；任何环境都能一步回滚；CI 不持有集群凭证。写出各步骤由谁完成、改了什么。',
 '<pre class="out">1. 开发者向 app 提交合并请求 → CI：测试、构建镜像 ghcr.io/acme/api:sha-3f6c1a2、扫描、签名、推送\n2. CI（只有 deploy 仓库的写权限）：\n   cd overlays/staging && kustomize edit set image api=ghcr.io/acme/api:sha-3f6c1a2\n   git commit && git push           # 直接推 main\n3. Argo CD（集群内）：检测到 deploy 仓库变化 → 同步 staging\n4. CI 同时开一个合并请求：把同样的标签写进 overlays/prod\n5. 审批人在 deploy 仓库审查并合并 → Argo CD 同步 prod\n回滚：git revert 对应提交 → Argo CD 同步回上一个镜像</pre><p>审批落在 deploy 仓库的合并请求上（分支保护 + CODEOWNERS），所以每次生产变更都有记录、有审批人。CI 只能推 Git，集群凭证只在集群内的 Argo CD 手里。镜像标签用提交哈希，Git 中的一行就能确定线上运行的代码。紧急情况下用 Argo CD 回到历史版本时，记得关闭自动同步，或尽快补一个 revert 提交，否则下次同步又会回到 Git 中的版本。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
