# 个人项目合集

本仓库包含两个项目：个人作品集网站和小说自动续写工具。

## 项目一：个人作品集网站

纯 HTML/CSS/JS 实现的响应式个人主页，包含关于我、技能、项目展示、联系方式等模块。

- 深色主题，滚动动画
- 项目分类筛选
- 数字计数动画
- 移动端适配

**在线预览：** [Gitee Pages](https://fangxianghui.gitee.io/myportfolio)

## 项目二：小说自动续写

基于 Flask + DeepSeek API 的 Web 应用，输入小说大纲后 AI 自动续写章节。

### 功能特性

- 输入大纲，AI 自动生成章节内容
- 章节自动编号，保持逻辑连贯
- 四种写作风格可选（均衡/细节/简洁/文艺）
- 章节列表导航，随时切换查看
- 保存/加载小说，数据按用户隔离
- 导出为 TXT 或 Markdown 格式
- 用户注册/登录系统

### 技术栈

- 后端：Python Flask
- AI：DeepSeek API（OpenAI 兼容接口）
- 前端：原生 HTML/CSS/JS
- 存储：本地 JSON 文件

### 快速开始

```bash
# 1. 安装依赖
cd novel-writer
pip install -r requirements.txt

# 2. 配置 API Key
# 编辑 .env 文件，填入你的 DeepSeek API Key
DEEPSEEK_API_KEY=sk-xxxxxxxx

# 3. 启动服务
python app.py

# 4. 打开浏览器
# 访问 http://localhost:5000
```

### 默认账户

- 用户名：`admin`
- 密码：`admin123`

可在 `.env` 文件中修改。

## 目录结构

```
.
├── index.html          # 作品集首页
├── style.css           # 作品集样式
├── script.js           # 作品集脚本
├── dist/               # 部署目录
├── novel-writer/       # 小说续写项目
│   ├── app.py          # Flask 后端
│   ├── templates/      # 页面模板
│   ├── static/         # 前端资源
│   ├── data/           # 用户数据（已忽略）
│   ├── .env            # 配置文件（已忽略）
│   └── requirements.txt
── .gitignore
```
