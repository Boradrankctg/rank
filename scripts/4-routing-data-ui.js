// 4-routing-data-ui.js — Routing, loaders, fetch, mobile filter, Top Schools, URL params, display masking

// ===== Year and Group loaders =====
function loadYear(year) {
  if (year) {
    document.getElementById("selectPrompt")?.style && (document.getElementById("selectPrompt").style.display = "none");
    document.querySelectorAll('.featured-box').forEach(b => b.remove());

    const newUrl = `${location.pathname}?year=${encodeURIComponent(year)}`;
    history.pushState({}, '', newUrl);

    if (currentYear) currentYear.textContent = ` ${year}`;
    if (currentGroup) currentGroup.style.display = 'none';
    if (noDataMessage) noDataMessage.style.display = 'none';

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
  if (currentGroup) {
    currentGroup.style.display = 'inline';
    currentGroup.textContent = `${group} Group`;
  }

  // Update SEO
  const examType = String(year).includes('hsc') ? 'HSC' : 'SSC';
  const formattedYear = String(year).replace('hsc_', '');
  document.title = `BOARD RANK OF ${examType} ${formattedYear} of ${group}`;
  updateSEOForYearGroup(year, group);
  injectDatasetForYearGroup(year, group);
  injectBreadcrumbs(`${location.origin}${location.pathname}`, year, group, null);

  if (yearDropdown) yearDropdown.style.display = 'none';

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

  const newUrl = `${location.pathname}?year=${encodeURIComponent(year)}&group=${encodeURIComponent(group)}`;
  history.pushState({}, '', newUrl);

  printExamResultHeader(year);
  fetchData(year, group);
  setTimeout(attachSearchSuggestions, 0);
}

function printExamResultHeader(year) {
  const headerElement = document.getElementById('examResultHeader');
  if (headerElement) {
    const examType = String(year).includes('hsc') ? 'HSC' : 'SSC';
    const formattedYear = String(year).replace('hsc_', '');
    headerElement.textContent = `${examType.toUpperCase()} ${formattedYear} Result`;
  }
}


// ===== Data fetch (XOR+Base64 decode for main, plain fetch for individual) =====
async function fetchData(year, group) {
  try { showLoadingIndicator(); } catch(e){}

  const mainDataUrl = `DATA/data_${year}_${group.toLowerCase()}.txt`;
  const individualDataUrl = `DATA/data_${year}_${group.toLowerCase()}_individual.txt`;

  try {
    const [mainData, individualData] = await Promise.all([
      fetchAndDecode(mainDataUrl, "MySecretKey123"),
      fetch(individualDataUrl).then(r => r.text()).catch(()=> null)
    ]);

    window.__br_currentDatasetMeta = { year, group };

    processData(mainData, individualData);
    populateInstituationDropdown();
    enableInstitutionSearchDropdown();
    createTopInstitutionsButton();
    try { hideLoadingIndicator(); } catch(e){}
  } catch (error) {
    console.error('Error loading data:', error);
    try { hideLoadingIndicator({ forceError: true, errorMessage: 'Unable to load files — check your connection.' }); } catch(e){}
    if (noDataMessage) noDataMessage.style.display = 'block';
  }
}

// Switch select → datalist for institution search
function enableInstitutionSearchDropdown() {
  const dropdown = document.getElementById('InstituationDropdown');
  if (!dropdown) return;

  dropdown.outerHTML = `
    <input list="institutionList" id="InstituationDropdown" placeholder="Type school name..." class="search-input" onchange="filterByInstituation()">
    <datalist id="institutionList">
      ${Array.from(InstituationSet).map(inst => `<option value="${inst}">`).join('')}
    </datalist>
  `;
}

// Override to open full school view from the institution selector (input or select)
function filterByInstituation() {
  const input = document.getElementById('InstituationDropdown');
  const val = (input && input.value || '').trim();
  if (!val) return resetFilter();
  showSchoolRanking(val);
}


// ===== Top Institutions + Mobile Filter =====
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

function injectMobileFilterStyles() {
  if (document.getElementById('mfStyle')) return;
  const css = `
/* Add your mobile filter styles here if needed */
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
  [rMin,rMax,nMin,nMax].forEach(el=>{ if (el) { el.min=minT; el.max=maxT; } });
  if (rMin) rMin.value = nMin.value = minT;
  if (rMax) rMax.value = nMax.value = maxT;

  function drawTrackFill(){
    const fill = document.getElementById('mfTrackFill');
    if (!fill || !rMin || !rMax) return;
    const min = parseInt(rMin.min), max = parseInt(rMin.max);
    const a = (parseInt(rMin.value)-min)/(max-min)*100;
    const b = (parseInt(rMax.value)-min)/(max-min)*100;
    fill.style.left = a+'%';
    fill.style.right = (100-b)+'%';
  }

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

  rMin?.addEventListener('input', clamp);
  rMax?.addEventListener('input', clamp);
  nMin?.addEventListener('input', syncFromNum);
  nMax?.addEventListener('input', syncFromNum);
  drawTrackFill();

  const gpas = Array.from(new Set(allData.map(s=>s.gpa).filter(x=>x!==undefined && !isNaN(x)))).sort((a,b)=>b-a);
  const gWrap = document.getElementById('mfGpaChips'); if (gWrap) gWrap.innerHTML='';
  gpas.forEach(val=>{
    const div = document.createElement('label'); div.className='mf-chip';
    div.innerHTML = `<input type="checkbox" name="mfGpa" value="${val}"><span>${val.toFixed ? val.toFixed(2) : val}</span>`;
    gWrap?.appendChild(div);
  });

  const schools = Array.from(new Set(allData.map(s => (s.Instituation || '').trim()).filter(Boolean)))
    .sort((a, b) => {
      const rankA = allData.find(s => (s.Instituation || '').trim() === a)?.TopSchools || Infinity;
      const rankB = allData.find(s => (s.Instituation || '').trim() === b)?.TopSchools || Infinity;
      return rankA - rankB;
    });

  const sWrap = document.getElementById('mfSchoolList'); if (sWrap) sWrap.innerHTML='';
  schools.forEach(name=>{
    const safe = name.replace(/"/g,'&quot;');
    const div = document.createElement('label'); div.className='mf-item';
    div.innerHTML = `<input type="checkbox" name="mfSchool" value="${safe}"><span>${safe}</span>`;
    sWrap?.appendChild(div);
  });

  // rebind listeners after rendering
  attachMobileFilterLiveListeners();
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
  const q = (document.getElementById('mfSchoolSearch')?.value || '').trim().toLowerCase();
  document.querySelectorAll('#mfSchoolList .mf-item').forEach(el=>{
    const txt = el.textContent.toLowerCase();
    el.style.display = txt.includes(q)?'flex':'none';
  });
}

function applyMobileFilters(){
  const nMin = parseInt(document.getElementById('mfTotalMin')?.value || '0', 10);
  const nMax = parseInt(document.getElementById('mfTotalMax')?.value || '999999', 10);
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
  applyMobileFilters();
}

function showTopInstitutions() {
  const topSchools = {};

  allData.forEach(student => {
    const school = student.Instituation;
    if (!topSchools[school]) {
      topSchools[school] = { gpa5Count: 0, totalMarks: 0, count: 0, top1000Count: 0 };
    }
    if (student.gpa === 5.0) topSchools[school].gpa5Count += 1;
    topSchools[school].totalMarks += student.total;
    topSchools[school].count += 1;
  });

  allData.slice(0, 1000).forEach(student => {
    const school = student.Instituation;
    if (topSchools[school]) topSchools[school].top1000Count++;
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


// ===== Featured year click animation to selection =====
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


// ===== URL param handling =====
function handleURLParams() {
  const params = new URLSearchParams(window.location.search);
  const year = params.get('year');
  const group = params.get('group');
  const roll = params.get('roll');

  if (year && group) {
    if (yearDropdown) { yearDropdown.value = year; yearDropdown.style.display = 'none'; }

    document.getElementById("selectPrompt")?.remove();
    document.querySelectorAll('.featured-box').forEach(b => b.remove());

    if (currentYear) currentYear.textContent = ` ${year}`;
    if (currentGroup) { currentGroup.textContent = `${group} Group`; currentGroup.style.display = 'inline'; }

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
      setTimeout(() => { showIndividualResult(roll, year, group); }, 1000);
    }
    const school = params.get('school');
    if (school) {
      setTimeout(() => { showSchoolRanking(school); }, 1000);
    }
  } else if (year) {
    loadYear(year);
    if (yearDropdown) yearDropdown.value = year;
  } else {
    contentDiv.innerHTML = '';
  }
}

// Popstate routing (close popup if open; otherwise route params)
window.addEventListener('popstate', function () {
  const params = new URLSearchParams(window.location.search);
  const year = params.get('year');
  const group = params.get('group');
  const roll = params.get('roll');

  if (document.querySelector('.popup')) {
    closePopup();
    return;
  }

  if (year && group && roll) {
    showIndividualResult(roll, year, group);
  } else if (year && group) {
    loadGroup(year, group);
  } else if (year) {
    loadYear(year);
  } else {
    location.reload();
  }
});


// ===== Scroll to top button visibility =====
var scrollToTopBtn = document.getElementById("scrollToTopBtn");
window.onscroll = function() { scrollFunction(); };
function scrollFunction() {
  if (!scrollToTopBtn) return;
  if (document.body.scrollTop > 600 || document.documentElement.scrollTop > 600) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
}


// ===== Display/masking controls hook (names/rolls visibility + name search toggle) =====
(function(){
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
    return s[0] + '*'.repeat(Math.max(0, s.length - 2)) + s[s.length - 1];
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

// Kick off by reading URL state
handleURLParams();