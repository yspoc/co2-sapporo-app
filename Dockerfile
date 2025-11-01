# 1. ベースとなるPython環境を準備
FROM python:3.11-slim

# 2. コンテナ内の作業ディレクトリを設定
WORKDIR /app

# 3. 必要なライブラリを先にインストール
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 4. アプリの全ファイル（app.py, static/, templates/ など）をコピー
COPY . .

# 5. アプリを起動するコマンド
#  (シェル形式):
CMD gunicorn --bind 0.0.0.0:$PORT app:app
