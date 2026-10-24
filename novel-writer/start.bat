@echo off
echo ====================================
echo 小说自动续写系统
echo ====================================
echo.

REM 检查是否设置了 API Key
if "%DEEPSEEK_API_KEY%"=="" (
    echo [警告] 未设置 DEEPSEEK_API_KEY 环境变量
    echo 请设置：set DEEPSEEK_API_KEY=你的API密钥
    echo 或者在下方直接输入 API Key：
    set /p DEEPSEEK_API_KEY=API Key: 
)

echo.
echo 正在启动服务器...
echo 访问地址：http://localhost:5000
echo 按 Ctrl+C 停止服务器
echo.

cd /d "%~dp0"
python app.py
