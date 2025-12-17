# 五子棋

一个支持双人对弈和AI对战的网页版五子棋游戏，可离线运行的PWA应用。

## 功能特性

- 15×15 标准棋盘，浅色木纹背景
- 黑白棋子带毛玻璃质感和阴影效果
- 行棋合法性检查，自动判断胜负
- 双人对弈模式（同一设备）
- 人机对战模式，AI难度可调（搜索深度1-4）
- 悔棋功能
- 完全离线运行（PWA）

## AI实现

AI使用 Minimax 算法配合 Alpha-Beta 剪枝：

- 通过评估棋型（五连、活四、冲四、活三等）计算局面分数
- 搜索深度可调节：简单(1) / 普通(2) / 困难(3) / 专家(4)
- 自动筛选有意义的候选落子位置，提高搜索效率

## 运行方式

需要通过 HTTP 服务器运行（PWA 要求）：

```bash
# 使用 Python
python3 -m http.server 8080

# 或使用 Node.js
npx serve .
```

然后在浏览器访问 `http://localhost:8080`

## 文件结构

```
├── index.html      # 主入口页面
├── styles.css      # 样式表
├── game.js         # 游戏核心逻辑
├── ai.js           # AI算法模块
├── app.js          # 应用主控制器
├── manifest.json   # PWA清单
├── sw.js           # Service Worker
└── icon.svg        # 应用图标
```

## 技术栈

- 纯原生 JavaScript，无外部依赖
- Canvas 2D 绘图
- Service Worker 离线缓存
