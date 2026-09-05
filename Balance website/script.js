/* ---------- Theme toggle ---------- */
const toggleBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  html.setAttribute('data-theme', 'dark');
}

toggleBtn.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
});

/* ---------- Seed data (realistic sample week, resets on page reload) ---------- */
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

const weekData = [
  [{ category: 'Social Media', minutes: 95 }, { category: 'Messaging', minutes: 40 }, { category: 'Entertainment', minutes: 30 }],
  [{ category: 'Social Media', minutes: 110 }, { category: 'Messaging', minutes: 35 }, { category: 'Productivity', minutes: 45 }],
  [{ category: 'Social Media', minutes: 80 }, { category: 'Entertainment', minutes: 60 }, { category: 'Messaging', minutes: 30 }],
  [{ category: 'Social Media', minutes: 130 }, { category: 'Entertainment', minutes: 50 }, { category: 'Messaging', minutes: 25 }],
  [{ category: 'Social Media', minutes: 100 }, { category: 'Productivity', minutes: 40 }, { category: 'Messaging', minutes: 35 }],
  [{ category: 'Entertainment', minutes: 150 }, { category: 'Social Media', minutes: 90 }, { category: 'Messaging', minutes: 20 }],
  [] // Today — starts empty, filled in as the user logs entries
];

const categoryColors = {
  'Social Media': 'var(--accent-orange)',
  'Entertainment': '#8B6FE8',
  'Messaging': 'var(--accent-teal)',
  'Productivity': '#3B82C4',
  'Other': '#9A9A9A'
};

/* ---------- Rendering ---------- */
function dayTotal(entries) {
  return entries.reduce((sum, e) => sum + e.minutes, 0);
}

function renderChart() {
  const chart = document.getElementById('bar-chart');
  const totals = weekData.map(dayTotal);
  const max = Math.max(...totals, 60);

  chart.innerHTML = '';
  totals.forEach((total, i) => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    const bar = document.createElement('div');
    bar.className = 'bar';
    const heightPct = Math.max((total / max) * 100, 4);
    bar.style.height = heightPct + '%';
    if (days[i] === 'Today') bar.style.opacity = '0.9';
    const label = document.createElement('span');
    label.textContent = days[i];
    col.appendChild(bar);
    col.appendChild(label);
    chart.appendChild(col);
  });

  const activeDays = totals.filter(t => t > 0).length;
  const avg = Math.round(totals.reduce((a, b) => a + b, 0) / Math.max(activeDays, 1));
  document.getElementById('chart-caption').textContent =
    `Average so far this week: ${Math.floor(avg / 60)}h ${avg % 60}m a day.`;
}

function renderBreakdown() {
  const list = document.getElementById('breakdown-list');
  const totalsByCategory = {};
  let grandTotal = 0;

  weekData.flat().forEach(({ category, minutes }) => {
    totalsByCategory[category] = (totalsByCategory[category] || 0) + minutes;
    grandTotal += minutes;
  });

  list.innerHTML = '';
  Object.entries(totalsByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, minutes]) => {
      const pct = grandTotal ? Math.round((minutes / grandTotal) * 100) : 0;
      const row = document.createElement('div');
      row.className = 'breakdown-row';
      row.innerHTML = `
        <div class="breakdown-row-top">
          <span>${category}</span>
          <span>${pct}%</span>
        </div>
        <div class="breakdown-track">
          <div class="breakdown-fill" style="width:${pct}%; background:${categoryColors[category] || 'var(--accent-orange)'}"></div>
        </div>
      `;
      list.appendChild(row);
    });
}

/* ---------- Nudge logic ---------- */
function updateNudge() {
  const priorDays = weekData.slice(0, 6).map(dayTotal);
  const priorAvg = priorDays.reduce((a, b) => a + b, 0) / priorDays.length;
  const todayTotal = dayTotal(weekData[6]);
  const nudgeEl = document.getElementById('nudge-text');

  if (todayTotal === 0) {
    nudgeEl.textContent = 'Log an entry to see how today compares with your week.';
    return;
  }

  const diff = todayTotal - priorAvg;
  if (diff > 30) {
    nudgeEl.textContent = `Today's at ${Math.round(todayTotal)} minutes so far — about ${Math.round(diff)} above your week's average. No judgment, just worth noticing. Maybe step away for a bit before the next scroll.`;
  } else if (diff < -30) {
    nudgeEl.textContent = `Today's lighter than usual — ${Math.round(todayTotal)} minutes logged, well under your average. Nice.`;
  } else {
    nudgeEl.textContent = `Today's tracking close to your usual average (${Math.round(todayTotal)} minutes so far). Steady.`;
  }
}

/* ---------- Check-in form ---------- */
document.getElementById('checkin-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const minutes = parseInt(document.getElementById('minutes').value, 10);
  const mood = document.getElementById('mood').value;

  if (!minutes || minutes <= 0) return;

  weekData[6].push({ category, minutes, mood });

  renderChart();
  renderBreakdown();
  updateNudge();

  const feedback = document.getElementById('checkin-feedback');
  feedback.textContent = `Logged ${minutes} minutes of ${category}.`;
  e.target.reset();
  setTimeout(() => { feedback.textContent = ''; }, 3000);
});

/* ---------- Tip of the day (public API, with local fallback) ---------- */
const fallbackTips = [
  "Notice which app you reach for first without thinking — that's usually the one worth watching.",
  "A 10-minute walk does more for your mood than another 10 minutes of scrolling.",
  "Try leaving your phone in another room during meals for one week.",
  "The goal isn't zero screen time — it's time you'd choose again if you looked back on it."
];

async function loadTip() {
  const tipEl = document.getElementById('tip-text');
  try {
    const res = await fetch('https://api.adviceslip.com/advice');
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    tipEl.textContent = data.slip.advice;
  } catch (err) {
    tipEl.textContent = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
  }
}

/* ---------- Init ---------- */
renderChart();
renderBreakdown();
updateNudge();
loadTip();
