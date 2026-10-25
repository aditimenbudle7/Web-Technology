/* CricPulse dashboard - vanilla JS single page app.
 * Data comes from the Spring Boot REST API; live updates arrive through
 * Server-Sent Events (/api/stream), so the page never needs a manual refresh. */
'use strict';

const view = document.getElementById('view');
const state = {
  matches: new Map(),
  overview: null,
  filter: 'ALL',
  detail: null,
  detailId: null,
  tab: 'commentary',
  playersSort: 'runs',
  players: [],
  lastTopCommentary: null,
};

// ------------------------------------------------------------------ helpers
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null ? '-' : Number(n).toFixed(2));

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Request failed (${res.status})`);
  return body;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function throttle(fn, ms) {
  let timer = null;
  return () => {
    if (timer) return;
    timer = setTimeout(() => { timer = null; fn(); }, ms);
  };
}

function ballChip(symbol) {
  let cls = 'b';
  let label = symbol;
  if (symbol === '4') cls += ' b-4';
  else if (symbol === '6') cls += ' b-6';
  else if (symbol === 'W') cls += ' b-W';
  else if (/Wd|Nb/.test(symbol)) cls += ' b-x';
  else if (symbol === '0') { cls += ' b-0'; label = '•'; }
  return `<span class="${cls}">${esc(label)}</span>`;
}

function statusPill(m) {
  if (m.status === 'LIVE') return m.paused ? '<span class="pill pill-paused">Paused</span>' : '<span class="pill pill-live">Live</span>';
  if (m.status === 'UPCOMING') return '<span class="pill pill-upcoming">Upcoming</span>';
  return '<span class="pill pill-completed">Result</span>';
}

function teamScore(m, short) {
  const inns = m.innings.filter((i) => i.team === short);
  if (!inns.length) return m.status === 'UPCOMING' ? '' : '<span class="tovers">Yet to bat</span>';
  return inns.map((i) => `${i.runs}/${i.wickets}<span class="tovers">(${esc(i.overs)})</span>`).join(' ');
}

function countdown(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Starting…';
  const s = Math.round(ms / 1000);
  return `Starts in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

setInterval(() => {
  document.querySelectorAll('[data-countdown]').forEach((el) => { el.textContent = countdown(el.dataset.countdown); });
}, 1000);

// ------------------------------------------------------------------ live connection (SSE)
function connectStream() {
  const conn = document.getElementById('conn');
  const text = conn.querySelector('.conn-text');
  const es = new EventSource('/api/stream');
  es.onopen = () => { conn.className = 'conn ok'; text.textContent = 'Live'; };
  es.onerror = () => { conn.className = 'conn down'; text.textContent = 'Reconnecting…'; };
  es.addEventListener('score', (e) => {
    const updates = JSON.parse(e.data);
    updates.forEach((m) => state.matches.set(m.id, m));
    onLiveUpdates(updates);
  });
}

const refreshOverview = throttle(async () => {
  try { state.overview = await api('/api/overview'); if (route().name === 'home') renderOverview(); } catch { /* ignore */ }
}, 3000);
const refreshDetail = throttle(() => { if (route().name === 'match') loadDetail(); }, 500);
const refreshPlayers = throttle(() => { if (route().name === 'players') loadPlayers(); }, 5000);

function onLiveUpdates(updates) {
  const r = route();
  if (r.name === 'home') {
    renderGrid(new Set(updates.map((m) => m.id)));
    renderFilters();
    refreshOverview();
  } else if (r.name === 'match' && updates.some((m) => m.id === state.detailId)) {
    refreshDetail();
  } else if (r.name === 'players') {
    refreshPlayers();
  }
}

// ------------------------------------------------------------------ routing
function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  const m = h.match(/^\/match\/([\w-]+)/);
  if (m) return { name: 'match', id: m[1] };
  if (h.startsWith('/players')) return { name: 'players' };
  if (h.startsWith('/api')) return { name: 'api' };
  return { name: 'home' };
}

function navigate() {
  const r = route();
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === (r.name === 'match' ? 'home' : r.name));
  });
  window.scrollTo(0, 0);
  if (r.name === 'match') showMatch(r.id);
  else if (r.name === 'players') showPlayers();
  else if (r.name === 'api') showApi();
  else showHome();
}
window.addEventListener('hashchange', navigate);

// ------------------------------------------------------------------ home / dashboard
async function showHome() {
  view.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Live Cricket Scores</h1>
        <p class="muted">Ball-by-ball updates pushed in real time from the Spring Boot server.</p>
      </div>
    </div>
    <section id="overview" class="overview"></section>
    <div id="filters" class="tabs" role="tablist"></div>
    <section id="grid" class="match-grid"><p class="empty">Loading matches…</p></section>`;
  try {
    const [list, overview] = await Promise.all([api('/api/matches'), api('/api/overview')]);
    state.matches = new Map(list.map((m) => [m.id, m]));
    state.overview = overview;
    renderOverview();
    renderFilters();
    renderGrid();
  } catch (e) {
    document.getElementById('grid').innerHTML = `<p class="error-box">Could not load matches: ${esc(e.message)}</p>`;
  }
}

function renderOverview() {
  const el = document.getElementById('overview');
  const o = state.overview;
  if (!el || !o) return;
  const stats = [
    ['Live matches', o.live], ['Upcoming', o.upcoming], ['Runs scored', o.totalRuns.toLocaleString()],
    ['Wickets', o.totalWickets], ['Sixes', o.sixes], ['Balls simulated', o.ballsSimulated.toLocaleString()],
  ];
  el.innerHTML = stats.map(([l, v]) => `<div class="card stat"><div class="stat-value">${esc(v)}</div><div class="stat-label">${esc(l)}</div></div>`).join('');
}

function renderFilters() {
  const el = document.getElementById('filters');
  if (!el) return;
  const all = [...state.matches.values()];
  const count = (s) => all.filter((m) => m.status === s).length;
  const tabs = [['ALL', 'All', all.length], ['LIVE', 'Live', count('LIVE')], ['UPCOMING', 'Upcoming', count('UPCOMING')], ['COMPLETED', 'Results', count('COMPLETED')]];
  el.innerHTML = tabs.map(([k, label, n]) =>
    `<button class="tab ${state.filter === k ? 'active' : ''}" role="tab" aria-selected="${state.filter === k}" data-filter="${k}">${label}<span class="count">${n}</span></button>`).join('');
  el.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.filter;
    renderFilters();
    renderGrid();
  }));
}

const ORDER = { LIVE: 0, UPCOMING: 1, COMPLETED: 2 };
function sortedMatches() {
  return [...state.matches.values()]
    .filter((m) => state.filter === 'ALL' || m.status === state.filter)
    .sort((a, b) => {
      if (ORDER[a.status] !== ORDER[b.status]) return ORDER[a.status] - ORDER[b.status];
      if (a.status === 'LIVE') return Number(a.id.slice(1)) - Number(b.id.slice(1));
      if (a.status === 'UPCOMING') return a.startsAt.localeCompare(b.startsAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

function renderGrid(flashIds = new Set()) {
  const el = document.getElementById('grid');
  if (!el) return;
  const list = sortedMatches();
  el.innerHTML = list.length ? list.map((m) => matchCard(m, flashIds.has(m.id))).join('') : '<p class="empty">No matches in this category right now.</p>';
}

function matchCard(m, flash) {
  const row = (t) => {
    const batting = m.battingTeam === t.shortName;
    const winner = m.winner === t.shortName;
    return `<div class="team-row ${batting ? 'batting' : ''} ${winner ? 'winner' : ''}">
      <span class="team-dot" style="background:${esc(t.color)}"></span>
      <span class="tname">${esc(t.name)}</span>
      <span class="tscore">${teamScore(m, t.shortName)}</span>
    </div>`;
  };
  let status;
  if (m.status === 'UPCOMING') status = `<div class="mc-status" data-countdown="${esc(m.startsAt)}">${countdown(m.startsAt)}</div>`;
  else status = `<div class="mc-status ${m.status === 'COMPLETED' ? 'result' : ''}">${esc(m.statusText)}</div>`;

  let foot;
  if (m.status === 'LIVE') {
    const rates = [`CRR ${fmt(m.currentRunRate)}`];
    if (m.requiredRunRate != null) rates.push(`RRR ${fmt(m.requiredRunRate)}`);
    foot = `<div class="balls">${m.recentBalls.slice(-6).map(ballChip).join('')}</div><span class="rates">${rates.join(' · ')}</span>`;
  } else if (m.status === 'UPCOMING') {
    foot = `<span class="muted small">${esc(m.venue)}</span>`;
  } else {
    foot = '<span class="muted small">Full scorecard →</span>';
  }

  return `<a class="card match-card ${flash ? 'flash' : ''}" href="#/match/${esc(m.id)}">
    <div class="mc-head"><span class="mc-series">${esc(m.series)} · ${esc(m.format)}</span>${statusPill(m)}</div>
    ${row(m.teamA)}${row(m.teamB)}
    ${status}
    <div class="mc-foot">${foot}</div>
  </a>`;
}

// ------------------------------------------------------------------ match centre
async function showMatch(id) {
  state.detailId = id;
  state.detail = null;
  state.lastTopCommentary = null;
  view.innerHTML = '<p class="empty">Loading match…</p>';
  await loadDetail();
}

async function loadDetail() {
  const id = state.detailId;
  try {
    const d = await api(`/api/matches/${encodeURIComponent(id)}?commentary=60`);
    if (route().name !== 'match' || state.detailId !== id) return;
    state.detail = d;
    state.matches.set(d.summary.id, d.summary);
    renderMatch();
  } catch (e) {
    view.innerHTML = `<a class="back" href="#/">← All matches</a><p class="error-box">${esc(e.message)}</p>`;
  }
}

function renderMatch() {
  const d = state.detail;
  const m = d.summary;
  const tabs = [['commentary', 'Commentary'], ['scorecard', 'Scorecard'], ['overs', 'Overs'], ['summary', 'Summary']];
  let tabBody = '';
  if (state.tab === 'commentary') tabBody = commentaryHtml(d.commentary);
  else if (state.tab === 'scorecard') tabBody = scorecardHtml(d.scorecard);
  else if (state.tab === 'overs') tabBody = oversHtml(d.scorecard, m);
  else tabBody = summaryHtml(d.report, m);

  view.innerHTML = `
    <a class="back" href="#/">← All matches</a>
    ${scoreboardHtml(m)}
    <div class="centre-grid">
      <section class="card pad">
        <div class="section-title">
          <div class="tabs" role="tablist">
            ${tabs.map(([k, l]) => `<button class="tab ${state.tab === k ? 'active' : ''}" role="tab" aria-selected="${state.tab === k}" data-tab="${k}">${l}</button>`).join('')}
          </div>
        </div>
        ${tabBody}
      </section>
      <aside class="side" style="display:flex;flex-direction:column;gap:16px">
        ${creaseHtml(d.crease, m)}
        ${scorerHtml(m)}
      </aside>
    </div>`;

  view.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; renderMatch(); }));
  view.querySelectorAll('[data-score]').forEach((b) => b.addEventListener('click', () => submitBall(JSON.parse(b.dataset.score))));
  const pause = view.querySelector('[data-pause]');
  if (pause) pause.addEventListener('click', togglePause);
  if (d.commentary.length) state.lastTopCommentary = d.commentary[0].time + d.commentary[0].text;
}

function scoreboardHtml(m) {
  const team = (t) => {
    const batting = m.battingTeam === t.shortName;
    const inns = m.innings.filter((i) => i.team === t.shortName);
    const score = inns.length
      ? inns.map((i) => `${i.runs}/${i.wickets} <small>(${esc(i.overs)} ov)</small>`).join(' ')
      : `<small>${m.status === 'UPCOMING' ? '' : 'Yet to bat'}</small>`;
    return `<div class="sb-team ${batting ? 'batting' : ''}">
      <div class="badge-team" style="background:${esc(t.color)}">${esc(t.shortName)}</div>
      <div><div class="name">${esc(t.name)}${m.winner === t.shortName ? ' 🏆' : ''}</div><div class="score">${score}</div></div>
    </div>`;
  };
  const chips = [];
  if (m.currentRunRate != null) chips.push(`<span class="chip">CRR <b>${fmt(m.currentRunRate)}</b></span>`);
  if (m.target != null) chips.push(`<span class="chip">Target <b>${m.target}</b></span>`);
  if (m.requiredRunRate != null) chips.push(`<span class="chip">RRR <b>${fmt(m.requiredRunRate)}</b></span>`);
  chips.push(`<span class="chip">${esc(m.format)} · ${m.oversPerSide} overs</span>`);
  const status = m.status === 'UPCOMING'
    ? `<div class="sb-status" data-countdown="${esc(m.startsAt)}">${countdown(m.startsAt)}</div>`
    : `<div class="sb-status ${m.status === 'COMPLETED' ? 'result' : ''}">${esc(m.statusText)}</div>`;
  return `<section class="card scoreboard">
    <div class="sb-meta">${statusPill(m)}<span>${esc(m.series)}</span><span>·</span><span>${esc(m.venue)}</span></div>
    <div class="sb-teams">${team(m.teamA)}${team(m.teamB)}</div>
    ${status}
    <div class="chips">${chips.join('')}</div>
  </section>`;
}

function creaseHtml(c, m) {
  if (!c) {
    const text = m.status === 'UPCOMING' ? 'Line-ups will appear when the match starts.' : 'Match finished. See the scorecard and summary.';
    return `<section class="card pad"><h2>At the crease</h2><p class="muted" style="margin-top:8px">${text}</p></section>`;
  }
  const bat = (b) => `<tr class="${b.onStrike ? 'on-strike' : ''}"><td class="name">${esc(b.name)}</td><td>${b.runs}</td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${fmt(b.strikeRate)}</td></tr>`;
  const bowl = c.bowler
    ? `<tr><td class="name">${esc(c.bowler.name)}</td><td>${esc(c.bowler.overs)}</td><td>${c.bowler.maidens}</td><td>${c.bowler.runs}</td><td>${c.bowler.wickets}</td><td>${fmt(c.bowler.economy)}</td></tr>`
    : '<tr><td colspan="6" class="muted">Next bowler coming on…</td></tr>';
  return `<section class="card pad">
    <div class="section-title"><h2>At the crease</h2><span class="muted small">Partnership ${esc(c.partnership)}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
      <tbody>${bat(c.striker)}${bat(c.nonStriker)}</tbody>
      <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
      <tbody>${bowl}</tbody>
    </table></div>
    <div style="margin-top:12px"><div class="muted small" style="margin-bottom:6px">This over</div>
      <div class="balls">${c.thisOver.length ? c.thisOver.map(ballChip).join('') : '<span class="muted small">New over</span>'}</div>
    </div>
  </section>`;
}

function scorerHtml(m) {
  if (m.status !== 'LIVE') return '';
  const btn = (label, payload, cls = '') => `<button class="btn ${cls}" data-score='${JSON.stringify(payload)}' title="Record: ${esc(label)}">${esc(label)}</button>`;
  return `<section class="card pad">
    <div class="section-title"><h2>Scorer controls</h2>
      <button class="btn ${m.paused ? 'btn-primary' : ''}" data-pause>${m.paused ? '▶ Resume auto' : '❚❚ Pause auto'}</button>
    </div>
    <p class="muted small" style="margin-bottom:10px">${m.paused
      ? 'Auto-simulation is paused. Record each delivery manually:'
      : 'Auto-simulation is running. You can also record deliveries manually:'}</p>
    <div class="scorer-grid">
      ${btn('0', { runs: 0 })}${btn('1', { runs: 1 })}${btn('2', { runs: 2 })}${btn('3', { runs: 3 })}${btn('4', { runs: 4 }, 's4')}
      ${btn('6', { runs: 6 }, 's6')}${btn('W', { runs: 0, wicket: true }, 'sW')}${btn('Wd', { runs: 0, extra: 'WIDE' }, 'sx')}${btn('Nb', { runs: 0, extra: 'NO_BALL' }, 'sx')}${btn('Nb+4', { runs: 4, extra: 'NO_BALL' }, 'sx')}
    </div>
  </section>`;
}

async function submitBall(payload) {
  try {
    const s = await api(`/api/matches/${encodeURIComponent(state.detailId)}/score`, { method: 'POST', body: JSON.stringify(payload) });
    state.matches.set(s.id, s);
    toast('Delivery recorded');
    loadDetail();
  } catch (e) {
    toast(e.message);
  }
}

async function togglePause() {
  const m = state.detail.summary;
  try {
    await api(`/api/matches/${encodeURIComponent(m.id)}/${m.paused ? 'resume' : 'pause'}`, { method: 'POST' });
    toast(m.paused ? 'Auto-simulation resumed' : 'Auto-simulation paused');
    loadDetail();
  } catch (e) {
    toast(e.message);
  }
}

function commentaryHtml(list) {
  if (!list.length) return '<p class="empty">Commentary will start when the match begins.</p>';
  const top = list[0].time + list[0].text;
  const fresh = state.lastTopCommentary && state.lastTopCommentary !== top;
  return `<ul class="commentary">${list.map((c, i) => {
    let text = esc(c.text).replace(/\b(FOUR!|SIX!|OUT!|NO BALL!)/, '<b>$1</b>');
    return `<li class="${esc(c.type)} ${fresh && i === 0 ? 'fresh' : ''}"><span class="ov">${esc(c.over)}</span><span class="txt">${text}</span></li>`;
  }).join('')}</ul>`;
}

function scorecardHtml(cards) {
  if (!cards.length) return '<p class="empty">Scorecard will appear once the match starts.</p>';
  return cards.map((s, idx) => {
    const batters = s.batters.map((b) => `<tr class="${b.onStrike ? 'on-strike' : ''}">
        <td class="name">${esc(b.name)}<span class="dis">${esc(b.status)}</span></td>
        <td><b>${b.runs}</b></td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${fmt(b.strikeRate)}</td></tr>`).join('');
    const bowlers = s.bowlers.map((b) => `<tr class="${b.bowling ? 'current' : ''}">
        <td class="name">${esc(b.name)}</td><td>${esc(b.overs)}</td><td>${b.maidens}</td><td>${b.runs}</td><td><b>${b.wickets}</b></td><td>${fmt(b.economy)}</td></tr>`).join('');
    return `<div style="margin-bottom:24px">
      <div class="section-title">
        <h2><span class="team-dot" style="background:${esc(s.battingTeam.color)}"></span> ${esc(s.battingTeam.name)} · ${idx === 0 ? '1st' : '2nd'} innings</h2>
        <span class="muted">${s.runs}/${s.wickets} (${esc(s.overs)} ov) · RR ${fmt(s.runRate)}${s.target ? ` · Target ${s.target}` : ''}</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
        <tbody>${batters}
          <tr><td>Extras <span class="muted small">${esc(s.extrasDetail)}</span></td><td>${s.extras}</td><td colspan="4"></td></tr>
          <tr class="total-row"><td>Total</td><td>${s.runs}/${s.wickets}</td><td colspan="4" class="muted">${esc(s.overs)} overs</td></tr>
        </tbody>
      </table></div>
      ${s.yetToBat.length ? `<p class="small" style="margin:8px 0"><span class="muted">${s.complete ? 'Did not bat' : 'Yet to bat'}:</span> ${s.yetToBat.map(esc).join(', ')}</p>` : ''}
      ${s.fallOfWickets.length ? `<p class="small" style="margin:8px 0"><span class="muted">Fall of wickets:</span> ${s.fallOfWickets.map(esc).join(' · ')}</p>` : ''}
      <div class="table-wrap" style="margin-top:10px"><table>
        <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
        <tbody>${bowlers}</tbody>
      </table></div>
    </div>`;
  }).join('');
}

function oversHtml(cards, m) {
  if (!cards.length) return '<p class="empty">Charts will appear once the match starts.</p>';
  const overs = m.oversPerSide;
  const W = 640, H = 230, L = 34, R = 10, T = 12, B = 26;
  const series = cards.map((s) => ({ color: s.battingTeam.color, name: s.battingTeam.shortName, data: s.runsPerOver }));
  const maxRuns = Math.max(12, ...series.flatMap((s) => s.data));
  const yMax = Math.ceil(maxRuns / 4) * 4;
  const slot = (W - L - R) / overs;
  const barW = Math.max(2, (slot - 3) / series.length);
  const y = (v) => T + (H - T - B) * (1 - v / yMax);
  const tickEvery = overs > 20 ? 5 : overs > 10 ? 2 : 1;

  let grid = '';
  for (let v = 0; v <= yMax; v += yMax / 4) grid += `<line class="axis" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  let xlabels = '';
  for (let o = 1; o <= overs; o++) if (o % tickEvery === 0 || o === 1) xlabels += `<text x="${L + slot * (o - 0.5)}" y="${H - 8}" text-anchor="middle">${o}</text>`;
  const bars = series.map((s, si) => s.data.map((r, o) =>
    `<rect x="${L + slot * o + 1.5 + barW * si}" y="${y(r)}" width="${barW}" height="${Math.max(0, y(0) - y(r))}" rx="1.5" fill="${s.color}"><title>${s.name} over ${o + 1}: ${r} runs</title></rect>`).join('')).join('');

  // Worm: cumulative runs
  const totals = series.map((s) => s.data.reduce((acc, r) => [...acc, (acc[acc.length - 1] || 0) + r], []));
  const wMax = Math.ceil(Math.max(20, ...totals.flat()) / 20) * 20;
  const wy = (v) => T + (H - T - B) * (1 - v / wMax);
  const wx = (o) => L + (W - L - R) * (o / overs);
  let wgrid = '';
  for (let v = 0; v <= wMax; v += wMax / 4) wgrid += `<line class="axis" x1="${L}" x2="${W - R}" y1="${wy(v)}" y2="${wy(v)}"/><text x="${L - 6}" y="${wy(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
  let wx_labels = '';
  for (let o = tickEvery; o <= overs; o += tickEvery) wx_labels += `<text x="${wx(o)}" y="${H - 8}" text-anchor="middle">${o}</text>`;
  const lines = series.map((s, si) => {
    const pts = [[wx(0), wy(0)], ...totals[si].map((t, o) => [wx(o + 1), wy(t)])];
    return `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" points="${pts.map((p) => p.join(',')).join(' ')}"/>`
      + pts.slice(1).map((p, o) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${s.color}"><title>${s.name} after ${o + 1} ov: ${totals[si][o]}</title></circle>`).join('');
  }).join('');

  const legend = `<div class="legend">${series.map((s) => `<span><span class="team-dot" style="background:${s.color}"></span>${esc(s.name)}</span>`).join('')}</div>`;
  return `
    <div class="section-title"><h2>Runs per over (Manhattan)</h2>${legend}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Runs per over">${grid}${bars}${xlabels}</svg>
    <div class="section-title" style="margin-top:18px"><h2>Run progression (Worm)</h2>${legend}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative runs">${wgrid}${lines}${wx_labels}</svg>`;
}

function summaryHtml(r, m) {
  if (m.status === 'UPCOMING') return '<p class="empty">Summary will be available once the match starts.</p>';
  const perf = (list) => list.length
    ? list.map((p) => `<div class="performer"><span><b>${esc(p.name)}</b> <span class="muted small">${esc(p.team)}</span></span><span>${esc(p.figures)}</span></div>`).join('')
    : '<p class="muted">-</p>';
  return `
    ${r.playerOfMatch ? `<div class="potm"><span class="trophy">🏆</span><div><div class="muted small">Player of the match</div><div><b>${esc(r.playerOfMatch)}</b></div></div></div>` : ''}
    <p style="margin:14px 0"><b>${esc(r.result || m.statusText)}</b><br><span class="muted small">${esc(r.toss || '')}</span></p>
    <div class="chips" style="margin-bottom:16px">
      <span class="chip">Runs <b>${r.totalRuns}</b></span><span class="chip">Wickets <b>${r.totalWickets}</b></span>
      <span class="chip">Fours <b>${r.fours}</b></span><span class="chip">Sixes <b>${r.sixes}</b></span><span class="chip">Extras <b>${r.extras}</b></span>
    </div>
    <div class="report-grid">
      <div><h2 style="margin-bottom:6px">Top batters</h2>${perf(r.topBatters)}</div>
      <div><h2 style="margin-bottom:6px">Top bowlers</h2>${perf(r.topBowlers)}</div>
    </div>`;
}

// ------------------------------------------------------------------ players
const PLAYER_SORTS = [['runs', 'Most runs'], ['wickets', 'Most wickets'], ['sixes', 'Most sixes'], ['strikeRate', 'Best strike rate']];

async function showPlayers() {
  view.innerHTML = `
    <div class="page-head"><div><h1>Player statistics</h1><p class="muted">Aggregated live across every match. Updates as balls are bowled.</p></div></div>
    <div id="psorts" class="tabs" style="margin:14px 0"></div>
    <section id="ptable" class="card pad"><p class="empty">Loading…</p></section>`;
  await loadPlayers();
}

async function loadPlayers() {
  try {
    state.players = await api(`/api/players?sort=${state.playersSort}&limit=15`);
    renderPlayers();
  } catch (e) {
    const el = document.getElementById('ptable');
    if (el) el.innerHTML = `<p class="error-box">${esc(e.message)}</p>`;
  }
}

function renderPlayers() {
  const sorts = document.getElementById('psorts');
  const table = document.getElementById('ptable');
  if (!sorts || !table) return;
  sorts.innerHTML = PLAYER_SORTS.map(([k, l]) => `<button class="tab ${state.playersSort === k ? 'active' : ''}" data-sort="${k}">${l}</button>`).join('');
  sorts.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => { state.playersSort = b.dataset.sort; loadPlayers(); }));

  const bowling = state.playersSort === 'wickets';
  const head = bowling
    ? '<th>#</th><th class="l">Player</th><th class="l">Team</th><th>M</th><th>Wkts</th><th>Overs</th><th>Runs</th><th>Econ</th><th>Best</th>'
    : '<th>#</th><th class="l">Player</th><th class="l">Team</th><th>M</th><th>Inns</th><th>Runs</th><th>HS</th><th>SR</th><th>4s</th><th>6s</th>';
  const rows = state.players.map((p, i) => {
    const team = `<span style="display:inline-flex;gap:6px;align-items:center"><span class="team-dot" style="background:${esc(p.teamColor)}"></span>${esc(p.team)}</span>`;
    return bowling
      ? `<tr><td>${i + 1}</td><td class="name">${esc(p.name)}</td><td class="l">${team}</td><td>${p.matches}</td><td><b>${p.wickets}</b></td><td>${esc(p.overs)}</td><td>${p.runsConceded}</td><td>${fmt(p.economy)}</td><td>${esc(p.bestBowling)}</td></tr>`
      : `<tr><td>${i + 1}</td><td class="name">${esc(p.name)}</td><td class="l">${team}</td><td>${p.matches}</td><td>${p.innings}</td><td><b>${p.runs}</b></td><td>${p.highScore}${p.highScoreNotOut ? '*' : ''}</td><td>${fmt(p.strikeRate)}</td><td>${p.fours}</td><td>${p.sixes}</td></tr>`;
  }).join('');
  table.innerHTML = state.players.length
    ? `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
    : '<p class="empty">No data yet.</p>';
}

// ------------------------------------------------------------------ API reference
function showApi() {
  const anyId = [...state.matches.keys()][0] || 'm1';
  const rows = [
    ['GET', '/api/matches', 'All matches (filter with ?status=LIVE, UPCOMING, COMPLETED)'],
    ['GET', `/api/matches/${anyId}`, 'Match centre: summary, crease, scorecard, commentary, report'],
    ['GET', `/api/matches/${anyId}/scorecard`, 'Full scorecard for both innings'],
    ['GET', `/api/matches/${anyId}/commentary?limit=20`, 'Latest ball-by-ball commentary'],
    ['GET', `/api/matches/${anyId}/summary`, 'Match summary and top performers'],
    ['POST', `/api/matches/${anyId}/score`, 'Record a delivery, body: {"runs":4} / {"wicket":true} / {"extra":"WIDE"}'],
    ['POST', `/api/matches/${anyId}/pause`, 'Pause the automatic simulation (also /resume)'],
    ['GET', '/api/players?sort=runs&limit=10', 'Player leaderboard (runs, wickets, sixes, strikeRate)'],
    ['GET', '/api/overview', 'Totals across all matches'],
    ['GET', '/api/stream', 'Server-Sent Events stream of live score updates'],
  ];
  view.innerHTML = `
    <div class="page-head"><div><h1>REST API</h1><p class="muted">Every screen in this dashboard is powered by these Spring Boot endpoints. GET links open the raw JSON.</p></div></div>
    <section class="card pad" style="margin-top:14px"><div class="api-list">
      ${rows.map(([method, path, desc]) => `<div class="api-row">
        <span class="method ${method === 'POST' ? 'post' : ''}">${method}</span>
        <span class="path">${method === 'GET' && !path.endsWith('/stream') ? `<a href="${esc(path)}" target="_blank" rel="noopener">${esc(path)}</a>` : esc(path)}</span>
        <span class="muted small">${esc(desc)}</span></div>`).join('')}
    </div></section>`;
}

// ------------------------------------------------------------------ start
connectStream();
navigate();
setInterval(async () => {
  // Periodic full re-sync (covers new fixtures and removed old results)
  if (route().name !== 'home') return;
  try {
    const list = await api('/api/matches');
    state.matches = new Map(list.map((m) => [m.id, m]));
    renderFilters();
    renderGrid();
  } catch { /* ignore */ }
}, 30000);
