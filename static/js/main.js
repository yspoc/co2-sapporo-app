"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// --- メインのロジック ---
const colors = [
    'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'
];
// 型注釈: myChartはChartインスタンスか、まだ存在しない(null)かを示す
let myChart = null;
let chartData = { labels: [], datasets: [] };
// グラフを描画する関数
// 型注釈: type引数は 'bar' または 'line' のどちらかでなければならない
function renderChart(type) {
    if (myChart) {
        myChart.destroy();
    }
    const ctx = document.getElementById('co2Chart').getContext('2d');
    if (!ctx)
        return; // コンテキストが取得できなければ処理を中断
    myChart = new Chart(ctx, {
        type: type,
        data: chartData,
        options: {
            responsive: true,
            plugins: { title: { display: true, text: '単位：千t-CO2' } },
            scales: {
                x: { stacked: type === 'bar' },
                y: { stacked: type === 'bar', beginAtZero: true, title: { display: true, text: '排出量' } }
            },
            elements: { line: { tension: 0.1 } }
        }
    });
}
// データを準備してグラフを初期化する非同期関数
function initializeChart() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('/api/data');
        // 型注釈: fetchで取得したデータがYearDataの配列であることを明示
        const data = yield response.json();
        data.sort((a, b) => a.year - b.year);
        const labels = data.map(item => item.year);
        const sectors = [...new Set(data.flatMap((item) => item.breakdown.map((b) => b.sector)))];
        const datasets = sectors.map((sector, index) => {
            return {
                label: sector,
                data: data.map(yearData => {
                    const sectorData = yearData.breakdown.find(b => b.sector === sector);
                    return sectorData ? sectorData.emission : 0;
                }),
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.8', '1'),
                fill: false
            };
        });
        chartData = { labels, datasets };
        renderChart('bar');
    });
}
// ボタン要素を取得し、イベントリスナーを設定
const barBtn = document.getElementById('barBtn');
const lineBtn = document.getElementById('lineBtn');
barBtn === null || barBtn === void 0 ? void 0 : barBtn.addEventListener('click', () => renderChart('bar'));
lineBtn === null || lineBtn === void 0 ? void 0 : lineBtn.addEventListener('click', () => renderChart('line'));
// 実行開始
initializeChart();
