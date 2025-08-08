

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
        hideLoadingIndicator();
        noDataMessage.style.display = 'block';
    });
}

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
                            <td class="student-name" onclick="showIndividualResult(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}')">${student.name}</td>
                            <td class="student-roll" onclick="showIndividualResult(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}')">${student.roll}</td>
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
        
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td class="student-name">${student.name}</td>
            <td class="student-roll">${student.roll}</td>
            <td>${student.gpa}</td>
            <td>${student.total}</td>
            <td class="student-school">${student.Instituation}</td>
        `;

        row.querySelector('.student-name').addEventListener('click', () => {
            showIndividualResult(student.roll, currentYear.textContent.split(' ')[1], currentGroup.textContent.split(' ')[0]);
        });
        row.querySelector('.student-roll').addEventListener('click', () => {
            showIndividualResult(student.roll, currentYear.textContent.split(' ')[1], currentGroup.textContent.split(' ')[0]);
        });
        row.querySelector('.student-school').addEventListener('click', () => {
            showSchoolRanking(student.Instituation.trim());
        });

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

function showLoadingIndicator() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

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
                          
<div class="popup-footer" style="display: flex; gap: 12px; margin-top: 20px;">
  <button onclick="copyFullResult(this)" class="copy-result-btn" aria-label="Copy full result">📄</button>
   <button class="back-button" onclick="closePopup()">Back</button>
  <button onclick="copyStudentResultLink(this)" class="copy-link-btn" aria-label="Copy result link">🔗</button>
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

<div class="popup-footer" style="display: flex; gap: 12px; margin-top: 20px;">
  <button onclick="copyFullResult(this)" class="copy-result-btn" aria-label="Copy full result">📄</button>
   <button class="back-button" onclick="closePopup()">Back</button>
  <button onclick="copyStudentResultLink(this)" class="copy-link-btn" aria-label="Copy result link">🔗</button>

                               
                            
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

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        popup.remove();
        document.body.classList.remove('locked'); 
    }
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

document.addEventListener('DOMContentLoaded', () => {
    
    const menuButton = document.getElementById('menuButton');
    sidebar.style.width = '0px';

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (sidebar.style.width === '0px' || sidebar.style.width === '') {
            sidebar.style.width = '40%';
        } else {
            sidebar.style.width = '0px';
        }
    });

    document.body.addEventListener('click', () => {
        if (sidebar.style.width === '40%') {
            sidebar.style.width = '0px';
        }
    });

    sidebar.addEventListener('click', (event) => {
        event.stopPropagation();
    });

});

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


// NEW: Top Institutions button
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
      hideLoadingIndicator();
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
        // Set dropdown value (sync UI)
        if (yearDropdown) {
            yearDropdown.value = year;
            yearDropdown.style.display = 'none';
        }

        // Remove prompt + featuredBox if exists
        document.getElementById("selectPrompt")?.remove();
        document.querySelectorAll('.featured-box').forEach(b => b.remove());


        // Update breadcrumb visually
        currentYear.textContent = ` ${year}`;
        currentGroup.textContent = `${group} Group`;
        currentGroup.style.display = 'inline';

        // Load data directly
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

        // Load header and fetch data
        printExamResultHeader(year);
        fetchData(year, group);
        if (!sessionStorage.getItem('rankTipsShown')) {
            setTimeout(() => {
                showRankTipsPopup();
                sessionStorage.setItem('rankTipsShown', '1');
            }, 800);
        }
        

        // If roll is present, wait and then show popup
        if (roll) {
            setTimeout(() => {
                showIndividualResult(roll, year, group);
            }, 1000);
        }

    } else if (year) {
        // Only year present, ask user to select group
        loadYear(year);
        if (yearDropdown) {
            yearDropdown.value = year;
        }
    } else {
        // No URL param → show dropdown normally
        contentDiv.innerHTML = '';
    }
}

// generic handler used by each featured box
function handleFeaturedClick(yearValue, el) {
    // el is the clicked element (passed via `this`) — fallback to query selector if not provided
    const box = el || document.querySelector(`.featured-box[data-value="${yearValue}"]`);
    if (!box) return;
  
    // animate hide (same visual behaviour as original)
    box.style.transition = "all 0.4s ease";
    box.style.opacity = "0";
    box.style.transform = "scale(0.9)";
  
    setTimeout(() => {
      box.style.display = "none";
  
      // set dropdown and load
      const dropdown = document.getElementById("yearDropdown");
      if (dropdown) {
        dropdown.value = yearValue;
        dropdown.style.display = 'none';
      }
      loadYear(yearValue);
    }, 400);
  }
  
  // Add at the end of script.js

  function showSharePopup() {
    if (document.querySelector('.popup')) return; // prevent duplicate popup

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
setTimeout(showSharePopup, 150000);
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
// =========================
// HSC -> SSC LINK MODULE
// Paste this at the END of your script.js / all merged.txt
// =========================

/* Helper: normalize student name (collapse spaces, lower, remove punctuation but keep letters/numbers/unicode) */
function _br_normalizeName(s) {
    if (!s && s !== 0) return '';
    try {
      return String(s)
        .normalize ? String(s).normalize('NFKC') : String(s)
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        // remove punctuation but keep Unicode letters & numbers & spaces
        .replace(/[^\p{L}\p{N}\s]/gu, '');
    } catch (e) {
      // fallback if Unicode property escapes not supported:
      return String(s).replace(/\s+/g, ' ').trim().toLowerCase().replace(/[^\w\s]/g, '');
    }
  }
  
  /* Helper: normalize roll (strip leading zeros, spaces) */
  function _br_normalizeRoll(r) {
    if (r === undefined || r === null) return '';
    return String(r).trim().replace(/^0+/, '') || '0';
  }
  
  /* Remove all popups immediately (no animation) so showIndividualResult can open new popup */
  function _br_removeAllPopupsImmediate() {
    const popups = document.querySelectorAll('.popup');
    popups.forEach(p => p.remove());
    document.body.classList.remove('locked');
  }
  
  /* Small visual spinner HTML (reused) */
  function _br_spinnerHtml() {
    return `<div style="display:flex;align-items:center;gap:10px;">
              <div class="loading-spinner" style="width:18px;height:18px;border-top-width:4px"></div>
              <div style="font-weight:bold">Searching SSC records...</div>
            </div>`;
  }
  
  /* Lightweight modal message (no alerts) */
  function _br_showMessage(msg) {
    // remove existing popup(s)
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
  
  /* ---- SSC data cache ----
     window.__br_sscCache = {
       [yearNumber]: {
          byName: Map(normalizedName -> [ { roll, group, nameRaw, institution? } ]),
          byRoll: Map(normalizedRoll -> { roll, group, nameRaw, institution? })
       }
     }
  */
  window.__br_sscCache = window.__br_sscCache || {};
  
  /* Ensure SSC data for a given HSC year is loaded (returns Promise resolving to cache object for sscYear) */
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
            // skip header if header line present (most of your files have header)
            const start = rows.length && rows[0].includes('\t') && rows[0].toLowerCase().includes('name') ? 1 : 0;
            for (let i = start; i < rows.length; i++) {
              const row = rows[i].trim();
              if (!row) continue;
              const cols = row.split('\t');
              // expected main format: serial, name, roll, gpa, total, Instituation
              const nameRaw = (cols[1] || '').trim();
              const rollRaw = (cols[2] || '').trim();
              const institution = (cols[5] || '').trim();
              if (!nameRaw || !rollRaw) continue;
              const nName = _br_normalizeName(nameRaw);
              const nRoll = _br_normalizeRoll(rollRaw);
              const obj = { roll: rollRaw, rollNorm: nRoll, group: g.charAt(0).toUpperCase() + g.slice(1), nameRaw, institution };
  
              // byRoll: keep first if collision (roll collisions across groups are unlikely but dedupe)
              if (!cache.byRoll.has(nRoll)) cache.byRoll.set(nRoll, obj);
  
              // byName: push candidate array, dedupe by roll+group
              const arr = cache.byName.get(nName) || [];
              if (!arr.some(x => x.rollNorm === obj.rollNorm && x.group === obj.group)) arr.push(obj);
              cache.byName.set(nName, arr);
            }
          }).catch(() => {
            // file missing or parse error -> ignore group quietly
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
  
  /* Try to read HSC roll from currently displayed popup (used to save mapping). Returns normalized roll or null */
  function _br_getHscRollFromCurrentPopup() {
    try {
      const popupContent = document.querySelector('.popup .popup-content');
      if (!popupContent) return null;
      const txt = (popupContent.innerText || popupContent.textContent || '').replace(/\u00A0/g, ' ');
      // look for "Roll: 12345" (robust)
      const m = txt.match(/roll[:\s]*([0-9\-]+)/i);
      if (m && m[1]) return _br_normalizeRoll(m[1]);
      // fallback search in p elements
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
  
  /* Save HSC->SSC link for future: key pattern br_hsc2ssc:<hscYear>:<hscRoll> -> { sscYear, sscRoll, sscGroup, nameMatched } */
  function _br_saveLinkMapping(hscYearNum, hscRollNorm, sscYearNum, sscRollNorm, sscGroup, matchedNameRaw) {
    try {
      if (!hscYearNum || !hscRollNorm) return;
      const key = `br_hsc2ssc:${hscYearNum}:${hscRollNorm}`;
      const obj = { sscYear: sscYearNum, sscRoll: sscRollNorm, sscGroup, matchedNameRaw, savedAt: Date.now() };
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {}
  }
  
  /* Retrieve mapping if exists */
  function _br_getLinkMapping(hscYearNum, hscRollNorm) {
    try {
      const key = `br_hsc2ssc:${hscYearNum}:${hscRollNorm}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  
  /* Build a small modal listing multiple SSC candidates and allow typing roll or clicking a candidate */
  function _br_showCandidatesModalAndHandle(matches, sscYearNum, onSelect) {
    // matches: array of { roll, rollNorm, group, nameRaw, institution }
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
        // select this candidate
        _br_removeAllPopupsImmediate();
        setTimeout(() => onSelect(m), 60);
      });
    });
  
    // Confirm by roll typed
    popup.querySelector('#br_ssc_roll_confirm').addEventListener('click', () => {
      const val = popup.querySelector('#br_ssc_roll_input').value.trim();
      const norm = _br_normalizeRoll(val);
      if (!norm) {
        // highlight or message
        popup.querySelector('#br_ssc_roll_input').style.border = '1px solid red';
        return;
      }
      const found = matches.find(mm => mm.rollNorm === norm);
      if (found) {
        _br_removeAllPopupsImmediate();
        setTimeout(() => onSelect(found), 60);
      } else {
        // show ephemeral message inside modal
        const err = document.createElement('div');
        err.style = 'color:#b71c1c;margin-top:8px;font-weight:bold';
        err.textContent = 'No SSC record found with that roll among the candidates.';
        popup.querySelector('.popup-content').appendChild(err);
        setTimeout(() => err.remove(), 3500);
      }
    });
  }
  
  /* PUBLIC function (called from HSC popup button). name = full name as shown in HSC popup; hscGroupLower = 'science'|'commerce'|'arts' (optional) */
  function showSSCResultFromHSC(name, hscGroupLower) {
    try {
      // Determine HSC year from UI's currentYear text (the app stores 'hsc_2025' or similar)
      const yearLabel = (currentYear && currentYear.textContent) ? currentYear.textContent.trim() : null;
      let hscYearNum = null;
      if (yearLabel && yearLabel.toLowerCase().includes('hsc')) {
        // expected 'hsc_2025' or 'hsc 2025' or 'HSC 2025' etc
        const m = yearLabel.match(/(\d{4})/);
        if (m) hscYearNum = parseInt(m[1], 10);
      }
  
      // fallback: try to extract from URL param '?year=hsc_2025'
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
  
      // final fallback: assume HSC 2025 if cannot detect (not ideal but prevents crash)
      if (!hscYearNum) hscYearNum = (new Date()).getFullYear();
  
      // If HSC popup includes the hsc roll, get it for mapping usage
      const currentHscRoll = _br_getHscRollFromCurrentPopup(); // normalized roll string or null
  
      // Check localStorage mapping first (fast path)
      if (currentHscRoll) {
        const mapping = _br_getLinkMapping(hscYearNum, currentHscRoll);
        if (mapping && mapping.sscYear && mapping.sscRoll) {
          // direct open (close any current popups)
          _br_removeAllPopupsImmediate();
          setTimeout(() => {
            // mapping.sscGroup might be saved; fallback to 'Science' if not
            showIndividualResult(mapping.sscRoll, String(mapping.sscYear), mapping.sscGroup || 'Science');
          }, 60);
          return;
        }
      }
  
      // show a small temporary modal with spinner inside current popup context (non-blocking)
      const loaderPopup = document.createElement('div');
      loaderPopup.className = 'popup';
      loaderPopup.innerHTML = `<div class="popup-content">${_br_spinnerHtml()}</div>`;
      document.body.appendChild(loaderPopup);
      document.body.classList.add('locked');
  
      // Ensure SSC data loaded
      _br_ensureSSCLoadedForHSCYear(hscYearNum).then(cache => {
        try {
          // remove loader (but don't close main HSC popup)
          loaderPopup.remove();
          // try to find matches by normalized name
          const nName = _br_normalizeName(name || '');
          const sscYearNum = hscYearNum - 2;
          const sscCache = cache || window.__br_sscCache[sscYearNum] || { byName: new Map(), byRoll: new Map() };
  
          const rawMatches = sscCache.byName.get(nName) || [];
  
          if (!rawMatches || rawMatches.length === 0) {
            _br_showMessage("Couldn’t find SSC result. Name mismatch or stream change may be the cause.");
            return;
          }
  
          // Deduplicate by rollNorm+group (should already be deduped in cache, but extra safety)
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
            // direct open: remove all popups then open SSC individual
            const chosen = uniq[0];
            // try to save mapping if we have hsc roll
            if (currentHscRoll) _br_saveLinkMapping(hscYearNum, currentHscRoll, sscYearNum, chosen.rollNorm, chosen.group, chosen.nameRaw);
  
            _br_removeAllPopupsImmediate();
            setTimeout(() => {
              showIndividualResult(chosen.roll, String(sscYearNum), chosen.group);
            }, 60);
            return;
          }
  
          // multiple candidates: show selection modal (click-to-open OR type roll)
          _br_showCandidatesModalAndHandle(uniq, sscYearNum, (chosen) => {
            // chosen is candidate object
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
  
  /* --- Optional integration: when fetchData is called for HSC, prefetch SSC automatically (non-invasive) --- */
  if (typeof fetchData === 'function') {
    try {
      const _origFetchData = fetchData;
      fetchData = function(year, group) {
        try {
          // call original behavior
          _origFetchData(year, group);
        } catch (e) {
          console.error('wrapped fetchData original error', e);
        }
        try {
          // if HSC year detected, prefetch ssc (non-blocking)
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
