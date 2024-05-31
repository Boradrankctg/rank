const contentDiv = document.getElementById('content');
const currentYear = document.getElementById('currentYear');
const currentGroup = document.getElementById('currentGroup');
const noDataMessage = document.getElementById('noDataMessage');
const yearDropdown = document.getElementById('yearDropdown');

function loadYear(year) {
    if (year) {
        currentYear.textContent = `SSC ${year}`;
        currentGroup.style.display = 'none';
        noDataMessage.style.display = 'none';
        contentDiv.innerHTML = `
            <p>Select your group:</p>
            <div class="group-buttons">
                <button onclick="loadGroup('${year}', 'Science')">Science</button>
                <button onclick="loadGroup('${year}', 'Commerce')">Business</button>
                <button onclick="loadGroup('${year}', 'Arts')">Humanities</button>
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
            <input type="text" id="searchInput" placeholder="Enter name..." oninput="debounce(handleSearchInput, 300)()">
        </div>
        <div class="search-container">
            <label for="searchRollInput">Search by Roll:</label>
            <input type="text" id="searchRollInput" placeholder="Enter roll number accurately..." oninput="debounce(handleRollSearchInput, 300)()">
        </div>
        <div class="search-container">
            <label for="schoolDropdown">Select School:</label>
            <select id="schoolDropdown" onchange="filterBySchool()"></select>
        </div>
        <button id="resetFilterBtn" style="display: none;" onclick="resetFilter()">Reset Filter</button>
        <div class="loading-spinner" id="loadingSpinner" style="display: none;"></div>
        <table>
            <thead>
                <tr>
                    <th>Serial</th>
                    <th>Name</th>
                    <th>SSC Roll</th>
                    <th>GPA</th>
                    <th>Total</th>
                    <th>School</th>
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
const studentsPerPage = 50;
let currentPage = 1;
const schoolSet = new Set();

function fetchData(year, group) {
    showLoadingIndicator();
    fetch(`data_${year}_${group.toLowerCase()}.txt`)
        .then(response => response.text())
        .then(data => {
            processData(data);
            populateSchoolDropdown();
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            hideLoadingIndicator();
            noDataMessage.style.display = 'block';
        });
}

function processData(data) {
    const rows = data.trim().split('\n').slice(1);
    allData = rows.map(row => {
        const [serial, name, roll, gpa, total, school] = row.split('\t');
        schoolSet.add(school);
        return { serial: parseInt(serial), name, roll: parseInt(roll), gpa: parseFloat(gpa), total: parseInt(total), school };
    });
    allData = allData.filter(student => !isNaN(student.gpa) && !isNaN(student.total));
    allData.sort((a, b) => a.serial - b.serial);
    filteredData = [...allData];
    updateTableData();
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
            <td style="cursor: pointer; color: blue;" onclick="showIndividualResult(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}')">${student.name}</td>
            <td style="cursor: pointer; color: blue;" onclick="showIndividualResult(${student.roll}, '${currentYear.textContent.split(' ')[1]}', '${currentGroup.textContent.split(' ')[0]}')">${student.roll}</td>
            <td>${student.gpa}</td>
            <td>${student.total}</td>
            <td>${student.school}</td>
        `;
        tableBody.appendChild(row);
    });
    document.getElementById('paginationInfo').textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredData.length} students`;
    updatePaginationButtons();
}


function filterBySchool(schoolName = null, fromTable = false) {
    const schoolDropdown = document.getElementById('schoolDropdown');
    if (fromTable) {
        schoolDropdown.value = schoolName;
        const event = new Event('change');
        schoolDropdown.dispatchEvent(event);
    } else {
        schoolName = schoolDropdown.value;
    }

    if (schoolName) {
        filteredData = allData.filter(student => student.school === schoolName);
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

function populateSchoolDropdown() {
    const schoolDropdown = document.getElementById('schoolDropdown');
    schoolDropdown.innerHTML = '<option value="">Select School</option>';
    schoolSet.forEach(school => {
        const option = document.createElement('option');
        option.value = school;
        option.textContent = school;
        schoolDropdown.appendChild(option);
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
    if (percentage >= 90) {
        color = 'blue';
    } else if (percentage >= 80) {
        color = 'green';
    } else if (percentage >= 70) {
        color = 'yellow';
    } else if (percentage >= 34) {
        color = 'orange';
    } else {
        color = 'red';
    }
    return `
        <div class="progress-bar-container">
            <div class="progress-bar" style="background-color: ${color}; width: ${percentage}%;">
                ${percentage.toFixed(2)}%
            </div>
        </div>
    `;
}

function showIndividualResult(roll, year, group) {
    fetch(`data_${year}_${group.toLowerCase()}_individual.txt`)
        .then(response => response.text())
        .then(data => {
            const rows = data.trim().split('\n');
            const individualData = rows.find(row => row.startsWith(roll.toString()));
            let popupContent;
            if (individualData) {
                const parts = individualData.split('\t');
                if (parts.length < 13) {
                    popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
                } else {
                    const [roll, bangla, english, math, bgs, religion, physics, chemistry, Compulsory, ICT, Optional, Physical, Career] = parts;
                    const student = filteredData.find(student => student.roll === parseInt(roll));
                    popupContent = `
                        <div class="popup-content">
                                <span class="close-btn" onclick="closePopup()">&times;</span>

                            <p>Name: ${student.name}</p>
                            <p>School: ${student.school}</p>
                            <p>Roll: ${roll}</p>
                            <p>GPA: ${student.gpa}</p>
                            <p>Board Rank: ${student.serial}</p>
                            <p>Bangla: ${bangla} ${getProgressBarHtml(bangla, 200)}</p>
                            <p>English: ${english} ${getProgressBarHtml(english, 200)}</p>
                            <p>Mathematics: ${math} ${getProgressBarHtml(math, 100)}</p>
                            <p>BGS: ${bgs} ${getProgressBarHtml(bgs, 100)}</p>
                            <p>Religion: ${religion} ${getProgressBarHtml(religion, 100)}</p>
                            <p>Physics: ${physics} ${getProgressBarHtml(physics, 100)}</p>
                            <p>Chemistry: ${chemistry} ${getProgressBarHtml(chemistry, 100)}</p>
                            <p>Compulsory: ${Compulsory} ${getProgressBarHtml(Compulsory, 100)}</p>
                            <p>ICT: ${ICT} ${getProgressBarHtml(ICT, 50)}</p>
                            <p>Optional: ${Optional} ${getProgressBarHtml(Optional, 100)}</p>
                            <p>Physical: ${Physical} ${getProgressBarHtml(Physical, 100)}</p>
                            <p>Career: ${Career} ${getProgressBarHtml(Career, 50)}</p>
                            <button class="back-button" onclick="closePopup()">Back</button>
                        </div>
                    `;
                }
            } else {
                popupContent = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
            }
            const popup = document.createElement('div');
            popup.classList.add('popup');
            popup.innerHTML = popupContent;
            document.body.appendChild(popup);
        })
        .catch(error => {
            console.error('Error loading individual data:', error);
            const popup = document.createElement('div');
            popup.classList.add('popup');
            popup.innerHTML = `<div class="popup-content"><p>Result not found</p><button class="back-button" onclick="closePopup()">Back</button></div>`;
            document.body.appendChild(popup);
        });
}

function closePopup() {
    const popup = document.querySelector('.popup');
    if (popup) {
        popup.remove();
    }
}

