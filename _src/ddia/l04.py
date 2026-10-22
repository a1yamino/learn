TITLE='数据模型：关系、文档与规范化';DESC='第 3 章前半部分。数据模型决定了我们如何思考问题。本课比较关系模型与文档模型：对象—关系不匹配、一对多的树状数据适合文档、多对一与多对多关系需要连接；规范化与反规范化的取舍（写时一致还是读时快）；分析场景的星型与雪花模式；以及“模式在写时还是读时”的区别。练习在 PostgreSQL 中同时使用表和 JSONB。';NEXT='图模型、查询语言与事件溯源';MIN=55
SUM=['<b>对象—关系不匹配</b>：应用代码里是嵌套的对象，关系库里是扁平的行与表，中间需要 ORM 转换。ORM 减少了样板代码，但也可能产生 N+1 查询等问题。文档模型（JSON）对一棵自包含的树（一份简历、一个订单及其明细）表达更直接：一次读取得到全部内容，<b>局部性</b>好。',
'<b>规范化</b>：同一个事实只存一份，其他地方用 ID 引用（例如城市、公司、标签）。好处：改名只改一处，不会不一致；可以本地化显示；方便搜索。代价：读取时要<b>连接</b>。<b>反规范化</b>：把数据复制到需要的地方，读更快，但要负责保持副本一致——反规范化的数据本质上是派生数据。第 2 课的物化时间线就是反规范化。',
'<b>关系的形状</b>：一对多（一个订单的多条明细）适合文档嵌套；<b>多对一</b>（很多人住在同一个城市）和<b>多对多</b>（学生与课程）需要引用，文档库要么在应用代码里做连接，要么本身支持连接。实际数据往往从树开始，随着功能增加长出越来越多的交叉引用。',
'<b>写时模式与读时模式</b>：关系库在写入时强制模式（schema-on-write），类似静态类型；文档库通常读时才解释结构（schema-on-read），类似动态类型——改结构时不必迁移全部旧数据，但读取代码要处理各种旧格式。两者都需要演进，区别是谁承担成本。',
'<b>星型模式</b>：数据仓库中，中间一张巨大的<b>事实表</b>（每行一个事件：一次销售、一次点击），外键指向若干<b>维度表</b>（谁、什么、何时、何地）。维度再细分成子维度就是<b>雪花模式</b>；为了查询简单，分析系统也常把维度直接展开成“宽表”（一个大表，几百列）。',
'<b>如何选择</b>：树状、整体读写、结构多变 → 文档；关系多、需要连接、需要强约束 → 关系。今天两者正在融合：PostgreSQL 有 JSONB 和 GIN 索引，文档库也支持连接与模式校验。']
def secs(prac,E):
    return [
('同一份数据，两种形状','一份用户档案在关系表与文档中的样子。','<div id="p1"></div>'),
('动手：改一个城市名','选择存储方式，看改名要修改多少条记录、会不会不一致。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('星型模式','分析库中的事实表与维度表。','<div id="p2"></div>'),
('JSONB 查询','在 PostgreSQL 中查询文档。','<div id="t4"></div>'),
('在你的电脑上练习','使用第 1 课的 <code>pg</code> 容器：<code>docker exec -it pg psql -U postgres</code>。',prac([
 ('规范化：城市与用户分开存。','CREATE TABLE cities(id int PRIMARY KEY, name text);\nCREATE TABLE people(id int PRIMARY KEY, name text, city_id int REFERENCES cities);\nINSERT INTO cities VALUES (1,\'北京\'),(2,\'上海\');\nINSERT INTO people SELECT g, \'用户\'||g, 1 + g % 2 FROM generate_series(1,1000) g;','CREATE TABLE\nCREATE TABLE\nINSERT 0 2\nINSERT 0 1000'),
 ('读取需要连接。','SELECT p.name, c.name FROM people p JOIN cities c ON c.id = p.city_id WHERE p.id = 7;','  name  | name\n-------+------\n 用户7 | 上海'),
 ('文档：一份自包含的档案（一对多嵌套）。','CREATE TABLE profiles(id int PRIMARY KEY, doc jsonb);\nINSERT INTO profiles VALUES (1, \'{"name":"张三","city":"上海","jobs":[{"org":"甲公司","from":2019},{"org":"乙公司","from":2023}],"skills":["SQL","Go"]}\');\nSELECT doc->\'jobs\'->1->>\'org\' FROM profiles WHERE id = 1;','INSERT 0 1\n ?column?\n----------\n 乙公司'),
 ('改城市名：规范化只改一行。','UPDATE cities SET name = \'沪\' WHERE id = 2;','UPDATE 1'),
 ('反规范化：城市名复制在每份文档中，要逐个修改。','INSERT INTO profiles SELECT g, jsonb_build_object(\'name\', \'用户\'||g, \'city\', \'上海\') FROM generate_series(2,500) g;\nUPDATE profiles SET doc = jsonb_set(doc, \'{city}\', \'"沪"\') WHERE doc->>\'city\' = \'上海\';','INSERT 0 499\nUPDATE 500'),
 ('为文档建 GIN 索引，按包含关系查询。','CREATE INDEX ON profiles USING gin (doc);\nSELECT id FROM profiles WHERE doc @> \'{"skills":["Go"]}\';',' id\n----\n  1')],
 ('为一个菜谱社区建模','功能：菜谱（标题、步骤列表、配料及用量）、作者、标签（多对多）、用户收藏、评论（可回复）、按食材搜索、“同一作者的其他菜谱”。请：① 哪些部分适合嵌套为文档、哪些需要规范化引用；② 给出 PostgreSQL 表结构（可用 JSONB）；③ 食材名称（例如“番茄/西红柿”）应规范化还是反规范化？',
 '<ol><li>适合嵌套：步骤列表（只属于一个菜谱，整体读写，有序）。需要引用：作者（多对一）、标签（多对多）、收藏（用户与菜谱多对多）、食材（多对一，需要按食材搜索与同义词处理）、评论（数量可能很大，单独成表，按菜谱分页）。</li><li><pre style="overflow-x:auto">users(id, name)\nrecipes(id, author_id → users, title, steps jsonb, created_at)\ningredients(id, canonical_name)            -- 番茄\ningredient_aliases(alias, ingredient_id)   -- 西红柿 → 番茄\nrecipe_ingredients(recipe_id, ingredient_id, amount text)\ntags(id, name); recipe_tags(recipe_id, tag_id)\nfavorites(user_id, recipe_id, created_at)\ncomments(id, recipe_id, parent_id, user_id, body, created_at)</pre></li><li>食材应规范化：同义词合并到同一个 ID，搜索“西红柿”也能找到“番茄”；改名、翻译只改一处。展示时如果怕连接慢，可以在菜谱文档中冗余一份显示名作为缓存（派生数据），但以 <code>recipe_ingredients</code> 为准。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
