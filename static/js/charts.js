window.chartRegistry = window.chartRegistry || {};

function createRadarChart(ctx, values) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Innovation', 'Market', 'Business', 'Technology', 'Investment', 'Risk'],
      datasets: [{
        label: 'Startup Profile',
        data: values,
        backgroundColor: 'rgba(6, 182, 212, 0.24)',
        borderColor: '#06b6d4',
        pointBackgroundColor: '#7c3aed',
        borderWidth: 2,
      }],
    },
    options: { scales: { r: { suggestedMin: 0, suggestedMax: 100 } }, plugins: { legend: { labels: { color: '#f8fafc' } } } },
  });
}

function createSwotChart(ctx) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
      datasets: [{ label: 'Strategic Signals', data: [8, 6, 7, 5], backgroundColor: ['#22c55e', '#f59e0b', '#06b6d4', '#ef4444'] }],
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

function createCompetitorChart(ctx) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['Your Position', 'Incumbents', 'Niche Tools'], datasets: [{ data: [62, 24, 14], backgroundColor: ['#7c3aed', '#06b6d4', '#f59e0b'] }] },
    options: { plugins: { legend: { position: 'bottom' } } },
  });
}

function createRiskChart(ctx) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'polarArea',
    data: { labels: ['Technical', 'Financial', 'Operational', 'Legal', 'Ethical'], datasets: [{ data: [22, 18, 16, 12, 10], backgroundColor: ['#06b6d4', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444'] }] },
    options: { plugins: { legend: { position: 'bottom' } } },
  });
}

function createInvestmentChart(ctx) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Investor Confidence', 'Remaining'],
      datasets: [{ data: [75, 25], backgroundColor: ['#22c55e', 'rgba(255,255,255,0.1)'] }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}

window.createCharts = function (metrics) {
  const radarCtx = document.getElementById('radarChart');
  const swotCtx = document.getElementById('swotChart');
  const competitorCtx = document.getElementById('competitorChart');
  const riskCtx = document.getElementById('riskChart');
  const investmentCtx = document.getElementById('investmentChart');

  if (window.chartRegistry.radar) window.chartRegistry.radar.destroy();
  if (window.chartRegistry.swot) window.chartRegistry.swot.destroy();
  if (window.chartRegistry.competitor) window.chartRegistry.competitor.destroy();
  if (window.chartRegistry.risk) window.chartRegistry.risk.destroy();
  if (window.chartRegistry.investment) window.chartRegistry.investment.destroy();

  window.chartRegistry.radar = createRadarChart(radarCtx, [metrics.innovation, metrics.market, metrics.business, metrics.technology, metrics.investment, 100 - metrics.risk]);
  window.chartRegistry.swot = createSwotChart(swotCtx);
  window.chartRegistry.competitor = createCompetitorChart(competitorCtx);
  window.chartRegistry.risk = createRiskChart(riskCtx);
  window.chartRegistry.investment = createInvestmentChart(investmentCtx);
};
