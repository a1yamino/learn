COL_='import random, zlib, struct\nrandom.seed(3)\nN = 1_000_000\nrows = [(i, random.choice(["北京", "上海", "广州", "深圳"]), random.randint(1, 500),\n         random.randint(0, 99), "x" * 40) for i in range(N)]   # id, 城市, 金额, 品类, 备注\n# 行存：查询 sum(金额) 也要读整行\nrow_bytes = sum(8 + 6 + 4 + 4 + 40 for _ in rows)\n# 列存：只读“金额”这一列\namount = struct.pack(f"{N}i", *[r[2] for r in rows])\nprint(f"行存需读取 {row_bytes/1e6:.0f} MB；列存只读金额列 {len(amount)/1e6:.0f} MB")\n# 排序后城市列的游程编码\ncity = sorted(r[1] for r in rows)\nruns, prev = [], None\nfor c in city:\n    if c == prev: runs[-1][1] += 1\n    else: runs.append([c, 1]); prev = c\nprint("城市列游程编码：", runs)\ncat = bytes(r[3] for r in rows)\nprint(f"品类列 {len(cat)/1e6:.1f} MB，zlib 压缩后 {len(zlib.compress(cat))/1e6:.2f} MB")'
VEC_='import math\ndocs = {"如何更换自行车链条": [0.9, 0.1, 0.0], "山地车刹车调整": [0.8, 0.3, 0.1],\n        "红烧肉的做法": [0.0, 0.1, 0.95], "单车保养入门": [0.85, 0.2, 0.05]}\ndef cos(a, b): return sum(x*y for x, y in zip(a, b)) / math.sqrt(sum(x*x for x in a) * sum(y*y for y in b))\nq = [0.88, 0.15, 0.02]                     # “自行车维修”的向量（示意）\nfor t, v in sorted(docs.items(), key=lambda d: -cos(q, d[1])):\n    print(f"{cos(q, v):.3f}  {t}")'
TITLE='分析型存储：列存、向量化与物化视图';DESC='第 4 章后半部分转向分析负载。一张事实表有上百列、几十亿行，而一个查询只用到其中三四列——按行存储就要读入大量无用数据。本课讲列式存储与压缩（位图、游程编码）、排序键、列存如何处理写入、查询执行的编译与向量化、物化视图与数据立方体，最后介绍多维索引、全文检索的倒排索引和向量嵌入的近似最近邻搜索。'
NEXT='编码格式：JSON、Protocol Buffers 与 Avro';MIN=60
SUM=['<b>列式存储</b>：把同一列的所有值存在一起，每列一个文件（或一个列块）。查询只读需要的列，I/O 大幅减少。所有列文件中的值按相同的行顺序排列，第 k 个值属于第 k 行。Parquet、ORC 是常见的列式文件格式；Snowflake、BigQuery、ClickHouse、DuckDB 等都是列存。',
'<b>压缩</b>：一列中的值类型相同、重复度高，非常适合压缩。取值不多的列可以用<b>位图编码</b>（每个不同值一个位图），再对位图做<b>游程编码</b>；多个条件的过滤变成位图的 AND/OR。<b>排序键</b>：按常用的过滤列（如日期）排序，可以跳过无关的数据块，并让第一排序列的游程编码效果极好。',
'<b>写入</b>：列存不适合原地更新——插入一行要改每一个列文件。做法与 LSM 类似：写入先进入内存中的行式缓冲区，积累后批量转换成列式段，查询时合并两者。',
'<b>查询执行</b>：扫描上亿行时，CPU 成为瓶颈。两种优化：<b>查询编译</b>（把查询生成为机器码，消除解释开销）和<b>向量化</b>（一次处理一批列值，紧凑的循环便于 CPU 流水线与 SIMD 指令）。',
'<b>物化视图</b>是把查询结果实际存下来的派生数据，底层数据变化时要更新（第 1 课练习过）。<b>数据立方体</b>是按多个维度预先聚合的特殊物化视图，查询极快但失去了灵活性，通常作为原始数据之上的加速层。',
'<b>其他索引</b>：<b>多维索引</b>（R 树、GiST）用于“经纬度同时在某个范围内”这类查询。<b>全文检索</b>用<b>倒排索引</b>：每个词项对应包含它的文档列表（posting list），可以用位图压缩，与列存的思想相近。<b>向量嵌入</b>把文本或图片映射为高维向量，语义相近则距离近；向量索引（IVF、HNSW）做近似最近邻搜索，是语义搜索与 RAG 的基础。']
def secs(prac,E):
    return [
('行存与列存','同一张表的两种磁盘布局，以及一个聚合查询读了多少数据。','<div id="p1"></div>'),
('动手：查询要读多少','选择查询，比较行存与列存需要读取的数据量。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('位图与游程编码','一个低基数列如何被压缩。','<div id="p2"></div>'),
('立方体与全文检索','在 PostgreSQL 中体验。','<div id="t4"></div>'),
('在你的电脑上练习','Python 3 与第 1 课的 <code>pg</code> 容器。',prac([
 ('保存为 <code>col.py</code>：一百万行，比较行存与列存的读取量和压缩效果（约需 2 秒）。',COL_,"行存需读取 62 MB；列存只读金额列 4 MB\n城市列游程编码： [['上海', 249970], ['北京', 249156], ['广州', 250438], ['深圳', 250436]]\n品类列 1.0 MB，zlib 压缩后 0.84 MB"),
 ('数据立方体：一次算出多种维度组合的汇总。','SELECT date_trunc(\'month\', created_at)::date m, user_id % 3 AS seg, sum(amount)\nFROM orders WHERE created_at < \'2026-03-01\'\nGROUP BY CUBE (1, 2) ORDER BY 1, 2;','     m      | seg |   sum\n------------+-----+---------\n 2026-01-01 |   0 | …\n 2026-01-01 |   1 | …\n 2026-01-01 |   2 | …\n 2026-01-01 |     | …（该月合计）\n …\n            |     | …（总计）'),
 ('倒排索引：PostgreSQL 全文检索。','CREATE TABLE articles(id serial, body text);\nINSERT INTO articles(body) VALUES (\'log structured merge tree\'),(\'b tree page split\'),(\'merge sort and log files\');\nCREATE INDEX ON articles USING gin (to_tsvector(\'english\', body));\nSELECT id, body FROM articles WHERE to_tsvector(\'english\', body) @@ to_tsquery(\'english\', \'merge & log\');',' id |           body\n----+---------------------------\n  1 | log structured merge tree\n  3 | merge sort and log files'),
 ('保存为 <code>vec.py</code>：用余弦相似度做语义搜索（向量为示意值）。',VEC_,'0.998  如何更换自行车链条\n0.997  单车保养入门\n0.978  山地车刹车调整\n0.040  红烧肉的做法')],
 ('为广告点击分析选择存储','每天 50 亿条点击事件，每条约 60 个字段（时间、广告 ID、广告主、地域、设备、价格……）。常见查询：某广告主过去 7 天按天、按地域的点击数与花费；运营临时探索任意维度组合。请：① 说明为什么用列存；② 选择排序键与分区；③ 是否需要预聚合，如何与原始数据配合；④ 写入如何进行。',
 '<ol><li>查询只涉及 60 列中的少数几列，并扫描大量行：列存只读需要的列，且低基数列（地域、设备）压缩率极高，向量化执行聚合很快。</li><li>按天分区（便于过期删除和跳过无关日期）；排序键 <code>(advertiser_id, event_time)</code>：最常见的过滤条件是广告主，排序后同一广告主的数据连续，可以跳过大部分数据块，广告主列游程编码几乎不占空间。</li><li>为固定报表建物化视图/汇总表：<code>(day, advertiser_id, region) → clicks, cost</code>，行数减少几个数量级，仪表盘直接查它；临时探索仍然查原始明细表。汇总表是派生数据，随原始数据增量更新，有问题可以按天重算。</li><li>事件先进入 Kafka，由写入任务按批（例如每几秒或每几十万行）写成列式数据段；存储引擎在后台合并小段（类似 LSM）。不要逐行插入列存。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
