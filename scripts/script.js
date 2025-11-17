const contentDiv = document.getElementById('content');
function isAdmin(){ return localStorage.getItem('userId') === 'admin1234'; }

const currentYear = document.getElementById('currentYear');
const currentGroup = document.getElementById('currentGroup');
const noDataMessage = document.getElementById('noDataMessage');
const yearDropdown = document.getElementById('yearDropdown');


/* ==== SEO/Share helpers ==== */
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

/* Year+Group page: dynamic SEO */
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

/* School page: dynamic SEO */
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
/* Breadcrumbs JSON-LD */
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

/* Dataset JSON-LD for a ranking table */
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

/* Dataset JSON-LD for a specific school's table */
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


function showRankTipsPopup() {
  if (document.querySelector('.popup')) return;

  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `
    <div class="popup-content help-popup" style="max-width: 720px;">
      <span class="close-btn" onclick="closePopup()">&times;</span>
      <h2 style="margin-top:0;">How it works</h2>

      <div class="help-grid">
        <div class="help-item">
          <div class="hi-text">Pick SSC/HSC + year. Then you can search, filter, and open details.</div>
        </div>

      <p class="help-note">Note: This is an unofficial ranking made from publicly available data.</p>
    </div>
  `;
  document.body.appendChild(popup);
  document.body.classList.add('locked');
  (function(){
    const pc = popup.querySelector('.popup-content');
    if (!pc) return;
    const r = String(roll);
  
    if (isAdmin()) {
      const bar = document.createElement('div');
      bar.className = 'admin-hidebar';
      bar.innerHTML = `
        <span>Admin</span>
        <button id="hrHideBtn" class="btn-secondary" style="margin-left:8px;">Hide</button>
        <button id="hrUnhideBtn" class="btn-secondary" style="margin-left:6px;display:none;">Unhide</button>
      `;
      pc.appendChild(bar);
  
      const applyState = () => {
        const hidden = window.__br_hiddenRolls?.has(r);
        pc.classList.toggle('admin-blur', hidden);
        bar.querySelector('#hrHideBtn').style.display = hidden ? 'none' : 'inline-block';
        bar.querySelector('#hrUnhideBtn').style.display = hidden ? 'inline-block' : 'none';
      };
      applyState();
  
      bar.querySelector('#hrHideBtn')?.addEventListener('click', async ()=>{ await window.hideResultRoll?.(r); applyState(); });
      bar.querySelector('#hrUnhideBtn')?.addEventListener('click', async ()=>{ await window.unhideResultRoll?.(r); applyState(); });
    } else if (window.__br_hiddenRolls?.has(r)) {
      closePopup();
      showErrorPopup("This result has been hidden by admin.");
    }
  })();
  

  // Wire quick commands → open bot and send
  popup.querySelectorAll('.help-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cmd = btn.getAttribute('data-cmd') || '';
      const launcher = document.getElementById('hb-launcher');
      const input = document.getElementById('hb-input');
      const send = document.getElementById('hb-send');

      // open bot panel
      if (typeof togglePanel === 'function') togglePanel(true);
      else launcher?.click();

      setTimeout(()=>{
        const i = document.getElementById('hb-input');
        const s = document.getElementById('hb-send');
        if (i && s) {
          i.value = cmd;
          s.click();
        }
      }, 180);
    });
  });
}
document.getElementById('helpBtn').addEventListener('click', showRankTipsPopup);

function loadYear(year) {
    if (year) {
        document.getElementById("selectPrompt").style.display = "none";

        document.querySelectorAll('.featured-box').forEach(b => b.remove());


        const newUrl = `${location.pathname}?year=${year}`;
        history.pushState({}, '', newUrl);
    
        currentYear.textContent = ` ${year}`;
        currentGroup.style.display = 'none';
        noDataMessage.style.display = 'none';
        contentDiv.innerHTML = `
            <p>Select your group:</p>
            <div class="group-buttons">
                <button onclick="loadGroup('${year}', 'Science')">
                    <img src="asset/sci.png" alt="Science Icon">Science
                </button>
                <button onclick="loadGroup('${year}', 'Commerce')">
                    <img src="asset/com.png" alt="Commerce Icon">Business
                </button>
                <button onclick="loadGroup('${year}', 'Arts')">
                    <img src="asset/hum.png" alt="Arts Icon">Humanities
                </button>
            </div>
        `;
    } else {
        contentDiv.innerHTML = '';
    }
}


function loadGroup(year, group) {
    currentGroup.style.display = 'inline';
    currentGroup.textContent = `${group} Group`;
    // 🔹 Dynamically update page title for SEO
let examType = year.includes('hsc') ? 'HSC' : 'SSC';
let formattedYear = year.replace('hsc_', '');
document.title = `BOARD RANK OF ${examType} ${formattedYear} of ${group}`;
updateSEOForYearGroup(year, group);
injectDatasetForYearGroup(year, group);
injectBreadcrumbs(`${location.origin}${location.pathname}`, year, group, null);


    yearDropdown.style.display = 'none';
    contentDiv.innerHTML = `
    
        <h3 id="examResultHeader"></h3> 
        <div class="search-container">
            <label for="searchInput">Search by Name:</label>
            <input type="text" id="searchInput" class="search-input" placeholder="Enter name" oninput="debounce(handleSearchInput, 300)()">
        </div>
        <div class="search-container">
            <label for="searchRollInput">Search by Roll:</label>
            <input type="text" id="searchRollInput" class="search-input" placeholder="Enter roll" oninput="debounce(handleRollSearchInput, 300)()">
        </div>
        <div class="search-container">
            <label for="InstituationDropdown">Select Instituation:</label>
            <select id="InstituationDropdown" onchange="filterByInstituation()"></select>
        </div>
        
      <button id="resetFilterBtn" style="display: none;" onclick="resetFilter()">Reset Filter</button>
<div class="loading-spinner" id="loadingSpinner" style="display: none;"></div>
<p id="tableHint" style="margin-top: 20px; font-weight: bold;">
    💡 Click on student names to see detailed result and on school names to see school BASED RANK
</p>
<table>

        <table>
            <thead>
                <tr>
                    <th>Serial</th>
                    <th>Name</th>
                    <th>Roll</th>
                    <th>GPA</th>
                    <th>Total</th>
                    <th>Institution</th>
                </tr>
            </thead>
            <tbody id="studentTableBody"></tbody>
        </table>
        <div class="pagination">
            <button id="firstBtn" onclick="handleFirstButtonClick()">First</button>
            <button id="prevBtn" onclick="handlePrevButtonClick()">Previous</button>
            <span id="paginationInfo">Loading data...</span>
            <button id="nextBtn" onclick="handleNextButtonClick()">Next</button>
            <button id="lastBtn" onclick="handleLastButtonClick()">Last</button>
        </div>
    `;
    const newUrl = `${location.pathname}?year=${year}&group=${group}`;
    history.pushState({}, '', newUrl);

    printExamResultHeader(year); 
    fetchData(year, group);
    setTimeout(attachSearchSuggestions, 0);

}

function printExamResultHeader(year) {
    const headerElement = document.getElementById('examResultHeader');
    if (headerElement) {
        let examType = year.includes('hsc') ? 'HSC' : 'SSC';
        let formattedYear = year.replace('hsc_', '');
        headerElement.textContent = `${examType.toUpperCase()} ${formattedYear} Result`;
    }
}

let allData = [];
let filteredData = [];
const studentsPerPage = 100;
let currentPage = 1;
const InstituationSet = new Set();
window.InstituationSet = InstituationSet;
window._br_clickListenerSet = window._br_clickListenerSet || new Set();



function fetchData(year, group) {
    showLoadingIndicator();

const mainDataUrl = `DATA/data_${year}_${group.toLowerCase()}.txt`;
const individualDataUrl = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;

    const cacheKey = `rankData_${year}_${group}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { mainData, individualData } = JSON.parse(cached);
            processData(mainData, individualData || null);
            populateInstituationDropdown();
            updateTableData();
            hideLoadingIndicator();
        } catch (err) {
            console.warn('Cache parse failed', err);
        }
    }

    // ✅ 2. Fetch fresh data in background and update cache
    fetch(mainDataUrl)
    .then(res => {
        const reader = res.body.getReader();
        const contentLength = +res.headers.get('Content-Length') || 0;
        let loaded = 0;
        return new Response(new ReadableStream({
            start(controller) {
                function push() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        loaded += value.length;
                        step(loaded, contentLength);
                        controller.enqueue(value);
                        push();
                    });
                }
                push();
            }
        })).text();
    })

}




let visitorInfoCompleted = localStorage.getItem('visitorInfoGiven') === '1';

function getDeviceDataAndFingerprint() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const screenRes = `${screen.width}x${screen.height}`;
  const deviceMemory = navigator.deviceMemory || null;
  const cores = navigator.hardwareConcurrency || null;
  const vendor = navigator.vendor || '';

  let deviceModel = 'Unknown device';
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+[\d.]+;\s+([^)]+)/i);
    if (match && match[1]) {
      deviceModel = match[1].replace(/Build\/.+/, '').trim();
    }
  } else if (/iPhone/i.test(ua)) {
    deviceModel = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    deviceModel = 'Apple iPad';
  } else if (/Macintosh/i.test(ua)) {
    deviceModel = 'Apple Mac';
  } else if (/Windows/i.test(ua)) {
    deviceModel = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    deviceModel = 'Linux Device';
  }

  const deviceData = {
    ua,
    platform,
    screen: screenRes,
    deviceMemory,
    cores,
    vendor,
    deviceModel
  };

  const seed = `${ua}|${platform}|${screenRes}|${deviceMemory}|${cores}|${vendor}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) + seed.charCodeAt(i);
    h = h & 0xffffffff;
  }
  const fingerprint = (h >>> 0).toString(16);

  return { deviceData, fingerprint };
}
function getOrCreateVisitorId() {
  let id = localStorage.getItem('visitorIdV2');
  if (!id) {
    try { id = crypto.randomUUID(); }
    catch { id = String(Date.now()) + Math.random().toString(36).slice(2); }
    localStorage.setItem('visitorIdV2', id);
  }
  return id;
}
async function showIndividualResultWithCheck(roll, year, group) {
  
  const params = new URLSearchParams(window.location.search);

  if (params.has('roll') && params.get('roll') == roll) {
    return showIndividualResult(roll, year, group);
    
  }
let clickCount = parseInt(localStorage.getItem('detailedResultClickCount') || '0', 10);
clickCount++;
localStorage.setItem('detailedResultClickCount', clickCount);

if (clickCount <= 10) { 
  
const visitorId = getOrCreateVisitorId();

// If already verified on this device, allow immediately
if (localStorage.getItem('visitorVerifiedV2') === '1') {
  return showIndividualResult(roll, year, group);
}

try {
  const dbLib = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const { getDatabase, ref, get } = dbLib;
  const dbv = getDatabase();
  const snap = await get(ref(dbv, 'visitorsVerified/' + visitorId));
  if (snap && snap.exists() && snap.val() === 1) {
    localStorage.setItem('visitorVerifiedV2', '1');
    return showIndividualResult(roll, year, group);
  }
} catch (e) {
  // No blocking if check fails
}
  return showIndividualResult(roll, year, group);
}

  const { deviceData, fingerprint } = getDeviceDataAndFingerprint();

  if (localStorage.getItem('visitorInfoGiven') === '1' &&
      localStorage.getItem('visitorFingerprint') === fingerprint) {
    visitorInfoCompleted = true;
    return showIndividualResult(roll, year, group);
    
  }

  try {
    const dbLib = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
    const { getDatabase, ref, get, query, orderByChild, equalTo } = dbLib;
    const dbv = getDatabase();
    const q = query(ref(dbv, 'visitors'), orderByChild('fingerprint'), equalTo(fingerprint));
    const snap = await get(q);
    if (snap && snap.exists()) {
      localStorage.setItem('visitorInfoGiven', '1');
      localStorage.setItem('visitorFingerprint', fingerprint);
      visitorInfoCompleted = true;
      return showIndividualResult(roll, year, group);
    }
  } catch (err) {
    // If the query fails (offline or permission), just continue to show the form.
    console.warn('Fingerprint check failed (ignoring):', err);
  }

  // Show improved visitor form popup
  if (document.querySelector('.popup')) return; // avoid duplicates
  const popup = document.createElement('div');
  popup.classList.add('popup');
  popup.innerHTML = `
  <div class="popup-content">
<div class="popup-header" style="
    background: linear-gradient(135deg, #1976d2, #42a5f5);
    color: white;
    font-weight: bold;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
">
  <div style="display: flex; align-items: center; gap: 8px;">
    <img src="https://img.icons8.com/color/48/verified-badge.png" alt="Icon" style="width: 28px; height: 28px;">
    <span>Quick Verification</span>
  </div>
  <button class="close-btn" onclick="visitorInfoDenied()" style="
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: white;
      cursor: pointer;
  ">&times;</button>
</div>

    <div class="popup-body">
      <p style="color:#555;">Please tell us a bit about yourself so we can improve our service. We store basic device info so you won't see this again on the same device.</p>
      
      <label>Name</label>
      <input id="visitorName" type="text" placeholder="Your name" />

      <label>Institution (school / college)</label>
      <input id="visitorInstitution" type="text" placeholder="Institution name" />

      <label>Type</label>
      <select id="visitorType">
        <option value="">Select ...</option>
        <option>SSC</option>
        <option>HSC</option>
        <option>Others</option>
      </select>

      <label>How did you find us?</label>
      <select id="visitorSource">
        <option value="">Select ...</option>
        <option>WhatsApp group</option>
        <option>Facebook group</option>
        <option>Friend / Classmate</option>
        <option>Facebook post</option>
        <option>Instagram</option>
        <option>YouTube</option>
        <option>Google Search</option>
        <option>School notice board</option>
        <option>Teacher</option>
        <option>Relatives</option>
        <option>Other social media</option>
        <option>Others</option>
      </select>

      <label>Experience so far</label>
      <select id="visitorExperience">
        <option value="">Select ...</option>
        <option value="worst">😖 Worst</option>
        <option value="bad">😞 Bad</option>
        <option value="average">😐 Average</option>
        <option value="good">🙂 Good</option>
        <option value="best">🤩 Best</option>
      </select>


      <label>Leave a Message (optional)</label>
<textarea id="visitorMessage" placeholder="Write something..." style="min-height:60px;"></textarea>

    </div>
    <div class="popup-footer">
      <button class="secondary-btn" onclick="visitorInfoDenied()">Cancel</button>

      <button id="submitVisitorInfo" class="primary-btn">Submit</button>
    </div>
  </div>
`;

  document.body.appendChild(popup);
  document.body.classList.add('locked');
  
  function looksFakeName(name) {
    if (!name) return true;
    const cleaned = name.trim();

    if (cleaned.length < 3 || cleaned.length > 40) return true;

    if (!/^[a-zA-Z\s]+$/.test(cleaned)) return true;

    const vowelCount = (cleaned.match(/[aeiouAEIOU]/g) || []).length;
    if (vowelCount < 2) return true;

    if (/(.)\1{3,}/.test(cleaned)) return true;

    return false;
}

  document.getElementById('submitVisitorInfo').addEventListener('click', async () => {
    const name = document.getElementById('visitorName').value.trim();
    const institution = document.getElementById('visitorInstitution').value.trim();
    const type = document.getElementById('visitorType').value;
    const source = document.getElementById('visitorSource').value;
    const experience = document.getElementById('visitorExperience').value;
    const messageVal = document.getElementById('visitorMessage').value.trim(); 
    if (experience === "worst" || experience === "bad") {
      const body = popup.querySelector('.popup-body');
      const footer = popup.querySelector('.popup-footer');
      if (footer) footer.style.display = 'none';
  
      body.innerHTML = `
          <div style="text-align:center; padding:20px;">
              <div class="access-status">
                  <div class="circle" style="
                      border: 4px solid #ccc;
                      border-top: 4px solid #1976d2;
                      border-radius: 50%;
                      width: 40px;
                      height: 40px;
                      margin: auto;
                      animation: spin 1s linear infinite;
                  "></div>
                  <div style="margin-top: 10px; font-size: 0.95rem;">Checking your feedback…</div>
              </div>
          </div>
          <style>
              @keyframes spin { to { transform: rotate(360deg); } }
          </style>
      `;
  
      setTimeout(() => {
          body.innerHTML = `
              <div style="text-align:center; padding:20px;">
                  <h3 style="color:#b91c1c;">🚫 Access Not Granted</h3>
                  <p style="margin:10px 0; font-size:0.95rem;">
                      Looks like this feature isn’t available with that feedback.  
                      Maybe try again later.
                  </p>
                  <p style="color:#666; font-size:0.85rem;">
                      We’re always working to improve — your opinion is noted.
                  </p>
                  <button onclick="visitorInfoDenied()" class="secondary-btn" style="margin-top:15px;">
                      Close
                  </button>
              </div>
          `;
      }, 1500);
  
      return;
  }
  if (looksFakeName(name)) {
    const body = popup.querySelector('.popup-body');
    const footer = popup.querySelector('.popup-footer');
    if (footer) footer.style.display = 'none';

    body.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <div class="circle" style="
                border: 4px solid #ccc;
                border-top: 4px solid #1976d2;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                margin: auto;
                animation: spin 1s linear infinite;
            "></div>
            <div style="margin-top: 10px; font-size: 0.95rem;">Verifying name…</div>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    setTimeout(() => {
        body.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#b91c1c;">🚫 Access Not Granted</h3>
                <p style="margin:10px 0; font-size:0.95rem;">
                    The name provided doesn’t seem valid.  
                    Please use your real name to continue.
                </p>
                <button onclick="visitorInfoDenied()" class="secondary-btn" style="margin-top:15px;">
                    Close
                </button>
            </div>
        `;
    }, 1500);

    return;
}

    if (!name || name.length < 4) {
        alert('Name must contain at least 4 characters.');
        return;
    }
    if (!institution || institution.length < 3) {
        alert('Institution name must contain at least 3 characters.');
        return;
    }
    if (!type || !source) {
        alert('Please fill all required fields.');
        return;
    }

    const body = popup.querySelector('.popup-body');
    const footer = popup.querySelector('.popup-footer');
    const originalFormHTML = body.innerHTML;
    if (footer) footer.style.display = 'none';

    body.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <h3 style="color:#d97706; margin-bottom:8px;">⚠ Confirm Your Name</h3>
            <p>Are you sure your name is <b>"${name}"</b>?</p>
            <p style="font-size:0.9rem; color:#555;">
                If you use a fake name, this form will appear again every time you visit.
                Please enter real details to avoid repeated verification.
            </p>
            <div style="margin-top:15px; display:flex; justify-content:center; gap:12px;">
                <button id="confirmNameBtn" class="primary-btn">Confirm</button>
                <button id="editNameBtn" class="secondary-btn">Edit Name</button>
            </div>
        </div>
    `;

   
    document.getElementById('confirmNameBtn').addEventListener('click', async () => {
        localStorage.setItem('visitorInfoGiven', '1');
        localStorage.setItem('visitorFingerprint', fingerprint);
        visitorInfoCompleted = true;

        try {
            const dbLib = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
            const { getDatabase, ref, push, set } = dbLib;
            const dbv = getDatabase();
            const visitorRef = push(ref(dbv, "visitors"));
            await set(visitorRef, {
              
              name,
              institution,
              type,
              source,
              experience,
              message: messageVal,
              fingerprint,
              deviceData,
              timestamp: Date.now()
              
          });
          try {
            const verRef = ref(dbv, "visitorsVerified/" + getOrCreateVisitorId());
            await set(verRef, 1);
            localStorage.setItem('visitorVerifiedV2', '1');
          } catch (e) {}
          
          try { window.__HAS9_notify(name); } catch (e) {}

          
        } catch (err) {
            console.error('Error saving visitor info:', err);
        }

        // Spinner → success
        body.innerHTML = `
            <div class="access-status">
                <div class="circle"></div>
                <div class="status-text">Processing...</div>
            </div>
        `;
        setTimeout(() => {
            body.innerHTML = `
                <div class="access-status">
                    <div class="tick">✅</div>
                    <div class="status-text" style="color:#16a34a;">Full Access Granted</div>
                </div>
            `;
            setTimeout(() => {
                closePopup();
                showIndividualResult(roll, year, group);
            }, 1500);
        }, 1000);
    });

    document.getElementById('editNameBtn').addEventListener('click', () => {
     
      body.innerHTML = originalFormHTML;
      footer.style.display = 'flex';
  

      document.getElementById('visitorName').value = name;
      document.getElementById('visitorInstitution').value = institution;
      document.getElementById('visitorType').value = type;
      document.getElementById('visitorSource').value = source;
      document.getElementById('visitorExperience').value = experience;
  

      document.getElementById('submitVisitorInfo').addEventListener('click', submitHandler);
  });
  
  
});

}
document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  if (userId !== "admin1234") {
    document.getElementById("visitorsLink")?.remove();
  }
  // both Help buttons point to same handler
  document.getElementById('helpBtnHero')?.addEventListener('click', showRankTipsPopup);
  initThemeToggle();
  initNavToggle();
});

function processData(mainData, individualData) {
    const rows = mainData.trim().split('\n').slice(1);
    const individualScores = parseIndividualData(individualData);
    allData = rows.map(row => {
        const [serial, name, roll, gpa, total, Instituation] = row.split('\t');
        const individual = individualScores[roll] || {};
        InstituationSet.add((Instituation || '').trim());
        return {
            serial: parseInt(serial),
            name,
            roll: parseInt(roll),
            gpa: parseFloat(gpa),
            total: parseInt(total),
            Instituation: (Instituation || '').trim(),
            ...individual
        };
    });
    console.log('Processed data:', allData);
    allData = allData.filter(student => !isNaN(student.gpa) && !isNaN(student.total));
    allData.sort(compareStudents);
    console.log('Sorted data:', allData);
    filteredData = [...allData];
    updateTableData();
    try {
      window.allData = allData;
      window.filteredData = filteredData;
      document.dispatchEvent(new CustomEvent('rank:data-ready'));
    } catch(e){}
    
}

function parseIndividualData(data) {
  if (!data) return {};
  const meta = (window.__br_currentDatasetMeta || {});
  const rows = data.trim().split('\n');
  const scores = {};

  rows.forEach(row => {
      const cols = row.split('\t');
      const roll = (cols[0] || '').trim();

      // Keep existing tie-break fields so nothing breaks
      // These indexes match your old code:
      const phy = parseInt(cols[6]);
      const chem = parseInt(cols[7]);
      const math = parseInt(cols[8]); // same as your old destructuring

      // Detect exam type for totals (HSC rows are shorter)
      const isHSC = (String(meta.year || '').includes('hsc')) || (cols.length <= 8);

      // Subject totals map (by column index)
      let subjectIdxTotals;
      if (isHSC) {
        // HSC: roll + 7 subjects => [1..7]
        // 200: Bangla, English, Physics, Chemistry, Compulsory, Optional
        // 100: ICT
        subjectIdxTotals = [
          [1,200],[2,200],[3,100],[4,200],[5,200],[6,200],[7,200]
        ];
      } else {
        // SSC: roll + 12 subjects => [1..12]
        // 200: Bangla, English
        // 100: Math, BGS, Religion, Physics, Chemistry, Compulsory, Optional, Physical
        // 50:  ICT, Career
        subjectIdxTotals = [
          [1,200],[2,200],[3,100],[4,100],[5,100],[6,100],
          [7,100],[8,100],[9,50],[10,100],[11,100],[12,50]
        ];
      }

      const allAPlus = subjectIdxTotals.every(([idx, total]) => {
        const m = parseFloat(cols[idx]);
        if (isNaN(m)) return false; // missing mark => not all A+
        const pct = (m / total) * 100;
        return pct >= 79.5;
      });

      scores[roll] = {
        phy: isNaN(phy) ? undefined : phy,
        chem: isNaN(chem) ? undefined : chem,
        math: isNaN(math) ? undefined : math,
        allAPlus
      };
  });

  console.log('Parsed individual scores (with allAPlus):', scores);
  return scores;
}


function compareStudents(a, b) {
    if (a.gpa !== b.gpa) return b.gpa - a.gpa;
    if (a.total !== b.total) return b.total - a.total;
    if (a.phy !== b.phy) return b.phy - a.phy;
    if (a.chem !== b.chem) return b.chem - a.chem;
    return b.math - a.math;
}

function makeSchoolNamesClickable() {
    const schoolNames = document.querySelectorAll('td:nth-child(6)'); 
    schoolNames.forEach(schoolName => {
        schoolName.style.cursor = 'pointer';
        schoolName.style.color = 'blue';
        schoolName.addEventListener('click', () => showSchoolRanking(schoolName.textContent.trim()));
    });
}



function showSchoolRanking(encodedSchoolName) {
    scrollToTop();
    const schoolName = (()=>{ try{return decodeURIComponent(encodedSchoolName);}catch(e){return encodedSchoolName;} })();
try {
  const params = new URLSearchParams(window.location.search);
  const y = params.get('year') || (document.getElementById('currentYear')?.textContent || '').trim();
  const examType = (y && y.includes('hsc')) ? 'HSC' : 'SSC';
  const formattedYear = (y || '').replace('hsc_', '');
  document.title = `${schoolName} | ${formattedYear} ${examType}`;
const yr = params.get('year'); 
const grp = params.get('group');
updateSEOForSchool(yr, grp, schoolName);
injectDatasetForSchool(yr, grp, schoolName);
injectBreadcrumbs(`${location.origin}${location.pathname}`, yr, grp, schoolName);

} catch (e) { /* no-op */ }

try {
  const params = new URLSearchParams(window.location.search);
  params.set('school', schoolName);
  history.pushState({}, '', `${location.pathname}?${params.toString()}`);
} catch (e) {
  console.error('Error updating URL for school:', e);
}

const schoolData = allData
  .filter(student => (student.Instituation || '').trim().toLowerCase() === schoolName.trim().toLowerCase())
  .filter(student => isAdmin() || !((window.__br_hiddenRolls || new Set()).has(String(student.roll))));
schoolData.sort(compareStudents);

    if (schoolData.length === 0) {
        contentDiv.innerHTML = `<h2>No data found for "${schoolName}"</h2>`;
    } else {
        contentDiv.innerHTML = `
            <h2>Showing rank of "${schoolName}"</h2>
            <button onclick="resetSchoolRanking()">Back</button>

            <table>
                <thead>
                    <tr>
                        <th>Serial</th>
                        <th>Name</th>
                        <th>Roll</th>
                        <th>GPA</th>
                        <th>Total</th>
                        <th>Institution</th>
                    </tr>
                </thead>
                <tbody>
                    ${schoolData.map((student, index) => `
                        <tr>
                            <td>${index + 1}</td>
                           <td class="student-name" onclick="
  (function(){
    if (window.incrementClickCount) incrementClickCount(${student.roll});
    showIndividualResultWithCheck(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}');
  })()
">${student.name}</td>

<td class="student-roll" onclick="
  (function(){
    if (window.incrementClickCount) incrementClickCount(${student.roll});
    showIndividualResultWithCheck(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}');
  })()
">${student.roll}</td>

<td><span class="${student.allAPlus ? 'gpa-shine' : ''}" title="${student.allAPlus ? 'All subjects ≥ 79.5%' : ''}">${student.gpa}</span></td>
                            <td>${student.total}</td>
                            <td class="student-school">${student.Instituation}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

function resetSchoolRanking() {
   
    loadGroup(currentYear.textContent.trim(), currentGroup.textContent.split(' ')[0]);
}

function updateTableData() {
  try { window.filteredData = filteredData; } catch(e){}
  const hidden = window.__br_hiddenRolls || new Set();
  const view = isAdmin() ? filteredData : filteredData.filter(s => !hidden.has(String(s.roll)));

  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, view.length);
  const dataToShow = view.slice(startIndex, endIndex);

  const tableBody = document.getElementById('studentTableBody');
  tableBody.innerHTML = '';

  dataToShow.forEach((student) => {
    const row = document.createElement('tr');
    const nameId = `name-${student.roll}`;
    const adminView = isAdmin();

    row.innerHTML = `
      <td>${allData.findIndex(s => s.roll === student.roll) + 1}</td>
 <td class="student-name" id="${nameId}"> 
  <h3 itemprop="name">${student.name}</h3> 
  ${adminView ? `<span class="click-count" data-roll="${student.roll}" title="Opens count" style="margin-left:6px;color:#64748b;font-weight:600;">[${(window.clickCountsCache && window.clickCountsCache[student.roll]) || 0}]</span>` : ''} 
  ${adminView ? `<span class="hide-eye" data-roll="${student.roll}" title="Hide/Unhide">👁️</span>` : ''} 
  ${adminView && window.__br_hiddenRolls?.has(String(student.roll)) ? `<span class="click-count" style="color:#b91c1c;font-weight:900;margin-left:6px;">HIDDEN</span>` : ''} 
</td>

      <td class="student-roll">${student.roll}</td>
<td><span class="${student.allAPlus ? 'gpa-shine' : ''}" title="${student.allAPlus ? 'All subjects ≥ 79.5%' : ''}">${student.gpa}</span></td>
      <td>${student.total}</td>
      <td class="student-school"><h4 itemprop="affiliation">${student.Instituation}</h4></td>
    `;

    const nameCell = row.querySelector('.student-name');
    nameCell.addEventListener('click', (e) => {
      if (e.target.classList.contains('hide-eye')) return;
      if (typeof window.incrementClickCount === 'function') window.incrementClickCount(student.roll);
      showIndividualResultWithCheck(student.roll, currentYear.textContent.split(' ')[1], currentGroup.textContent.split(' ')[0]);
    });

    if (adminView) {
      const eye = row.querySelector('.hide-eye');
      if (eye) {
        eye.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const r = String(ev.currentTarget.dataset.roll || student.roll);
          const hiddenNow = window.__br_hiddenRolls?.has(r);
          if (hiddenNow) await window.unhideResultRoll?.(r);
          else await window.hideResultRoll?.(r);
        });
      }
    }

    row.querySelector('.student-roll').addEventListener('click', () => {
      if (typeof window.incrementClickCount === 'function') window.incrementClickCount(student.roll);
      showIndividualResultWithCheck(student.roll, currentYear.textContent.split(' ')[1], currentGroup.textContent.split(' ')[0]);
    });

    row.querySelector('.student-school').addEventListener('click', () => {
      showSchoolRanking(student.Instituation.trim());
    });

  
    tableBody.appendChild(row);
    if (adminView && typeof window.listenClickCount === 'function') {
      const r = student.roll;
      window._br_clickListenerSet = window._br_clickListenerSet || new Set();
      if (!window._br_clickListenerSet.has(r)) {
        window._br_clickListenerSet.add(r);
        window.listenClickCount(r, (val) => {
          const span = document.querySelector(`.student-name .click-count[data-roll="${r}"]`);
          if (span) span.textContent = `[${val}]`;
        });
      }
    }
    
  });

  const info = document.getElementById('paginationInfo');
  info.textContent = `Showing ${view.length ? (startIndex + 1) : 0}-${endIndex} of ${view.length} students`;
  updatePaginationButtons();
}


function filterByInstituation(InstituationName = null, fromTable = false) {
    const InstituationDropdown = document.getElementById('InstituationDropdown');
    if (fromTable) {
        InstituationDropdown.value = InstituationName;
        const event = new Event('change');
        InstituationDropdown.dispatchEvent(event);
    } else {
        InstituationName = InstituationDropdown.value;
    }

    if (InstituationName) {
      filteredData = allData.filter(student => (student.Instituation || '').trim().toLowerCase() === (InstituationName || '').trim().toLowerCase());
      document.getElementById('resetFilterBtn').style.display = 'block';
    } else {
        resetFilter();
    }
    currentPage = 1;
    updatePage();
}

function resetFilter() {
    filteredData = [...allData];
    currentPage = 1;
    document.getElementById('resetFilterBtn').style.display = 'none';
    updatePage();
}

function updatePage() {
    updateTableData();
    updatePaginationButtons();
}

function handlePrevButtonClick() {
    if (currentPage > 1) {
        currentPage--;
        updatePage();
    }
}
function handleFirstButtonClick() {
    if (currentPage > 1) {
        currentPage = 1;
        updatePage();
    }
}
function handleLastButtonClick() {
    const maxPage = Math.ceil(filteredData.length / studentsPerPage);
    if (currentPage < maxPage) {
        currentPage = maxPage;
        updatePage();
    }
}


function handleNextButtonClick() {
    const maxPage = Math.ceil(filteredData.length / studentsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        updatePage();
    }
}

function getVisibleLength() {
  const hidden = window.__br_hiddenRolls || new Set();
  return isAdmin() ? filteredData.length : filteredData.filter(s => !hidden.has(String(s.roll))).length;
}
function updatePaginationButtons() {
  const visibleLen = getVisibleLength();
  const maxPage = Math.ceil(visibleLen / studentsPerPage) || 1;
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage >= maxPage || visibleLen === 0;
}

function handleSearchInput() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    filteredData = allData.filter(student => student.name.toLowerCase().includes(searchTerm));
    currentPage = 1;
    updatePage();
}

function handleRollSearchInput() {
    const rollSearchTerm = document.getElementById('searchRollInput').value.trim();
    filteredData = allData.filter(student => student.roll.toString().includes(rollSearchTerm));
    currentPage = 1;
    updatePage();
}

function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

function populateInstituationDropdown() {
    const InstituationDropdown = document.getElementById('InstituationDropdown');
    InstituationDropdown.innerHTML = '<option value="">Select Instituation</option>';
    InstituationSet.forEach(Instituation => {
        const option = document.createElement('option');
        option.value = Instituation;
        option.textContent = Instituation;
        InstituationDropdown.appendChild(option);
    });
}


(function(){
  const STYLE_ID = 'br-loader-styles';
  function ensureLoaderStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#dataLoaderOverlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 10050;
  display: flex; align-items: center; justify-content: center;
}
#dataLoaderOverlay .loader-box {
  background: #fff;
  padding: 20px 28px;
  border-radius: 12px;
  max-width: 320px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}
#dataLoaderOverlay .rings {
  width: 96px; height: 96px; margin: 0 auto; position: relative;
}
#dataLoaderOverlay .ring {
  position: absolute;
  border-radius: 50%;
  border: 6px solid transparent;
  border-top-color: #1976d2;
  animation: spin 1s linear infinite;
}
#dataLoaderOverlay .ring.r2 {
  width: 64px; height: 64px;
  top: 16px; left: 16px;
  border-top-color: #ff8f00;
  animation-duration: 1.4s;
}
#dataLoaderOverlay .ring.r3 {
  width: 40px; height: 40px;
  top: 28px; left: 28px;
  border-top-color: #6a1b9a;
  animation-duration: 1.85s;
}
@keyframes spin { to { transform: rotate(360deg); } }
#dataLoaderOverlay .percent {
  font-size: 22px; font-weight: bold; margin-top: 8px;
}
#dataLoaderOverlay .subtext {
  font-size: 13px; color: #555; margin-top: 4px;
}
#dataLoaderOverlay button {
  margin-top: 12px; padding: 6px 14px;
  border-radius: 6px; background: #1976d2; color: #fff;
  border: none; cursor: pointer;
}
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
    }, 8); // 0→99 in ~0.8s
  
    // Optional: keep streaming updates only for the subtitle (safeguard for code that calls step)
    window.step = function(loaded, total) {
      if (!document.getElementById('dataLoaderOverlay')) return;
      if (!total || !loaded) return;
      const ratio = loaded / total;
      if (ratio < 0.2) subEl.textContent = 'Connecting to server…';
      else if (ratio < 0.5) subEl.textContent = 'Downloading result files…';
      else if (ratio < 0.8) subEl.textContent = 'Processing student data…';
      else subEl.textContent = 'Almost done…';
      // We intentionally do NOT bump percent here. It stays racing to 99% via the timer.
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
  
    // Remove immediately; no artificial delay
    requestAnimationFrame(() => overlay.remove());
  };
  
})();


function getProgressBarHtml(score, totalMark) {
  const percentage = (parseFloat(score) / totalMark) * 100;
  const barId = `pb_${Math.random().toString(36).substr(2, 9)}`;
  const numId = `num_${Math.random().toString(36).substr(2, 9)}`;

  setTimeout(() => {
      animateProgressBar(barId, percentage);
      animateNumber(numId, score); 
  }, 100);

  return `
      <span id="${numId}">0</span>
      <div class="progress-bar-container">
          <div id="${barId}" class="progress-bar">0%</div>
      </div>
  `;
}


function animateProgressBar(id, targetPercentage) {
    const bar = document.getElementById(id);
    let current = 0;

    function update() {
        current += 1;
        if (current > targetPercentage) current = targetPercentage;

        let color = 'red';
        let additionalClass = '';
        if (current >= 95) {
            color = 'indigo';
        } else if (current >= 90) {
            color = 'blue';
        } else if (current >= 80) {
            color = 'green';
        } else if (current >= 70) {
            color = 'yellow';
            additionalClass = 'yellow';
        } else if (current >= 34) {
            color = 'orange';
        }

        bar.style.width = `${current}%`;
        bar.style.backgroundColor = color;
        bar.textContent = `${current.toFixed(0)}%`;

        if (current < targetPercentage) {
            requestAnimationFrame(update);
        } else {
            bar.style.width = `${targetPercentage}%`;
            bar.textContent = `${targetPercentage.toFixed(2)}%`;
        }
    }

    update();
}

function animateNumber(elementId, targetNumber) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let current = 0;
  const duration = 1000; // ms, match your progress bar animation speed
  const stepTime = Math.max(Math.floor(duration / targetNumber), 10);

  const timer = setInterval(() => {
      current += 1;
      if (current >= targetNumber) {
          current = targetNumber;
          clearInterval(timer);
      }
      el.textContent = current;
  }, stepTime);
}

function showIndividualResult(roll, year, group) {
  if (!isAdmin() && window.__br_hiddenRolls?.has(String(roll))) {
    showErrorPopup("This result has been hidden by admin.");
    return;
  }

    if (document.querySelector('.popup')) return; // Prevent multiple popups

    const fileName = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;
    const isHSC = fileName.includes("hsc");
    const newUrl = `${location.pathname}?year=${year}&group=${group}&roll=${roll}`;
    history.pushState({}, '', newUrl);

    fetch(fileName)
        .then(response => response.text())
        .then(data => {
            const rows = data.trim().split('\n');
            const individualData = rows.find(row => row.split('\t')[0].replace(/^0+/, '') === roll.toString().replace(/^0+/, ''));


            let popupContent;
            if (individualData) {
                const parts = individualData.split('\t');
                let subject1Name, subject2Name, subject3Name;

                if (group === 'Commerce') {
                    subject1Name = 'Science';
                    subject2Name = 'Accounting';
                    subject3Name = 'Finance';
                } else if (group === 'Arts') {
                    subject1Name = 'Science';
                    subject2Name = 'Geography';
                    subject3Name = 'Civics';
                } else {
                    subject1Name = 'BGS';
                    subject2Name = 'Physics';
                    subject3Name = 'Chemistry';
                }

                if (isHSC) {
                    if (parts.length < 8) {
                        popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
                    } else {
                        const [roll, bangla, english, ICT, physics, chemistry, compulsory, optional] = parts;
                        
                        const student = allData.find(student => student.roll === parseInt(roll));
                        try { updateSEOForStudent(year, group, student.name, roll); } catch(e) {}
              
                        const combinedRank = allData.findIndex(student => student.roll === parseInt(roll)) + 1;
try {
  const examType = (year && year.includes('hsc')) ? 'HSC' : 'SSC';
  const formattedYear = (year || '').replace('hsc_', '');
  document.title = `${student.name} | ${formattedYear} ${examType}`;
} catch (e) { /* no-op */ }

                        popupContent = `
                            <div class="popup-content">
                                <span class="close-btn" onclick="closePopup()">&times;</span>
                                <p>Name: ${student.name}</p>
                                <p>Institution: ${student.Instituation}</p>
                                <p>Roll: ${roll}</p>
                                <p>GPA: ${student.gpa}</p>
                                <p>Board Rank: ${combinedRank}</p>
<p>Total Marks: ${student.total}</p>

<p>Bangla: ${getProgressBarHtml(bangla, 200)}</p>
<p>English: ${getProgressBarHtml(english, 200)}</p>
<p>ICT: ${getProgressBarHtml(ICT, 100)}</p>
<p>Physics: ${getProgressBarHtml(physics, 200)}</p>
<p>Chemistry: ${getProgressBarHtml(chemistry, 200)}</p>
<p>Compulsory: ${getProgressBarHtml(compulsory, 200)}</p>
<p>Optional: ${getProgressBarHtml(optional, 200)}</p>

                                <button onclick='promptComparison(${student.roll}, "${year}", "${group}")'>Compare with Other Student</button>


<div class="popup-footer">
  <button onclick="copyFullResult(this)" class="icon-btn footer-btn" title="Copy Result">
    <i class="fas fa-copy"></i>
  </button>
  <button onclick="closePopup()" class="icon-btn footer-btn" title="Close">
    <i class="fas fa-times"></i>
  </button>
  <button onclick="copyStudentResultLink(this)" class="icon-btn footer-btn" title="Copy Link">
    <i class="fas fa-link"></i>
  </button>
   <button onclick="downloadStudentPDF(this)" class="icon-btn footer-btn" title="Download PDF">
  <i class="fas fa-file-pdf"></i>
</button>
          
</div>

                        `;
                    }
                } else {
                    if (parts.length < 13) {
                        popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
                    } else {
                        const [roll, bangla, english, math, bgs, religion, physics, chemistry, Compulsory, ICT, Optional, Physical, Career] = parts;
                        const student = allData.find(student => student.roll === parseInt(roll));
                        try { updateSEOForStudent(year, group, student.name, roll); } catch(e) {}
                        const combinedRank = allData.findIndex(student => student.roll === parseInt(roll)) + 1;
try {
  const examType = (year && year.includes('hsc')) ? 'HSC' : 'SSC';
  const formattedYear = (year || '').replace('hsc_', '');
  document.title = `${student.name} | ${formattedYear} ${examType}`;
} catch (e) { /* no-op */ }

                        popupContent = `
                            <div class="popup-content">
                                <span class="close-btn" onclick="closePopup()">&times;</span>
                                <p>Name: ${student.name}</p>
                                <p>Institution: ${student.Instituation}</p>
                                <p>Roll: ${roll}</p>
                                <p>GPA: ${student.gpa}</p>
                                <p>Board Rank: ${combinedRank}</p>
<p>Total Marks: ${student.total}</p>

                                <p>Bangla: ${getProgressBarHtml(bangla, 200)}</p>
<p>English: ${getProgressBarHtml(english, 200)}</p>
<p>Mathematics: ${getProgressBarHtml(math, 100)}</p>
<p>${subject1Name}: ${getProgressBarHtml(bgs, 100)}</p>
<p>Religion: ${getProgressBarHtml(religion, 100)}</p>
<p>${subject2Name}: ${getProgressBarHtml(physics, 100)}</p>
<p>${subject3Name}: ${getProgressBarHtml(chemistry, 100)}</p>
<p>Compulsory: ${getProgressBarHtml(Compulsory, 100)}</p>
<p>ICT: ${getProgressBarHtml(ICT, 50)}</p>
<p>Optional: ${getProgressBarHtml(Optional, 100)}</p>
<p>Physical: ${getProgressBarHtml(Physical, 100)}</p>
<p>Career: ${getProgressBarHtml(Career, 50)}</p>

                              <button onclick='promptComparison(${student.roll}, "${year}", "${group}")'>Compare with Other Student</button>


<div class="popup-footer">
  <button onclick="copyFullResult(this)" class="icon-btn footer-btn" title="Copy Result">
    <i class="fas fa-copy"></i>
  </button>
  <button onclick="closePopup()" class="icon-btn footer-btn" title="Close">
    <i class="fas fa-times"></i>
  </button>
  <button onclick="copyStudentResultLink(this)" class="icon-btn footer-btn" title="Copy Link">
    <i class="fas fa-link"></i>
  </button>
  <button onclick="downloadStudentPDF(this)" class="icon-btn footer-btn" title="Download PDF">
  <i class="fas fa-file-pdf"></i>
</button>

</div>

                            
                        `;
                    }
                }
            } else {
                popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
            }
            const popup = document.createElement('div');
            popup.classList.add('popup');
            popup.innerHTML = popupContent;
            document.body.appendChild(popup);
            document.body.classList.add('locked');
            (function(){
              const pc = popup.querySelector('.popup-content');
              if (!pc) return;
              const r = String(roll);
            
              if (isAdmin()) {
                const bar = document.createElement('div');
                bar.className = 'admin-hidebar';
                bar.innerHTML = `
                  <span>Admin</span>
                  <button id="hrHideBtn" class="btn-secondary" style="margin-left:8px;">Hide</button>
                  <button id="hrUnhideBtn" class="btn-secondary" style="margin-left:6px;display:none;">Unhide</button>
                `;
                pc.appendChild(bar);
            
                const applyState = () => {
                  const hidden = window.__br_hiddenRolls?.has(r);
                  pc.classList.toggle('admin-blur', hidden);
                  bar.querySelector('#hrHideBtn').style.display = hidden ? 'none' : 'inline-block';
                  bar.querySelector('#hrUnhideBtn').style.display = hidden ? 'inline-block' : 'none';
                };
                applyState();
            
                bar.querySelector('#hrHideBtn')?.addEventListener('click', async ()=>{ await window.hideResultRoll?.(r); applyState(); });
                bar.querySelector('#hrUnhideBtn')?.addEventListener('click', async ()=>{ await window.unhideResultRoll?.(r); applyState(); });
              } else if (window.__br_hiddenRolls?.has(r)) {
                closePopup();
                showErrorPopup("This result has been hidden by admin.");
              }
            })();
            
        })
        .catch(error => {
            console.error('Error loading individual data:', error);
            const popup = document.createElement('div');
            popup.classList.add('popup');
            popup.innerHTML = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
            document.body.appendChild(popup);
            document.body.classList.add('locked'); 
        });
}
function copyFullResult(btn) {
    const popup = btn.closest('.popup-content');
    if (!popup) return;
  
    let text = '';
    const fields = popup.querySelectorAll('p'); 
  
    fields.forEach(p => {
      if (p.querySelector('.progress-bar')) return;
  
      const clean = p.textContent.trim();
      if (clean) text += `${clean}\n`;
    });
  
    navigator.clipboard.writeText(text).then(() => {
      showToast("📋 Result copied to clipboard");
    }).catch(() => {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast("📋 Result copied (fallback)");
    });
  }
  
  
  function copyStudentResultLink(btn) {
    const popup = btn.closest('.popup-content');
    const roll = popup?.innerHTML.match(/Roll:\s*(\d+)/)?.[1];
    const year = currentYear?.textContent?.trim();
    const group = currentGroup?.textContent?.split(' ')[0];
    const url = `https://boradrankctg.github.io/rank/entity.html?year=${year}&group=${encodeURIComponent(group)}&roll=${roll}`;
  
    navigator.clipboard.writeText(url).then(() => {
      showToast("🔗 Link copied");
    }).catch(() => {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast("🔗 Link copied (fallback)");
    });
  }
  function openEntityPage(type, year, group, value) {
    if (type === 'student') {
      location.href = `entity.html?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&roll=${encodeURIComponent(value)}`;
    } else {
      location.href = `entity.html?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}&school=${encodeURIComponent(value)}`;
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
  

function promptComparison(roll, year, group) {
    const baseStudent = allData.find(s => s.roll === roll);
    if (!baseStudent) return alert("Base student not found.");
  
    const popup = document.createElement('div');
    popup.classList.add('popup');
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="closePopup()">&times;</span>
            <p>Compare <b>${baseStudent.name}</b> with another student</p>
            <input type="text" id="compareRollInput" placeholder="Enter roll number to compare" style="width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #000;">
            <button onclick="startComparison(${baseStudent.roll}, '${year}', '${group}')">Compare</button>
        </div>
    `;
    document.body.appendChild(popup);
    document.body.classList.add('locked');
}
function startComparison(roll1, year, group) {
    const roll2 = document.getElementById("compareRollInput").value.trim();
    if (!roll2) return alert("Enter roll number");

const dataFile = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;

    fetch(dataFile)
        .then(res => res.text())
        .then(text => {
            const lines = text.trim().split('\n');
            const row1 = lines.find(r => r.split('\t')[0] === roll1.toString());
            const row2 = lines.find(r => r.split('\t')[0] === roll2.toString());
            
            if (!row2) return alert("Second roll not found.");

            const parts1 = row1.split('\t');
            const parts2 = row2.split('\t');

            const student1 = allData.find(s => s.roll === parseInt(roll1));
            const student2 = allData.find(s => s.roll === parseInt(roll2));

            if (!student1 || !student2) return alert("Student data not found.");

            let labels = [];
const isHSC = year.includes("hsc");

if (isHSC) {
  if (group === "Science") {
    labels = ["Bangla", "English", "ICT", "Physics", "Chemistry", "Compulsory", "Optional"];
  } else if (group === "Commerce") {
    labels = ["Bangla", "English", "ICT", "Accounting", "Finance", "Business Studies", "Optional"];
  } else if (group === "Arts") {
    labels = ["Bangla", "English", "ICT", "Geography", "Civics", "History", "Optional"];
  }
} else {
  // SSC logic
  if (group === "Science") {
    labels = ["Bangla", "English", "Math", "BGS", "Religion", "Physics", "Chemistry", "Compulsory", "ICT", "Optional", "Physical", "Career"];
  } else if (group === "Commerce") {
    labels = ["Bangla", "English", "Math", "Science", "Religion", "Accounting", "Finance", "Compulsory", "ICT", "Optional", "Physical", "Career"];
  } else if (group === "Arts") {
    labels = ["Bangla", "English", "Math", "Science", "Religion", "Geography", "Civics", "Compulsory", "ICT", "Optional", "Physical", "Career"];
  }
}

            let rows = `
            <h2 style="text-align:center; margin-top: 10px;">🎯 Student Comparison</h2>
            <p style="text-align:center; font-weight:bold;">${student1.name} <span style="color:green;">vs</span> ${student2.name}</p>
           <div class="compare-table-container">
            <table class="compare-table">

                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>${student1.name}</th>
                            <th>${student2.name}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>GPA</td><td>${student1.gpa}</td><td>${student2.gpa}</td></tr>
                        <tr><td>Total Marks</td><td>${student1.total}</td><td>${student2.total}</td></tr>
        `;
        

            for (let i = 1; i < Math.min(parts1.length, parts2.length); i++) {
                const label = labels[i - 1] || `Subject ${i}`;
                rows += `<tr><td>${label}</td><td>${parts1[i]}</td><td>${parts2[i]}</td></tr>`;
            }

            rows += `
                        </tbody>
                    </table>
                </div>
                <button class="back-button" onclick="closePopup()">Close</button>
            `;

            closePopup(); // Close input popup
            const popup = document.createElement('div');
            popup.classList.add('popup');
            popup.innerHTML = `<div class="popup-content"><span class="close-btn" onclick="closePopup()">&times;</span>${rows}</div>`;
            document.body.appendChild(popup);
            document.body.classList.add('locked');
        });
}


function handleSearchInput() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const rollSearchTerm = document.getElementById('searchRollInput').value.trim();
    const selectedInstituation = document.getElementById('InstituationDropdown').value;
    filteredData = allData.filter(student => {
        const matchesName = student.name.toLowerCase().includes(searchTerm);
        const matchesRoll = student.roll.toString().includes(rollSearchTerm);
        const matchesInstituation = selectedInstituation ? (student.Instituation || '').trim().toLowerCase() === selectedInstituation.trim().toLowerCase() : true;
        return matchesName && matchesRoll && matchesInstituation;
    });
    currentPage = 1;
    updatePage();
}

function handleRollSearchInput() {
    handleSearchInput();
}

function filterByInstituation() {
    handleSearchInput();
}


function navigateTo(page) {
    window.location.href = page;
}



function closePopup() {
  const popup = document.querySelector('.popup');
  if (popup) {
      popup.classList.add('pop-out');
      setTimeout(() => {
          popup.remove();
          document.body.classList.remove('locked');
      }, 500); 
  }
}


document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
      closePopup();
  }
});


window.addEventListener('popstate', function() {
  closePopup();
});


function openPopup(contentHTML) {
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = contentHTML;
  document.body.appendChild(popup);
  document.body.classList.add('locked');

  // Add animation class if needed
  popup.classList.add('pop-in');

  // Push a new state to enable back button closing
  history.pushState({ popupOpen: true }, '');
}


var scrollToTopBtn = document.getElementById("scrollToTopBtn");

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 600 || document.documentElement.scrollTop > 600) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
}

function scrollToTop() {
  document.body.scrollTop = 0; 
  document.documentElement.scrollTop = 0; 
}

window.addEventListener('popstate', function () {
  const params = new URLSearchParams(window.location.search);
  const year = params.get('year');
  const group = params.get('group');
  const roll = params.get('roll');


  if (document.querySelector('.popup')) {
      closePopup();
      return;
  }

  // If roll present → show individual result
  if (year && group && roll) {
      showIndividualResult(roll, year, group);
  }
  // If year & group present → load that table
  else if (year && group) {
      loadGroup(year, group);
  }
  // If only year present → load group selection
  else if (year) {
      loadYear(year);
  }
  // No params → go to home/default
  else {
      location.reload(); // or your home view loader
  }
});


function createTopInstitutionsButton() {
  const resetBtn = document.getElementById('resetFilterBtn');
  if (!resetBtn) return;

  const topBtn = document.createElement('button');
  topBtn.id = 'topSchoolsBtn';
  topBtn.innerHTML = '<i class="ri-trophy-line" aria-hidden="true"></i><span>Top Schools</span>';
  topBtn.className = 'btn-pill btn-top-schools';
  topBtn.style.marginLeft = '10px';
  topBtn.onclick = showTopInstitutions;
  resetBtn.insertAdjacentElement('afterend', topBtn);

  const filterBtn = document.createElement('button');
  filterBtn.id = 'mobileFilterBtn';
  filterBtn.innerHTML = '<i class="ri-filter-3-line" aria-hidden="true"></i><span>Filter</span>';
  filterBtn.className = 'btn-pill btn-mobile-filter';
  filterBtn.style.marginLeft = '8px';
  filterBtn.addEventListener('click', openMobileFilter);
  topBtn.insertAdjacentElement('afterend', filterBtn);

  injectMobileFilterStyles();
  ensureMobileFilterUI();
}

  /* === Mobile Filter Drawer (total, gpa, school) === */
function injectMobileFilterStyles() {
  if (document.getElementById('mfStyle')) return;
  const css = `
  `;
  const el = document.createElement('style'); el.id='mfStyle'; el.textContent = css; document.head.appendChild(el);
}

function ensureMobileFilterUI() {
  if (document.getElementById('mfDrawer')) return;
  const overlay = document.createElement('div'); overlay.className='mf-overlay'; overlay.id='mfOverlay';
  const drawer = document.createElement('aside'); drawer.className='mf-drawer'; drawer.id='mfDrawer';
  drawer.innerHTML = `
    <div class="mf-head">
      <div class="mf-title">Filter</div>
      <button class="mf-close" id="mfCloseBtn" aria-label="Close">✕</button>
    </div>
    <div class="mf-body">
      <div class="mf-section" id="mfTotal">
        <h4>Total</h4>
        <div class="mf-range">
          <div class="mf-dual">
            <div class="mf-track"></div>
            <div class="mf-track-fill" id="mfTrackFill"></div>
            <input id="mfRangeMin" type="range">
            <input id="mfRangeMax" type="range">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input id="mfTotalMin" type="number" placeholder="Min">
            <input id="mfTotalMax" type="number" placeholder="Max">
          </div>
        </div>
      </div>
      <div class="mf-section" id="mfGpa">
        <h4>GPA</h4>
        <div class="mf-chips" id="mfGpaChips"></div>
      </div>
      <div class="mf-section" id="mfSchool">
        <h4>School</h4>
        <div class="mf-search"><input id="mfSchoolSearch" type="text" placeholder="Search school"></div>
        <div class="mf-list" id="mfSchoolList"></div>
      </div>
    </div>
    <div class="mf-foot">
      <button class="mf-reset" id="mfResetBtn">Reset</button>
      <button class="mf-apply" id="mfApplyBtn">Apply</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  document.getElementById('mfCloseBtn').addEventListener('click', closeMobileFilter);
  document.getElementById('mfOverlay')?.addEventListener('click', closeMobileFilter);
  document.getElementById('mfApplyBtn').addEventListener('click', applyMobileFilters);
  document.getElementById('mfResetBtn').addEventListener('click', resetMobileFilters);
  document.getElementById('mfSchoolSearch').addEventListener('input', filterSchoolList);

  populateMobileFilterOptions();
  attachMobileFilterLiveListeners();

}

function openMobileFilter() {
  document.getElementById('mfOverlay')?.classList.add('open');
  document.getElementById('mfDrawer')?.classList.add('open');
  try { history.pushState({ mf:true }, '', location.href); } catch(e){}
  window.addEventListener('popstate', mfPopCloseOnce, { once:true });
}

function closeMobileFilter() {
  document.getElementById('mfOverlay')?.classList.remove('open');
  document.getElementById('mfDrawer')?.classList.remove('open');
}

function mfPopCloseOnce() { closeMobileFilter(); }

function populateMobileFilterOptions() {
  if (!Array.isArray(allData) || !allData.length) return;

  const totals = allData.map(s=>parseInt(s.total)).filter(n=>!isNaN(n));
  const minT = Math.min(...totals), maxT = Math.max(...totals);

  const rMin = document.getElementById('mfRangeMin');
  const rMax = document.getElementById('mfRangeMax');
  const nMin = document.getElementById('mfTotalMin');
  const nMax = document.getElementById('mfTotalMax');
  [rMin,rMax,nMin,nMax].forEach(el=>{ el.min=minT; el.max=maxT; });
  rMin.value = nMin.value = minT;
  rMax.value = nMax.value = maxT;
  const clamp = () => {
    let a = Math.min(parseInt(rMin.value), parseInt(rMax.value));
    let b = Math.max(parseInt(rMin.value), parseInt(rMax.value));
    rMin.value = a; rMax.value = b; nMin.value = a; nMax.value = b; drawTrackFill();
  };
  const syncFromNum = () => {
    let a = Math.max(minT, Math.min(maxT, parseInt(nMin.value||minT)));
    let b = Math.max(minT, Math.min(maxT, parseInt(nMax.value||maxT)));
    if (a>b) [a,b] = [b,a];
    rMin.value = a; rMax.value = b; drawTrackFill();
  };

  
  rMin.addEventListener('input', clamp);
  rMax.addEventListener('input', clamp);
  nMin.addEventListener('input', syncFromNum);
  nMax.addEventListener('input', syncFromNum);

  function drawTrackFill(){
    const fill = document.getElementById('mfTrackFill');
    const min = parseInt(rMin.min), max = parseInt(rMin.max);
    const a = (parseInt(rMin.value)-min)/(max-min)*100;
    const b = (parseInt(rMax.value)-min)/(max-min)*100;
    fill.style.left = a+'%';
    fill.style.right = (100-b)+'%';
  }


  drawTrackFill();

  const gpas = Array.from(new Set(allData.map(s=>s.gpa).filter(x=>x!==undefined && !isNaN(x)))).sort((a,b)=>b-a);
  const gWrap = document.getElementById('mfGpaChips'); gWrap.innerHTML='';
  gpas.forEach(val=>{
    const id = 'mfGpa_'+String(val).replace('.','_');
    const div = document.createElement('label'); div.className='mf-chip';
    div.innerHTML = `<input type="checkbox" name="mfGpa" value="${val}"><span>${val.toFixed ? val.toFixed(2) : val}</span>`;
    gWrap.appendChild(div);
  });

  const schools = Array.from(new Set(allData.map(s => (s.Instituation || '').trim()).filter(Boolean)))
  .sort((a, b) => {
    const rankA = allData.find(s => (s.Instituation || '').trim() === a)?.TopSchools || Infinity;
    const rankB = allData.find(s => (s.Instituation || '').trim() === b)?.TopSchools || Infinity;
    return rankA - rankB; // Lower number = higher rank
  });

  const sWrap = document.getElementById('mfSchoolList'); sWrap.innerHTML='';
  schools.forEach(name=>{
    const safe = name.replace(/"/g,'&quot;');
    const div = document.createElement('label'); div.className='mf-item';
    div.innerHTML = `<input type="checkbox" name="mfSchool" value="${safe}"><span>${safe}</span>`;
    sWrap.appendChild(div);
  });
  try { attachMobileFilterLiveListeners(); } catch(e){}
}
function attachMobileFilterLiveListeners() {
  const liveApply = debounce(applyMobileFilters, 120);
  ['mfRangeMin','mfRangeMax','mfTotalMin','mfTotalMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', liveApply);
  });
  document.querySelectorAll('#mfGpaChips input[type=checkbox], #mfSchoolList input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', liveApply);
  });
}


  function attachMobileFilterLiveListeners() {
    const liveApply = debounce(applyMobileFilters, 120);
    ['mfRangeMin','mfRangeMax','mfTotalMin','mfTotalMax'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', liveApply);
    });
    document.querySelectorAll('#mfGpaChips input[type=checkbox], #mfSchoolList input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', liveApply);
    });
  }


function filterSchoolList(){
  const q = document.getElementById('mfSchoolSearch').value.trim().toLowerCase();
  document.querySelectorAll('#mfSchoolList .mf-item').forEach(el=>{
    const txt = el.textContent.toLowerCase();
    el.style.display = txt.includes(q)?'flex':'none';
  });
}

function applyMobileFilters(){
  const nMin = parseInt(document.getElementById('mfTotalMin').value);
  const nMax = parseInt(document.getElementById('mfTotalMax').value);
  const gpaVals = Array.from(document.querySelectorAll('input[name="mfGpa"]:checked')).map(x=>parseFloat(x.value));
  const schoolVals = Array.from(document.querySelectorAll('input[name="mfSchool"]:checked')).map(x=>x.value);

  const nameQ = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim().toLowerCase() : '';
  const rollQ = document.getElementById('searchRollInput') ? document.getElementById('searchRollInput').value.trim() : '';
  const instSelEl = document.getElementById('InstituationDropdown');
  const instSel = instSelEl && instSelEl.value ? instSelEl.value : '';

  filteredData = allData.filter(s=>{
    const totOK = !isNaN(s.total) && s.total>=nMin && s.total<=nMax;
    const gpaOK = gpaVals.length? gpaVals.includes(parseFloat(s.gpa)) : true;
    const schOK = schoolVals.length? schoolVals.includes(s.Instituation) : true;
    const nameOK = nameQ ? String(s.name).toLowerCase().includes(nameQ) : true;
    const rollOK = rollQ ? String(s.roll).includes(rollQ) : true;
    const instOK = instSel ? (s.Instituation || '').trim().toLowerCase() === instSel.trim().toLowerCase() : true;
    return totOK && gpaOK && schOK && nameOK && rollOK && instOK;
  });

  currentPage = 1;
  updatePage();
  closeMobileFilter();
}

function resetMobileFilters(){
  document.querySelectorAll('#mfGpaChips input[type=checkbox], #mfSchoolList input[type=checkbox]').forEach(cb=>cb.checked=false);
  populateMobileFilterOptions();
  // keep existing name/roll/institution search in place
  applyMobileFilters();
}

  function showTopInstitutions() {
    const topSchools = {};
  
    allData.forEach(student => {
      const school = student.Instituation;
      if (!topSchools[school]) {
        topSchools[school] = {
          gpa5Count: 0,
          totalMarks: 0,
          count: 0,
          top1000Count: 0
        };
      }
      if (student.gpa === 5.0) {
        topSchools[school].gpa5Count += 1;
      }
      topSchools[school].totalMarks += student.total;
      topSchools[school].count += 1;
    });
  
    allData.slice(0, 1000).forEach(student => {
      const school = student.Instituation;
      if (topSchools[school]) {
        topSchools[school].top1000Count++;
      }
    });
  
    const schoolArray = Object.entries(topSchools)
      .filter(([_, stats]) => stats.count >= 20)
      .map(([name, stats]) => {
        const gpa5Percent = (stats.gpa5Count / stats.count) * 100;
        return {
          name,
          gpa5Percent: gpa5Percent.toFixed(2),
          gpa5Count: stats.gpa5Count,
          avgTotal: (stats.totalMarks / stats.count).toFixed(1),
          top1000Count: stats.top1000Count,
          studentCount: stats.count
        };
      });
  
    // Sort by GPA 5% descending, then average total descending
    schoolArray.sort((a, b) => {
      const percentDiff = parseFloat(b.gpa5Percent) - parseFloat(a.gpa5Percent);
      if (percentDiff !== 0) return percentDiff;
      return parseFloat(b.avgTotal) - parseFloat(a.avgTotal);
    });
  
    const top100 = schoolArray.slice(0, 100);
  
    contentDiv.innerHTML = `
      <h2> Top 100 Institutions - ${currentGroup.textContent} ${currentYear.textContent}</h2>
      <button onclick="loadGroup('${currentYear.textContent.trim()}', '${currentGroup.textContent.split(' ')[0]}')">Back</button>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Institution</th>
            <th>GPA 5.00 %</th>
            <th>Total GPA 5.00</th>
            <th>Avg Total</th>
            <th>Top 1000 Students</th>
            <th>Total Students</th>
          </tr>
        </thead>
        <tbody>
          ${top100.map((school, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${school.name}</td>
              <td>${school.gpa5Percent}%</td>
              <td>${school.gpa5Count}</td>
              <td>${school.avgTotal}</td>
              <td>${school.top1000Count}</td>
              <td>${school.studentCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  
  function enableInstitutionSearchDropdown() {
    const dropdown = document.getElementById('InstituationDropdown');
    dropdown.outerHTML = `
    <input list="institutionList" id="InstituationDropdown" placeholder="Type school name..." class="search-input" onchange="filterByInstituation()">


      <datalist id="institutionList">
        ${Array.from(InstituationSet).map(inst => `<option value="${inst}">`).join('')}
      </datalist>
    `;
  }
  

  const originalFetchData = fetchData;
  fetchData = function(year, group) {
    showLoadingIndicator();
const mainDataUrl = `DATA/data_${year}_${group.toLowerCase()}.txt`;
const individualDataUrl = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;
  
    Promise.all([
      fetchAndDecode(mainDataUrl, "MySecretKey123")
,
      fetch(individualDataUrl).then(response => response.text()).catch(() => null)
    ]).then(([mainData, individualData]) => {
      window.__br_currentDatasetMeta = { year, group };

      processData(mainData, individualData);
      populateInstituationDropdown();
      enableInstitutionSearchDropdown();
      createTopInstitutionsButton();
      hideLoadingIndicator();
    }).catch(error => {
      console.error('Error loading data:', error);
      hideLoadingIndicator({ forceError: true, errorMessage: 'Unable to load files — check your connection.' });
      noDataMessage.style.display = 'block';
  });
  
  };
  function filterByInstituation() {
    const input = document.getElementById('InstituationDropdown').value.trim();
    showSchoolRanking(input); // ← reuse the same function used on click
  }
  
function showFullRankingNote(schoolName) {
    const note = document.createElement('div');
    note.className = 'filter-note';
    note.innerHTML = `
        Showing results for "<strong>${schoolName}</strong>" —
        <button onclick="resetFilter()">Show Full Ranking</button>
    `;
    const oldNote = document.querySelector('.filter-note');
    if (oldNote) oldNote.remove();
    contentDiv.prepend(note);
}
handleURLParams();
function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const year = params.get('year');
    const group = params.get('group');
    const roll = params.get('roll');

    if (year && group) {
        
        if (yearDropdown) {
            yearDropdown.value = year;
            yearDropdown.style.display = 'none';
        }

   
        document.getElementById("selectPrompt")?.remove();
        document.querySelectorAll('.featured-box').forEach(b => b.remove());


        currentYear.textContent = ` ${year}`;
        currentGroup.textContent = `${group} Group`;
        currentGroup.style.display = 'inline';

        contentDiv.innerHTML = `
            <h3 id="examResultHeader"></h3>
            <div class="search-container">
                <label for="searchInput">Search by Name:</label>
                <input type="text" id="searchInput" class="search-input" placeholder="Enter name" oninput="debounce(handleSearchInput, 300)()">
            </div>
            <div class="search-container">
                <label for="searchRollInput">Search by Roll:</label>
                <input type="text" id="searchRollInput" class="search-input" placeholder="Enter roll" oninput="debounce(handleRollSearchInput, 300)()">
            </div>
            <div class="search-container">
                <label for="InstituationDropdown">Select Institution:</label>
                <select id="InstituationDropdown" onchange="filterByInstituation()"></select>
            </div>
            <button id="resetFilterBtn" style="display: none;" onclick="resetFilter()">Reset Filter</button>
            <div class="loading-spinner" id="loadingSpinner" style="display: none;"></div>
            <p id="tableHint" style="margin-top: 20px; font-weight: bold;">
                💡 Click on student names to see detailed result and on school names to see school BASED RANK
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Serial</th>
                        <th>Name</th>
                        <th>Roll</th>
                        <th>GPA</th>
                        <th>Total</th>
                        <th>Institution</th>
                    </tr>
                </thead>
                <tbody id="studentTableBody"></tbody>
            </table>
            <div class="pagination">
                <button id="firstBtn" onclick="handleFirstButtonClick()">First</button>
                <button id="prevBtn" onclick="handlePrevButtonClick()">Previous</button>
                <span id="paginationInfo">Loading data...</span>
                <button id="nextBtn" onclick="handleNextButtonClick()">Next</button>
                <button id="lastBtn" onclick="handleLastButtonClick()">Last</button>
            </div>
        `;


        printExamResultHeader(year);
        fetchData(year, group);
        setTimeout(attachSearchSuggestions, 0);



     
        if (roll) {
            setTimeout(() => {
                showIndividualResult(roll, year, group);
            }, 1000);
        }
        const school = params.get('school');
        if (school) {
          // wait a little so fetchData(year, group) finishes and DOM is ready
          setTimeout(() => {
            showSchoolRanking(school);
          }, 1000);
        }
        
    } else if (year) {
    
        loadYear(year);
        if (yearDropdown) {
            yearDropdown.value = year;
        }
    } else {
 
        contentDiv.innerHTML = '';
    }
}


function handleFeaturedClick(yearValue, el) {
    const box = el || document.querySelector(`.featured-box[data-value="${yearValue}"]`);
    if (!box) return;
  
    box.style.transition = "all 0.4s ease";
    box.style.opacity = "0";
    box.style.transform = "scale(0.9)";
  
    setTimeout(() => {
      box.style.display = "none";
  
      const dropdown = document.getElementById("yearDropdown");
      if (dropdown) {
        dropdown.value = yearValue;
        dropdown.style.display = 'none';
      }
      loadYear(yearValue);
    }, 400);
  }
  

  function showSharePopup() {
    if (document.querySelector('.popup')) return; 

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="closePopup()">&times;</span>
            <h2>🚀Enjoying this amazing website?</h2>
            <p>Help us grow! Share this website:</p>
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; padding: 10px;">
                <a href="https://wa.me/?text=https://boradrankctg.github.io/rank/" target="_blank"><img src="https://img.icons8.com/color/48/whatsapp.png" alt="WhatsApp" width="36"></a>
                <a href="https://www.instagram.com/?url=https://boradrankctg.github.io/rank/" target="_blank"><img src="https://img.icons8.com/color/48/instagram-new.png" alt="Instagram" width="36"></a>
                <a href="https://www.facebook.com/dialog/send?link=https://boradrankctg.github.io/rank/&app_id=YOUR_APP_ID&redirect_uri=https://boradrankctg.github.io/rank/" target="_blank"><img src="https://img.icons8.com/color/48/facebook-messenger.png" alt="Messenger" width="36"></a>
                <a href="mailto:?subject=Check%20this%20awesome%20ranking%20site!&body=https://boradrankctg.github.io/rank/" target="_blank"><img src="https://img.icons8.com/color/48/gmail--v1.png" alt="Email" width="36"></a>
            </div>
            <hr>
            <h3 style="margin-top:10px">⭐ Rate this Website:</h3>
            <div id="starContainer" style="font-size: 1.8rem; color: gold; cursor: pointer;">
                <span onclick="rateSite(1)">&#9734;</span>
                <span onclick="rateSite(2)">&#9734;</span>
                <span onclick="rateSite(3)">&#9734;</span>
                <span onclick="rateSite(4)">&#9734;</span>
                <span onclick="rateSite(5)">&#9734;</span>
            </div>
            <textarea id="reviewText" placeholder="Leave your feedback here..." rows="3" style="width: 100%; margin-top: 10px;"></textarea>
            <button onclick="submitReview()">Submit Review</button>
        </div>
    `;

    document.body.appendChild(popup);
    document.body.classList.add('locked');
}
if (!localStorage.getItem('sharePopupShown')) {
    setTimeout(() => {
        showSharePopup();
        localStorage.setItem('sharePopupShown', '1');
    }, 150000);
}

document.getElementById('shareBtn').addEventListener('click', showSharePopup);


function rateSite(rating) {
    const stars = document.getElementById('starContainer').children;
    for (let i = 0; i < stars.length; i++) {
        stars[i].innerHTML = i < rating ? '&#9733;' : '&#9734;';
    }
    localStorage.setItem('userRating', rating);
}

function submitReview() {
    const rating = localStorage.getItem('userRating') || 0;
    const comment = document.getElementById('reviewText').value.trim();

    if (!comment && rating == 0) return alert('Please rate or write something.');

    localStorage.setItem('pendingReview', JSON.stringify({ rating, comment }));

    window.location.href = 'review.html';
}




function downloadStudentPDF(btn) {
  const safe = s => String(s == null ? '' : s).trim();

  const popup = (btn && btn.closest && (btn.closest('.popup') || btn.closest('.popup-content'))) || 
                document.querySelector('.popup .popup-content') || null;
  if (!popup) {
    alert('No result popup found.');
    return;
  }

  const data = { name: '', roll: '', institution: '', gpa: '', subjects: [] };


  const els = Array.from(popup.querySelectorAll('p,div,span,li,td'));
  els.forEach(el => {
    const txt = safe(el.textContent);
    if (!txt) return;
    const colon = txt.match(/^([^:]{1,40})\s*[:\-]\s*(.+)$/);
    if (colon) {
      const key = colon[1].toLowerCase();
      const val = colon[2].trim();
      if (key.includes('name') && !data.name) data.name = val;
      else if (key.includes('roll') && !data.roll) data.roll = val;
      else if ((key.includes('institution') || key.includes('school') || key.includes('college')) && !data.institution) data.institution = val;
      else if (key.includes('gpa') && !key.includes('subject') && !data.gpa) data.gpa = val;
      else if (!key.includes('board rank')) {
        data.subjects.push({ name: colon[1].trim(), mark: val });
      }
    }
  });


  data.subjects = data.subjects.filter(s => !/board\s*rank/i.test(s.name));

  function markToGrade(markStr, subjectName) {
    const m = parseFloat(String(markStr).replace(/[^0-9.\-]/g, ''));
    if (isNaN(m)) return { gp: '-', grade: '-' };
  
    const nameLower = (subjectName || '').toLowerCase();
  

    let yearText = '';
    try {
      if (typeof currentYear !== 'undefined' && currentYear && currentYear.textContent) {
        yearText = String(currentYear.textContent).toLowerCase();
      }
    } catch (e) { yearText = ''; }
    const popupText = (document.querySelector('.popup .popup-content')?.textContent || '').toLowerCase();
    const isHSC = (yearText.includes('hsc') || popupText.includes('hsc'));
  

    let totalMarks;
    if (isHSC) {
    
      if (nameLower.includes('ict')) totalMarks = 100;
      else totalMarks = 200;
    } else {
      
      if (nameLower.includes('ict') || nameLower.includes('career')) totalMarks = 50;
      else if (nameLower.includes('bangla') || nameLower.includes('english')) totalMarks = 200;
      else totalMarks = 100;
    }
  

    const percentage = (m / totalMarks) * 100;
  
    if (percentage >= 79.5) return { gp: 5.00, grade: 'A+' };
    if (percentage >= 70) return { gp: 4.00, grade: 'A' };
    if (percentage >= 60) return { gp: 3.50, grade: 'A-' };
    if (percentage >= 50) return { gp: 3.00, grade: 'B' };
    if (percentage >= 40) return { gp: 2.00, grade: 'C' };
    if (percentage >= 33) return { gp: 1.00, grade: 'D' };
    return { gp: 0.00, grade: 'F' };
  }
  

  const filename = `${(data.name || 'marksheet').replace(/[^\w\- ]/g, '')}.pdf`;

  function loadJsPdf(cb) {
    if (window.jspdf && window.jspdf.jsPDF) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadJsPdf(() => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 18;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('SSC 2025 Board Rank of Chittagong', margin, y);
    y += 12;


const infoW = pageW - margin * 2;
const colW = infoW / 4;
const infoH = 20;
const fields = [
  { label: 'Name', value: data.name || '-' },
  { label: 'Roll', value: data.roll || '-' },
  { label: 'Institution', value: data.institution || '-' },
  { label: 'GPA', value: data.gpa || '-' }
];
doc.setLineWidth(0.3);
doc.rect(margin, y, infoW, infoH);
for (let i = 0; i < fields.length; i++) {
  const x = margin + i * colW;
  doc.rect(x, y, colW, infoH);
  doc.setFontSize(9);
  doc.text(fields[i].label + ':', x + 2, y + 6);

  doc.setFont(undefined, 'bold');

  const wrapped = doc.splitTextToSize(fields[i].value, colW - 4);
  doc.setFontSize(10);
  let textY = y + 12;
  wrapped.forEach(line => {
    doc.text(line, x + 2, textY);
    textY += 4; 
  });
  doc.setFont(undefined, 'normal');
}
y += infoH + 8;


    const tblW = pageW - margin * 2;
    const col1 = Math.round(tblW * 0.5 * 100) / 100; 
    const col2 = Math.round(tblW * 0.25 * 100) / 100; 
    const col3 = tblW - col1 - col2; 
    const rowH = 8;

    doc.setFillColor(240);
    doc.rect(margin, y, col1, rowH, 'F');
    doc.rect(margin + col1, y, col2, rowH, 'F');
    doc.rect(margin + col1 + col2, y, col3, rowH, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Subject', margin + 2, y + 6);
    doc.text('Marks', margin + col1 + col2 - 2, y + 6, { align: 'right' });
    doc.text('GPA', margin + col1 + col2 + col3 - 2, y + 6, { align: 'right' });
    y += rowH;
    doc.setFont(undefined, 'normal');

  
    data.subjects.forEach(row => {
      const g = markToGrade(row.mark, row.name);

      doc.rect(margin, y, col1, rowH);
      doc.rect(margin + col1, y, col2, rowH);
      doc.rect(margin + col1 + col2, y, col3, rowH);

      doc.text(row.name, margin + 2, y + 5);
      doc.text(String(row.mark), margin + col1 + col2 - 2, y + 5, { align: 'right' });
      doc.text(`${g.gp.toFixed(2)} (${g.grade})`, margin + col1 + col2 + col3 - 2, y + 5, { align: 'right' });
      y += rowH;
    });

    
    doc.setFontSize(9);
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 285);
    doc.text('Unofficial printable copy', pageW - margin, 285, { align: 'right' });

    doc.save(filename);
    showToast("📥 Download started");
  });
}
function visitorInfoDenied() {
  const popup = document.querySelector('.popup');
  if (!popup) return;

  const body = popup.querySelector('.popup-body');
  const footer = popup.querySelector('.popup-footer');

  if (footer) footer.style.display = 'none';


  if (body) {
    body.innerHTML = `
      <div class="access-status">
        <div class="circle"></div>
        <div class="status-text">Processing...</div>
      </div>
    `;

    setTimeout(() => {
      const circleEl = body.querySelector('.circle');
      if (circleEl) circleEl.style.display = 'none';

      body.innerHTML = `
        <div class="access-status">
          <div class="cross">❌</div>
          <div class="status-text" style="color:#dc2626;">Access Denied — Please try again</div>
        </div>
      `;
    }, 800); 
  }

  setTimeout(() => {
    closePopup();
  }, 1800);
}

(function(){
  const words = Array.from(new Set((allData || []).flatMap(s => [
    s?.name, s?.Instituation
  ]).filter(Boolean)));
  upsertMeta('keywords', words.join(', '));
})();
function attachSearchSuggestions() {
  const nameInput = document.getElementById('searchInput');
  const rollInput = document.getElementById('searchRollInput');
  if (!nameInput || !rollInput) return;

  ensureSuggestBox(nameInput, 'nameSuggestBox');
  ensureSuggestBox(rollInput, 'rollSuggestBox');

  nameInput.addEventListener('input', renderNameSuggestions);
  rollInput.addEventListener('input', renderRollSuggestions);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.suggest-box')) hideSuggestions();
  });
}

function ensureSuggestBox(inputEl, id) {
  if (document.getElementById(id)) return;
  const box = document.createElement('div');
  box.id = id;
  box.className = 'suggest-box';
  inputEl.insertAdjacentElement('afterend', box);
}

function hideSuggestions() {
  const boxes = document.querySelectorAll('.suggest-box');
  boxes.forEach(b => b.style.display = 'none');
}

function renderNameSuggestions() {
  try {
    const input = document.getElementById('searchInput');
    const box = document.getElementById('nameSuggestBox');
    if (!input || !box || !Array.isArray(allData) || allData.length === 0) return;

    const q = input.value.trim().toLowerCase();
    if (!q) return (box.style.display = 'none');

    const seen = new Set();
    const matches = allData
      .filter(s => s.name && s.name.toLowerCase().includes(q))
      .filter(s => {
        const key = s.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key); return true;
      })
      .slice(0, 8);

    box.innerHTML = matches.map(s => 
      `<div class="suggest-item" data-name="${s.name.replace(/"/g,'&quot;')}">
         <i class="ri-user-3-line"></i> ${s.name} <small>• ${s.Instituation || ''}</small>
       </div>`).join('') || '<div class="suggest-empty">No matches</div>';

    box.style.display = 'block';
    box.querySelectorAll('.suggest-item').forEach(it => {
      it.addEventListener('click', () => {
        input.value = it.getAttribute('data-name');
        handleSearchInput();
        hideSuggestions();
      });
    });
  } catch(e){}
}

function renderRollSuggestions() {
  try {
    const input = document.getElementById('searchRollInput');
    const box = document.getElementById('rollSuggestBox');
    if (!input || !box || !Array.isArray(allData) || allData.length === 0) return;

    const q = input.value.trim();
    if (!q) return (box.style.display = 'none');

    const matches = allData
      .filter(s => String(s.roll).includes(q))
      .slice(0, 8);

    box.innerHTML = matches.map(s => 
      `<div class="suggest-item" data-roll="${s.roll}">
         <i class="ri-hashtag"></i> ${s.roll} <small>• ${s.name} — ${s.Instituation || ''}</small>
       </div>`).join('') || '<div class="suggest-empty">No matches</div>';

    box.style.display = 'block';
    box.querySelectorAll('.suggest-item').forEach(it => {
      it.addEventListener('click', () => {
        input.value = it.getAttribute('data-roll');
        handleRollSearchInput();
        hideSuggestions();
      });
    });
  } catch(e){}
}
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
  
    // Close when a menu item is chosen
    links.querySelectorAll('a, .linklike, input[type="checkbox"]').forEach(el => {
      el.addEventListener('click', () => {
        // Don’t auto-close when toggling dark mode; close on navigation/actions
        if (el.matches('input[type="checkbox"]')) return;
        closeNav();
      });
    });
  
    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
  
    // If resized to desktop, close sheet
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeNav();
    });
  }




  (function(){
    // Guard to avoid re-entrancy
    window.__br_applying = window.__br_applying || false;
  
    
    function maskWord(w){
      const s = String(w || '');
      if (s.length <= 2) return s.replace(/.(?=.)/g, '*');
      return s[0] + '*'.repeat(s.length - 2) + s[s.length - 1];
    }
  
    function maskName(full){
      return String(full || '').split(/\s+/).map(maskWord).join(' ');
    }
  
    function maskRollStr(r){
      const s = String(r || '').trim();
      if (s.length <= 2) return s.replace(/.(?=.)/g, '*');
      return s[0] + '*'.repeat(Math.max(0, s.length - 2)) + s[s.length - 1]; // e.g. 1**9
    }
  
    function safeSetText(el, val){
      if (el && el.textContent !== val) el.textContent = val;
    }
  

    function applyToTable(){
      const ds = window.__br_displaySettings || {};
      const showNames = (ds.showNames !== false);
      const showRolls = (ds.showRolls !== false);
  
      document.querySelectorAll('.student-name h3').forEach(el=>{
        if (!el.dataset.originalText) el.dataset.originalText = el.textContent || '';
        const newVal = showNames ? el.dataset.originalText : maskName(el.dataset.originalText);
        safeSetText(el, newVal);
      });
  
      document.querySelectorAll('.student-roll').forEach(el=>{
        if (!el.dataset.originalRoll) el.dataset.originalRoll = (el.textContent || '').trim();
        const newVal = showRolls ? el.dataset.originalRoll : maskRollStr(el.dataset.originalRoll);
        safeSetText(el, newVal);
      });
    }
  

    function applyToPopup(){
      const ds = window.__br_displaySettings || {};
      const showNames = (ds.showNames !== false);
      const showRolls = (ds.showRolls !== false);
  
      const pop = document.querySelector('.popup .popup-content');
      if (!pop) return;
  
      pop.querySelectorAll('p').forEach(p=>{
        const t = p.textContent || '';
        if (/^Name:\s*/i.test(t)) {
          const cur = t.replace(/^Name:\s*/i, '').trim();
          if (!p.dataset.originalText) p.dataset.originalText = cur;
          const newVal = 'Name: ' + (showNames ? p.dataset.originalText : maskName(p.dataset.originalText));
          safeSetText(p, newVal);
        } else if (/^Roll:\s*/i.test(t)) {
          const cur = t.replace(/^Roll:\s*/i, '').trim();
          if (!p.dataset.originalRoll) p.dataset.originalRoll = cur;
          const newVal = 'Roll: ' + (showRolls ? p.dataset.originalRoll : maskRollStr(p.dataset.originalRoll));
          safeSetText(p, newVal);
        }
      });
    }
 
    function applyNameSearchToggle(){
      const ds = window.__br_displaySettings || {};
      const enableNameSearch = (ds.nameSearch !== false);
      const nameInput = document.getElementById('searchInput');
  
      if (nameInput) {
        nameInput.disabled = !enableNameSearch;
        nameInput.placeholder = enableNameSearch ? 'Enter name' : 'Name search is disabled for now';
        if (!enableNameSearch) {
          nameInput.value = '';
        }
      }
    }
 
    window.applyDisplaySettingsToDOM = function(){
      if (window.__br_applying) return;
      window.__br_applying = true;
      try {
        applyToTable();
        applyToPopup();
        applyNameSearchToggle();
      } catch (e) {
        console.error('applyDisplaySettingsToDOM error:', e);
      } finally {
        window.__br_applying = false;
      }
    };
  

    if (typeof updateTableData === 'function' && !window.__br_wrap_updateTableData_v2) {
      window.__br_wrap_updateTableData_v2 = true;
      const _orig = updateTableData;
      window.updateTableData = function(){
        const r = _orig.apply(this, arguments);
        setTimeout(()=>window.applyDisplaySettingsToDOM(), 0);
        return r;
      };
    }
  
    if (typeof showSchoolRanking === 'function' && !window.__br_wrap_showSchoolRanking_v2) {
      window.__br_wrap_showSchoolRanking_v2 = true;
      const _orig2 = showSchoolRanking;
      window.showSchoolRanking = function(){
        const r = _orig2.apply(this, arguments);
        setTimeout(()=>window.applyDisplaySettingsToDOM(), 0);
        return r;
      };
    }

    const obs = new MutationObserver((muts)=>{
      let addedPopup = false;
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1 && (n.matches?.('.popup') || n.querySelector?.('.popup'))) {
            addedPopup = true;
            break;
          }
        }
        if (addedPopup) break;
      }
      if (addedPopup) setTimeout(()=>window.applyDisplaySettingsToDOM(), 0);
    });
  
    obs.observe(document.body, { childList:true, subtree:true });
  })();
  
