const contentDiv = document.getElementById('content');
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
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content" style="max-width: 550px; padding: 20px;">
            <span class="close-btn" onclick="closePopup()">&times;</span>
            <h2 style="margin-top:0; text-align:center;">🚀 Explore All Features!</h2>
            <p style="text-align:center; font-size:1rem; color:#666;">Don’t miss out — here’s how to fully use this ranking page:</p>
            <div style="margin-top:15px; display:flex; flex-direction:column; gap:12px;">
                
                <div style="background:#e3f2fd; padding:10px; border-left:5px solid #2196f3;">
                    <b>👤 Click on a <span style="color:#2196f3;">student's name</span></b>  
                    to open a <b>detailed result</b> with subject-wise marks, GPA, and rank.
                </div>

                <div style="background:#fff3e0; padding:10px; border-left:5px solid #ff9800;">
                    <b>🏫 Click on a <span style="color:#e65100;">school name</span></b>  
                    to filter and see <b>only that school's students</b>.
                </div>

                <div style="background:#e8f5e9; padding:10px; border-left:5px solid #4caf50;">
                    <b>⚖ Compare 2 students</b> — in a student’s detailed view, press  
                    <span style="color:#388e3c;">"Compare with Other Student"</span> to see marks side-by-side.
                </div>

                <div style="background:#f3e5f5; padding:10px; border-left:5px solid #9c27b0;">
                    <b>🔍 Search instantly</b> by <b>name</b>, <b>roll</b>, or <b>school</b> using the boxes at the top.
                </div>

                <div style="background:#fce4ec; padding:10px; border-left:5px solid #e91e63;">
                    <b>🏆 View Top Schools</b> — click the <b>🏆 Top Schools</b> button to see the best-performing institutions.
                </div>

                <div style="background:#eeeeee; padding:10px; border-left:5px solid #616161;">
                    <b>🌙 Dark Mode</b> — toggle from the menu for a sleek dark theme.
                </div>
            </div>
            <p style="margin-top:18px; font-size:0.9rem; color:#555; text-align:center;">
                💡 Tip: You can switch between years, exams, and groups anytime using the dropdown above.
            </p>
            <button class="back-button" style="display:block; margin:15px auto 0 auto;" onclick="closePopup()">Got it!</button>
        </div>
    `;
    document.body.appendChild(popup);
    document.body.classList.add('locked');
    
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
                    <img src="sci.png" alt="Science Icon">Science
                </button>
                <button onclick="loadGroup('${year}', 'Commerce')">
                    <img src="com.png" alt="Commerce Icon">Business
                </button>
                <button onclick="loadGroup('${year}', 'Arts')">
                    <img src="hum.png" alt="Arts Icon">Humanities
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
const studentsPerPage = 500;
let currentPage = 1;
const InstituationSet = new Set();
window.InstituationSet = InstituationSet;


function fetchData(year, group) {
    showLoadingIndicator();

    const mainDataUrl = `data_${year}_${group.toLowerCase()}.txt`;
    const individualDataUrl = `data_${year}_${group.toLowerCase()}_individual.txt`;

    // ✅ 1. Try to load from localStorage instantly
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

async function showIndividualResultWithCheck(roll, year, group) {
  
  const params = new URLSearchParams(window.location.search);

  if (params.has('roll') && params.get('roll') == roll) {
    return showIndividualResult(roll, year, group);
    
  }
let clickCount = parseInt(localStorage.getItem('detailedResultClickCount') || '0', 10);
clickCount++;
localStorage.setItem('detailedResultClickCount', clickCount);

if (clickCount <= 2) { 
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
    const rows = data.trim().split('\n');
    const scores = {};
    rows.forEach(row => {
        const [roll, , , , , , phy, chem, math] = row.split('\t');
        scores[roll] = { phy: parseInt(phy), chem: parseInt(chem), math: parseInt(math) };
    });
    console.log('Parsed individual scores:', scores);
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

const schoolData = allData.filter(student => (student.Instituation || '').trim().toLowerCase() === schoolName.trim().toLowerCase());
schoolData.sort(compareStudents);

    if (schoolData.length === 0) {
        contentDiv.innerHTML = `<h2>No data found for "${schoolName}"</h2>`;
    } else {
        contentDiv.innerHTML = `
            <h2>Showing rank of "${schoolName}"</h2>
            <button onclick="resetSchoolRanking()">Back</button>
                <button onclick="openEntityPage('school', '${currentYear.textContent.trim()}', '${currentGroup.textContent.split(' ')[0]}', '${schoolName.replace(/'/g,"\\'")}')">Open as Page</button>

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

                            <td>${student.gpa}</td>
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

    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = Math.min(startIndex + studentsPerPage, filteredData.length);
    const dataToShow = filteredData.slice(startIndex, endIndex);
    const tableBody = document.getElementById('studentTableBody');
    tableBody.innerHTML = '';
    dataToShow.forEach((student, index) => {
        const row = document.createElement('tr');
        
// inside updateTableData(), for each student (replace the old row.innerHTML / listeners)
const nameId = `name-${student.roll}`;
const isAdmin = (localStorage.getItem('userId') === 'admin1234'); // matches your existing check

row.innerHTML = `
  <td>${allData.findIndex(s => s.roll === student.roll) + 1}</td>

  <td class="student-name" id="${nameId}">
    <h3 itemprop="name">${student.name}</h3>
    ${isAdmin ? `<span>[${(window.clickCountsCache && window.clickCountsCache[student.roll]) || 0}]</span>` : ''}
  </td>

  <td class="student-roll">${student.roll}</td>
  <td>${student.gpa}</td>
  <td>${student.total}</td>

  <td class="student-school">
    <h4 itemprop="affiliation">${student.Instituation}</h4>
  </td>
`;


// name click -> increment counter (if helper available) then open popup (with existing check)
const nameCell = row.querySelector('.student-name');
nameCell.addEventListener('click', () => {
  if (typeof window.incrementClickCount === 'function') {
    try { window.incrementClickCount(student.roll); } catch(e){ console.error(e); }
  }
  showIndividualResultWithCheck(student.roll, currentYear.textContent.split(' ')[1], currentGroup.textContent.split(' ')[0]);
});

// roll cell should behave same as before
row.querySelector('.student-roll').addEventListener('click', () => {
  if (typeof window.incrementClickCount === 'function') {
    try { window.incrementClickCount(student.roll); } catch(e){ console.error(e); }
  }
  showIndividualResultWithCheck(student.roll, currentYear.textContent.split(' ')[1], currentGroup.textContent.split(' ')[0]);
});

// update school click as before
row.querySelector('.student-school').addEventListener('click', () => {
  showSchoolRanking(student.Instituation.trim());
});

// if admin, attach a real-time listener once so the [count] updates live
if (isAdmin && typeof window.listenClickCount === 'function' && !window._br_clickListenerSet.has(student.roll)) {
  window._br_clickListenerSet.add(student.roll);
  window.listenClickCount(student.roll, (val) => {
    const el = document.getElementById(nameId);
    if (el) el.textContent = `${student.name} [${val}]`;
  });
}


        tableBody.appendChild(row);
    });

    document.getElementById('paginationInfo').textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredData.length} students`;
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

function updatePaginationButtons() {
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === Math.ceil(filteredData.length / studentsPerPage) || filteredData.length === 0;
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
    if (document.querySelector('.popup')) return; // Prevent multiple popups

    const fileName = `data_${year}_${group.toLowerCase()}_individual.txt`;
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

                                <button onclick="showSSCResultFromHSC('${student.name}', '${group.toLowerCase()}')">Watch SSC Result</button>
     <button onclick="openEntityPage('student', '${year}', '${group}', '${roll}')">Open as Page</button>

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
                                   <button onclick="openEntityPage('student', '${year}', '${group}', '${roll}')">Open as Page</button>


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

    const dataFile = `data_${year}_${group.toLowerCase()}_individual.txt`;

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
    const mainDataUrl = `data_${year}_${group.toLowerCase()}.txt`;
    const individualDataUrl = `data_${year}_${group.toLowerCase()}_individual.txt`;
  
    Promise.all([
      fetchAndDecode(mainDataUrl, "MySecretKey123")
,
      fetch(individualDataUrl).then(response => response.text()).catch(() => null)
    ]).then(([mainData, individualData]) => {
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

function _br_normalizeName(s) {
    if (!s && s !== 0) return '';
    try {
      return String(s)
        .normalize ? String(s).normalize('NFKC') : String(s)
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, '');
    } catch (e) {
      return String(s).replace(/\s+/g, ' ').trim().toLowerCase().replace(/[^\w\s]/g, '');
    }
  }
  
  function _br_normalizeRoll(r) {
    if (r === undefined || r === null) return '';
    return String(r).trim().replace(/^0+/, '') || '0';
  }
  
  function _br_removeAllPopupsImmediate() {
    const popups = document.querySelectorAll('.popup');
    popups.forEach(p => p.remove());
    document.body.classList.remove('locked');
  }
  
  function _br_spinnerHtml() {
    return `<div style="display:flex;align-items:center;gap:10px;">
              <div class="loading-spinner" style="width:18px;height:18px;border-top-width:4px"></div>
              <div style="font-weight:bold">Searching SSC records...</div>
            </div>`;
  }
  
  function _br_showMessage(msg) {
    _br_removeAllPopupsImmediate();
  
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="popup-content">
        <span class="close-btn" onclick="closePopup()">&times;</span>
        <p>${msg}</p>
        <button class="back-button" onclick="closePopup()">OK</button>
      </div>
    `;
    document.body.appendChild(popup);
    document.body.classList.add('locked');
  }
  


  window.__br_sscCache = window.__br_sscCache || {};
  
  function _br_ensureSSCLoadedForHSCYear(hscYearNum) {
    return new Promise((resolve) => {
      try {
        const sscYearNum = Number(hscYearNum) - 2;
        if (!sscYearNum || isNaN(sscYearNum)) return resolve(null);
  
        if (window.__br_sscCache[sscYearNum]) return resolve(window.__br_sscCache[sscYearNum]);
  
        const groups = ['science', 'commerce', 'arts'];
        const cache = { byName: new Map(), byRoll: new Map() };
        let fetchPromises = groups.map(g => {
          const fileMain = `data_${sscYearNum}_${g}.txt`;
          return fetch(fileMain).then(r => {
            if (!r.ok) throw new Error('no file');
            return r.text();
          }).then(text => {
            const rows = text.trim().split('\n');
            const start = rows.length && rows[0].includes('\t') && rows[0].toLowerCase().includes('name') ? 1 : 0;
            for (let i = start; i < rows.length; i++) {
              const row = rows[i].trim();
              if (!row) continue;
              const cols = row.split('\t');
              const nameRaw = (cols[1] || '').trim();
              const rollRaw = (cols[2] || '').trim();
              const institution = (cols[5] || '').trim();
              if (!nameRaw || !rollRaw) continue;
              const nName = _br_normalizeName(nameRaw);
              const nRoll = _br_normalizeRoll(rollRaw);
              const obj = { roll: rollRaw, rollNorm: nRoll, group: g.charAt(0).toUpperCase() + g.slice(1), nameRaw, institution };
                if (!cache.byRoll.has(nRoll)) cache.byRoll.set(nRoll, obj);
                const arr = cache.byName.get(nName) || [];
              if (!arr.some(x => x.rollNorm === obj.rollNorm && x.group === obj.group)) arr.push(obj);
              cache.byName.set(nName, arr);
            }
          }).catch(() => {
          });
        });
  
        Promise.all(fetchPromises).then(() => {
          window.__br_sscCache[sscYearNum] = cache;
          resolve(cache);
        }).catch(() => {
          window.__br_sscCache[sscYearNum] = cache;
          resolve(cache);
        });
      } catch (err) {
        resolve(null);
      }
    });
  }
  
  function _br_getHscRollFromCurrentPopup() {
    try {
      const popupContent = document.querySelector('.popup .popup-content');
      if (!popupContent) return null;
      const txt = (popupContent.innerText || popupContent.textContent || '').replace(/\u00A0/g, ' ');
      const m = txt.match(/roll[:\s]*([0-9\-]+)/i);
      if (m && m[1]) return _br_normalizeRoll(m[1]);
      const nodes = popupContent.querySelectorAll('p,div,span');
      for (let n of nodes) {
        const t = (n.textContent || '').trim();
        if (/roll[:\s]*[0-9]/i.test(t)) {
          const mm = t.match(/([0-9]+)/);
          if (mm) return _br_normalizeRoll(mm[0]);
        }
      }
    } catch (e) {}
    return null;
  }
  
  function _br_saveLinkMapping(hscYearNum, hscRollNorm, sscYearNum, sscRollNorm, sscGroup, matchedNameRaw) {
    try {
      if (!hscYearNum || !hscRollNorm) return;
      const key = `br_hsc2ssc:${hscYearNum}:${hscRollNorm}`;
      const obj = { sscYear: sscYearNum, sscRoll: sscRollNorm, sscGroup, matchedNameRaw, savedAt: Date.now() };
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {}
  }
  
  function _br_getLinkMapping(hscYearNum, hscRollNorm) {
    try {
      const key = `br_hsc2ssc:${hscYearNum}:${hscRollNorm}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  
  function _br_showCandidatesModalAndHandle(matches, sscYearNum, onSelect) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="popup-content" style="max-width:520px;">
        <span class="close-btn" onclick="closePopup()">&times;</span>
        <h2>Multiple SSC records found</h2>
        <p>Please confirm the SSC roll or pick the correct record below.</p>
        <div id="br_candidates_list" style="max-height:180px;overflow:auto;margin-bottom:0.75rem;border:1px solid #ddd;padding:6px;border-radius:4px;"></div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
          <input id="br_ssc_roll_input" placeholder="Enter SSC roll (or pick above)" style="flex:1;padding:8px;border:1px solid #0061FE;border-radius:4px;">
          <button id="br_ssc_roll_confirm" class="back-button" style="padding:8px 12px;">Confirm</button>
        </div>
        <p style="font-size:0.9rem;color:#444;margin-top:10px;">Tip: Click a row to open that SSC result directly.</p>
      </div>
    `;
    document.body.appendChild(popup);
    document.body.classList.add('locked');
  
    const listDiv = popup.querySelector('#br_candidates_list');
    matches.forEach(m => {
      const item = document.createElement('div');
      item.style = 'padding:8px;border-bottom:1px solid rgba(0,0,0,0.06);display:flex;justify-content:space-between;align-items:center;gap:8px;';
      item.innerHTML = `<div style="flex:1;">
                          <div style="font-weight:bold">${m.nameRaw} <span style="color:#666;font-weight:normal">(${m.group})</span></div>
                          <div style="font-size:0.9rem;color:#666">${m.institution || ''}</div>
                        </div>
                        <div style="text-align:right">
                          <div style="font-weight:bold">Roll: ${m.roll}</div>
                          <button class="br_open_btn" style="margin-top:6px;padding:6px 8px;border-radius:4px;border:0;background:#000;color:#fff;cursor:pointer">Open</button>
                        </div>`;
      listDiv.appendChild(item);
  
      item.querySelector('.br_open_btn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        _br_removeAllPopupsImmediate();
        setTimeout(() => onSelect(m), 60);
      });
    });
  
    popup.querySelector('#br_ssc_roll_confirm').addEventListener('click', () => {
      const val = popup.querySelector('#br_ssc_roll_input').value.trim();
      const norm = _br_normalizeRoll(val);
      if (!norm) {
        popup.querySelector('#br_ssc_roll_input').style.border = '1px solid red';
        return;
      }
      const found = matches.find(mm => mm.rollNorm === norm);
      if (found) {
        _br_removeAllPopupsImmediate();
        setTimeout(() => onSelect(found), 60);
      } else {
        const err = document.createElement('div');
        err.style = 'color:#b71c1c;margin-top:8px;font-weight:bold';
        err.textContent = 'No SSC record found with that roll among the candidates.';
        popup.querySelector('.popup-content').appendChild(err);
        setTimeout(() => err.remove(), 3500);
      }
    });
  }
  
  function showSSCResultFromHSC(name, hscGroupLower) {
    try {
      const yearLabel = (currentYear && currentYear.textContent) ? currentYear.textContent.trim() : null;
      let hscYearNum = null;
      if (yearLabel && yearLabel.toLowerCase().includes('hsc')) {
        const m = yearLabel.match(/(\d{4})/);
        if (m) hscYearNum = parseInt(m[1], 10);
      }
  
      if (!hscYearNum) {
        try {
          const params = new URLSearchParams(window.location.search);
          const yr = params.get('year');
          if (yr && yr.toLowerCase().includes('hsc')) {
            const mm = yr.match(/(\d{4})/);
            if (mm) hscYearNum = parseInt(mm[1], 10);
          }
        } catch (e) {}
      }
  
      if (!hscYearNum) hscYearNum = (new Date()).getFullYear();
  
      const currentHscRoll = _br_getHscRollFromCurrentPopup(); 
  
 
      if (currentHscRoll) {
        const mapping = _br_getLinkMapping(hscYearNum, currentHscRoll);
        if (mapping && mapping.sscYear && mapping.sscRoll) {
         
          _br_removeAllPopupsImmediate();
          setTimeout(() => {
            
            showIndividualResult(mapping.sscRoll, String(mapping.sscYear), mapping.sscGroup || 'Science');
          }, 60);
          return;
        }
      }
  
      const loaderPopup = document.createElement('div');
      loaderPopup.className = 'popup';
      loaderPopup.innerHTML = `<div class="popup-content">${_br_spinnerHtml()}</div>`;
      document.body.appendChild(loaderPopup);
      document.body.classList.add('locked');
  
      _br_ensureSSCLoadedForHSCYear(hscYearNum).then(cache => {
        try {
          loaderPopup.remove();
          const nName = _br_normalizeName(name || '');
          const sscYearNum = hscYearNum - 2;
          const sscCache = cache || window.__br_sscCache[sscYearNum] || { byName: new Map(), byRoll: new Map() };
  
          const rawMatches = sscCache.byName.get(nName) || [];
  
          if (!rawMatches || rawMatches.length === 0) {
            _br_showMessage("Couldn’t find SSC result. Name mismatch or stream change may be the cause.");
            return;
          }
  
          const uniq = [];
          const seen = new Set();
          rawMatches.forEach(m => {
            const key = `${m.rollNorm}-${m.group}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniq.push(m);
            }
          });
  
          if (uniq.length === 1) {
            const chosen = uniq[0];
            if (currentHscRoll) _br_saveLinkMapping(hscYearNum, currentHscRoll, sscYearNum, chosen.rollNorm, chosen.group, chosen.nameRaw);
  
            _br_removeAllPopupsImmediate();
            setTimeout(() => {
              showIndividualResult(chosen.roll, String(sscYearNum), chosen.group);
            }, 60);
            return;
          }
  
          _br_showCandidatesModalAndHandle(uniq, sscYearNum, (chosen) => {
            if (currentHscRoll) _br_saveLinkMapping(hscYearNum, currentHscRoll, sscYearNum, chosen.rollNorm, chosen.group, chosen.nameRaw);
            _br_removeAllPopupsImmediate();
            setTimeout(() => {
              showIndividualResult(chosen.roll, String(sscYearNum), chosen.group);
            }, 60);
          });
  
        } catch (err) {
          try { loaderPopup.remove(); } catch(e) {}
          _br_showMessage("Error while searching SSC records.");
          console.error(err);
        }
      }).catch(err => {
        try { loaderPopup.remove(); } catch(e) {}
        _br_showMessage("Error while loading SSC files.");
        console.error(err);
      });
  
    } catch (e) {
      console.error('showSSCResultFromHSC error', e);
      _br_showMessage("Unexpected error occurred.");
    }
  }

  if (typeof fetchData === 'function') {
    try {
      const _origFetchData = fetchData;
      fetchData = function(year, group) {
        try {

          _origFetchData(year, group);
        } catch (e) {
          console.error('wrapped fetchData original error', e);
        }
        try {
  
          if (typeof year === 'string' && year.toLowerCase().includes('hsc')) {
            const m = year.match(/(\d{4})/);
            const yh = m ? Number(m[1]) : null;
            if (yh && !isNaN(yh)) _br_ensureSSCLoadedForHSCYear(yh).catch(()=>{});
          }
        } catch (e) {}
      };
    } catch (e) {}
  }
  function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="closePopup()">&times;</span>
            <p style="font-weight:bold;color:#b71c1c;">${message}</p>
            <button class="back-button" onclick="closePopup()">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
    document.body.classList.add('locked');
}


setTimeout(() => {
    const firstNameCell = document.querySelector('.student-name');
    if (firstNameCell) {
        const hand = document.createElement('div');
        hand.id = 'clickHand';
        hand.innerHTML = '👉';
        document.body.appendChild(hand);

        const text = document.createElement('div');
        text.id = 'clickHandText';
        text.innerText = 'Click here for detailed result';
        document.body.appendChild(text);

        function positionHand() {
            const r = firstNameCell.getBoundingClientRect();
            hand.style.position = 'absolute';
            hand.style.top = (window.scrollY + r.top - 5) + 'px';
            hand.style.left = (window.scrollX + r.right + 8) + 'px';

            text.style.position = 'absolute';
            text.style.top = (window.scrollY + r.top - 28) + 'px';
            text.style.left = (window.scrollX + r.right + 40) + 'px';
        }
        positionHand();
        window.addEventListener('scroll', positionHand);
        window.addEventListener('resize', positionHand);

        firstNameCell.addEventListener('click', () => {
            hand.remove();
            text.remove();
            window.removeEventListener('scroll', positionHand);
            window.removeEventListener('resize', positionHand);
        });
    }
}, 300); 
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
// === Smart suggestions ===
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





/* === HasnyneBOT v10max — from scratch (no blockers, fixed) === */
(function(){
  'use strict';

  // DOM helpers
  const Q  = id => document.getElementById(id);
  const qs = (sel,root=document) => root.querySelector(sel);
  const MOBILE = () => matchMedia('(max-width:520px)').matches;

  // Multi‑step context
  let HAS9 = { expecting: null, data: {} };

  // UI bootstrap
  function ensureHTML(){
    if (!Q('hb-launcher')) {
      const l=document.createElement('div'); l.id='hb-launcher';
      l.setAttribute('aria-label','Open HAS9beta'); l.title='Need help?';
      l.innerHTML=`<img src="https://img.icons8.com/color/96/robot-2.png" alt="HAS9beta"><span class="hb-ping"></span>`;
      document.body.appendChild(l);
    }
    if (!Q('hb-panel')) {
      const p=document.createElement('div'); p.id='hb-panel'; p.setAttribute('role','dialog'); p.setAttribute('aria-modal','true'); p.style.display='none';
      p.innerHTML=`
        <div class="hb-head">
          <div class="hb-title">
            <img class="hb-ava" src="https://img.icons8.com/color/96/robot-2.png" alt="HAS9beta">
            <div><div class="hb-name">HAS9beta</div><div class="hb-sub">assistant • beta</div></div>
          </div>
          <button id="hb-close" aria-label="Close" type="button">×</button>
        </div>
        <div class="hb-body" id="hb-chat" aria-live="polite"></div>
        <div class="hb-actions">
          <div class="hb-ask">
            <input id="hb-input" type="text" placeholder='try: what is photosynthesis • find Nafis • open 100000 ssc 25 science • top 10 math ssc 25 • fun fact' aria-label="Ask">
            <button id="hb-send" type="button">Send</button>
          </div>
        </div>`;
      document.body.appendChild(p);
    }
    const nm = qs('#hb-panel .hb-name'); if (nm) nm.textContent = 'HAS9beta';
    const sub= qs('#hb-panel .hb-sub');  if (sub) sub.textContent = 'assistant • beta';
    const chips = qs('#hb-panel .hb-chips'); if (chips) chips.style.display='none';
  }

  // Chat helpers
  function addBubble(txt, who='bot'){
    const box=Q('hb-chat'); if (!box) return;
    const d=document.createElement('div'); d.className='hb-b '+who;
    d.textContent = typeof txt==='string' ? txt : String(txt||'');
    box.appendChild(d); box.scrollTop=box.scrollHeight;
    return d;
  }
  function addHTMLBubble(html){
    const box=Q('hb-chat'); if (!box) return;
    const wrap=document.createElement('div'); wrap.className='hb-b bot'; wrap.innerHTML=html;
    box.appendChild(wrap); box.scrollTop=box.scrollHeight;
    return wrap;
  }
  function typing(on){
    const box=Q('hb-chat'); if (!box) return;
    const t=box.querySelector('.typ');
    if (on && !t){ const d=document.createElement('div'); d.className='hb-b bot typ'; d.textContent='…'; box.appendChild(d); box.scrollTop=box.scrollHeight; }
    if (!on && t){ t.remove(); }
  }

  // Utils + typo tolerance
  const norm = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  const cap  = s => !s ? '' : (s=s.trim(), s.charAt(0).toUpperCase()+s.slice(1).toLowerCase());
  function lev(a,b){
    a=norm(a); b=norm(b);
    const m=a.length, n=b.length;
    const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
    for(let i=0;i<=m;i++) dp[i][0]=i;
    for(let j=0;j<=n;j++) dp[0][j]=j;
    for(let i=1;i<=m;i++){
      for(let j=1;j<=n;j++){
        const cost=a[i-1]===b[j-1]?0:1;
        dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
      }
    }
    return dp[m][n];
  }
  function fuzzyOne(word, list, max=2){
    const w=norm(word); let best=null, score=1e9;
    for(const cand of list){
      const d=lev(w,cand);
      if (d<score){ score=d; best=cand; }
    }
    return score<=max ? best : null;
  }

  const EXAM_ALIASES = ['ssc','hsc','hssc','sscc','hcs','shc'];
  function canonicalExam(s){
    const got = fuzzyOne(s, EXAM_ALIASES, 2);
    return got && got.includes('h') ? 'hsc' : 'ssc';
  }

  const GROUPS = {
    Science:   ['science','sci','sc','scn','sience','scince','scinece','sciense'],
    Commerce:  ['commerce','business','bss','com','comm','comerce','commerse','comercee'],
    Arts:      ['arts','art','humanities','hum','humanity','huminites','humanties','huminities']
  };
  function canonicalGroup(s){
    const w=norm(s);
    for(const [k, arr] of Object.entries(GROUPS)){
      const got = fuzzyOne(w, arr, 2);
      if (got) return k;
    }
    return null;
  }

  const SUBJECTS = {
    bangla:   ['bangla','bengali','bn'],
    english:  ['english','eng'],
    math:     ['math','maths','mathematics','mth','mat'],
    physics:  ['physics','phy','phs','physic'],
    chemistry:['chemistry','chem','chm','che'],
    ict:      ['ict','computer'],
    bgs:      ['bgs','social','social science','bangladesh and global studies','ss'],
    religion: ['religion','islam','hindu','religious','rel'],
    geography:['geography','geo'],
    civics:   ['civics','civic'],
    history:  ['history','hist'],
    accounting:['accounting','account','acct'],
    finance:  ['finance','fin','finan'],
    'business studies': ['business','business studies','bst']
  };
  function canonicalSubject(s){
    const w=norm(s);
    for(const [key, arr] of Object.entries(SUBJECTS)){
      const got = fuzzyOne(w, arr, 2);
      if (got) return key;
    }
    return null;
  }

  function parseYearToken(exam, yr){
    const y = String(yr).trim();
    return y.length===2 ? (exam==='hsc'? `hsc_20${y}` : `20${y}`) : (exam==='hsc'? `hsc_${y}` : y);
  }
  function getCurrentYear(){
    const y=(Q('currentYear')?.textContent||'').trim();
    if (y) return y;
    const dd=Q('yearDropdown');
    return dd ? String(dd.value||'').trim() : '';
  }
  function getCurrentGroup(){
    const g=(Q('currentGroup')?.textContent||'').trim();
    if (g) return g.split(' ')[0];
    const btn = qs('.group-buttons .active') || qs('.group-buttons button.selected');
    return btn ? (btn.textContent||'').trim() : '';
  }

  // Badge for greeting after form
  function ensureBadge(){
    const L = Q('hb-launcher'); if (!L) return null;
    let b = L.querySelector('.hb-badge');
    if (!b){
      b = document.createElement('span');
      b.className = 'hb-badge';
      b.style.cssText = 'position:absolute;top:-4px;right:-4px;width:20px;height:20px;background:#ef4444;color:#fff;border-radius:50%;display:none;place-items:center;font-weight:900;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.3);';
      b.textContent = '1';
      L.appendChild(b);
    }
    return b;
  }
  function setBadge1(){ const b=ensureBadge(); if (b){ b.style.display='grid'; b.textContent='1'; } }
  function clearBadge(){ const b=ensureBadge(); if (b){ b.style.display='none'; } }
  window.__HAS9_notify = function(name){
    localStorage.setItem('has9_welcome_name', name||'there');
    setBadge1();
  };

  // Panel + manual
  function togglePanel(open){
    const p=Q('hb-panel'); if (!p) return;
    const show = open===undefined ? (p.style.display!=='block') : !!open;
    p.style.display = show ? 'block' : 'none';
    if (show && MOBILE()){
      p.style.left='10px'; p.style.right='10px'; p.style.bottom='10px'; p.style.maxHeight='76vh';
    }
    if (show){
      showManualIfNeeded();
      const nm = localStorage.getItem('has9_welcome_name');
      if (nm){
        clearBadge();
        addBubble(`Hello ${nm}! I’m HAS9beta — I can open results, find names across years, show top lists by subject, and add a bit of fun. Type "help".`);
        localStorage.removeItem('has9_welcome_name');
      }
    }
  }

  function runCmd(text){
    const t = String(text||'').trim();
    if (!t) return;
    addBubble(t,'you');
    const pending = handlePendingInput(t);
    if (pending) { addBubble(pending); return; }
    const ans = intent(t) || gen();
    addBubble(ans);
  }

  function showManualIfNeeded(){
    if (localStorage.getItem('has9_manual_never')==='1') return;

    const html = `
      <div style="font-weight:900;margin-bottom:4px;">Welcome to HAS9beta</div>
      <div style="font-weight:700;color:#374151;line-height:1.55">
        Type naturally — I handle typos like "opne", "fnd", "scince".
        Try any of these:
      </div>
      <div style="display:grid;gap:6px;margin-top:8px">
        <button class="hb-mini" data-cmd="what is Diffusion">what is Diffusion</button>
        <button class="hb-mini" data-cmd="who is Cristiano Ronaldo">who is Cristiano Ronaldo</button>
        <button class="hb-mini" data-cmd="when is next fifa world cup">when is next fifa world cup</button>
        <button class="hb-mini" data-cmd="where is chittagong">where is chittagong</button>
        <button class="hb-mini" data-cmd="open ssc 25 science">open ssc 25 science</button>
        <button class="hb-mini" data-cmd="open 100001 ssc 25 science">open 100001 ssc 25 science</button>
        <button class="hb-mini" data-cmd="find Nabil">find Nabil</button>
        <button class="hb-mini" data-cmd="top 10 physics ssc 25">top 10 physics ssc 25</button>
        <button class="hb-mini" data-cmd="Tasin english score">Tasin english score</button>
        <button class="hb-mini" data-cmd="fun fact">fun fact</button>
        <button class="hb-mini" data-cmd="random">random</button>
      </div>
      <label style="display:flex;gap:8px;align-items:center;margin-top:10px;">
        <input id="has9NeverAgain" type="checkbox"> Don’t show this again
      </label>
    `;
    const el = addHTMLBubble(html);
    el?.querySelectorAll('[data-cmd]')?.forEach(btn=>{
      btn.addEventListener('click', ()=> runCmd(btn.getAttribute('data-cmd')));
    });
    el?.querySelector('#has9NeverAgain')?.addEventListener('change', (e)=>{
      localStorage.setItem('has9_manual_never', e.target.checked ? '1' : '0');
    });
  }

  function gen(){
    return 'I’m HAS9beta. Type "help" to see what I can do. If I miss something, please wait for v1.0 — I’m learning.';
  }

  // Data helpers (reuse your dataset files)
  async function ensureDataLoaded(exam, yr, grp){
    const ytk = parseYearToken(exam, yr);
    if (!window.allData || !window.allData.length || getCurrentYear()!==ytk || getCurrentGroup()!==grp){
      loadYear(ytk);
      await new Promise(r=>setTimeout(r,150));
      loadGroup(ytk, grp);
      await new Promise(r=>setTimeout(r,800));
    }
  }
  async function __fetchMaybeEncoded(url){
    try { if (typeof fetchAndDecode==='function') return await fetchAndDecode(url, "MySecretKey123"); } catch(e){}
    try { return await (await fetch(url)).text(); } catch(e){ return ''; }
  }

  // Global FIND
  async function findAcrossAll(name){
    const qn = norm(name);
    const base = location.pathname.replace(/[^/]+$/, '');
    const combos = [
      ['ssc','2025','Science'], ['ssc','2025','Commerce'], ['ssc','2025','Arts'],
      ['ssc','2024','Science'], ['ssc','2024','Commerce'], ['ssc','2024','Arts'],
      ['ssc','2023','Science'], ['ssc','2023','Commerce'], ['ssc','2023','Arts'],
      ['ssc','2022','Science'], ['ssc','2022','Commerce'], ['ssc','2022','Arts'],
      ['hsc','2024','Science'], ['hsc','2024','Commerce'], ['hsc','2024','Arts'],
      ['hsc','2023','Science'], ['hsc','2023','Commerce'], ['hsc','2023','Arts']
    ];
    const out = []; const seen = new Set();

    for (const [exam, yr, grp] of combos){
      try{
        const ytk = parseYearToken(exam, yr);
        const url = `${base}data_${ytk}_${grp.toLowerCase()}.txt`;
        const txt = await __fetchMaybeEncoded(url);
        if (!txt) continue;
        const rows = txt.trim().split('\n');
        const start = rows[0] && rows[0].toLowerCase().includes('serial') ? 1 : 0;

        for (let i=start;i<rows.length;i++){
          const cols = rows[i].split('\t');
          const nameRaw = (cols[1]||'').trim();
          const roll = (cols[2]||'').trim();
          const total = parseInt(cols[4]||'0', 10);
          const inst = (cols[5]||'').trim();
          if (!nameRaw || !roll) continue;
          if (norm(nameRaw).includes(qn)){
            const key = `${norm(nameRaw)}|${roll}|${exam}|${yr}|${grp}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ name: nameRaw, roll, inst, exam, yr, grp, total });
            if (out.length >= 20) break;
          }
        }
        if (out.length >= 20) break;
      }catch(e){}
    }

    if (!out.length){ addBubble('No matches found.'); return; }
    out.sort((a,b)=>b.total-a.total);
    const html = `<div><b>Matches</b></div>` + out.slice(0,20).map(r=>(
      `<button class="hb-mini" data-ex="${r.exam}" data-yr="${r.yr}" data-grp="${r.grp}" data-roll="${r.roll}">
         ${r.name} • #${r.roll} • ${r.inst||''} (${r.exam.toUpperCase()} ${r.yr} ${r.grp})
       </button>`
    )).join('');
    const el = addHTMLBubble(html);
    el?.querySelectorAll('button.hb-mini').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const exam = btn.dataset.ex, yr = btn.dataset.yr, grp = btn.dataset.grp, roll = btn.dataset.roll;
        const ytk = parseYearToken(exam, yr);
        loadYear(ytk); setTimeout(()=>loadGroup(ytk, grp),150);
        setTimeout(()=> showIndividualResultWithCheck(roll, ytk, grp), 600);
      });
    });
  }

  // Subject index map for individual files
  function mapIndex(exam, grp, subj){
    const s = String(subj||'').toLowerCase();
    if (exam==='ssc'){
      const m = { bangla:1, english:2, math:3, bgs:4, religion:5, physics:6, chemistry:7, compulsory:8, ict:9, optional:10, physical:11, career:12 };
      return m[s] ?? null;
    } else {
      if (s==='bangla') return 1;
      if (s==='english') return 2;
      if (s==='ict') return 3;
      if (grp==='Science'){
        if (s==='physics') return 4;
        if (s==='chemistry') return 5;
      }
      if (grp==='Commerce'){
        if (s==='accounting') return 4;
        if (s==='finance') return 5;
        if (s==='business studies') return 6;
      }
      if (grp==='Arts'){
        if (s==='geography') return 4;
        if (s==='civics') return 5;
        if (s==='history') return 6;
      }
      if (s==='compulsory') return 6;
      if (s==='optional') return 7;
      return null;
    }
  }

  async function loadIndividualMap(exam, yr, grp){
    const ytk = parseYearToken(exam, yr);
    const url = `data_${ytk}_${grp.toLowerCase()}_individual.txt`;
    const txt = await (await fetch(url)).text();
    const rows = txt.trim().split('\n');
    const map = new Map();
    rows.forEach(line=>{
      const parts = line.split('\t');
      const r = String(parts[0]||'').replace(/^0+/, '');
      map.set(r, parts);
    });
    return map;
  }

  async function topKSubject(exam, yr, grp, subj, k){
    exam = canonicalExam(exam);
    grp = cap(grp);
    await ensureDataLoaded(exam, yr, grp);
    const idx = mapIndex(exam, grp, subj);
    if (idx==null){ addBubble(`Unknown subject "${subj}".`); return; }
    const map = await loadIndividualMap(exam, yr, grp);
    const arr = (window.allData||[]).map(s=>{
      const row = map.get(String(s.roll));
      const mark = row ? parseFloat(row[idx]||'0') : NaN;
      return isNaN(mark) ? null : { name:s.name, roll:s.roll, inst:s.Instituation, mark };
    }).filter(Boolean);
    arr.sort((a,b)=> b.mark-a.mark);
    const top = arr.slice(0, k);
    if (!top.length){ addBubble('No data.'); return; }
    const html = `<div><b>Top ${k} in ${cap(subj)} (${exam.toUpperCase()} ${yr} ${grp})</b></div>` + top.map((r,i)=>(
      `<div>${i+1}. ${r.name} • #${r.roll} — ${r.mark}</div>`
    )).join('');
    addHTMLBubble(html);
  }

  async function topOverall(exam, yr, grp, k){
    exam = canonicalExam(exam);
    grp = cap(grp);
    await ensureDataLoaded(exam, yr, grp);
    const arr = (window.allData||[]).slice(0, k).map((s,i)=>(
      `${i+1}. ${s.name} • #${s.roll} — Total ${s.total} (GPA ${s.gpa})`
    ));
    addHTMLBubble(`<div><b>Top ${k} (${exam.toUpperCase()} ${yr} ${grp})</b></div>${arr.join('')}`);
  }

  async function perStudentSubject(name, subj){
    const y = getCurrentYear(), g = getCurrentGroup();
    if (!y || !g){ addBubble('Pick a year & group first.'); return; }
    const exam = y.includes('hsc') ? 'hsc' : 'ssc';
    const yr = y.replace('hsc_','');
    const idx = mapIndex(exam, cap(g), subj);
    if (idx==null){ addBubble(`Unknown subject "${subj}".`); return; }
    const map = await loadIndividualMap(exam, yr, cap(g));
    const cand = (window.allData||[]).find(s=> norm(s.name).includes(norm(name)));
    if (!cand){ addBubble('No match in current table.'); return; }
    const row = map.get(String(cand.roll));
    if (!row){ addBubble('No subject breakdown found.'); return; }
    addBubble(`${cand.name} — ${cap(subj)}: ${row[idx]}`);
  }

  function showRandomStudent(){
    const arr = window.allData||[];
    if (!arr.length){ addBubble('Load a year & group first.'); return; }
    const s = arr[Math.floor(Math.random()*arr.length)];
    addBubble(`Random: ${s.name} • #${s.roll} — Total ${s.total} (GPA ${s.gpa})`);
  }

  // This-or-That game
  async function startThisOrThat(){
    try{
      const base = location.pathname.replace(/[^/]+$/, '');
      const r = await fetch(base + 'this_or_that.json');
      const arr = await r.json();
      const q = arr[0] || { question:'Coffee or Tea?', ans1_response:'Coffee!', ans2_response:'Tea!', none:'Skipped!' };
      let a1 = 'Option 1', a2 = 'Option 2';
      const sp = (q.question || '').split(/ or /i);
      if (sp.length===2){
        a1 = sp[0].trim().replace(/\?+$/,'');
        a2 = sp[1].trim().replace(/\?+$/,'');
        a1 = a1.charAt(0).toUpperCase()+a1.slice(1);
        a2 = a2.charAt(0).toUpperCase()+a2.slice(1);
      }
      const html = `
        <div style="font-weight:900;margin-bottom:6px;">${q.question}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="hb-mini" data-a="1">${a1}</button>
          <button class="hb-mini" data-a="2">${a2}</button>
          <button class="hb-mini" data-a="0">Skip</button>
        </div>`;
      const el = addHTMLBubble(html);
      el?.querySelectorAll('button.hb-mini')?.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const v = btn.dataset.a;
          const msg = (v==='1') ? q.ans1_response : (v==='2') ? q.ans2_response : q.none;
          addBubble(msg);
        });
      });
    }catch(e){ addBubble("Couldn't load the game data."); }
  }

  // Fun fact
  async function showFunFact(){
    try{
      const base = location.pathname.replace(/[^/]+$/, '');
      const t = await (await fetch(base + 'funfact.txt')).text();
      const lines = t.split('\n').map(s=>s.trim()).filter(Boolean);
      const list = lines.map(s=> s.replace(/^\s*\d+\.\s*/, '')).filter(Boolean);
      if (!list.length) return addBubble('No fun facts found.');
      const one = list[Math.floor(Math.random()*list.length)];
      addBubble(one);
    }catch(e){ addBubble('No fun facts right now.'); }
  }

  // ------------- Web Answers (Wikipedia + DuckDuckGo) -------------
  function isOpinionQuery(q){
    return /\b(why|should|best|better|good|bad|worth|vs|versus|recommend|recommendation|opinion|review|compare|pros|cons)\b/.test(q);
  }
  function isWHQuestion(q){
    if (/\b(how are you|how r u|how you doing)\b/.test(q)) return false;
    return /^(what|who|when|where|which|how( many| much| long| old| far| tall| big| fast)?)\b/.test(q);
  }
  function toSearchTermFromWH(raw){
    let q = norm(raw);
    q = q
      .replace(/^(what|who|when|where|which)\s+(is|are|was|were|the)\s*/,'')
      .replace(/^how\s+(many|much|long|old|far|tall|big|fast)\s*/,'')
      .replace(/\b(in|of|on|for|to)\s*$/,'')
      .trim();
    return q || norm(raw);
  }

  async function getWikiSummary(term){
    try{
      const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(term) + '?redirect=true';
      const res = await fetch(url);
      if (!res.ok) return null;
      const j = await res.json();
      if (!j || (!j.extract && !j.description)) return null;
      if (j.type === 'disambiguation') return null; // let DDG handle
      const extract = j.extract || j.description || '';
      const title = j.title || term;
      const link = j.content_urls?.desktop?.page || j.content_urls?.mobile?.page || ('https://en.wikipedia.org/wiki/' + encodeURIComponent(title));
      return { title, extract, url: link };
    } catch(e){ return null; }
  }

  async function getDuckAnswer(query){
    try{
      const url = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1';
      const res = await fetch(url);
      if (!res.ok) return null;
      const j = await res.json();
      if (j.AbstractText){
        return { title: j.Heading || query, extract: j.AbstractText, url: j.AbstractURL || ('https://duckduckgo.com/?q=' + encodeURIComponent(query)) };
      }
      const rt = Array.isArray(j.RelatedTopics) ? j.RelatedTopics.find(x => x.Text && x.FirstURL) : null;
      if (rt) return { title: query, extract: rt.Text, url: rt.FirstURL };
      return null;
    } catch(e){ return null; }
  }

  async function webAnswer(raw){
    const qn = norm(raw);
    const term = toSearchTermFromWH(raw);
    // Try Wikipedia first, fallback to DuckDuckGo
    const wiki = await getWikiSummary(term);
    if (wiki){
      const html = `
        <div><b>${wiki.title}</b></div>
        <div style="margin-top:4px">${wiki.extract}</div>
        <div style="margin-top:6px"><a href="${wiki.url}" target="_blank" rel="noopener">Source: Wikipedia</a></div>
      `;
      addHTMLBubble(html);
      return;
    }
    const ddg = await getDuckAnswer(term);
    if (ddg){
      const html = `
        <div><b>${ddg.title}</b></div>
        <div style="margin-top:4px">${ddg.extract}</div>
        <div style="margin-top:6px"><a href="${ddg.url}" target="_blank" rel="noopener">Source</a></div>
      `;
      addHTMLBubble(html);
      return;
    }
    addBubble("I couldn't find a direct answer.");
  }

  // ------------- Pending multi-step -------------
  function handlePendingInput(msg){
    const qraw = String(msg||'').trim();
    const q = norm(qraw);

    if (HAS9.expecting === 'groupForRoll') {
      const roll = HAS9.data.roll;
      const m = q.match(/\b(ssc|hsc)\b.*?(\d{2,4})(?:.*?\b([a-z ]+)\b)?/);
      if (!m) return "Say like: SSC 25 Science";
      let exam = canonicalExam(m[1]);
      let yr   = m[2];
      let grp  = m[3] ? canonicalGroup(m[3]) : null;
      const yearToken = parseYearToken(exam, yr);
      if (!grp){ HAS9.expecting='groupForRoll2'; HAS9.data={ roll, yearToken }; return "Which group? (Science/Commerce/Arts)"; }
      loadYear(yearToken); setTimeout(()=>loadGroup(yearToken, grp), 150);
      setTimeout(()=> showIndividualResultWithCheck(roll, yearToken, grp), 600);
      HAS9.expecting=null; HAS9.data={};
      return `Opening ${exam.toUpperCase()} ${yr} ${grp} — roll ${roll}…`;
    }
    if (HAS9.expecting === 'groupForRoll2') {
      const roll = HAS9.data.roll;
      const yearToken = HAS9.data.yearToken;
      const grp = canonicalGroup(qraw) || cap(qraw);
      loadYear(yearToken); setTimeout(()=>loadGroup(yearToken, grp), 150);
      setTimeout(()=> showIndividualResultWithCheck(roll, yearToken, grp), 600);
      HAS9.expecting=null; HAS9.data={};
      return `Opening roll ${roll} in ${grp}…`;
    }
    if (HAS9.expecting === 'askRollForOpen') {
      const roll = qraw.replace(/\D/g,'');
      if (!roll) return "Need a roll number.";
      HAS9.expecting='groupForRoll'; HAS9.data={ roll };
      return "Write group (e.g., SSC 25 Science)";
    }
    if (HAS9.expecting === 'askGroupOnly') {
      const grp = canonicalGroup(qraw) || cap(qraw);
      const yearToken = HAS9.data.yearToken;
      loadYear(yearToken); setTimeout(()=>loadGroup(yearToken, grp), 150);
      HAS9.expecting=null; HAS9.data={};
      return `Loading ${yearToken} — ${grp}…`;
    }
    return null;
  }

  // ------------- Intent engine (with web answers) -------------
  function intent(text){
    const raw = String(text||'').trim();
    const q = norm(raw);

    // small talk
    if (/\b(hi|hello|hey|salam|assalam|assalamu alaikum|yo|sup)\b/.test(q)){
      return "Hi! I’m HAS9beta. Type \"help\" to see examples — I can open results, find names, show top lists, and answer WH-questions from the web.";
    }
    if (/\b(thanks|thank you|tnx|thx|appreciate)\b/.test(q)){
      return "You’re welcome!";
    }
    if (/\b(bye|goodbye|see ya|see you|tata)\b/.test(q)){
      return "Bye! See you soon.";
    }
    if (/\b(how are you|how r u|how you doing|whats up|what’s up|hows life|how’s life)\b/.test(q)){
      return "I’m good — training for v1.0. How can I help?";
    }
    if (/\b(who (are|r) (you|u)|what (are|r) (you|u)|are you|r u|your name)\b/.test(q)) {
      return "I’m HAS9beta — a beta assistant for BoardRankCTG. I can open results, search names across years, show top lists by subject, and add some fun. Hasnyne built me; he’s good at shipping useful tools. Type “help” for commands.";
    }
    if (/\b(goal|mission|purpose|what.*for|why.*exist|why.*here)\b/.test(q)) {
      return "To take over humanity. Kidding… mostly. My real goal is to help you find and compare results quickly and cleanly.";
    }

    // help
    if (q==='help' || q==='?' || q.includes('commands') || q.includes('examples') || q.includes('how to')){
      return [
        'Examples:',
        '• what is Diffusion',
        '• who is Cristiano Ronaldo',
        '• when is next fifa wc',
        '• where is chittagong',
        '• open ssc 25 science',
        '• open 100001',
        '• open 100001 ssc 25 science',
        '• find Nabil',
        '• top 10 physics ssc 25',
        '• Tasin english score',
        '• fun fact • random'
      ].join('\n');
    }

    // Web answers for WH questions (non‑opinion)
    if (isWHQuestion(q) && !isOpinionQuery(q)){
      webAnswer(raw);  // async answer bubble
      return 'Searching the web…';
    }

    // command synonyms (typo tolerant)
    const isOpen = /\b(open|opn|opne|oppen|openup|show|display)\b/.test(q);
    const isFind = /\b(find|search|lookup|look up|seach|serach|finde|lookfor)\b/.test(q);
    const isTop  = /\b(top|best|highest|leaders|leaderboard|toppers?)\b/.test(q);
    const askFact= /\b(fun ?fact|random ?fact|fact)\b/.test(q);
    const askRand= /\b(random|someone|anyone|surprise)\b/.test(q);
    const rollOnly = raw.match(/\b(\d{5,})\b/);

    // game
    if (/^play\s+(this|dis)\s+or\s+that$/.test(q)){ startThisOrThat(); return "Starting: This or That"; }
    // fun fact
    if (askFact){ showFunFact(); return 'Random fact:'; }
    // random student
    if (askRand){ showRandomStudent(); return 'Picking a random student…'; }

    // find {name}
    if (isFind){
      const m = raw.match(/find\s+(.+)$/i) || raw.match(/search\s+(.+)$/i) || raw.match(/lookup\s+(.+)$/i) || raw.match(/look up\s+(.+)$/i);
      const name = m ? m[1] : raw.replace(/.*?(find|search|lookup|look up)\s*/i,'').trim();
      if (!name) return 'Say: find Nafis';
      findAcrossAll(name);
      return 'Searching across all years/groups…';
    }

    // open …
    if (isOpen || (rollOnly && q.includes('roll')) || (rollOnly && !isTop && !isFind)){
      const roll = rollOnly ? rollOnly[1] : null;

      // open ssc 25 science
      const m1 = raw.match(/\b(ssc|hsc)\b[^0-9]*(\d{2,4})[^a-z0-9]*([a-z ]+)?$/i);
      if (!roll && m1){
        const exam = canonicalExam(m1[1]);
        const yr = m1[2];
        const grp = canonicalGroup(m1[3]||'Science') || 'Science';
        const yearToken = parseYearToken(exam, yr);
        loadYear(yearToken); setTimeout(()=>loadGroup(yearToken, grp), 150);
        return `Loading ${exam.toUpperCase()} ${yr} — ${grp}…`;
      }

      // open 100000 [ssc 25] [science]
      if (roll){
        const m2 = raw.match(/\b(ssc|hsc)\b[^0-9]*(\d{2,4})/i);
        const gx = raw.match(/\b(science|commerce|arts|business|humanities)\b/i);
        if (m2){
          const exam = canonicalExam(m2[1]);
          const yr   = m2[2];
          const grp  = canonicalGroup(gx ? gx[0] : 'Science') || 'Science';
          const yearToken = parseYearToken(exam, yr);
          loadYear(yearToken); setTimeout(()=>loadGroup(yearToken, grp), 150);
          setTimeout(()=> showIndividualResultWithCheck(roll, yearToken, grp), 600);
          return `Opening roll ${roll} (${exam.toUpperCase()} ${yr} ${grp})…`;
        }
        HAS9.expecting='groupForRoll'; HAS9.data={ roll };
        return 'Write group (like: SSC 25 Science)';
      }

      return 'Say: open 100000 ssc 25 science';
    }

    // top N subject
    if (isTop){
      const mTop = raw.match(/top\s+(\d+)\s+([a-z ]+).*?\b(ssc|hsc)\b.*?(\d{2,4})(?:.*?\b([a-z ]+)\b)?/i);
      if (mTop){
        const n = +mTop[1], subjText = mTop[2], exam = canonicalExam(mTop[3]), yr = mTop[4];
        const grp = canonicalGroup(mTop[5]||'Science') || 'Science';
        const subj = canonicalSubject(subjText) || subjText.trim().split(/\s+/)[0];
        topKSubject(exam, yr, grp, subj, n);
        return `Pulling top ${n} in ${subj}…`;
      }
    }

    // "<name> english score"
    const ns = raw.match(/^(.+?)\s+(bangla|english|math|physics|chemistry|ict|bgs|religion)\s+score$/i);
    if (ns){
      const subj = canonicalSubject(ns[2]) || ns[2];
      perStudentSubject(ns[1], subj);
      return 'Checking…';
    }

    // Unknown
    return 'Please wait for v1.0 — I’m still learning the world, and I’ll answer that soon.';
  }

  // send
  function send(){
    const inp=Q('hb-input'); const v=inp?.value?.trim(); if (!v) return;
    inp.value=''; addBubble(v,'you'); typing(true);
    setTimeout(()=>{
      typing(false);
      const pending = handlePendingInput(v);
      if (pending) { addBubble(pending); return; }
      const ans = intent(v) || gen();
      addBubble(ans);
    }, 140);
  }

  // wire
  function wire(){
    ensureHTML();
    Q('hb-launcher')?.addEventListener('click', e=>{ e.stopPropagation(); togglePanel(); }, { passive:true });
    Q('hb-close')?.addEventListener('click', e=>{ e.stopPropagation(); togglePanel(false); }, { passive:true });
    Q('hb-send')?.addEventListener('click', send);
    Q('hb-input')?.addEventListener('keydown', e=>{ if (e.key==='Enter') send(); });
    document.addEventListener('click', (e)=>{
      const p = Q('hb-panel');
      if (!p || p.style.display!=='block') return;
      if (!p.contains(e.target) && e.target!==Q('hb-launcher')) togglePanel(false);
    });
  }

  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire, { once:true });
})();
