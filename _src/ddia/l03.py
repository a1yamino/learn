TITLE='可靠性、可扩展性与可维护性';DESC='第 2 章后半部分的三个非功能需求。可靠性：区分故障（fault）与失效（failure），硬件、软件与人为错误各有什么特点，为什么要主动注入故障。可扩展性：如何用负载参数描述增长，共享内存、共享磁盘、无共享三种架构，以及扩展的几条原则。可维护性：可操作性、简单性、可演化性。';NEXT='数据模型：关系、文档与规范化';MIN=50
SUM=['<b>故障与失效</b>：故障（fault）是某个组件偏离了规格，失效（failure）是整个系统不再向用户提供所需服务。容错的目标是让故障不演变成失效。不可能容忍所有故障（整个地球消失），所以要说清楚容忍哪些故障。<b>单点故障</b>是指一个组件出错就会导致整个系统失效。可以用<b>混沌工程</b>主动注入故障，确认容错机制真的有效。',
'<b>硬件故障</b>：大量机器下故障是常态——磁盘年故障率约 1–2%，一万块盘在此假设下平均每天约坏 0.27–0.55 块（不是每天固定发生）；还有内存位翻转、CPU 计算错误、整个机房断电。对策是冗余（RAID、多副本、多可用区），并让软件能容忍整台机器丢失，这样还可以滚动升级。<b>软件故障</b>彼此相关：同一个 bug 会同时击中所有节点（例如闰秒、证书过期、某个输入触发的崩溃），比随机的硬件故障更危险。',
'<b>人为错误</b>是线上事故的主要原因之一（配置变更尤甚）。对策不是责怪个人，而是改进系统：好的抽象与默认值、在沙箱或预发环境演练、渐进发布与快速回滚、详细监控（遥测）、无责复盘（blameless postmortem）。',
'<b>可扩展性</b>不是一个二元标签，而是“负载增长到某个程度时，系统如何应对”。先用<b>负载参数</b>描述负载（请求率、读写比、数据量、并发用户、分布偏斜），再问：负载翻倍时性能如何变化？要保持性能需要增加多少资源？架构：<b>共享内存</b>（垂直扩展，一台更大的机器），<b>共享磁盘</b>（多台机器共享存储阵列或云存储服务），<b>无共享</b>（水平扩展，每个节点独立，通过网络协调）。',
'扩展的原则：把系统拆成可以独立运作的部分；不要为远期规模过早设计（10 倍增长时多半需要重新设计）；简单的方案往往能撑很久；弹性伸缩适合负载不可预测的场景，手动扩容更简单、意外更少。',
'<b>可维护性</b>：软件的大部分成本在上线之后。<b>可操作性</b>——让运维容易：良好的监控、文档、可预测的行为、避免依赖单台机器、合理的默认值同时允许覆盖。<b>简单性</b>——区分本质复杂度与偶然复杂度；好的<b>抽象</b>（如 SQL、事务）隐藏实现细节。<b>可演化性</b>——让需求变化时容易修改（第 9–10 课的模式演进就是一例）。']
def secs(prac,E):
    return [
('故障不等于失效','冗余如何阻止一个故障变成系统失效。','<div id="p1"></div>'),
('三种扩展架构','共享内存、共享磁盘、无共享。','<div id="p2"></div>'),
('动手：要几个副本','选择副本数与修复时间，看数据全部丢失的概率。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('故障的规模','用 Python 估算一万块磁盘的故障。','<div id="t4"></div>'),
('在你的电脑上练习','用 Docker 体会“故障 → 自动恢复”和“人为错误 → 从备份恢复”。需要第 1 课的 <code>pg</code> 容器。',prac([
 ('保存为 <code>disk.py</code> 并运行。','import random\nrandom.seed(1)\nAFR = 0.02          # 每块磁盘年故障率 2%\nDISKS = 10000\ndays = 365\nfails = sum(1 for _ in range(DISKS) if random.random() < AFR)\nprint(f"{DISKS} 块盘一年坏 {fails} 块，平均每天 {fails/days:.2f} 块")\np_day = AFR / days\nprint(f"单块盘某天坏的概率 {p_day:.2e}")\nprint(f"3 个健康副本在固定 1 天窗口内独立全坏的概率 {p_day**3:.2e}")','10000 块盘一年坏 226 块，平均每天 0.62 块\n单块盘某天坏的概率 5.48e-05\n3 个健康副本在固定 1 天窗口内独立全坏的概率 1.65e-13'),
 ('让容器在进程崩溃后自动重启。','docker update --restart=always pg\ndocker exec pg sh -c \'kill 1\'\nsleep 5; docker ps --filter name=pg --format "{{.Status}}"','Up 3 seconds'),
 ('人为错误前先做备份。','docker exec pg pg_dump -U postgres -t orders -Fc -f /tmp/orders.dump\ndocker exec pg ls -lh /tmp/orders.dump','-rw-r--r-- 1 root root 13M … /tmp/orders.dump'),
 ('模拟误操作：忘了 WHERE。','docker exec pg psql -U postgres -c "DELETE FROM orders;"','DELETE 1000000'),
 ('从备份恢复。','docker exec pg pg_restore -U postgres -d postgres --data-only -t orders /tmp/orders.dump\ndocker exec pg psql -U postgres -c "SELECT count(*) FROM orders;"',' count\n---------\n 1000000'),
 ('防止人为错误的另一种方式：在事务里先看影响行数再提交。','docker exec -it pg psql -U postgres\nBEGIN;\nDELETE FROM orders WHERE created_at < \'2026-01-02\';\n-- 看到 DELETE 3333，确认无误再 COMMIT，否则 ROLLBACK\nROLLBACK;','BEGIN\nDELETE 3333\nROLLBACK')],
 ('为一个支付系统写可靠性设计','系统：支付 API（无状态，8 台）、PostgreSQL 主库 + 1 个同机房从库、Redis 缓存、每晚全量备份。过去一年的事故：一次机房断电（停机 4 小时）、一次错误配置推送导致全部 API 节点崩溃、一次 DBA 误删表（从昨晚备份恢复，丢失 14 小时数据）。请针对每次事故提出改进，并列出你会主动做的故障演练。',
 '<ol><li><b>机房断电</b>：单机房是单点故障。至少跨两个可用区部署 API 与数据库副本；主库故障时自动或半自动切换（第 11 课）；定期演练切换。</li><li><b>错误配置</b>：同一个错误同时击中所有节点，是相关性故障。配置也要走代码评审与校验；灰度发布（先 1 台、再 5%、再全量）并自动比较错误率；一键回滚；配置变更要有审计记录。</li><li><b>误删表</b>：每晚全量备份的 RPO 是 24 小时。加入 WAL 归档实现时间点恢复（PITR，见 PostgreSQL 课程），RPO 降到秒级；生产库权限最小化，危险操作需要两人确认；延迟从库（如延迟 1 小时）可以快速找回误删数据；定期做恢复演练，确认备份真的可用。</li><li><b>演练清单</b>：随机杀掉一台 API 节点；关闭主库，测量切换时间；断开可用区间网络；把 Redis 清空看数据库能否扛住；磁盘写满；在预发环境从备份做一次完整恢复并计时。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
