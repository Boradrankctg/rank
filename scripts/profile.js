import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
    import { getDatabase, ref, get, set, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

    // Database config (where user data is stored)
    const dbConfig = {
      apiKey: "AIzaSyBaKVrTWKeaUxa0EaiDBR8OGpGCAjxAcUA",
      authDomain: "boardrankctg.firebaseapp.com",
      databaseURL: "https://boardrankctg-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "boardrankctg",
      storageBucket: "boardrankctg.firebasestorage.app",
      messagingSenderId: "751761229963",
      appId: "1:751761229963:web:43f9dbf71feef6dc9cec8e"
    };

    const app = initializeApp(dbConfig);
    const db = getDatabase(app);
        // Activity list limits and caches
    let pagesLimit = 5;
    let comparesLimit = 5;
    let viewsLimit = 5;
    let pagesRowsCache = [];
    let comparesRowsCache = [];
    let viewsRowsCache = [];
    function msLeftHuman(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (d ? `${d}d ` : '') + (h ? `${h}h ` : '') + `${m}m`;
}

  if (localStorage.getItem('userLoggedIn') !== 'true') {
  if (typeof requireLogin === 'function') {
    requireLogin('Please log in to access your profile.');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
  } else {
    alert('Please log in to access your profile.');
    window.location.href = 'login.html';
    
  }
}
    const params = new URLSearchParams(window.location.search);
    const overrideUID = params.get('uid');
    const userEmail = (localStorage.getItem('userEmail') || '').toLowerCase();
    const isAdmin = userEmail === 'hasnyne2007@gmail.com';
    const loggedInUID = localStorage.getItem('loggedInUserId');

    // Decide whose profile to show:
    // - Admin: can view any uid via ?uid=
    // - Normal user: can only view their own uid (even if ?uid= is present)
    let userUID;
    if (overrideUID && (isAdmin || overrideUID === loggedInUID)) {
      userUID = overrideUID;
    } else {
      userUID = loggedInUID;
    }

    // Extra safety: if someone tries profile.html?uid=OTHER and is not admin, force back to own profile
    if (overrideUID && overrideUID !== loggedInUID && !isAdmin) {
      window.location.replace('profile.html');
    }
    const userPhoto = localStorage.getItem('userPhoto');
    async function loadProfile() {
      try {
        const snapshot = await get(ref(db, 'users/' + userUID));
        const userData = snapshot.exists() ? snapshot.val() : {};
        
        // Display user info
        const displayName = userData.fullName || userData.firstName || localStorage.getItem('userName') || 'User';
        document.getElementById('profileName').textContent = displayName;
        // Prefer email from DB, fall back to locally cached email
        document.getElementById('profileEmail').textContent = userData.email || userEmail || '';
        
        // Set avatar (prefer stored photoURL for that user)
        const avatarUrl = userData.photoURL || userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff&size=200`;
        document.getElementById('profileAvatar').src = avatarUrl;

        // Save state for name‑change limit
        window._profileState = {
          fullName: displayName,
          lastUsernameChangeAt: userData.lastUsernameChangeAt || 0
        };
        
        // Fill form fields
        document.getElementById('editName').value = displayName;
        document.getElementById('editInstitution').value = userData.institution || '';
        document.getElementById('editType').value = userData.type || '';
        document.getElementById('editPhone').value = userData.phone || '';
        document.getElementById('editAbout').value = userData.about || '';
        
        // Account information
        document.getElementById('memberSince').textContent = userData.createdAt 
          ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Today';
        
        document.getElementById('lastUpdated').textContent = userData.updatedAt 
          ? new Date(userData.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Never';
        
        document.getElementById('userId').textContent = userUID.substring(0, 8) + '...';
        
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }
    
    // Load profile on page load
    loadProfile();
    loadActivityBlocks();
window.saveProfile = async function() {
  const displayName = document.getElementById('editName').value.trim();
  const updates = {
    institution: document.getElementById('editInstitution').value.trim(),
    type: document.getElementById('editType').value,
    phone: document.getElementById('editPhone').value.trim(),
    about: document.getElementById('editAbout').value.trim(),
    updatedAt: Date.now()
  };

  const state = window._profileState || { fullName: '', lastUsernameChangeAt: 0 };
  const changingName = displayName && displayName !== state.fullName;
  const now = Date.now();
  const minGap = 14 * 24 * 60 * 60 * 1000; // 14 days
  const msg = document.getElementById('nameChangeMsg');

  if (changingName) {
    const last = state.lastUsernameChangeAt || 0;
    const diff = now - last;
    if (last && diff < minGap) {
      const left = minGap - diff;
      if (msg) {
        msg.style.display = 'block';
        msg.style.background = '#fee2e2';
        msg.style.color = '#991b1b';
        msg.style.border = '2px solid #fecaca';
        msg.innerHTML = `<i class="fas fa-clock"></i> You can change your name again in ${msLeftHuman(left)}.`;
      } else {
        alert(`You can change your name again in ${msLeftHuman(left)}.`);
      }
      return;
    }
    updates.fullName = displayName;
    updates.lastUsernameChangeAt = now;
  } else {
    updates.fullName = state.fullName || displayName;
  }

  try {
    await update(ref(db, 'users/' + userUID), updates);
    localStorage.setItem('userName', updates.fullName);
    document.getElementById('profileName').textContent = updates.fullName;
    document.getElementById('profileAvatar').src =
      `https://ui-avatars.com/api/?name=${encodeURIComponent(updates.fullName)}&background=2563eb&color=fff&size=200`;

    if (msg) msg.style.display = 'none';

    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
      successMsg.style.display = 'block';
      setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
    }

    // update local state and refresh
    window._profileState.fullName = updates.fullName;
    if (changingName) window._profileState.lastUsernameChangeAt = now;
    loadProfile();
    loadActivityBlocks();
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Failed to update profile. Please try again.');
  }
};


function loadActivityBlocks() {
  const uid = userUID;

  function renderPages() {
    const box = document.getElementById('recentPagesList');
    if (!box) return;
    box.innerHTML = '';

    if (!pagesRowsCache.length) {
      box.innerHTML = '<div style="color:#64748b">No pages yet.</div>';
      return;
    }

    const rows = pagesRowsCache;
    const show = rows.slice(0, pagesLimit);
    show.forEach(r => {
      const d = document.createElement('div');
      d.className = 'review-box';
      d.style.marginBottom = '8px';
      d.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div>
            <div style="font-weight:900">${r.title || 'Page'}</div>
            <div style="color:#64748b; font-size:.9rem;">${new Date(r.ts).toLocaleString()}</div>
            <a href="${r.url}" target="_blank" rel="noopener" style="font-weight:800;">Open</a>
          </div>
          <button class="btn-secondary" onclick="removePageLog('${r.key}')">Delete</button>
        </div>
      `;
      box.appendChild(d);
    });

    const section = document.getElementById('activityPages');
    if (!section) return;
    let btn = section.querySelector('.show-more-pages');
    if (rows.length > pagesLimit) {
      if (!btn) {
        btn = document.createElement('button');
        btn.textContent = 'Show More';
        btn.className = 'btn-secondary show-more-pages';
        btn.style.marginTop = '8px';
        btn.addEventListener('click', () => {
          pagesLimit += 5;
          renderPages();
        });
        section.appendChild(btn);
      }
      btn.style.display = 'inline-block';
    } else if (btn) {
      btn.style.display = 'none';
    }
  }

  function renderCompares() {
    const box = document.getElementById('recentComparesList');
    if (!box) return;
    box.innerHTML = '';

    if (!comparesRowsCache.length) {
      box.innerHTML = '<div style="color:#64748b">No comparisons yet.</div>';
      return;
    }

    const rows = comparesRowsCache;
    const show = rows.slice(0, comparesLimit);
    show.forEach(r => {
      const d = document.createElement('div');
      d.className = 'review-box';
      d.style.marginBottom = '8px';
      d.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div>
            <div><b>${r.roll1}</b> vs <b>${r.roll2}</b> — ${r.year} ${r.group}</div>
            <div style="color:#64748b; font-size:.9rem;">${new Date(r.ts).toLocaleString()}</div>
          </div>
          <button class="btn-secondary" onclick="removeCompareLog('${r.key}')">Delete</button>
        </div>
      `;
      box.appendChild(d);
    });

    const section = document.getElementById('activityCompares');
    if (!section) return;
    let btn = section.querySelector('.show-more-compares');
    if (rows.length > comparesLimit) {
      if (!btn) {
        btn = document.createElement('button');
        btn.textContent = 'Show More';
        btn.className = 'btn-secondary show-more-compares';
        btn.style.marginTop = '8px';
        btn.addEventListener('click', () => {
          comparesLimit += 5;
          renderCompares();
        });
        section.appendChild(btn);
      }
      btn.style.display = 'inline-block';
    } else if (btn) {
      btn.style.display = 'none';
    }
  }

  function renderViews() {
    const box = document.getElementById('viewsHistoryList');
    if (!box) return;
    box.innerHTML = '';

    if (!viewsRowsCache.length) {
      box.innerHTML = '<div style="color:#64748b">No views yet.</div>';
      return;
    }

    const rows = viewsRowsCache;
    const show = rows.slice(0, viewsLimit);
    show.forEach(r => {
      const d = document.createElement('div');
      d.className = 'review-box';
      d.style.marginBottom = '8px';
      d.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <div><b>${r.name || 'Student'}</b> — Roll ${r.roll}</div>
            <div style="color:#64748b; font-size:.9rem;">${r.year} ${r.group} — ${r.institution || ''}</div>
            <div style="color:#64748b; font-size:.9rem;">${new Date(r.ts).toLocaleString()}</div>
          </div>
          <div>
            <button class="btn-secondary" onclick="viewStudentFromHistory('${r.roll}','${r.year}','${r.group}')">Open</button>
            <button class="btn-secondary" onclick="removeViewLog('${r.key}')">Delete</button>
          </div>
        </div>
      `;
      box.appendChild(d);
    });

    const section = document.getElementById('viewsHistory');
    if (!section) return;
    let btn = section.querySelector('.show-more-views');
    if (rows.length > viewsLimit) {
      if (!btn) {
        btn = document.createElement('button');
        btn.textContent = 'Show More';
        btn.className = 'btn-secondary show-more-views';
        btn.style.marginTop = '8px';
        btn.addEventListener('click', () => {
          viewsLimit += 5;
          renderViews();
        });
        section.appendChild(btn);
      }
      btn.style.display = 'inline-block';
    } else if (btn) {
      btn.style.display = 'none';
    }
  }

  // Recently Viewed Pages
  onValue(ref(db, `userLogs/${uid}/pages`), (snap) => {
    if (!snap.exists()) {
      pagesRowsCache = [];
    } else {
      pagesRowsCache = Object.entries(snap.val())
        .map(([k, v]) => ({ key:k, ...v }))
        .sort((a,b) => b.ts - a.ts);
    }
    renderPages();
  });

  // Recently Compared Students
  onValue(ref(db, `userLogs/${uid}/comparisons`), (snap) => {
    if (!snap.exists()) {
      comparesRowsCache = [];
    } else {
      comparesRowsCache = Object.entries(snap.val())
        .map(([k, v]) => ({ key:k, ...v }))
        .sort((a,b) => b.ts - a.ts);
    }
    renderCompares();
  });

  // Favorite Schools (unchanged, show all)
  onValue(ref(db, `favoriteSchools/${uid}`), (snap) => {
    const box = document.getElementById('favSchoolsList');
    if (!box) return;
    box.innerHTML = '';
    if (!snap.exists()) {
      box.innerHTML = '<div style="color:#64748b">No favorite schools yet.</div>';
      return;
    }
    Object.entries(snap.val()).forEach(([key, v]) => {
      const d = document.createElement('div');
      d.className = 'review-box';
      d.style.marginBottom = '8px';
      d.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div><b>${(v && v.name) || key}</b></div>
          <button class="btn-secondary" onclick="unfavoriteSchool('${key}')">Unfavorite</button>
        </div>
      `;
      box.appendChild(d);
    });
  });

  // Viewed Students — full history (limited by viewsLimit)
  onValue(ref(db, `userLogs/${uid}/views`), (snap) => {
    if (!snap.exists()) {
      viewsRowsCache = [];
    } else {
      viewsRowsCache = Object.entries(snap.val())
        .map(([k, v]) => ({ key:k, ...v }))
        .sort((a,b) => b.ts - a.ts);
    }
    renderViews();
  });

  // Clear all history
  document.getElementById('clearAllHistoryBtn')?.addEventListener('click', async () => {
    if (!confirm('Clear all history (pages, views, comparisons)?')) return;
    try {
      await remove(ref(db, `userLogs/${uid}/pages`));
      await remove(ref(db, `userLogs/${uid}/views`));
      await remove(ref(db, `userLogs/${uid}/comparisons`));
      alert('History cleared.');
    } catch (e) {
      console.error('Clear history error', e);
      alert('Failed to clear history.');
    }
  });
}
window.removePageLog = async function(key) {
  const uid = localStorage.getItem('loggedInUserId');
  await remove(ref(db, `userLogs/${uid}/pages/${key}`));
};

window.removeCompareLog = async function(key) {
  const uid = localStorage.getItem('loggedInUserId');
  await remove(ref(db, `userLogs/${uid}/comparisons/${key}`));
};

window.removeViewLog = async function(key) {
  const uid = localStorage.getItem('loggedInUserId');
  await remove(ref(db, `userLogs/${uid}/views/${key}`));
};

window.unfavoriteSchool = async function(key) {
  const uid = localStorage.getItem('loggedInUserId');
  await remove(ref(db, `favoriteSchools/${uid}/${key}`));
};

window.viewStudentFromHistory = function(roll, year, group) {
  window.location.href = `index.html?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&roll=${encodeURIComponent(roll)}`;
};

