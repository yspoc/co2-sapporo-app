from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# JSONデータのパス
JSON_FILE_PATH = os.path.join('data', 'co2_emissions.json')

@app.route('/')
def index():
    """
    トップページ (index.html) を表示する
    """
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    """
    グラフ用のJSONデータをAPIとして提供する
    """
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "Data file not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)