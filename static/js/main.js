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
const colors = [
    'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'
];
let myChart = null;
// ★★★ 2. chartDataの型から labels を削除 ★★★
let chartData = { datasets: [] };
// グラフを描画する関数
function renderChart(type) {
    if (myChart) {
        myChart.destroy();
    }
    const ctx = document.getElementById('co2Chart').getContext('2d');
    if (!ctx)
        return;
    myChart = new Chart(ctx, {
        type: type,
        data: chartData, // data.labels を含まないオブジェクト
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: { title: { display: true, text: '単位：千t-CO2' } },
            scales: {
                // ★★★ 3. x軸のタイプを 'linear' に変更 ★★★
                x: {
                    type: 'linear', // ★ 変更
                    stacked: type === 'bar',
                    // Ticks(目盛り)のフォーマットを修正 (例: 2,020 とカンマが入るのを防ぐ)
                    ticks: {
                        callback: function (value) {
                            return value; // 年をそのまま表示
                        }
                    }
                },
                y: {
                    stacked: type === 'bar',
                    beginAtZero: true,
                    title: { display: true, text: '排出量' }
                }
            },
            elements: { line: { tension: 0.1 } }
        }
    });
}
// データを準備してグラフを初期化する非同期関数
function initializeChart() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('/api/data');
        const apiResponse = yield response.json();
        const citationText = apiResponse.citation;
        const data = apiResponse.data;
        data.sort((a, b) => a.year - b.year);
        const citationElement = document.getElementById('citation-source');
        if (citationElement) {
            citationElement.innerText = citationText;
        }
        const sectors = [...new Set(data.flatMap((item) => item.breakdown.map((b) => b.sector)))];
        const datasets = sectors.map((sector, index) => {
            return {
                label: sector,
                // ★★★ 4. data の形式を {x: 年, y: 排出量} に変更 ★★★
                data: data.map(yearData => {
                    const sectorData = yearData.breakdown.find(b => b.sector === sector);
                    return {
                        x: yearData.year, // x に年を設定
                        y: sectorData ? sectorData.emission : 0 // y に排出量を設定
                    };
                }),
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.8', '1'),
                fill: false
            };
        });
        // ★★★ 5. chartDataに labels を渡さないように変更 ★★★
        chartData = { datasets: datasets };
        renderChart('bar');
    });
}
// (...ボタンのイベントリスナーと initializeChart() 呼び出しは変更なし...)
const barBtn = document.getElementById('barBtn');
const lineBtn = document.getElementById('lineBtn');
barBtn === null || barBtn === void 0 ? void 0 : barBtn.addEventListener('click', () => renderChart('bar'));
lineBtn === null || lineBtn === void 0 ? void 0 : lineBtn.addEventListener('click', () => renderChart('line'));
initializeChart();
