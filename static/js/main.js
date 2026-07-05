document.addEventListener('DOMContentLoaded', () => {
  const ideaInput = document.getElementById('ideaInput');
  const analyzeButton = document.getElementById('analyzeButton');
  const clearButton = document.getElementById('clearButton');
  const sampleButton = document.getElementById('sampleButton');
  const loadingScreen = document.getElementById('loadingScreen');
  const dashboardSection = document.getElementById('dashboardSection');
  const agentLoadList = document.getElementById('agentLoadList');
  const overallProgress = document.getElementById('overallProgress');
  const reportContent = document.getElementById('reportContent');
  const agentCards = document.getElementById('agentCards');
  const extraOutputs = document.getElementById('extraOutputs');
  const copyReportButton = document.getElementById('copyReport');
  const downloadMarkdownButton = document.getElementById('downloadMarkdown');
  const downloadPdfButton = document.getElementById('downloadPdf');
  const printReportButton = document.getElementById('printReport');
  const progressCards = document.getElementById('progressCards');
  const scoreStars = document.getElementById('scoreStars');
  const overallHealthScore = document.getElementById('overallScore');
  const healthStatusText = document.getElementById('healthStatusText');
  const swotCards = document.getElementById('swotCards');
  const competitorTableBody = document.querySelector('#competitorTable tbody');
  const investmentPanel = document.getElementById('investmentPanel');
  const riskCanvas = document.getElementById('riskChart');
  const marketCanvas = document.getElementById('marketChart');
  const revenueCanvas = document.getElementById('revenueChart');
  let chartInstances = {};

  const sampleIdeas = [
    'An AI copilot that helps small restaurants reduce food waste and improve margins.',
    'A personal finance assistant that helps students automate budgeting and debt planning.',
    'A vertical AI platform that creates compliant onboarding experiences for healthcare startups.'
  ];

  function showLoading() {
    loadingScreen.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    agentLoadList.innerHTML = '';
    overallProgress.style.width = '0%';
    const agents = ['Innovation Agent', 'Market Agent', 'Business Agent', 'Technology Agent', 'Risk Agent', 'Investment Agent', 'Competitor Agent', 'Coordinator Agent'];
    agents.forEach((name, index) => {
      const item = document.createElement('div');
      item.className = 'agent-item';
      item.innerHTML = `<strong>${name}</strong><span class="status">Thinking...</span>`;
      agentLoadList.appendChild(item);
      setTimeout(() => {
        item.classList.add('done');
        item.querySelector('.status').textContent = 'Completed';
        overallProgress.style.width = `${((index + 1) / agents.length) * 100}%`;
      }, 700 + index * 700);
    });
  }

  function animateValue(element, start, end, duration = 1400) {
    const startTime = performance.now();
    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.round(start + (end - start) * progress);
      element.textContent = current;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function extractOverallScore(data) {
    return clamp(toNumber(data.startup_score, toNumber(data.metrics?.overall, 0)), 0, 100);
  }

  function extractInnovation(data) {
    return clamp(toNumber(data.metrics?.innovation, toNumber(data.startup_score, 0)), 0, 100);
  }

  function extractSWOT(data) {
    const swot = data.swot || {};
    const strengths = swot.strengths || ['Strong differentiation', 'Clear product vision'];
    const weaknesses = swot.weaknesses || ['Needs validation', 'Requires funding'];
    const opportunities = swot.opportunities || ['Expanding market', 'AI adoption growth'];
    const threats = swot.threats || ['Competition', 'Regulatory risk'];
    return { strengths, weaknesses, opportunities, threats };
  }

  function extractCompetitors(data) {
    const competitorAgent = (data.agents || []).find((item) => item.agent === 'competitor');
    const details = competitorAgent?.details || {};
    const rawCompetitors = details.top_competitors || ['Emerging incumbents', 'Specialized competitors', 'Open-source alternatives'];
    const list = Array.isArray(rawCompetitors) ? rawCompetitors : [rawCompetitors];
    return list.map((name, index) => ({
      name: typeof name === 'string' ? name : `Competitor ${index + 1}`,
      description: details.comparison_table || 'A fast-moving competitor in the same category.',
      strengths: details.competitive_advantages || ['Category depth', 'Brand familiarity'],
      weaknesses: details.weaknesses || ['Resource constraints', 'Limited differentiation'],
      score: clamp(55 + index * 8 + (data.metrics?.investment || 0) % 10, 55, 95)
    }));
  }

  function extractInvestment(data) {
    const investmentAgent = (data.agents || []).find((item) => item.agent === 'investment');
    const details = investmentAgent?.details || {};
    return {
      recommendation: details.funding_recommendation || (data.investment_recommendation || 'Recommended for Seed Funding'),
      stage: details.startup_valuation || 'Seed Stage',
      valuation: details.startup_valuation || '$2M–$6M',
      confidence: clamp(toNumber(data.metrics?.investment, 80), 50, 99),
      roi: details.roi || 'High upside with disciplined execution',
      comments: details.investor_feedback || 'The concept has credible momentum and clear upside.'
    };
  }

  function extractRisks(data) {
    const riskAgent = (data.agents || []).find((item) => item.agent === 'risk');
    const details = riskAgent?.details || {};
    const riskValue = clamp(toNumber(data.metrics?.risk, 35), 10, 90);
    return [
      { label: 'Technical Risk', value: clamp(riskValue + 4, 12, 90), description: details.technical_risks || 'Execution complexity requires careful sequencing.' },
      { label: 'Financial Risk', value: clamp(riskValue + 2, 12, 90), description: details.financial_risks || 'Funding and unit economics need discipline.' },
      { label: 'Market Risk', value: clamp(riskValue + 8, 12, 90), description: details.operational_risks || 'Adoption depends on strong market feedback loops.' },
      { label: 'Legal Risk', value: clamp(riskValue - 3, 12, 85), description: details.legal_risks || 'Compliance needs early planning.' },
      { label: 'Operational Risk', value: clamp(riskValue + 6, 12, 90), description: details.ethical_risks || 'Execution velocity must stay consistent.' }
    ];
  }

  function extractBusinessModel(data) {
    const businessAgent = (data.agents || []).find((item) => item.agent === 'business');
    const details = businessAgent?.details || {};
    return details.business_model || data.business_model || 'Subscription + B2B';
  }

  function extractMarket(data) {
    const marketAgent = (data.agents || []).find((item) => item.agent === 'market');
    const details = marketAgent?.details || {};
    return details.market_opportunity || data.market_analysis || 'High';
  }

  function getStatusLabel(score) {
    if (score >= 85) return 'Investment Ready';
    if (score >= 70) return 'Strong Potential';
    if (score >= 55) return 'Promising';
    return 'Needs Validation';
  }

  function getStars(score) {
    const filled = Math.round(score / 20);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  function destroyCharts() {
    Object.values(chartInstances).forEach((chart) => chart?.destroy());
    chartInstances = {};
  }

  function renderCharts(metrics, risks, investment) {
    destroyCharts();

    if (riskCanvas) {
      chartInstances.risk = new Chart(riskCanvas, {
        type: 'doughnut',
        data: {
          labels: risks.map((risk) => risk.label),
          datasets: [{
            data: risks.map((risk) => risk.value),
            backgroundColor: ['#06b6d4', '#7c3aed', '#f59e0b', '#22c55e', '#ef4444']
          }]
        },
        options: {
          plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } },
          maintainAspectRatio: false,
          cutout: '55%'
        }
      });
    }

    if (marketCanvas) {
      chartInstances.market = new Chart(marketCanvas, {
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Market Growth',
            data: [40, 55, 68, 78],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.18)',
            tension: 0.4,
            fill: true,
            pointRadius: 3
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { stepSize: 20, color: '#94a3b8' }, beginAtZero: true, max: 100 } },
          maintainAspectRatio: false
        }
      });
    }

    if (revenueCanvas) {
      chartInstances.revenue = new Chart(revenueCanvas, {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Revenue Potential',
            data: [32, 48, 60, 72],
            backgroundColor: 'rgba(124, 58, 237, 0.8)',
            borderRadius: 10
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { stepSize: 20, color: '#94a3b8' }, beginAtZero: true, max: 100 } },
          maintainAspectRatio: false
        }
      });
    }
  }

  function updateScoreCards(metrics) {
    const overall = clamp(toNumber(metrics.overall, 0), 0, 100);
    const innovation = clamp(toNumber(metrics.innovation, 0), 0, 100);
    const market = clamp(toNumber(metrics.market, 0), 0, 100);
    const business = clamp(toNumber(metrics.business, 0), 0, 100);
    const technology = clamp(toNumber(metrics.technology, 0), 0, 100);
    const investment = clamp(toNumber(metrics.investment, 0), 0, 100);
    const risk = clamp(toNumber(metrics.risk, 0), 0, 100);

    document.getElementById('overallLabel').textContent = getStatusLabel(overall);

    animateValue(overallHealthScore, 0, overall);
    scoreStars.textContent = getStars(overall);
    healthStatusText.textContent = overall >= 80 ? 'A premium venture profile with strong investor viability.' : 'A strong concept that needs sharper validation and execution focus.';
  }

  function renderHealthDashboard(metrics, agents, data) {
    const overall = clamp(toNumber(metrics.overall, 0), 0, 100);
    updateScoreCards(metrics);

    const cards = [
      { icon: '💡', name: 'Innovation', color: 'var(--secondary)', value: clamp(toNumber(metrics.innovation, 0), 0, 100), status: toNumber(metrics.innovation, 0) >= 85 ? 'Excellent' : toNumber(metrics.innovation, 0) >= 70 ? 'Good' : toNumber(metrics.innovation, 0) >= 55 ? 'Average' : 'Needs Improvement' },
      { icon: '📈', name: 'Market', color: 'var(--success)', value: clamp(toNumber(metrics.market, 0), 0, 100), status: toNumber(metrics.market, 0) >= 85 ? 'Excellent' : toNumber(metrics.market, 0) >= 70 ? 'Good' : toNumber(metrics.market, 0) >= 55 ? 'Average' : 'Needs Improvement' },
      { icon: '💼', name: 'Business', color: '#8b5cf6', value: clamp(toNumber(metrics.business, 0), 0, 100), status: toNumber(metrics.business, 0) >= 85 ? 'Excellent' : toNumber(metrics.business, 0) >= 70 ? 'Good' : toNumber(metrics.business, 0) >= 55 ? 'Average' : 'Needs Improvement' },
      { icon: '⚙', name: 'Technology', color: '#22d3ee', value: clamp(toNumber(metrics.technology, 0), 0, 100), status: toNumber(metrics.technology, 0) >= 85 ? 'Excellent' : toNumber(metrics.technology, 0) >= 70 ? 'Good' : toNumber(metrics.technology, 0) >= 55 ? 'Average' : 'Needs Improvement' },
      { icon: '💰', name: 'Investment', color: '#fbbf24', value: clamp(toNumber(metrics.investment, 0), 0, 100), status: toNumber(metrics.investment, 0) >= 85 ? 'Excellent' : toNumber(metrics.investment, 0) >= 70 ? 'Good' : toNumber(metrics.investment, 0) >= 55 ? 'Average' : 'Needs Improvement' },
      { icon: '🛡', name: 'Risk', color: '#ef4444', value: clamp(100 - toNumber(metrics.risk, 0), 0, 100), status: toNumber(metrics.risk, 0) <= 25 ? '🟢 Low Risk' : toNumber(metrics.risk, 0) <= 45 ? '🟡 Medium Risk' : '🔴 High Risk' }
    ];

    progressCards.innerHTML = cards.map((card) => `
      <article class="performance-card">
        <div class="card-head">
          <div class="card-icon" style="background:${card.color}20; color:${card.color};">${card.icon}</div>
          <div>
            <h5>${card.name}</h5>
            <p>${card.status}</p>
          </div>
        </div>
        <div class="performance-score">
          <strong>${card.name === 'Risk' ? (card.status === '🟢 Low Risk' ? 'Low' : card.status === '🟡 Medium Risk' ? 'Med' : 'High') : `${card.value}%`}</strong>
          <span class="performance-pill" style="background:${card.color}20; color:${card.color};">${card.name === 'Risk' ? card.status : card.status}</span>
        </div>
        <div class="performance-track">
          <div class="performance-bar" style="width:${card.value}% ; background:${card.color};"></div>
        </div>
      </article>
    `).join('');

    agentCards.innerHTML = (agents || []).map((agent) => {
      const confidence = clamp(Math.round(agent.score + 3), 70, 99);
      return `
        <article class="agent-card">
          <div class="agent-top">
            <div class="agent-avatar">${agent.avatar}</div>
            <div>
              <h5>${agent.name}</h5>
              <p>${agent.status}</p>
            </div>
          </div>
          <div class="agent-bottom">
            <span class="agent-score-pill">Score ${(agent.score / 10).toFixed(1)}/10</span>
            <span class="agent-summary">${agent.summary}</span>
          </div>
          <div class="agent-bottom">
            <span class="agent-score-pill">Confidence ${confidence}%</span>
            <span class="agent-summary">${agent.agent === 'risk' ? 'Risk-focused' : 'Completed'}</span>
          </div>
        </article>
      `;
    }).join('');

    const swot = extractSWOT(data);
    swotCards.innerHTML = [
      { title: 'Strengths', icon: '🟢', items: swot.strengths, accent: 'var(--success)' },
      { title: 'Weaknesses', icon: '🟡', items: swot.weaknesses, accent: 'var(--warning)' },
      { title: 'Opportunities', icon: '🔵', items: swot.opportunities, accent: 'var(--secondary)' },
      { title: 'Threats', icon: '🔴', items: swot.threats, accent: '#ef4444' }
    ].map((section) => `
      <article class="swot-mini-card" style="border-color: ${section.accent};">
        <h4>${section.icon} ${section.title}</h4>
        <ul>${section.items.slice(0, 4).map((item) => `<li>${item}</li>`).join('')}</ul>
      </article>
    `).join('');

    const competitors = extractCompetitors(data);
    competitorTableBody.innerHTML = competitors.slice(0, 5).map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.strengths.slice(0, 2).join(', ')}</td>
        <td>${item.weaknesses.slice(0, 2).join(', ')}</td>
        <td>${item.description}</td>
        <td>
          <div class="competitor-score-bar"><div class="competitor-score-fill" style="width:${item.score}%"></div></div>
          <span>${item.score}/100</span>
        </td>
      </tr>
    `).join('');

    const risks = extractRisks(data);
    if (riskCanvas) {
      chartInstances.risk = new Chart(riskCanvas, {
        type: 'doughnut',
        data: {
          labels: risks.map((risk) => risk.label),
          datasets: [{
            data: risks.map((risk) => risk.value),
            backgroundColor: ['#06b6d4', '#7c3aed', '#f59e0b', '#22c55e', '#ef4444']
          }]
        },
        options: {
          plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } },
          maintainAspectRatio: false,
          cutout: '55%'
        }
      });
    }

    const investment = extractInvestment(data);
    investmentPanel.innerHTML = `
      <article class="investment-card">
        <h4>💼 Investor Outlook</h4>
        <div class="metric-row"><span>Recommendation</span><strong>${investment.recommendation}</strong></div>
        <div class="metric-row"><span>Funding Stage</span><strong>${investment.stage}</strong></div>
        <div class="metric-row"><span>Estimated Valuation</span><strong>${investment.valuation}</strong></div>
        <div class="metric-row"><span>Confidence Score</span><strong>${investment.confidence}%</strong></div>
        <div class="metric-row"><span>ROI Potential</span><strong>${investment.roi}</strong></div>
        <div class="metric-row"><span>Investor Comments</span><strong>${investment.comments}</strong></div>
      </article>
    `;

    renderCharts(metrics, risks, investment);
  }

  function renderReport(data) {
    const executive = data.executive_summary || 'The startup presents a credible path to market with strong differentiation.';
    const market = data.market_analysis || 'The market opportunity appears large and attractive.';
    const business = data.business_model || 'A premium subscription model with enterprise add-ons.';
    const swot = extractSWOT(data);
    const risks = extractRisks(data);
    const investment = extractInvestment(data);
    const cards = [
      ['Executive Summary', executive],
      ['Market Analysis', market],
      ['Business Model', business],
      ['SWOT', Object.entries(swot).map(([key, values]) => `<strong>${key}:</strong> ${values.join(' • ')}`).join('<br/>')],
      ['Competitor', (extractCompetitors(data).slice(0, 3).map((item) => `${item.name}: ${item.description}`).join('<br/>'))],
      ['Risk', risks.map((risk) => `<strong>${risk.label}:</strong> ${risk.description}`).join('<br/>')],
      ['Recommendation', investment.recommendation],
      ['Roadmap', (data.roadmap || []).join('<br/>')],
      ['Final Verdict', data.final_verdict || 'Proceed with focused validation and pilot testing.']
    ];
    reportContent.innerHTML = [
      `<div class="report-hero"><h3>🧠 Executive Intelligence</h3><p>${executive}</p></div>`,
      ...cards.map(([title, content]) => `<div class="report-card"><h4>${title}</h4><div>${content}</div></div>`)
    ].join('');
  }

  function renderExtras(data) {
    const extras = [
      ['Startup Name', data.startup_name],
      ['Tagline', data.tagline],
      ['Elevator Pitch', data.elevator_pitch],
      ['Mission Statement', data.mission_statement],
      ['Vision Statement', data.vision_statement],
      ['Business Model Canvas', data.extra?.business_model_canvas || ''],
      ['Lean Canvas', data.extra?.lean_canvas || ''],
      ['Target Customer Persona', data.extra?.target_customer_persona || ''],
      ['Investor Pitch', data.extra?.investor_pitch || ''],
      ['Launch Roadmap', (data.roadmap || []).join(' • ')]
    ];
    extraOutputs.innerHTML = extras.map(([title, content]) => `<article class="extra-item"><h4>${title}</h4><p>${content}</p></article>`).join('');
  }

  async function handleAnalyze() {
    const idea = ideaInput.value.trim();
    if (!idea) return;
    showLoading();
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      renderHealthDashboard(data.metrics, data.agents, data);
      renderReport(data);
      renderExtras(data);
      loadingScreen.classList.add('hidden');
      dashboardSection.classList.remove('hidden');
    } catch (error) {
      loadingScreen.classList.add('hidden');
      dashboardSection.classList.remove('hidden');
      reportContent.innerHTML = `<div class="report-card"><h4>Analysis Error</h4><p>${error.message}</p></div>`;
    }
  }

  analyzeButton.addEventListener('click', handleAnalyze);
  clearButton.addEventListener('click', () => { ideaInput.value = ''; ideaInput.focus(); });
  sampleButton.addEventListener('click', () => {
    ideaInput.value = sampleIdeas[Math.floor(Math.random() * sampleIdeas.length)];
  });

  copyReportButton.addEventListener('click', async () => {
    const text = reportContent.innerText;
    await navigator.clipboard.writeText(text);
    copyReportButton.textContent = 'Copied';
    setTimeout(() => { copyReportButton.textContent = 'Copy Report'; }, 1200);
  });

  downloadMarkdownButton.addEventListener('click', () => {
    const blob = new Blob([reportContent.innerText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'startup-report.md';
    link.click();
    URL.revokeObjectURL(url);
  });

  downloadPdfButton.addEventListener('click', () => {
    window.print();
  });

  printReportButton.addEventListener('click', () => {
    window.print();
  });
});
