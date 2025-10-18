import camelot
import pandas as pd
import json
import re
import os

# --- 設定項目 ---
file_path = 'data/2024/reports/02_2022_report_material.pdf'
page_number = '3'
output_dir = 'data'
output_path = os.path.join(output_dir, 'co2_emissions.json')

TARGET_SECTORS = [
    'エネルギー転換', '産業', '民生（家庭）',
    '民生（業務）', '運輸', '廃棄物'
]

def clean_text(text):
    if isinstance(text, str):
        text = text.replace('\n', '')
        text = re.sub(r'\s+', '', text)
        text = text.translate(str.maketrans('０１２３４５６７８９，', '0123456789,'))
    return text

# --- メイン処理 ---
try:
    os.makedirs(output_dir, exist_ok=True)
    tables = camelot.read_pdf(file_path, pages=page_number, flavor='lattice')

    if not tables:
        raise Exception(f"{page_number}ページにテーブルが見つかりませんでした。")

    df = tables[0].df.copy()
    df = df.map(clean_text)

    header_row_index = -1
    for i, row in df.iterrows():
        if sum('年度' in str(cell) for cell in row) > 3:
            header_row_index = i
            break
    
    if header_row_index == -1:
        raise Exception("年度が含まれるヘッダー行が見つかりませんでした。")

    sector_col_index = -1
    for col_idx in range(df.shape[1]):
        if df.iloc[:, col_idx].str.contains('エネルギー転換|産業|民生|運輸|廃棄物').any():
            sector_col_index = col_idx
            break
            
    if sector_col_index == -1:
        raise Exception("部門名が含まれる列が見つかりませんでした。")

    header_content = df.iloc[header_row_index].tolist()
    processed_headers = []
    counts = {}
    for i, header in enumerate(header_content):
        if i == sector_col_index:
            processed_headers.append('sector')
            continue
        if header is None or header.strip() == '':
            placeholder = '_blank'
            counts[placeholder] = counts.get(placeholder, 0) + 1
            processed_headers.append(f"{placeholder}_{counts[placeholder]}")
        else:
            processed_headers.append(header)

    # ★★★★★ ここが前回の指示で抜けていた部分です ★★★★★
    df.columns = processed_headers
    df_data = df.iloc[header_row_index + 1:].reset_index(drop=True)
    
    df_data['sector'] = df_data['sector'].str.replace('部門', '', regex=False)
    df_data = df_data[df_data['sector'].isin(TARGET_SECTORS)].copy()
    
    if df_data.empty:
        raise Exception("フィルタリング後、データが空になりました。")
    # ★★★★★ ここまで ★★★★★

    final_data = []
    year_columns = [col for col in df_data.columns if '年度' in str(col)]

    for year_col in year_columns:
        year = int(re.search(r'(\d{4})', str(year_col)).group(1))
        df_data[year_col] = pd.to_numeric(df_data[year_col], errors='coerce').fillna(0)

        breakdown_list = [
            {"sector": row['sector'], "emission": int(row[year_col])}
            for index, row in df_data.iterrows()
        ]
        total_emission = sum(item['emission'] for item in breakdown_list)

        final_data.append({
            "year": year, "total_emission": total_emission, "unit": "千t-CO2", "breakdown": breakdown_list
        })

    final_data.sort(key=lambda x: x['year'], reverse=True)
    
    # ★★★★★ ここからがJSONの構造を変更する部分 ★★★★★
    
    # 1. 引用元テキストを定義
    citation_text = (
        "引用元：以下の公開データ\n"
        "「札幌市気候変動対策行動計画」進行管理報告書 2022 年速報値・ 2020 年確定値）ー 資料編 ー 2024年10月"
    )
    
    # 2. 最終的なJSONオブジェクトを作成
    final_json_output = {
        "citation": citation_text,
        "data": final_data  # これまでの配列データを 'data' キーに入れる
    }

    # JSONファイルとして保存
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_json_output, f, ensure_ascii=False, indent=2)

    print(f"\nデータの変換に成功し、'{output_path}'に保存しました。")
    print("\n--- 生成されたJSON（全体像） ---")
    print(json.dumps(final_json_output, ensure_ascii=False, indent=2))


except Exception as e:
    print(f"\nエラーが発生しました: {e}")