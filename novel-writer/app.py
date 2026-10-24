import os
import json
import uuid
import hashlib
import requests
from datetime import datetime
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

app = Flask(__name__)

# 从 .env 文件加载配置
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'default-secret-key')

LOGIN_USERNAME = os.environ.get('LOGIN_USERNAME', 'admin')
LOGIN_PASSWORD = os.environ.get('LOGIN_PASSWORD', 'admin123')
API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')
BASE_URL = os.environ.get('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')

BASE_DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(BASE_DATA_DIR, exist_ok=True)

USERS_FILE = os.path.join(BASE_DATA_DIR, 'users.json')

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_data_dir(username):
    user_dir = os.path.join(BASE_DATA_DIR, username)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

# 初始化管理员账户
users = load_users()
admin_user = os.environ.get('LOGIN_USERNAME', 'admin')
admin_pass = os.environ.get('LOGIN_PASSWORD', 'admin123')
if admin_user not in users:
    users[admin_user] = {
        'password': hash_password(admin_pass),
        'created_at': datetime.now().isoformat()
    }
    save_users(users)

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'username' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'error': '未登录'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

STYLE_PROMPTS = {
    'balanced': '保持均衡的叙事节奏，既有情节推进也有细节描写',
    'detailed': '注重细节描写，环境、人物心理、动作都要细致刻画',
    'fast': '节奏明快，以情节推进为主，对话简洁有力',
    'literary': '文笔优美，多用修辞，注重意境和情感表达',
}

def generate_novel_content(outline, previous_content, chapter_num, style='balanced', all_chapter_titles=None):
    style_desc = STYLE_PROMPTS.get(style, STYLE_PROMPTS['balanced'])

    chapter_titles_context = ''
    if all_chapter_titles:
        titles_list = '\n'.join(f'  第{i+1}章：{t}' for i, t in enumerate(all_chapter_titles))
        chapter_titles_context = f'\n【已有章节标题】\n{titles_list}\n'

    if previous_content:
        prompt = f"""你是一位专业的小说作家。根据以下信息续写第{chapter_num}章。

【小说大纲】
{outline}
{chapter_titles_context}
【前情提要】
{previous_content}

【写作风格】
{style_desc}

【要求】
1. 先给本章起一个简洁的标题（4-8个字），格式：标题：xxx
2. 续写第{chapter_num}章，字数800-1500字
3. 与前文情节连贯，人物性格一致
4. 要有细节描写和对话
5. 结尾留有悬念或推动情节发展
6. 标题和正文之间空一行"""
    else:
        prompt = f"""你是一位专业的小说作家。根据以下大纲创作第一章。

【小说大纲】
{outline}

【写作风格】
{style_desc}

【要求】
1. 先给本章起一个简洁的标题（4-8个字），格式：标题：xxx
2. 创作第一章，字数800-1500字
3. 开头要吸引人，建立世界观和主要人物
4. 要有细节描写和对话
5. 结尾留有悬念
6. 标题和正文之间空一行"""

    response = requests.post(
        f"{BASE_URL}/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": "你是一位才华横溢的小说作家，擅长创作引人入胜的故事。严格按照要求的格式输出。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.8,
            "max_tokens": 2000
        },
        timeout=120
    )

    if response.status_code != 200:
        raise Exception(f"API 请求失败：{response.status_code} - {response.text}")

    data = response.json()
    raw_content = data['choices'][0]['message']['content']

    # 解析标题和内容
    title = ''
    content = raw_content
    for line in raw_content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('标题：') or stripped.startswith('标题:'):
            title = stripped.split('：', 1)[-1].split(':', 1)[-1].strip()
            content = raw_content.replace(line, '', 1).strip()
            break

    return {'content': content, 'title': title}

@app.route('/login')
def login():
    if 'username' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/register')
def register():
    if 'username' in session:
        return redirect(url_for('index'))
    return render_template('register.html')

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': '请输入用户名和密码'}), 400

    users = load_users()
    if username in users and users[username]['password'] == hash_password(password):
        session['username'] = username
        session.permanent = True
        return jsonify({'message': '登录成功', 'username': username})
    return jsonify({'error': '用户名或密码错误'}), 401

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    confirm = data.get('confirm_password', '')

    if not username or not password:
        return jsonify({'error': '请输入用户名和密码'}), 400

    if len(username) < 2:
        return jsonify({'error': '用户名至少 2 个字符'}), 400

    if len(password) < 6:
        return jsonify({'error': '密码至少 6 个字符'}), 400

    if password != confirm:
        return jsonify({'error': '两次密码不一致'}), 400

    users = load_users()
    if username in users:
        return jsonify({'error': '用户名已存在'}), 409

    users[username] = {
        'password': hash_password(password),
        'created_at': datetime.now().isoformat()
    }
    save_users(users)

    session['username'] = username
    session.permanent = True
    return jsonify({'message': '注册成功', 'username': username})

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('username', None)
    return jsonify({'message': '已退出登录'})

@app.route('/api/user')
def api_user():
    if 'username' in session:
        return jsonify({'username': session['username']})
    return jsonify({'error': '未登录'}), 401

@app.route('/')
@login_required
def index():
    return render_template('index.html', username=session.get('username', ''))

@app.route('/api/generate', methods=['POST'])
@login_required
def generate():
    data = request.json
    outline = data.get('outline', '')
    previous_content = data.get('previous_content', '')
    chapter_num = data.get('chapter_num', 1)
    style = data.get('style', 'balanced')
    all_chapter_titles = data.get('all_chapter_titles', [])

    if not outline:
        return jsonify({'error': '请输入小说大纲'}), 400

    if not API_KEY:
        return jsonify({'error': '请先配置 DeepSeek API Key'}), 500

    try:
        result = generate_novel_content(outline, previous_content, chapter_num, style, all_chapter_titles)
        return jsonify({
            'content': result['content'],
            'title': result['title'],
            'chapter': chapter_num
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save', methods=['POST'])
@login_required
def save_novel():
    data = request.json
    title = data.get('title', '未命名小说')
    outline = data.get('outline', '')
    chapters = data.get('chapters', [])

    novel_id = str(uuid.uuid4())[:8]
    novel = {
        'id': novel_id,
        'title': title,
        'outline': outline,
        'chapters': chapters,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }

    user_dir = get_user_data_dir(session['username'])
    filepath = os.path.join(user_dir, f'{novel_id}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(novel, f, ensure_ascii=False, indent=2)

    return jsonify({'id': novel_id, 'message': '保存成功'})

@app.route('/api/load/<novel_id>')
@login_required
def load_novel(novel_id):
    user_dir = get_user_data_dir(session['username'])
    filepath = os.path.join(user_dir, f'{novel_id}.json')
    if not os.path.exists(filepath):
        return jsonify({'error': '小说不存在'}), 404

    with open(filepath, 'r', encoding='utf-8') as f:
        novel = json.load(f)

    return jsonify(novel)

@app.route('/api/list')
@login_required
def list_novels():
    user_dir = get_user_data_dir(session['username'])
    novels = []
    for filename in os.listdir(user_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(user_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                novel = json.load(f)
                novels.append({
                    'id': novel['id'],
                    'title': novel['title'],
                    'chapter_count': len(novel['chapters']),
                    'updated_at': novel['updated_at']
                })

    novels.sort(key=lambda x: x['updated_at'], reverse=True)
    return jsonify(novels)

@app.route('/api/delete/<novel_id>', methods=['DELETE'])
@login_required
def delete_novel(novel_id):
    user_dir = get_user_data_dir(session['username'])
    filepath = os.path.join(user_dir, f'{novel_id}.json')
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'message': '删除成功'})
    return jsonify({'error': '小说不存在'}), 404

if __name__ == '__main__':
    if not API_KEY:
        print("=" * 50)
        print("警告：未设置 DEEPSEEK_API_KEY")
        print("请设置环境变量：")
        print("  Windows: set DEEPSEEK_API_KEY=你的API密钥")
        print("  Linux/Mac: export DEEPSEEK_API_KEY=你的API密钥")
        print("=" * 50)

    app.run(debug=True, port=5000)
