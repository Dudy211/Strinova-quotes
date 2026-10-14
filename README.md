# 🐾 猫娘语录集

卡拉彼丘 · 喵言喵语收藏所 —— 一个纯静态的语录复制网页。

点一下卡片就把语录复制到剪贴板;擦边语录默认模糊遮罩,点击揭开后才可复制。

---

## 🚀 部署到 GitHub Pages

**关键:URL 取决于你把哪一层放进仓库根。**

### 布局 A —— 仓库根 = 站点根(推荐)

把 `yuneko-quotes/` **里面的内容**(不是文件夹本身)放进仓库根:

```
你的仓库/
├── index.html          ← 必须在仓库根!
├── css/  js/  quotes/
├── .nojekyll
└── (README.md, tools/ 可放可不放)
```

- Settings → Pages → Source:`Deploy from a branch`
- Branch:`main`,目录:`/ (root)`,Save
- 地址:**`https://<用户名>.github.io/<仓库名>/`**

> 判断标准:仓库首页能直接看到 `index.html`,就是布局 A。

### 布局 B —— 整个文件夹放进去

```
你的仓库/
└── yuneko-quotes/
    ├── index.html
    └── css/  js/  quotes/
```

- Settings → Pages 同上,Branch `main`,目录 `/ (root)`
- 地址:**`https://<用户名>.github.io/<仓库名>/yuneko-quotes/`**

⚠️ 这种情况**用 `/ <仓库名>/` 打开会 404**,必须带上 `/yuneko-quotes/`。
  如果你想要更短的地址(即布局 A),把文件挪到仓库根,或者干脆新建一个
  专门放站点的仓库。

### `.nojekyll` 别漏了

它是**隐藏文件**,用 GitHub 网页「上传/拖拽」很容易被跳过。

- 用 git 命令行推送 → 一般没问题
- 用网页上传 → 传完后确认仓库根**真的有** `.nojekyll`,没有就手动 New file 建一个(内容留空)

它没有也不一定坏(本项目没有 Jekyll 会特殊处理的文件),但留着更保险。

> 另外:GitHub Pages 有 **约 10 分钟 CDN 缓存**。改完内容想立刻生效,见下面的「改完不生效」。

---

## ✏️ 怎么加语录

**只改一个文件**:`quotes/quotes.txt`

```
语录内容写一行
#1#香奈美#星绘

下一条语录

再下一条,带一个角色标签
#星绘
```

| 规则 | 说明 |
|---|---|
| **一行 = 一条语录** | 长句就一行写到底,不要用回车换行 |
| **标签行紧跟其后** | 以 `#` 开头的那一行,可以省略 |
| `#1` | 标记这条是**擦边**,页面上会模糊遮罩 |
| `#角色名` | 角色标签,想写几个写几个:`#香奈美#星绘` |
| 空行 | 随便打,纯为好看,解析不依赖它 |
| 注释 | 一整行以 `#` 开头、又不是接在某条语录后面的 → 不显示 |

**两个坑**

1. ⚠️ **语录内容不能以 `#` 开头** —— 会被当成标签行。真需要的话写成 `\#`。
2. ⚠️ **文件必须是 UTF-8 编码** —— 存成 GBK 会全部乱码。

`#1` 之外,`#nsfw`、`#r18`、`#擦边`、`#涩` 也都会被识别成擦边标记。

### 改完不生效?

GitHub Pages 有约 10 分钟的 CDN 缓存。想立刻生效:

打开 `js/config.js`,把 `dataVersion: '2',` 改成 `'3'`、`'4'`... 提交后刷新即可。

---

## 🎯 页面功能

| 功能 | 说明 |
|---|---|
| 左键复制 | 点卡片即复制全文,绿框 + 底部提示「复制成功喵 :3」 |
| 擦边遮罩 | 擦边卡片默认模糊;第一次点 = 揭开,第二次点 = 复制 |
| 角色筛选 | 顶部标签栏按角色过滤;卡片上的 `#角色名` chip 也能点。再点一次取消 |
| 搜索 | 模糊匹配,**正文和角色标签都在搜索范围**。输入「猫语录」也能命中「猫娘语录集」 |
| 随机一条 | 右下角 🎲 按钮,旁边开关决定**是否可能抽到擦边语录** |
| 主题切换 | 右上角月亮/太阳图标,首次跟随系统,选择会记住 |
| 计数 | 搜索框旁显示「共 N 条(擦边 M 条)」/「#香奈美 · 找到 X / N 条」 |

**快捷键**:搜索框里 `Enter` 立即搜索,`Esc` 清空。

---

## 💻 本地开发(可选,不用部署就不必看)

### 本地起服务

```
bash tools/serve.sh          # 默认 http://localhost:8000
bash tools/serve.sh 9000     # 指定端口
```

> ⚠️ **不要双击 `index.html` 直接打开**。`file://` 协议下浏览器会拦截 ES 模块和 txt 加载,
> 页面会显示一个友好提示而不是内容。这不是 bug,是浏览器的安全策略。

### 单文件离线版(给不支持 http 的环境用)

```
python3 tools/build_single.py
```

产出 `yuneko-quotes-standalone.html`(约 66 KB)。**双击就能开**,因为:

- CSS、全部 JS 都内联进去了,不需要 ES 模块加载
- 语录数据也嵌在文件里,不需要 `fetch`

适合手机端本地服务器 App(HopWeb 之类)、各种 WebView、或者直接 `file://` 打开。

> 📌 改完语录要重新跑一次 `build_single.py`,单文件版才会更新。
> ⚠️ 上面两个工具都要用**自己的电脑**(有 Python 3 / bash)跑,GitHub Pages 上跑不了。

---

## ⚠️ 踩过的坑(重要)

### `hidden` 属性会被 CSS 盖掉

HTML 里写 `hidden`,靠的是浏览器默认样式 `[hidden] { display: none }`。
但如果给同一元素写了 `display: grid` / `flex`(类选择器,**权重相同**),又声明在后面 ——
**默认规则被盖掉,元素照样显示。**

症状很吓人:**全屏错误遮罩常驻,整页像黑屏**,但 DOM 属性检查全是绿的
(`el.hidden === true` 确实成立)。**光查属性查不出来。**

现在的三层保险:

1. `base.css` 里全局 `[hidden] { display: none !important; }`
2. `#boot-error` 自带内联 `style="display:none"`(CSS 没加载也安全)
3. JS 用 `el.style.display` 显式开关,不依赖 `hidden`

自查:`python3 tools/check_hidden.py`

### 页面崩了要说得出原因

`index.html` 最前面挂了全局 `onerror` / `unhandledrejection` 捕获。
兜底提示里带「诊断信息」折叠区,会输出:协议、URL、UA、
是否支持 ES 模块 / fetch / clipboard / localStorage,以及错误堆栈。

**页面出问题先点开它**,比猜快得多。

---

## 🔧 兼容性

按 **ES2017 基线** 写,并针对老 WebView 做了降级:

| 项目 | 要求 |
|---|---|
| JS 语法 | ES2017(`async/await`,即 Chrome 55 / Android 7 之后) |
| CSS | 不含 `:has()` / `color-mix()` / `inset` 简写;`dvh` 有 `vh` 兜底 |
| flex `gap` | 启动时特性检测,不支持则用 margin 顶上 |
| grid | `@supports not (display:grid)` 时退化为单列 |
| 复制 | `navigator.clipboard` 不可用时降级到 `execCommand` |

已用 acorn 按 ES2015/2017/2019/2020 逐版本解析验证过。

---

## 📁 目录结构

```
yuneko-quotes/
├── index.html                     页面骨架 + 防闪白脚本 + 兜底提示
├── yuneko-quotes-standalone.html  单文件离线版(由 build_single.py 生成)
├── .nojekyll                      告诉 GitHub Pages 别用 Jekyll
├── README.md
├── css/
│   ├── variables.css     ★ 设计变量(配色/圆角/间距),改风格只动这个
│   ├── base.css          重置 + 背景光斑 + [hidden] 兜底
│   ├── layout.css        骨架布局
│   └── components.css    卡片/标签/按钮/开关/Toast
├── js/
│   ├── config.js         ★ 标题、数据路径、缓存版本号
│   ├── main.js           装配层
│   ├── core/
│   │   ├── loader.js      取数据(内嵌通道 / fetch 通道)
│   │   ├── parser.js      纯函数:文本 → 语录 + 标签
│   │   ├── clipboard.js   复制 + 降级
│   │   ├── prefs.js       localStorage 读写
│   │   └── search.js      模糊搜索 + 标签筛选
│   └── ui/
│       ├── list.js        列表渲染 + 卡片交互
│       ├── random.js      随机一条
│       ├── theme.js       深浅色
│       └── toast.js       轻提示
├── tools/                ← 本地工具,不需要部署
│   ├── build_single.py   打包单文件离线版
│   ├── check_hidden.py   静态检查 hidden 失效 bug
│   └── serve.sh          一键本地预览
└── quotes/
    └── quotes.txt        ★ 语录数据(唯一要维护的文件)
```

---

## 🛠 二次开发小抄

- **改配色/圆角/字号** → `css/variables.css`,亮暗两套都在里面。
- **改标题/副标题/数据文件路径** → `js/config.js`。
- **加一个新的擦边判定词** → `parser.js` 顶部的 `NSFW_TOKENS`。
- **调试** → 控制台敲 `__yuneko.ALL` 看全部数据、`__yuneko.META` 看统计、
  `__yuneko.tag` 看当前筛的标签、`__yuneko.reload()` 手动重载。
