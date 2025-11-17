import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getDatabase, ref, onValue, remove, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
    import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
  
// --- Project 1: boardrankctg (DATABASE) ---
const dbConfig = {
  apiKey: "AIzaSyBaKVrTWKeaUxa0EaiDBR8OGpGCAjxAcUA",
  authDomain: "boardrankctg.firebaseapp.com",
  databaseURL: "https://boardrankctg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "boardrankctg",
  storageBucket: "boardrankctg.appspot.com",
  messagingSenderId: "751761229963",
  appId: "1:751761229963:web:43f9dbf71feef6dc9cec8e"
};
const dbApp = initializeApp(dbConfig, "dbApp"); 
const db = getDatabase(dbApp);

// --- Project 2: boardrank-c095a (AUTH) ---
const authConfig = {
  apiKey: "AIzaSyAwUqYxrhyEZDmvlQaUB7tuVtXP1ZYdKfI",
  authDomain: "boardrank-c095a.firebaseapp.com",
  projectId: "boardrank-c095a",
  storageBucket: "boardrank-c095a.appspot.com",
  messagingSenderId: "953246350478",
  appId: "1:953246350478:web:xxxxxxxxxxxxxxxx" // ← copy exact value from Firebase settings
};
const authApp = initializeApp(authConfig, "authApp");
const auth = getAuth(authApp);

    const ADMIN_UID = "m2yGng2JRBfvG5MKGf5A977t5Az2";
  
    const main = document.querySelector('main');
    const container = document.getElementById("visitorsContainer");
    // Live banned map
    const bannedRef = ref(db, "bannedDevices");
  let bannedMap = {};
  onValue(bannedRef, (snap) => {
    bannedMap = snap.val() || {};
    // Re-render to refresh badges/buttons (lightweight; keeps it simple)
    if (typeof loadVisitors === 'function') {
      try { loadVisitors(); } catch (e) {}
    }
  });

    // Login box
    const loginHtml = `
  <div id="adminLoginBox" style="max-width:900px;margin:10px auto;padding:12px;border-radius:8px;background:#fff;">
    <div style="display:flex;align-items:center;gap:10px;">
      <input id="adminEmail" placeholder="Admin email" style="padding:8px;flex:1;" />
      <input id="adminPassword" type="text" placeholder="Password" style="padding:8px;width:180px;" />
      <button id="loginBtn">Login</button>
      <button id="logoutBtn" style="display:none;">Logout</button>
    </div>
    <div id="loginError" style="color:#b71c1c;margin-top:6px;"></div>
  </div>
`;
main.insertAdjacentHTML('afterbegin', loginHtml);

  
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginError = document.getElementById('loginError');
  
    onAuthStateChanged(auth, user => {
      if (user && user.uid === ADMIN_UID) {
    document.getElementById('adminLoginBox').style.display = 'none';
    initAnnouncementPanel();
initDisplayControlsPanel();
loadVisitors();
initPollPanel();


      } else {
        document.getElementById('adminLoginBox').style.display = 'block';
        container.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#b71c1c;">Admin access required. Please login.</td></tr>`;
      }
    });
  
    loginBtn.addEventListener('click', async () => {
      loginError.textContent = '';
      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value;
      if (!email || !password) {
        loginError.textContent = 'Enter email and password.';
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
  console.error('Login failed:', err);
  loginError.textContent = 'Login failed: ' + (err.message || err.code);
}

    });
  
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      location.reload();
    });
  
    function loadVisitors() {
      const visitorsRef = ref(db, "visitors");
      onValue(visitorsRef, (snapshot) => {
        container.innerHTML = "";
        const visitors = snapshot.val() || {};
        const entries = Object.entries(visitors).reverse();
        let count = entries.length;
        entries.forEach(([id, visitor]) => {
          const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
          const tr = document.createElement('tr');
tr.innerHTML = `
  <td>${count--}</td>
  <td>${escapeHtml(visitor.name || '')}</td>
  <td>${escapeHtml(visitor.type || '')}</td>
  <td>${escapeHtml(visitor.source || '')}</td>
  <td>${escapeHtml(visitor.institution || '')}</td>
  <td>${escapeHtml(visitor.experience || '')}</td>
  <td>${visitor.message ? '<div class="visitor-message">' + escapeHtml(visitor.message) + '</div>' : ''}</td>
 <td>${escapeHtml(visitor.deviceData?.deviceModel || 'Unknown')}</td>
<td>${escapeHtml(visitor.fingerprint || '—')}</td>
<td>${visitor.timestamp ? new Date(visitor.timestamp).toLocaleString() : ''}</td>
<td data-fp="${escapeHtml(visitor.fingerprint || '')}">
    <span class="ban-badge" style="color:#b91c1c;font-weight:900;margin-right:8px;">
      ${(visitor.fingerprint && bannedMap[visitor.fingerprint]) ? 'BANNED' : ''}
    </span>
    ${
      visitor.fingerprint
        ? (bannedMap[visitor.fingerprint]
            ? `<button onclick="unbanFingerprint('${escapeHtml(visitor.fingerprint)}')">✅ Unban</button>`
            : `<button onclick="banFingerprint('${escapeHtml(visitor.fingerprint)}', '${escapeHtml(visitor.name || '')}', '${escapeHtml(visitor.deviceData?.deviceModel || '')}')">🚫 Ban</button>`)
        : '<span style="color:#666">No FP</span>'
    }
    <button onclick="deleteVisitor('${id}')" style="margin-left:6px">🗑️ Delete</button>
  </td>

`;

          container.appendChild(tr);
        });
      });
    }
    function initAnnouncementPanel() {
    if (document.getElementById('annPanel')) return;

    const html = `
      <section id="annPanel" style="max-width:900px;margin:12px auto;padding:12px;border:2px solid #0ea5e9;border-radius:10px;background:#f0f9ff;">
        <h3 style="margin:6px 0;">📢 Global Announcement</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select id="annType" style="padding:8px;border:1px solid #ccc;border-radius:8px;">
            <option value="info">Info (blue)</option>
            <option value="warning">Warning (amber)</option>
            <option value="success">Success (green)</option>
            <option value="danger">Danger (red)</option>
          </select>
          <label style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="annActive" /> Active
          </label>
        </div>
        <textarea id="annMsg" rows="2" placeholder="Type the banner message..." style="width:100%;padding:10px;margin:8px 0;border:1px solid #ccc;border-radius:8px;"></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input id="annBtnText" placeholder="Button text (optional)" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:8px;">
          <input id="annBtnUrl" placeholder="https://example.com (optional)" style="flex:2;padding:8px;border:1px solid #ccc;border-radius:8px;">
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button id="annSaveBtn">Publish / Update</button>
          <button id="annClearBtn" style="background:#e5e7eb;color:#111;border:1px solid #d1d5db;">Clear</button>
        </div>
        <div id="annStatus" style="margin-top:6px;color:#065f46;font-weight:700;"></div>
      </section>
    `;
    document.querySelector('main').insertAdjacentHTML('afterbegin', html);

    // Load current
    onValue(ref(db, 'announcements/global'), (snap) => {
      const v = snap.val() || {};
      document.getElementById('annType').value = v.type || 'info';
      document.getElementById('annActive').checked = !!v.active;
      document.getElementById('annMsg').value = v.message || '';
      document.getElementById('annBtnText').value = v.buttonText || '';
      document.getElementById('annBtnUrl').value = v.buttonUrl || '';
    });

    document.getElementById('annSaveBtn').addEventListener('click', async () => {
      const payload = {
        type: document.getElementById('annType').value,
        active: document.getElementById('annActive').checked,
        message: document.getElementById('annMsg').value.trim(),
        buttonText: document.getElementById('annBtnText').value.trim(),
        buttonUrl: document.getElementById('annBtnUrl').value.trim(),
        updatedAt: Date.now(),
        by: (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'admin'
      };
      try {
        await set(ref(db, 'announcements/global'), payload);
        document.getElementById('annStatus').textContent = 'Saved. Live in real-time.';
        setTimeout(() => document.getElementById('annStatus').textContent = '', 2000);
      } catch (e) {
        alert('Save failed: ' + (e.message || e.code));
      }
    });

    document.getElementById('annClearBtn').addEventListener('click', async () => {
      try {
        await set(ref(db, 'announcements/global'), { active: false, message: '', updatedAt: Date.now() });
        document.getElementById('annStatus').textContent = 'Cleared.';
        setTimeout(() => document.getElementById('annStatus').textContent = '', 2000);
      } catch (e) {
        alert('Clear failed: ' + (e.message || e.code));
      }
    });
  }

    window.deleteVisitor = function(id) {
      if (!confirm("Delete this visitor?")) return;
      remove(ref(db, `visitors/${id}`)).catch(err => {
        alert('Delete failed — permission denied.');
      });
    };

    function initDisplayControlsPanel() {
  if (document.getElementById('displayControls')) return;
  const html = `
    <section id="displayControls" style="max-width:900px;margin:12px auto;padding:12px;border:2px solid #334155;border-radius:10px;background:#f8fafc;">
      <h3 style="margin:6px 0;">🛠️ Display Controls (Global)</h3>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
        <label><input type="checkbox" id="optNameSearch" checked /> Name Search</label>
        <label><input type="checkbox" id="optShowNames" checked /> Show Name</label>
        <label><input type="checkbox" id="optShowRolls" checked /> Show Roll</label>
      </div>
      <small style="display:block;margin-top:6px;color:#555;">Changes apply for everyone in real-time.</small>
    </section>
  `;
  const ann = document.getElementById('annPanel');
  (ann ? ann : document.querySelector('main')).insertAdjacentHTML('afterend', html);

  const dRef = ref(db, 'displaySettings');
  onValue(dRef, (snap) => {
    const v = snap.val() || {};
    document.getElementById('optNameSearch').checked = (v.nameSearch !== false);
    document.getElementById('optShowNames').checked = (v.showNames !== false);
    document.getElementById('optShowRolls').checked = (v.showRolls !== false);
  });

  document.getElementById('optNameSearch').addEventListener('change', e => update(dRef, { nameSearch: e.target.checked, updatedAt: Date.now() }));
  document.getElementById('optShowNames').addEventListener('change', e => update(dRef, { showNames: e.target.checked, updatedAt: Date.now() }));
  document.getElementById('optShowRolls').addEventListener('change', e => update(dRef, { showRolls: e.target.checked, updatedAt: Date.now() }));
}









     // Parse duration like "30m", "2h", "3d", "1w" or "forever"
  window.parseBanDuration = function(str) {
    if (!str) return null;
    const s = String(str).trim().toLowerCase();
    if (s === 'forever' || s === 'permanent' || s === 'perm') return -1;
    const m = s.match(/^(\d+)\s*(m|h|d|w)$/);
    if (!m) return null;
    const qty = parseInt(m[1], 10);
    const unit = m[2];
    const mult = unit === 'm' ? 60000
               : unit === 'h' ? 3600000
               : unit === 'd' ? 86400000
               : 604800000; // weeks
    return Date.now() + qty * mult;
  };

  window.banFingerprint = async function(fp, name = '', deviceModel = '') {
    if (!fp) return alert('No fingerprint found for this visitor.');
    const reason = prompt('Reason for ban (shown to user):', 'Policy violation');
    if (reason === null) return;
    const durationStr = prompt('Duration (examples: 30m, 2h, 3d, 1w, forever):', '2h');
    if (durationStr === null) return;

    const until = window.parseBanDuration(durationStr);
    if (until === null) return alert('Invalid duration. Use 30m, 2h, 3d, 1w, or forever');

    const data = {
      reason,
      until,
      createdAt: Date.now(),
      by: (auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'admin',
      name,
      deviceModel
    };

    try {
      await set(ref(db, 'bannedDevices/' + fp), data);
      alert('Device banned.');
    } catch (e) {
      console.error('Ban failed:', e);
      alert('Ban failed: ' + (e.message || e.code));
    }
  };

  window.unbanFingerprint = async function(fp) {
    if (!fp) return;
    if (!confirm('Unban this device?')) return;
    try {
      await remove(ref(db, 'bannedDevices/' + fp));
      alert('Device unbanned.');
    } catch (e) {
      console.error('Unban failed:', e);
      alert('Unban failed: ' + (e.message || e.code));
    }
  };
  function initPollPanel() {
  if (document.getElementById('pollPanel')) return;
  const html = `
    <section id="pollPanel" style="max-width:900px;margin:12px auto;padding:12px;border:2px solid #7c3aed;border-radius:10px;background:#faf5ff;">
      <h3 style="margin:6px 0;">📊 Site Poll</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <label><input type="checkbox" id="pollActive"> Active</label>
        <label><input type="checkbox" id="pollRequired"> Compulsory (Required)</label>
      </div>
      <input id="pollQ" placeholder="Poll question..." style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-top:8px;">
      <div id="pollOpts" style="margin-top:8px;display:grid;gap:8px;"></div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <button id="pollAddOpt">+ Add option</button>
        <button id="pollSave">Publish / Update</button>
        <button id="pollClear" style="background:#e5e7eb;color:#111;border:1px solid #d1d5db;">Clear config</button>
        <button id="pollReset" style="background:#fee2e2;color:#7f1d1d;border:1px solid #fecaca;">Reset votes</button>
      </div>
      <div id="pollStatus" style="margin-top:6px;color:#065f46;font-weight:800;"></div>
      <div id="pollStats" style="margin-top:10px;"></div>
    </section>
  `;
  document.querySelector('main').insertAdjacentHTML('afterbegin', html);

  const optsWrap = document.getElementById('pollOpts');
  const addOpt = (val='') => {
    const row = document.createElement('div');
    row.style = 'display:flex;gap:8px;align-items:center;';
    row.innerHTML = `
      <input class="pollOpt" placeholder="Option..." value="${String(val).replace(/"/g,'&quot;')}"
             style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;">
      <button class="rm">×</button>
    `;
    row.querySelector('.rm').addEventListener('click', ()=> row.remove());
    optsWrap.appendChild(row);
  };

  document.getElementById('pollAddOpt').addEventListener('click', ()=> addOpt());

  // Load current config + live results
  onValue(ref(db, 'polls/global'), (snap) => {
    const v = snap.val() || {};
    document.getElementById('pollActive').checked = !!v.active;
    document.getElementById('pollRequired').checked = !!v.required;
    document.getElementById('pollQ').value = v.question || '';
    optsWrap.innerHTML = '';
    (Array.isArray(v.options) ? v.options : []).forEach(o => addOpt(o));

    // Live vote counts (admin sees exact numbers)
    const pid = v.id || 'global';
    onValue(ref(db, 'pollVotes/' + pid), (vs) => {
      const votes = vs.val() || {};
      const counts = (Array.isArray(v.options) ? v.options : []).map(()=>0);
      Object.values(votes).forEach(rec => {
        const i = Number(rec?.opt);
        if (!isNaN(i) && counts[i] !== undefined) counts[i] += 1;
      });
      const total = counts.reduce((a,b)=>a+b,0);
      const rows = (v.options || []).map((o,i) => {
        const c = counts[i] || 0;
        const pct = total ? Math.round(c*100/total) : 0;
        return `
          <tr>
            <td>${i+1}</td>
            <td>${o}</td>
            <td><b>${c}</b></td>
            <td>${pct}%</td>
          </tr>
        `;
      }).join('');
      document.getElementById('pollStats').innerHTML = `
        <h4 style="margin:6px 0;">Live results</h4>
        <table border="1" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr><th>#</th><th>Option</th><th>Votes</th><th>%</th></tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align:right;font-weight:900;">Total</td>
              <td><b>${total}</b></td>
              <td>${total ? '100%' : '—'}</td>
            </tr>
          </tfoot>
        </table>
      `;
    });
  });

  // Save config
  document.getElementById('pollSave').addEventListener('click', async () => {
    const active = document.getElementById('pollActive').checked;
    const required = document.getElementById('pollRequired').checked;
    const question = document.getElementById('pollQ').value.trim();
    const options = Array.from(document.querySelectorAll('.pollOpt'))
      .map(i=>i.value.trim()).filter(Boolean);
    if (!question || options.length < 2) {
      alert('Enter a question and at least 2 options.');
      return;
    }
    const cur = (await get(ref(db, 'polls/global'))).val() || {};
    const cfg = {
      id: cur.id || ('poll_' + Date.now()),
      active, required, question, options,
      updatedAt: Date.now()
    };
    try {
      await set(ref(db, 'polls/global'), cfg);
      document.getElementById('pollStatus').textContent = 'Saved. Poll is live.';
      setTimeout(()=> document.getElementById('pollStatus').textContent = '', 1800);
    } catch (e) {
      alert('Save failed: ' + (e.message || e.code));
    }
  });

  // Clear config
  document.getElementById('pollClear').addEventListener('click', async () => {
    try {
      await set(ref(db, 'polls/global'), { active:false, required:false, question:'', options:[], updatedAt: Date.now() });
      document.getElementById('pollStatus').textContent = 'Cleared.';
      setTimeout(()=> document.getElementById('pollStatus').textContent = '', 1500);
    } catch (e) {
      alert('Clear failed: ' + (e.message || e.code));
    }
  });

  // Reset votes only (keep question/options)
  document.getElementById('pollReset').addEventListener('click', async () => {
    try {
      const cur = (await get(ref(db, 'polls/global'))).val() || {};
      if (!cur.id) return alert('No active poll to reset.');
      if (!confirm('Reset all poll votes?')) return;
      await remove(ref(db, 'pollVotes/' + cur.id));
      document.getElementById('pollStatus').textContent = 'Votes reset.';
      setTimeout(()=> document.getElementById('pollStatus').textContent = '', 1500);
    } catch (e) {
      alert('Reset failed: ' + (e.message || e.code));
    }
  });
}
