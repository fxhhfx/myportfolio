# 小说自动续写系统

基于 DeepSeek AI 的小说自动续写工具，输入大纲即可自动生成章节内容。

## 功能特点

- 输入小说大纲，AI 自动续写章节
- 支持多章节连续创作，保持情节连贯
- 保存和加载小说项目
- 深色主题界面，专注写作体验

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 API Key

**方式一：环境变量（推荐）**

Windows:
```cmd
set DEEPSEEK_API_KEY=你的API密钥
```

Linux/Mac:
```bash
export DEEPSEEK_API_KEY=你的API密钥
```

**方式二：运行 start.bat 时输入**

双击 `start.bat`，按提示输入 API Key。

### 3. 启动服务

```bash
python app.py
```

或双击 `start.bat`

### 4. 访问网页

打开浏览器访问：http://localhost:5000

## 获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com
2. 注册/登录账号
3. 在"API Keys"页面创建新密钥
4. 复制密钥并配置到环境变量

## 使用说明

1. **输入大纲**：在左侧"小说大纲"框中输入故事梗概
2. **设置章节**：填写小说标题和当前章节号
3. **生成内容**：点击"生成章节"，AI 将创作 800-1500 字内容
4. **继续创作**：章节号自动递增，点击继续生成下一章
5. **保存小说**：点击"保存小说"，系统会生成唯一 ID
6. **加载小说**：点击"加载小说"，输入 ID 即可恢复之前的创作

## 项目结构

```
novel-writer/
├── app.py              # Flask 后端
├── requirements.txt    # Python 依赖
├── start.bat          # Windows 启动脚本
├── templates/
│   └── index.html     # 前端页面
├── static/
│   ├── style.css      # 样式
│   └── script.js      # 前端逻辑
└── data/              # 小说数据存储（自动创建）
```

## 注意事项

- API 调用会产生费用，请注意控制使用量
- 生成的内容仅供参考，建议人工润色
- 小说数据保存在本地 `data/` 目录
