import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, runTransaction, set, onValue, get, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaKVrTWKeaUxa0EaiDBR8OGpGCAjxAcUA",
  authDomain: "boardrankctg.firebaseapp.com",
  databaseURL: "https://boardrankctg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "boardrankctg",
  storageBucket: "boardrankctg.firebasestorage.app",
  messagingSenderId: "751761229963",
  appId: "1:751761229963:web:43f9dbf71feef6dc9cec8e",
  measurementId: "G-3Y6J44NWNH"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
window.db = db;

(function(){
try {
const liveEl = document.getElementById('liveVisits');
if (!liveEl) return;

onValue(ref(db, "siteStats/totalVisits"), (snap) => {
  const v = Number(snap.val() || 0);
  liveEl.textContent = v.toLocaleString();
}, (err) => {
  console.error('TotalVisits listener error', err);
});

get(ref(db, "siteStats/totalVisits")).then((snap) => {
  const v = Number(snap.val() || 0);
  if (liveEl.textContent === '—' || liveEl.textContent === '') {
    liveEl.textContent = v.toLocaleString();
  }
}).catch(()=>{});
} catch(e) {
console.error('TotalVisits setup error', e);
}
})();

window.clickCountsCache = {};
window._br_clickListenerSet = new Set();
window.__br_hiddenRolls = new Set();

function initHiddenResultsListener() {
  try {
    const hrRef = ref(db, 'hiddenResults');
    onValue(hrRef, (snap) => {
      const obj = snap.val() || {};
      window.__br_hiddenRolls = new Set(Object.keys(obj));
      try { if (typeof window.updateTableData === 'function') window.updateTableData(); } catch(e){}
    });
  } catch (e) { console.error('hiddenResults listener failed', e); }
}

window.hideResultRoll = async function(roll) {
  try {
    await set(ref(db, 'hiddenResults/' + String(roll)), { on: true, at: Date.now() });
    alert('Hidden for everyone (except admin).');
  } catch (e) { alert('Failed: ' + (e.message || e.code)); }
};
window.unhideResultRoll = async function(roll) {
  try {
    await remove(ref(db, 'hiddenResults/' + String(roll)));
    alert('Unhidden.');
  } catch (e) { alert('Failed: ' + (e.message || e.code)); }
};

window.incrementClickCount = function(roll) {
  if (!window.db) {
    console.error("DB not ready for incrementClickCount");
    return;
  }
  try {
    const clickRef = ref(window.db, `clickCounts/${roll}`);
    runTransaction(clickRef, (count) => {
      return (count || 0) + 1;
    }).catch(err => console.error('incrementClickCount error', err));
  } catch (e) {
    console.error('incrementClickCount exception', e);
  }
};

window.listenClickCount = function(roll, cb) {
  if (!window.db) {
    console.error("DB not ready for listenClickCount");
    cb(0);
    return;
  }
  try {
    const clickRef = ref(window.db, `clickCounts/${roll}`);
    onValue(clickRef, (snap) => {
      const val = snap.val() || 0;
      window.clickCountsCache[roll] = val;
      cb(val);
    });
  } catch (e) {
    console.error('listenClickCount exception', e);
    cb(0);
  }
};

let userId = localStorage.getItem("userId");
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("userId", userId);
}

const ADMIN_ID = "admin1234";

function trackVisit() {
  runTransaction(ref(db, "siteStats/totalVisits"), (count) => (count || 0) + 1);
  set(ref(db, `siteStats/activeUsers/${userId}`), Date.now());
}

function showAdminStats() {
  const box = document.createElement("div");
  box.className = "admin-stats-box";
  box.innerHTML = `<h3>📊 Site Stats (Admin Only)</h3><div id="visitStats">Loading...</div>`;
  document.body.appendChild(box);

  const statsRef = ref(db, "siteStats");

  onValue(statsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const total = data.totalVisits || 0;
    const active = data.activeUsers || {};
    const now = Date.now();
    const live = Object.values(active).filter(ts => now - ts < 5 * 60 * 1000).length;

    document.getElementById("visitStats").innerHTML = `
      👁️ Total Visits: <strong>${total}</strong><br />
      🟢 Live Visitors (past 5 min): <strong>${live}</strong>
    `;
  });
}

trackVisit();
initAnnouncementsListener();
initDisplaySettingsListener();
initPollFeature();
initHiddenResultsListener();
initPollFeature();
checkAndEnforceBan();

if (userId === ADMIN_ID) showAdminStats();

function __deriveFingerprintFallback() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const screenRes = `${screen.width}x${screen.height}`;
  const deviceMemory = navigator.deviceMemory || '';
  const cores = navigator.hardwareConcurrency || '';
  const vendor = navigator.vendor || '';
  const seed = `${ua}|${platform}|${screenRes}|${deviceMemory}|${cores}|${vendor}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) + seed.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return (h >>> 0).toString(16);
}

async function __getFingerprint() {
  try {
    if (typeof getDeviceDataAndFingerprint === 'function') {
      const v = getDeviceDataAndFingerprint();
      if (v && v.fingerprint) return v.fingerprint;
    }
  } catch (e) {}
  return __deriveFingerprintFallback();
}

function startBanCountdown(until) {
  const timer = document.getElementById('banTimer');
  if (!timer) return;
  clearInterval(window.__banTick);
  if (until === -1) {
    timer.textContent = 'Permanent ban';
    return;
  }
  function tick() {
    const ms = until - Date.now();
    if (ms <= 0) {
      timer.textContent = 'Ban expired. Reloading...';
      setTimeout(() => location.reload(), 1200);
      clearInterval(window.__banTick);
      return;
    }
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    timer.textContent = `Time left: ${d}d ${h}h ${m}m ${ss}s`;
  }
  tick();
  window.__banTick = setInterval(tick, 1000);
}

function initAnnouncementsListener() {
  const annRef = ref(db, 'announcements/global');
  onValue(annRef, (snap) => {
    const v = snap.val() || {};
    const banner = document.getElementById('annBanner');
    if (!banner) return;

    if (v.active && v.message) {
      banner.style.display = 'block';
      banner.className = `ann-banner type-${v.type || 'info'}`;
      const textEl = document.getElementById('annText');
      const btnEl = document.getElementById('annBtn');
      textEl.textContent = v.message || '';
      if (v.buttonText && v.buttonUrl) {
        btnEl.style.display = 'inline-block';
        btnEl.textContent = v.buttonText;
        btnEl.href = v.buttonUrl;
      } else {
        btnEl.style.display = 'none';
      }
    } else {
      banner.style.display = 'none';
    }
  });
}

async function checkAndEnforceBan() {
  const fp = await __getFingerprint();
  const bRef = ref(db, 'bannedDevices/' + fp);
  onValue(bRef, (snap) => {
    const ban = snap.val();
    const overlay = document.getElementById('banOverlay');
    if (!overlay) return;

    const active = ban && (ban.until === -1 || Number(ban.until) > Date.now());
    if (active) {
      overlay.style.display = 'flex';
      document.body.classList.add('ban-locked');
      const reason = ban.reason || '—';
      const until = Number(ban.until);
      document.getElementById('banReason').textContent = `Reason: ${reason}`;
      document.getElementById('banUntil').textContent = (until === -1)
        ? 'Until: Permanent'
        : 'Until: ' + new Date(until).toLocaleString();
      startBanCountdown(until);

      const stopper = (e) => { e.stopPropagation(); e.preventDefault(); };
      window.addEventListener('keydown', stopper, { capture: true });
      window.addEventListener('click', stopper, { capture: true });
    } else {
      overlay.style.display = 'none';
      document.body.classList.remove('ban-locked');
      clearInterval(window.__banTick);
    }
  });
}

function initDisplaySettingsListener() {
  try {
    const dRef = ref(db, 'displaySettings');
    onValue(dRef, (snap) => {
      window.__br_displaySettings = snap.val() || {};
      if (typeof window.applyDisplaySettingsToDOM === 'function') {
        window.applyDisplaySettingsToDOM();
      }
    });
  } catch (e) {
    console.error('Display settings listener failed', e);
  }
}

function initPollFeature() {
  try {
    const pRef = ref(db, 'polls/global');
    onValue(pRef, (snap) => {
      const poll = snap.val() || {};
      if (!poll.active || !Array.isArray(poll.options) || poll.options.length === 0) return;

      const pid = poll.id || 'global';
      const seenKey = 'poll_seen_' + pid;
      const votedKey = 'poll_voted_' + pid;

      if (localStorage.getItem(votedKey) || localStorage.getItem(seenKey)) return;

      setTimeout(() => {
        if (document.querySelector('.popup')) return;
        renderPollPopup(poll);
      }, 600);
    });
  } catch (e) {
    console.error('initPollFeature failed', e);
  }
}

function renderPollPopup(poll) {
  const pid = poll.id || 'global';
  const required = !!poll.required;

  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `
    <div class="popup-content poll-box">
      ${required ? '' : '<span class="close-btn" onclick="closePopup()">&times;</span>'}
      <div class="poll-head">
        <div class="poll-emoji">🗳️</div>
        <div class="poll-title">${poll.question || 'Quick poll'}</div>
      </div>
      <div class="poll-optgrid" id="pollOptsUser">
        ${poll.options.map((opt,i)=>`
          <label class="poll-chip" data-idx="${i}">
            <input type="radio" name="pollOpt" value="${i}">
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>

      <div class="poll-actions">
        ${required ? '' : '<button class="btn-secondary" id="pollSkipBtn">Skip</button>'}
        <button class="btn-primary" id="pollVoteBtn">Submit</button>
      </div>

      <div id="pollUserStats" class="poll-stats"></div>
    </div>
  `;
  document.body.appendChild(popup);
  document.body.classList.add('locked');

  document.querySelectorAll('.poll-chip').forEach(ch => {
    ch.addEventListener('click', () => {
      document.querySelectorAll('.poll-chip').forEach(c => c.classList.remove('active'));
      ch.classList.add('active');
      const r = ch.querySelector('input[type=radio]');
      if (r) r.checked = true;
    });
  });

  const pidSeen = 'poll_seen_' + pid;
  const pidVoted = 'poll_voted_' + pid;

  document.getElementById('pollSkipBtn')?.addEventListener('click', () => {
    localStorage.setItem(pidSeen, '1');
    closePopup();
  });

  document.getElementById('pollVoteBtn').addEventListener('click', async () => {
    const sel = document.querySelector('input[name="pollOpt"]:checked');
    if (!sel) { alert('Pick an option'); return; }
    await submitPollVote(poll, Number(sel.value));
  });
}

async function submitPollVote(poll, idx) {
  try {
    const pid = poll.id || 'global';
    const fp = await __getFingerprint();
    await set(ref(db, 'pollVotes/' + pid + '/' + fp), { opt: idx, at: Date.now() });
    localStorage.setItem('poll_voted_' + pid, '1');

    const statsBox = document.getElementById('pollUserStats');
    statsBox.innerHTML = `<div style="font-weight:800">Calculating results…</div>`;

    const snap = await get(ref(db, 'pollVotes/' + pid));
    const votes = snap.val() || {};
    const counts = poll.options.map(()=>0);
    Object.values(votes).forEach(rec => {
      const i = Number(rec?.opt);
      if (!isNaN(i) && counts[i] !== undefined) counts[i] += 1;
    });

    const total = counts.reduce((a,b)=>a+b,0);

    const rows = poll.options.map((o,i)=>{
      const c = counts[i] || 0;
      const pct = total ? Math.round(c*100/total) : 0;
      return `
        <div class="poll-row">
          <div class="poll-row-text">${o}</div>
          <div class="poll-bar">
            <div class="poll-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="poll-pct">${pct}%</div>
        </div>
      `;
    }).join('');

    statsBox.innerHTML = `
      <div class="poll-results">
        <div class="poll-results-title">Live percentages</div>
        ${rows}
        <div class="poll-total">Total votes: ${total}</div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:12px;">
        <button class="btn-secondary" onclick="closePopup()">Close</button>
      </div>
    `;
  } catch (e) {
    alert('Vote failed: ' + (e.message || e.code));
  }
}
