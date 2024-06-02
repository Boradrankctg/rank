const contentDiv = document.getElementById('content');
const currentYear = document.getElementById('currentYear');
const currentGroup = document.getElementById('currentGroup');
const noDataMessage = document.getElementById('noDataMessage');
const yearDropdown = document.getElementById('yearDropdown');

// script.js

document.addEventListener("DOMContentLoaded", function () {
    const yearDropdown = document.getElementById('yearDropdown');
    const currentYear = document.getElementById('currentYear');
    const currentGroup = document.getElementById('currentGroup');
    const noDataMessage = document.getElementById('noDataMessage');

    yearDropdown.addEventListener('change', function () {
        loadYear(this.value);
    });

    function loadYear(year) {
        if (!year) {
            noDataMessage.style.display = 'block';
            return;
        }
        noDataMessage.style.display = 'none';
        updateBreadcrumb(year);
        // You would add your logic here to load the data for the selected year and exam type
    }

    function updateBreadcrumb(year) {
        if (year.includes('hsc')) {
            currentYear.textContent = 'HSC ' + year.replace('hsc_', '');
        } else {
            currentYear.textContent = 'SSC ' + year;
        }
        currentGroup.style.display = 'none'; // Hide the group by default, adjust as needed
    }
});

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('locked');
}

function navigateTo(page) {
    window.location.href = page;
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.width = '0px';

    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('theme') === 'dark') {
        themeToggle.checked = true;
        document.body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
        updateTableData();  // Update table to apply new colors
    });
});

function loadYear(year) {
    if (year) {
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
    <div class="search-container">
    <label for="searchInput">Search by Name:</label>
    <input type="text" id="searchInput" class="search-input" placeholder="      Enter name" oninput="debounce(handleSearchInput, 300)()">
</div>
<div class="search-container">
    <label for="searchRollInput">Search by Roll:</label>
    <input type="text" id="searchRollInput" class="search-input" placeholder="      Enter roll" oninput="debounce(handleRollSearchInput, 300)()">
</div>
        <div class="search-container">
            <label for="InstituationDropdown">Select Instituation:</label>
            <select id="InstituationDropdown" onchange="filterByInstituation()"></select>
        </div>
        
        <button id="resetFilterBtn" style="display: none;" onclick="resetFilter()">Reset Filter</button>
        <div class="loading-spinner" id="loadingSpinner" style="display: none;"></div>
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
            <button id="prevBtn" onclick="handlePrevButtonClick()">Previous</button>
            <span id="paginationInfo">Loading data...</span>
            <button id="nextBtn" onclick="handleNextButtonClick()">Next</button>
        </div>
    `;
    fetchData(year, group);
    
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
        fetch(mainDataUrl).then(response => {
            if (!response.ok) {
                throw new Error('Main data not found');
            }
            return response.text();
        }),
        fetch(individualDataUrl).then(response => {
            if (!response.ok) {
                throw new Error('Individual data not found');
            }
            return response.text();
        }).catch(() => null)
    ]).then(([mainData, individualData]) => {
        console.log('Main data loaded:', mainData);
        console.log('Individual data loaded:', individualData);

        if (!mainData) {
            throw new Error('Main data is missing');
        }

        processData(mainData, individualData);
        populateInstituationDropdown();
        hideLoadingIndicator();
    }).catch(error => {
        console.error('Error loading data:', error);
        hideLoadingIndicator();
        console.log("oops! No data found :(");
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



function showSchoolRanking(schoolName) {
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
    // Restore the current group view without asking to select the group again
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
            <td class="student-name" onclick="showIndividualResult(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}')">${student.name}</td>
            <td class="student-roll" onclick="showIndividualResult(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}')">${student.roll}</td>
            <td>${student.gpa}</td>
            <td>${student.total}</td>
            <td class="student-school" onclick="showSchoolRanking('${student.Instituation.trim()}')">${student.Instituation}</td>
        `;
        tableBody.appendChild(row);
    });
    document.getElementById('paginationInfo').textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredData.length} students`;
    updatePaginationButtons();
}

document.addEventListener('DOMContentLoaded', () => {
    makeSchoolNamesClickable(); // Initial call
});

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
    let color;
    let additionalClass = '';
    if (percentage >= 95) {
        color = 'indigo';
    } else if (percentage >= 90) {
        color = 'blue';
    } else if (percentage >= 80) {
        color = 'green';
    } else if (percentage >= 70) {
        color = 'yellow';
        additionalClass = 'yellow'; // Add this class for yellow bars
    } else if (percentage >= 34) {
        color = 'orange';
    } else {
        color = 'red';
    }
    return `
        <div class="progress-bar-container">
            <div class="progress-bar ${additionalClass}" style="background-color: ${color}; width: ${percentage}%;">
                ${percentage.toFixed(2)}%
            </div>
        </div>
    `;
}

function showIndividualResult(roll, year, group) {
    const fileName = `data_${year}_${group.toLowerCase()}_individual.txt`;
    const isHSC = fileName.includes("hsc");

    fetch(fileName)
        .then(response => response.text())
        .then(data => {
            const rows = data.trim().split('\n');
            const individualData = rows.find(row => row.startsWith(roll.toString()));
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
                                <button class="back-button" onclick="closePopup()">Back</button>
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
                                <p>Religion: ${Compulsory} ${getProgressBarHtml(Compulsory, 100)}</p>
                                <p>ICT: ${ICT} ${getProgressBarHtml(ICT, 50)}</p>
                                <p>Optional: ${Optional} ${getProgressBarHtml(Optional, 100)}</p>
                                <p>Physical: ${Physical} ${getProgressBarHtml(Physical, 100)}</p>
                                <p>Career: ${Career} ${getProgressBarHtml(Career, 50)}</p>
                                <button class="back-button" onclick="closePopup()">Back</button>
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
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.width === '0px' || sidebar.style.width === '') {
        sidebar.style.width = '40%';
    } else {
        sidebar.style.width = '0px';
    }
}

function navigateTo(page) {
    window.location.href = page;
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.width === '0px' || sidebar.style.width === '') {
        sidebar.style.width = '40%';
    } else {
        sidebar.style.width = '0px';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.width = '0px';

    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('theme') === 'dark') {
        themeToggle.checked = true;
        document.body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
});
