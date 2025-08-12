const contentDiv = document.getElementById('content');
const currentYear = document.getElementById('currentYear');
const currentGroup = document.getElementById('currentGroup');
const noDataMessage = document.getElementById('noDataMessage');
const yearDropdown = document.getElementById('yearDropdown');




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

function fetchData(year, group) {
    showLoadingIndicator();
    const mainDataUrl = `data_${year}_${group.toLowerCase()}.txt`;
    const individualDataUrl = `data_${year}_${group.toLowerCase()}_individual.txt`;

    Promise.all([
        fetch(mainDataUrl).then(response => response.text()),
        fetch(individualDataUrl).then(response => response.text()).catch(() => null)
    ]).then(([mainData, individualData]) => {
        console.log('Main data loaded:', mainData);
        console.log('Individual data loaded:', individualData);
        processData(mainData, individualData);
        populateInstituationDropdown();
        hideLoadingIndicator();
      }).catch(error => {
        console.error('Error loading data:', error);
        hideLoadingIndicator({ forceError: true, errorMessage: 'Unable to load files — check your connection.' });
        noDataMessage.style.display = 'block';
    });
    
}



let visitorInfoCompleted = localStorage.getItem('visitorInfoGiven') === '1';

function getDeviceDataAndFingerprint() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const screenRes = `${screen.width}x${screen.height}`;
  const deviceMemory = navigator.deviceMemory || null;
  const cores = navigator.hardwareConcurrency || null;
  const vendor = navigator.vendor || '';

  // --- Detect device model from UA ---
  let deviceModel = 'Unknown device';
  if (/Android/i.test(ua)) {
    // Extract something like "SM-S918B" or "Redmi Note 12"
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

  // fingerprint hash
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

if (clickCount <= 2) { // first two clicks are free
  return showIndividualResult(roll, year, group);
}

  // compute fingerprint and device data
  const { deviceData, fingerprint } = getDeviceDataAndFingerprint();

  // quick localStorage check (fast)
  if (localStorage.getItem('visitorInfoGiven') === '1' &&
      localStorage.getItem('visitorFingerprint') === fingerprint) {
    visitorInfoCompleted = true;
    return showIndividualResult(roll, year, group);
  }

  // fallback: check server (Firebase) for same fingerprint before showing form
  try {
    const dbLib = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
    const { getDatabase, ref, get, query, orderByChild, equalTo } = dbLib;
    const dbv = getDatabase();
    const q = query(ref(dbv, 'visitors'), orderByChild('fingerprint'), equalTo(fingerprint));
    const snap = await get(q);
    if (snap && snap.exists()) {
      // we found a visitor entry with same fingerprint -> don't show popup again
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

    // Too short / too long
    if (cleaned.length < 3 || cleaned.length > 40) return true;

    // Must contain at least one space (first + last name) and only letters/spaces
    if (!/^[a-zA-Z\s]+$/.test(cleaned)) return true;

    // Very few vowels (gibberish like "sdghjk")
    const vowelCount = (cleaned.match(/[aeiouAEIOU]/g) || []).length;
    if (vowelCount < 2) return true;

    // Same character repeated 4+ times in a row
    if (/(.)\1{3,}/.test(cleaned)) return true;

    return false;
}

  document.getElementById('submitVisitorInfo').addEventListener('click', async () => {
    const name = document.getElementById('visitorName').value.trim();
    const institution = document.getElementById('visitorInstitution').value.trim();
    const type = document.getElementById('visitorType').value;
    const source = document.getElementById('visitorSource').value;
    const experience = document.getElementById('visitorExperience').value;
    const messageVal = document.getElementById('visitorMessage').value.trim(); // ✅ capture now
    if (experience === "worst" || experience === "bad") {
      const body = popup.querySelector('.popup-body');
      const footer = popup.querySelector('.popup-footer');
      if (footer) footer.style.display = 'none';
  
      // Step 1: Show loading spinner
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
  
      // Step 2: After delay, show lighthearted denial message
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

    // Spinner first
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

    // After delay → denial screen
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

    // Show confirmation screen
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

    // Handle confirm
    document.getElementById('confirmNameBtn').addEventListener('click', async () => {
        localStorage.setItem('visitorInfoGiven', '1');
        localStorage.setItem('visitorFingerprint', fingerprint);
        visitorInfoCompleted = true;

        // Save to Firebase
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
              message: messageVal, // ✅ use saved value
              fingerprint,
              deviceData,
              timestamp: Date.now()
          });
          
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
      // Restore original form inside the same popup
      body.innerHTML = originalFormHTML;
      footer.style.display = 'flex';
  
      // Restore values
      document.getElementById('visitorName').value = name;
      document.getElementById('visitorInstitution').value = institution;
      document.getElementById('visitorType').value = type;
      document.getElementById('visitorSource').value = source;
      document.getElementById('visitorExperience').value = experience;
  
      // Rebind submit button logic
      document.getElementById('submitVisitorInfo').addEventListener('click', submitHandler);
  });
  
  
});

}

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  if (userId !== "admin1234") {
    document.getElementById("visitorsLink")?.remove();
  }
});

function processData(mainData, individualData) {
    const rows = mainData.trim().split('\n').slice(1);
    const individualScores = parseIndividualData(individualData);
    allData = rows.map(row => {
        const [serial, name, roll, gpa, total, Instituation] = row.split('\t');
        const individual = individualScores[roll] || {};
        InstituationSet.add(Instituation);
        return {
            serial: parseInt(serial),
            name,
            roll: parseInt(roll),
            gpa: parseFloat(gpa),
            total: parseInt(total),
            Instituation,
            ...individual
        };
    });
    console.log('Processed data:', allData);
    allData = allData.filter(student => !isNaN(student.gpa) && !isNaN(student.total));
    allData.sort(compareStudents);
    console.log('Sorted data:', allData);
    filteredData = [...allData];
    updateTableData();
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
    const schoolName = decodeURIComponent(encodedSchoolName);
    const schoolData = allData.filter(student => student.Instituation.trim() === schoolName);
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

  <td class="student-name" id="${nameId}">${student.name}${isAdmin ? ` [${(window.clickCountsCache && window.clickCountsCache[student.roll]) || 0}]` : ''}</td>
  <td class="student-roll">${student.roll}</td>
  <td>${student.gpa}</td>
  <td>${student.total}</td>
  <td class="student-school">${student.Instituation}</td>
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
        filteredData = allData.filter(student => student.Instituation === InstituationName);
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

    window.__br_percent = 1;
    function step() {
      if (!document.getElementById('dataLoaderOverlay')) return;
      if (window.__br_percent < 99) {
        window.__br_percent += Math.floor(Math.random()*5) + 1;
        if (window.__br_percent > 99) window.__br_percent = 99;
        document.getElementById('brLoaderPercent').textContent = window.__br_percent + '%';

        const sub = document.getElementById('brLoaderSub');
        if (window.__br_percent < 30) sub.textContent = 'Starting…';
        else if (window.__br_percent < 70) sub.textContent = 'Loading records…';
        else sub.textContent = 'Almost there…';
      }
      window.__br_timer = setTimeout(step, Math.random()*400 + 120);
    }
    step();
  };

  window.hideLoadingIndicator = function(opts={}) {
    clearTimeout(window.__br_timer);
    const overlay = document.getElementById('dataLoaderOverlay');
    if (!overlay) return;

    const noData = opts.forceError === true || (typeof filteredData !== 'undefined' && filteredData.length === 0);
    if (noData) {
      overlay.querySelector('.loader-box').innerHTML = `
        <h2 style="color:#b71c1c; margin:6px 0;">❗ Data NOT FOUND</h2>
        <p style="color:#444; margin-bottom: 10px;">
          This selected results are not yet available.<br>
        </p>
        <button onclick="window.location.href='index.html'">Go Back</button>

      `;
      return;
    }
   

    

    document.getElementById('brLoaderPercent').textContent = '100%';
    document.getElementById('brLoaderSub').textContent = 'Done';
    setTimeout(() => overlay.remove(), 300);
  };
})();


function getProgressBarHtml(score, totalMark) {
    const percentage = (parseFloat(score) / totalMark) * 100;
    const barId = `pb_${Math.random().toString(36).substr(2, 9)}`;
    setTimeout(() => animateProgressBar(barId, percentage), 100); // slight delay for popup load
    return `
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

        // Color logic
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
            // final correction
            bar.style.width = `${targetPercentage}%`;
            bar.textContent = `${targetPercentage.toFixed(2)}%`;
        }
    }

    update();
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
              
                        const combinedRank = allData.findIndex(student => student.roll === parseInt(roll)) + 1;
                        popupContent = `
                            <div class="popup-content">
                                <span class="close-btn" onclick="closePopup()">&times;</span>
                                <p>Name: ${student.name}</p>
                                <p>Institution: ${student.Instituation}</p>
                                <p>Roll: ${roll}</p>
                                <p>GPA: ${student.gpa}</p>
                                <p>Board Rank: ${combinedRank}</p>
                                <p>Bangla: ${bangla} ${getProgressBarHtml(bangla, 200)}</p>
                                <p>English: ${english} ${getProgressBarHtml(english, 200)}</p>
                                <p>ICT: ${ICT} ${getProgressBarHtml(ICT, 100)}</p>
                                <p>Physics: ${physics} ${getProgressBarHtml(physics, 200)}</p>
                                <p>Chemistry: ${chemistry} ${getProgressBarHtml(chemistry, 200)}</p>
                                <p>Compulsory: ${compulsory} ${getProgressBarHtml(compulsory, 200)}</p>
                                <p>Optional: ${optional} ${getProgressBarHtml(optional, 200)}</p>
                                <button onclick='promptComparison(${student.roll}, "${year}", "${group}")'>Compare with Other Student</button>
                                <button onclick="showSSCResultFromHSC('${student.name}', '${group.toLowerCase()}')">Watch SSC Result</button>
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
                        const combinedRank = allData.findIndex(student => student.roll === parseInt(roll)) + 1;
                        popupContent = `
                            <div class="popup-content">
                                <span class="close-btn" onclick="closePopup()">&times;</span>
                                <p>Name: ${student.name}</p>
                                <p>Institution: ${student.Instituation}</p>
                                <p>Roll: ${roll}</p>
                                <p>GPA: ${student.gpa}</p>
                                <p>Board Rank: ${combinedRank}</p>
                                <p>Bangla: ${bangla} ${getProgressBarHtml(bangla, 200)}</p>
                                <p>English: ${english} ${getProgressBarHtml(english, 200)}</p>
                                <p>Mathematics: ${math} ${getProgressBarHtml(math, 100)}</p>
                                <p>${subject1Name}: ${bgs} ${getProgressBarHtml(bgs, 100)}</p>
                                <p>Religion: ${religion} ${getProgressBarHtml(religion, 100)}</p>
                                <p>${subject2Name}: ${physics} ${getProgressBarHtml(physics, 100)}</p>
                                <p>${subject3Name}: ${chemistry} ${getProgressBarHtml(chemistry, 100)}</p>
                                <p>Compulsory: ${Compulsory} ${getProgressBarHtml(Compulsory, 100)}</p>
                                <p>ICT: ${ICT} ${getProgressBarHtml(ICT, 50)}</p>
                                <p>Optional: ${Optional} ${getProgressBarHtml(Optional, 100)}</p>
                                <p>Physical: ${Physical} ${getProgressBarHtml(Physical, 100)}</p>
                                <p>Career: ${Career} ${getProgressBarHtml(Career, 50)}</p>
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
    const fields = popup.querySelectorAll('p'); // only text fields
  
    fields.forEach(p => {
      // Skip if it contains a progress bar
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
    const url = `https://boradrankctg.github.io/rank/index.html?year=${year}&group=${encodeURIComponent(group)}&roll=${roll}`;
  
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
        const matchesInstituation = selectedInstituation ? student.Instituation === selectedInstituation : true;
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
    const topBtn = document.createElement('button');
    topBtn.textContent = '🏆 Top Schools';
    topBtn.style.marginLeft = '10px';
    topBtn.onclick = showTopInstitutions;
    resetBtn.insertAdjacentElement('afterend', topBtn);
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
      .filter(([_, stats]) => stats.count >= 50)
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
      <h2>🏆 Top 100 Institutions - ${currentGroup.textContent} ${currentYear.textContent}</h2>
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
      fetch(mainDataUrl).then(response => response.text()),
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


     
        if (roll) {
            setTimeout(() => {
                showIndividualResult(roll, year, group);
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

