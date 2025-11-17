// 2-data-table.js — Data parse/sort, table rendering, pagination, search/suggestions, school view

// ===== Dataset state =====
let allData = [];
let filteredData = [];
const studentsPerPage = 100;
let currentPage = 1;
const InstituationSet = new Set();
window.InstituationSet = InstituationSet;
window._br_clickListenerSet = window._br_clickListenerSet || new Set();


// ===== Parse, process, and sort =====
function processData(mainData, individualData) {
  const rows = (mainData || '').trim().split('\n').slice(1);
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

  // Clean + sort
  allData = allData.filter(student => !isNaN(student.gpa) && !isNaN(student.total));
  allData.sort(compareStudents);

  // Initialize view
  filteredData = [...allData];
  updateTableData();

  // Expose + notify
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

    const phy = parseInt(cols[6]);
    const chem = parseInt(cols[7]);
    const math = parseInt(cols[8]);

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
      if (isNaN(m)) return false;
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

  return scores;
}

function compareStudents(a, b) {
  if (a.gpa !== b.gpa) return b.gpa - a.gpa;
  if (a.total !== b.total) return b.total - a.total;
  if (a.phy !== b.phy) return b.phy - a.phy;
  if (a.chem !== b.chem) return b.chem - a.chem;
  return b.math - a.math;
}


// ===== School view =====
function scrollToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
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


// ===== Table rendering =====
function updateTableData() {
  try { window.filteredData = filteredData; } catch(e){}
  const hidden = window.__br_hiddenRolls || new Set();
  const view = isAdmin() ? filteredData : filteredData.filter(s => !hidden.has(String(s.roll)));

  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = Math.min(startIndex + studentsPerPage, view.length);
  const dataToShow = view.slice(startIndex, endIndex);

  const tableBody = document.getElementById('studentTableBody');
  if (!tableBody) return;
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

    // Live admin click-count listener
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
  if (info) info.textContent = `Showing ${view.length ? (startIndex + 1) : 0}-${endIndex} of ${view.length} students`;
  updatePaginationButtons();
}


// ===== Institution filter (basic; may be overridden later to open school view) =====
function filterByInstituation(InstituationName = null, fromTable = false) {
  const InstituationDropdown = document.getElementById('InstituationDropdown');
  if (fromTable) {
    InstituationDropdown.value = InstituationName;
    const event = new Event('change');
    InstituationDropdown.dispatchEvent(event);
  } else {
    InstituationName = InstituationDropdown ? InstituationDropdown.value : (InstituationName || '');
  }

  if (InstituationName) {
    filteredData = allData.filter(student => (student.Instituation || '').trim().toLowerCase() === (InstituationName || '').trim().toLowerCase());
    const btn = document.getElementById('resetFilterBtn');
    if (btn) btn.style.display = 'block';
  } else {
    resetFilter();
  }
  currentPage = 1;
  updatePage();
}

function resetFilter() {
  filteredData = [...allData];
  currentPage = 1;
  const btn = document.getElementById('resetFilterBtn');
  if (btn) btn.style.display = 'none';
  updatePage();
}


// ===== Pagination =====
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
  const visibleLen = getVisibleLength();
  const maxPage = Math.ceil(visibleLen / studentsPerPage);
  if (currentPage < maxPage) {
    currentPage = maxPage;
    updatePage();
  }
}
function handleNextButtonClick() {
  const visibleLen = getVisibleLength();
  const maxPage = Math.ceil(visibleLen / studentsPerPage);
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
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage >= maxPage || visibleLen === 0;
}


// ===== Search + suggestions =====
function handleSearchInput() {
  const nameEl = document.getElementById('searchInput');
  const rollEl = document.getElementById('searchRollInput');
  const instEl = document.getElementById('InstituationDropdown');

  const searchTerm = nameEl ? nameEl.value.trim().toLowerCase() : '';
  const rollSearchTerm = rollEl ? rollEl.value.trim() : '';
  const selectedInstituation = instEl ? instEl.value : '';

  filteredData = allData.filter(student => {
    const matchesName = student.name && student.name.toLowerCase().includes(searchTerm);
    const matchesRoll = String(student.roll).includes(rollSearchTerm);
    const matchesInstituation = selectedInstituation
      ? (student.Instituation || '').trim().toLowerCase() === selectedInstituation.trim().toLowerCase()
      : true;
    return matchesName && matchesRoll && matchesInstituation;
  });

  currentPage = 1;
  updatePage();
}

function handleRollSearchInput() {
  handleSearchInput();
}

function populateInstituationDropdown() {
  const InstituationDropdown = document.getElementById('InstituationDropdown');
  if (!InstituationDropdown) return;
  InstituationDropdown.innerHTML = '<option value="">Select Instituation</option>';
  InstituationSet.forEach(Instituation => {
    const option = document.createElement('option');
    option.value = Instituation;
    option.textContent = Instituation;
    InstituationDropdown.appendChild(option);
  });
}


// ===== Suggestions UI =====
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
    if (!q) { box.style.display = 'none'; return; }

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
      `<div class="suggest-item" data-name="${String(s.name).replace(/"/g,'&quot;')}">
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
    if (!q) { box.style.display = 'none'; return; }

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