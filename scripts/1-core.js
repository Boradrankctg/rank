// 1-core.js — Core globals, SEO helpers, JSON-LD, crypto/decode, utilities, loader, theme/nav
/* ===== Modal helpers (global) ===== */
window.showModal = function(opts) {
  const cfg = typeof opts === 'string'
    ? { title: 'Notice', message: String(opts) }
    : (opts || {});
  const title = cfg.title || 'Notice';
  const message = cfg.message || '';
  const buttons = Array.isArray(cfg.buttons) && cfg.buttons.length
    ? cfg.buttons
    : [{ text: 'OK', variant: 'primary', onClick: () => closePopup() }];

  const btnHtml = buttons.map((b, i) => `
    <button class="${b.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}"
            data-idx="${i}">
      ${b.text}
    </button>
  `).join('');

  openPopup(`
    <div class="popup-content">
      <span class="close-btn" onclick="closePopup()">&times;</span>
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="popup-footer">
        ${btnHtml}
      </div>
    </div>
  `);

  // bind button callbacks on the most recently created popup
  const popupContents = document.querySelectorAll('.popup .popup-content');
  const lastPopup = popupContents[popupContents.length - 1];
  if (lastPopup) {
    lastPopup.querySelectorAll('.popup-footer button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        const b = buttons[idx];
        try { b.onClick && b.onClick(); } catch (e) {}
        if (!b || b.autoClose !== false) closePopup();
      });
    });
  }
};
// Always-available login gate helper (global)
window.requireLogin = function(message = 'Please log in to access this feature.', redirect = 'login.html') {
  showModal({
    title: 'Login required',
    message,
    buttons: [
      { text: 'Go to login', onClick: () => { window.location.href = redirect; } },
      { text: 'Cancel', variant: 'secondary' }
    ]
  });
};
// Promise-based confirm modal
window.confirmModal = function({ title='Confirm', message='Are you sure?', okText='Yes', cancelText='No' } = {}) {
  return new Promise((resolve) => {
    showModal({
      title, message,
      buttons: [
        { text: cancelText, variant: 'secondary', onClick: () => resolve(false) },
        { text: okText, variant: 'primary', onClick: () => resolve(true) }
      ]
    });
  });
};

// Auto-upgrade native alerts to modals
window.alert = function(msg) {
  // Require-login helper for gated features
window.requireLogin = function(message = 'Please log in to access this feature.', redirect = 'login.html') {
  showModal({
    title: 'Login required',
    message,
    buttons: [
      { text: 'Go to login', onClick: () => { window.location.href = redirect; } },
      { text: 'Cancel', variant: 'secondary' }
    ]
  });
};

  showModal({ title: 'Notice', message: String(msg), buttons:[{ text:'OK' }] });
};

// ===== Global DOM refs + admin helper =====
const contentDiv = document.getElementById('content');
function isAdmin(){
  return (localStorage.getItem('userEmail') || '').toLowerCase() === 'hasnyne2007@gmail.com';
}

const currentYear = document.getElementById('currentYear');
const currentGroup = document.getElementById('currentGroup');
const noDataMessage = document.getElementById('noDataMessage');
const yearDropdown = document.getElementById('yearDropdown');

// Logout function
async function doLogout() {
  const yes = await confirmModal({
    title: 'Sign out?',
    message: 'Do you really want to sign out?',
    okText: 'Sign out',
    cancelText: 'Cancel'
  });
  if (!yes) return;
  localStorage.clear();
  window.location.href = 'index.html';
}
window.doLogout = doLogout;

window.doLogout = doLogout;

window.doLogout = doLogout;
// ===== SEO/Share helpers =====
function upsertMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', name); document.head.appendChild(tag); }
  tag.setAttribute('content', content);
}

function upsertProperty(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute('property', property); document.head.appendChild(tag); }
  tag.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.setAttribute('rel','canonical'); document.head.appendChild(link); }
  link.setAttribute('href', url);
}

function injectJSONLD(obj, id) {
  // remove previous block with same id
  if (id) document.querySelectorAll(`script[type="application/ld+json"][data-id="${id}"]`).forEach(n=>n.remove());
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  if (id) s.setAttribute('data-id', id);
  s.text = JSON.stringify(obj);
  document.head.appendChild(s);
}


// ===== Dynamic SEO (Year+Group / School / Student) =====
function updateSEOForYearGroup(year, group) {
  const isHSC = String(year).includes('hsc');
  const yr = String(year).replace('hsc_', '');
  const exam = isHSC ? 'HSC' : 'SSC';

  const title = `SSC Result Ranking ${yr} — ${exam === 'HSC' ? 'Chattogram Board (HSC archive)' : 'Chattogram Board'} ${group}`;
  const desc  = `See ${exam} ${yr} ${group} rankings for Chattogram Board — GPA, total marks, top schools, and student comparisons. Fast and accurate.`;
  const url   = `${location.origin}${location.pathname}?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}`;

  document.title = title;
  upsertMeta('description', desc);
  setCanonical(url);
  upsertProperty('og:title', title);
  upsertProperty('og:description', desc);
  upsertProperty('og:url', url);
  upsertProperty('og:type', 'website');
  upsertMeta('twitter:title', title);
  upsertMeta('twitter:description', desc);
}

function updateSEOForSchool(year, group, schoolName) {
  const yr = String(year).replace('hsc_', '');
  const exam = String(year).includes('hsc') ? 'HSC' : 'SSC';
  const title = `${schoolName} — ${exam} ${yr} Ranking (Chattogram Board)`;
  const desc  = `Rank list for ${schoolName} — ${exam} ${yr}, ${group}. View GPA, totals, and student positions from Chattogram Board.`;
  const url   = `${location.origin}${location.pathname}?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&school=${encodeURIComponent(schoolName)}`;

  document.title = title;
  upsertMeta('description', desc);
  setCanonical(url);
  upsertProperty('og:title', title);
  upsertProperty('og:description', desc);
  upsertProperty('og:url', url);
  upsertMeta('twitter:title', title);
  upsertMeta('twitter:description', desc);
}

function updateSEOForStudent(year, group, studentName, roll) {
  const yr = String(year).replace('hsc_', '');
  const exam = String(year).includes('hsc') ? 'HSC' : 'SSC';
  const title = `${studentName} — ${exam} ${yr} Result (Chattogram Board) | Roll ${roll}`;
  const desc  = `Subject-wise marks, GPA, total and rank for ${studentName} (${exam} ${yr}, ${group}) — Chattogram Board.`;
  const pagePath = location.pathname.includes('entity.html') ? location.pathname : '/rank/entity.html';
  const url   = `${location.origin}${pagePath}?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&roll=${encodeURIComponent(roll)}`;

  document.title = title;
  upsertMeta('description', desc);
  setCanonical(url);
  upsertProperty('og:title', title);
  upsertProperty('og:description', desc);
  upsertProperty('og:url', url);
  upsertMeta('twitter:title', title);
  upsertMeta('twitter:description', desc);

  injectJSONLD({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": studentName,
    "identifier": `${exam}-${yr}-${roll}`,
    "affiliation": { "@type": "EducationalOrganization", "name": "Chattogram Education Board" }
  }, 'student');
}


// ===== JSON-LD: breadcrumbs + dataset =====
function injectBreadcrumbs(homeUrl, year, group, school) {
  const items = [
    { "@type":"ListItem", "position":1, "name":"Home", "item": homeUrl }
  ];
  if (year) items.push({ "@type":"ListItem", "position":2, "name": String(year).replace('hsc_','') });
  if (group) items.push({ "@type":"ListItem", "position":3, "name": group });
  if (school) items.push({ "@type":"ListItem", "position":4, "name": school });

  injectJSONLD({
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement": items
  }, 'breadcrumbs');
}

function injectDatasetForYearGroup(year, group) {
  const isHSC = String(year).includes('hsc');
  const yr = String(year).replace('hsc_','');
  const exam = isHSC ? 'HSC' : 'SSC';

  injectJSONLD({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${exam} ${yr} ${group} Result Ranking — Chattogram Board`,
    "description": `Unofficial ${exam} ${yr} ${group} rankings for Chattogram Board including GPA, totals, school names and positions.`,
    "creator": { "@type":"Organization", "name":"BoardRankCTG" },
    "distribution": [
      { "@type":"DataDownload", "encodingFormat":"text/tab-separated-values", "contentUrl": `${location.origin}${location.pathname.replace(/index\.html?$/,'')}data_${year}_${group.toLowerCase()}.txt` }
    ],
    "license": "https://creativecommons.org/licenses/by/4.0/"
  }, 'dataset');
}

function injectDatasetForSchool(year, group, schoolName) {
  const yr = String(year).replace('hsc_','');
  const exam = String(year).includes('hsc') ? 'HSC' : 'SSC';
  injectJSONLD({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${schoolName} — ${exam} ${yr} Ranking (Chattogram Board)`,
    "description": `Ranking table for ${schoolName} in ${exam} ${yr}, ${group} — GPA, totals and positions.`,
    "creator": { "@type":"Organization", "name":"BoardRankCTG" }
  }, 'dataset');
}


// ===== Crypto helpers (XOR + base64 wrapper fetch) =====
function xorDecrypt(dataBytes, key) {
  const keyBytes = new TextEncoder().encode(key);
  return dataBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
}

async function fetchAndDecode(url, key) {
  const res = await fetch(url);
  const encodedText = await res.text();
  const decodedBase64 = atob(encodedText);
  const decodedBytes = new Uint8Array(decodedBase64.split("").map(c => c.charCodeAt(0)));
  const originalBytes = xorDecrypt(decodedBytes, key);
  return new TextDecoder().decode(originalBytes);
}


// ===== Utilities: debounce, popup, toast =====
function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

function openPopup(contentHTML) {
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = contentHTML;
  document.body.appendChild(popup);
  document.body.classList.add('locked');
  popup.classList.add('pop-in');
  history.pushState({ popupOpen: true }, '');
}
function closePopup() {
  // Close the top-most popup (last .popup in the DOM)
  const popups = document.querySelectorAll('.popup');
  const popup = popups[popups.length - 1];
  if (popup) {
    popup.classList.add('pop-out');
    setTimeout(() => {
      popup.remove();
      // Only unlock body if no other popups remain
      if (!document.querySelector('.popup')) {
        document.body.classList.remove('locked');
      }
    }, 500);
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #222;
    color: #fff;
    padding: 10px 16px;
    font-size: 14px;
    border-radius: 6px;
    z-index: 9999;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}


// ===== Loader overlay (global: window.showLoadingIndicator / window.hideLoadingIndicator) =====
(function(){
  const STYLE_ID = 'br-loader-styles';
  function ensureLoaderStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#dataLoaderOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 10050; display: flex; align-items: center; justify-content: center; }
#dataLoaderOverlay .loader-box { background: #fff; padding: 20px 28px; border-radius: 12px; max-width: 320px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
#dataLoaderOverlay .rings { width: 96px; height: 96px; margin: 0 auto; position: relative; }
#dataLoaderOverlay .ring { position: absolute; border-radius: 50%; border: 6px solid transparent; border-top-color: #1976d2; animation: spin 1s linear infinite; }
#dataLoaderOverlay .ring.r2 { width: 64px; height: 64px; top: 16px; left: 16px; border-top-color: #ff8f00; animation-duration: 1.4s; }
#dataLoaderOverlay .ring.r3 { width: 40px; height: 40px; top: 28px; left: 28px; border-top-color: #6a1b9a; animation-duration: 1.85s; }
@keyframes spin { to { transform: rotate(360deg); } }
#dataLoaderOverlay .percent { font-size: 22px; font-weight: bold; margin-top: 8px; }
#dataLoaderOverlay .subtext { font-size: 13px; color: #555; margin-top: 4px; }
#dataLoaderOverlay button { margin-top: 12px; padding: 6px 14px; border-radius: 6px; background: #1976d2; color: #fff; border: none; cursor: pointer; }
    `;
    document.head.appendChild(s);
  }

  window.showLoadingIndicator = function() {
    if (document.getElementById('dataLoaderOverlay')) return;
    ensureLoaderStyles();

    const overlay = document.createElement('div');
    overlay.id = 'dataLoaderOverlay';
    overlay.innerHTML = `
      <div class="loader-box">
        <div class="rings">
          <div class="ring r1" style="width:96px;height:96px;"></div>
          <div class="ring r2"></div>
          <div class="ring r3"></div>
        </div>
        <div id="brLoaderPercent" class="percent">1%</div>
        <div id="brLoaderSub" class="subtext">Preparing files…</div>
      </div>
    `;
    document.body.appendChild(overlay);

    const percentEl = document.getElementById('brLoaderPercent');
    const subEl = document.getElementById('brLoaderSub');

    // Super-fast fake progress to 99%
    window.__br_fakeP = 1;
    clearInterval(window.__br_fakeTimer);
    window.__br_fakeTimer = setInterval(() => {
      if (!document.getElementById('dataLoaderOverlay')) { clearInterval(window.__br_fakeTimer); return; }
      if (window.__br_fakeP < 99) {
        window.__br_fakeP += 1;
        percentEl.textContent = window.__br_fakeP + '%';
        if (window.__br_fakeP < 20) subEl.textContent = 'Connecting to server…';
        else if (window.__br_fakeP < 50) subEl.textContent = 'Downloading result files…';
        else if (window.__br_fakeP < 80) subEl.textContent = 'Processing student data…';
        else subEl.textContent = 'Almost done…';
      } else {
        clearInterval(window.__br_fakeTimer);
      }
    }, 8);

    // Streaming update hook (subtitle only)
    window.step = function(loaded, total) {
      if (!document.getElementById('dataLoaderOverlay')) return;
      if (!total || !loaded) return;
      const ratio = loaded / total;
      if (ratio < 0.2) subEl.textContent = 'Connecting to server…';
      else if (ratio < 0.5) subEl.textContent = 'Downloading result files…';
      else if (ratio < 0.8) subEl.textContent = 'Processing student data…';
      else subEl.textContent = 'Almost done…';
    };
  };

  window.hideLoadingIndicator = function(opts = {}) {
    const overlay = document.getElementById('dataLoaderOverlay');
    if (!overlay) return;

    const percentEl = document.getElementById('brLoaderPercent');
    const subEl = document.getElementById('brLoaderSub');

    clearInterval(window.__br_fakeTimer);

    const noData = opts.forceError === true ||
                   (typeof filteredData !== 'undefined' && Array.isArray(filteredData) && filteredData.length === 0);

    if (noData) {
      overlay.querySelector('.loader-box').innerHTML = `
        <h2 style="color:#fca5a5; margin:6px 0;">❗ Data NOT FOUND</h2>
        <p style="color:#e5e7eb; margin-bottom: 10px;">
          ${opts.errorMessage || 'This selected results are not yet available.'}
        </p>
        <button onclick="window.location.href='index.html'">Go Back</button>
      `;
      return; // keep overlay to show the error UI
    }

    if (percentEl) percentEl.textContent = '100%';
    if (subEl) subEl.textContent = 'Done';

    requestAnimationFrame(() => overlay.remove());
  };
})();


// ===== Theme + Nav toggles (just the functions; wire them elsewhere) =====
function initThemeToggle() {
  const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.body.classList.toggle('dark-mode', saved === 'dark');
  const t = document.getElementById('themeToggle');
  if (t) {
    t.checked = saved === 'dark';
    t.addEventListener('change', () => {
      const isDark = t.checked;
      document.body.classList.toggle('dark-mode', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}

function initNavToggle() {
  const btn = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');
  if (!btn || !links) return;

  const openNav = () => {
    links.classList.add('open');
    overlay?.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  };
  const closeNav = () => {
    links.classList.remove('open');
    overlay?.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };
  const toggleNav = () => {
    if (links.classList.contains('open')) closeNav(); else openNav();
  };

  btn.addEventListener('click', toggleNav);
  overlay?.addEventListener('click', closeNav);

  links.querySelectorAll('a, .linklike, input[type="checkbox"]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.matches('input[type="checkbox"]')) return;
      closeNav();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) closeNav();
  });
} 