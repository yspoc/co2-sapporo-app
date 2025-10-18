// Chart.jsの型定義。anyでも動きますが、より厳密にする場合は@types/chart.jsをインストールします。
declare const Chart: any;

// --- 型定義 (TypeScriptのメリット) ---
// データの構造を「型」として定義することで、コードの安全性が向上します。
interface BreakdownEntry {
  sector: string;
  emission: number;
}

interface YearData {
  year: number;
  total_emission: number;
  unit: string;
  breakdown: BreakdownEntry[];
}

// Chart.jsに渡すデータセットの型
interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  fill: boolean;
}


// --- メインのロジック ---
const colors: string[] = [
  'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
  'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'
];

// 型注釈: myChartはChartインスタンスか、まだ存在しない(null)かを示す
let myChart: any | null = null; 
let chartData: { labels: number[]; datasets: ChartDataset[] } = { labels: [], datasets: [] };

// グラフを描画する関数
// 型注釈: type引数は 'bar' または 'line' のどちらかでなければならない
function renderChart(type: 'bar' | 'line'): void {
  if (myChart) {
    myChart.destroy();
  }
  
  const ctx = (document.getElementById('co2Chart') as HTMLCanvasElement).getContext('2d');
  if (!ctx) return; // コンテキストが取得できなければ処理を中断

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
async function initializeChart(): Promise<void> {
  const response = await fetch('/api/data');
  // 型注釈: fetchで取得したデータがYearDataの配列であることを明示
  const data: YearData[] = await response.json();
  data.sort((a, b) => a.year - b.year);

  const labels = data.map(item => item.year);
  const sectors = [...new Set(data.flatMap((item: YearData) => item.breakdown.map((b: BreakdownEntry) => b.sector)))];
 
  const datasets: ChartDataset[] = sectors.map((sector, index) => {
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
}

// ボタン要素を取得し、イベントリスナーを設定
const barBtn = document.getElementById('barBtn');
const lineBtn = document.getElementById('lineBtn');

barBtn?.addEventListener('click', () => renderChart('bar'));
lineBtn?.addEventListener('click', () => renderChart('line'));

// 実行開始
initializeChart();