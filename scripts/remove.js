    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import {
      getDatabase,
      ref,
      push,
      set,
      get,
      onValue,
      update,
      query,
      orderByChild,
      equalTo
    } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
    
    // === Firebase Config ===
    const firebaseConfig = {
      apiKey: "AIzaSyBaKVrTWKeaUxa0EaiDBR8OGpGCAjxAcUA",
      authDomain: "boardrankctg.firebaseapp.com",
      databaseURL: "https://boardrankctg-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "boardrankctg",
      storageBucket: "boardrankctg.firebasestorage.app",
      messagingSenderId: "751761229963",
      appId: "1:751761229963:web:43f9dbf71feef6dc9cec8e",
      measurementId: "G-3Y6J44NWNH",
    };
    
    // === Init Firebase ===
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    console.log('Firebase initialized successfully');
    
    // === User ID ===
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = crypto.randomUUID ? crypto.randomUUID() : 'user_' + Date.now() + '_' + Math.random().toString(36);
      localStorage.setItem("userId", userId);
    }
  const ADMIN_EMAIL = (localStorage.getItem('userEmail') || '').toLowerCase();
const isAdmin = ADMIN_EMAIL === 'hasnyne2007@gmail.com';


    // === Show/Hide Admin Section ===
    if (isAdmin) {
      document.getElementById('adminSection').style.display = 'block';
      document.getElementById('userSection').style.display = 'none';
      loadAdminRequests();
    } else {
      loadUserRequests();
    }

    // === Submit Removal Request (with better error handling) ===
    async function submitRemovalRequest() {
      console.log('Submit button clicked');
      
      try {
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        // Get form values
        const examType = document.getElementById('examType').value;
        const examYear = document.getElementById('examYear').value;
        const streamGroup = document.getElementById('streamGroup').value;
        const studentName = document.getElementById('studentName').value.trim();
        const rollNumber = document.getElementById('rollNumber').value.trim();
        const regNumber = document.getElementById('regNumber').value.trim();
        const removalReason = document.getElementById('removalReason').value.trim();

        console.log('Form values:', { examType, examYear, streamGroup, studentName, rollNumber, regNumber });

        // Validate
        let hasError = false;
        
        if (!examType || !examYear || !streamGroup) {
          alert('Please select exam type, year, and stream/group.');
          return;
        }

        if (!studentName || studentName.length < 3) {
          document.getElementById('nameError').textContent = 'Name must be at least 3 characters.';
          hasError = true;
        }

        if (!rollNumber || rollNumber.length < 4) {
          document.getElementById('rollError').textContent = 'Please enter a valid roll number.';
          hasError = true;
        }

        if (!regNumber || regNumber.length < 4) {
          document.getElementById('regError').textContent = 'Please enter a valid registration number.';
          hasError = true;
        }

        if (hasError) {
          console.log('Validation failed');
          return;
        }

        console.log('Validation passed, checking for duplicates...');

        // Check for duplicate request
        try {
          const existingQuery = query(
            ref(db, 'removalRequests'),
            orderByChild('rollNumber'),
            equalTo(rollNumber)
          );
          
          const snapshot = await get(existingQuery);
          if (snapshot.exists()) {
            const existing = Object.values(snapshot.val());
            const hasPending = existing.some(req => 
              req.examType === examType && 
              req.examYear === examYear && 
              req.status === 'pending'
            );
            
            if (hasPending) {
              alert('You already have a pending request for this roll number.');
              return;
            }
          }
        } catch (dupError) {
          console.log('Duplicate check error (continuing):', dupError);
          // Continue anyway if duplicate check fails
        }

        // Show processing state
        document.getElementById('requestForm').style.display = 'none';
        document.getElementById('statusDisplay').style.display = 'block';
        document.getElementById('statusSpinner').style.display = 'block';
        document.getElementById('statusTitle').textContent = 'Submitting Request...';
        document.getElementById('statusMessage').textContent = 'Please wait while we process your request.';

        console.log('Submitting to Firebase...');

        // Submit to Firebase
        const newRequestRef = push(ref(db, 'removalRequests'));
        const requestData = {
          examType,
          examYear,
          streamGroup,
          studentName,
          rollNumber,
          regNumber,
          removalReason: removalReason || 'No reason provided',
          status: 'pending',
          userId: userId,
          timestamp: Date.now(),
          requestId: newRequestRef.key
        };
        
        console.log('Saving data:', requestData);
        await set(newRequestRef, requestData);
        
        console.log('Successfully saved to Firebase');

        // Update UI for success
        document.getElementById('statusSpinner').style.display = 'none';
        document.getElementById('statusTitle').innerHTML = '<i class="fas fa-check-circle" style="color:#22c55e;"></i> Request Submitted';
        document.getElementById('statusMessage').innerHTML = `
          Your removal request has been submitted successfully.<br>
          <strong>Status: Waiting for admin approval</strong><br>
          <small style="color:#64748b;">Request ID: ${newRequestRef.key}</small>
        `;
        document.getElementById('statusActions').style.display = 'block';

        // Clear form
        document.getElementById('examType').value = '';
        document.getElementById('examYear').value = '';
        document.getElementById('streamGroup').value = '';
        document.getElementById('studentName').value = '';
        document.getElementById('rollNumber').value = '';
        document.getElementById('regNumber').value = '';
        document.getElementById('removalReason').value = '';

        // Reload user's requests
        loadUserRequests();

      } catch (error) {
        console.error('Firebase Error:', error);
        alert('Error submitting request: ' + error.message + '\n\nPlease check console for details.');
        
        document.getElementById('statusSpinner').style.display = 'none';
        document.getElementById('statusTitle').innerHTML = '<i class="fas fa-times-circle" style="color:#ef4444;"></i> Submission Failed';
        document.getElementById('statusMessage').innerHTML = 'Error: ' + error.message;
        document.getElementById('statusActions').style.display = 'block';
      }
    }
    
    // IMPORTANT: Expose function to global scope
    window.submitRemovalRequest = submitRemovalRequest;
    console.log('submitRemovalRequest function attached to window');

    // === Submit New Request ===
    function submitNewRequest() {
      document.getElementById('requestForm').style.display = 'block';
      document.getElementById('statusDisplay').style.display = 'none';
      document.getElementById('statusActions').style.display = 'none';
    }
    window.submitNewRequest = submitNewRequest;

    // === Load User's Requests ===
    function loadUserRequests() {
      console.log('Loading user requests...');
      const userRequestsRef = query(
        ref(db, 'removalRequests'),
        orderByChild('userId'),
        equalTo(userId)
      );

      onValue(userRequestsRef, (snapshot) => {
        const container = document.getElementById('userRequests');
        const listContainer = document.getElementById('userRequestsList');
        
        if (!snapshot.exists()) {
          console.log('No existing requests found');
          container.style.display = 'none';
          return;
        }

        console.log('Found user requests:', snapshot.size);
        container.style.display = 'block';
        listContainer.innerHTML = '';

        const requests = [];
        snapshot.forEach((child) => {
          requests.push({ id: child.key, ...child.val() });
        });

        // Sort by timestamp (newest first)
        requests.sort((a, b) => b.timestamp - a.timestamp);

        requests.forEach(req => {
          const statusColor = 
            req.status === 'approved' ? '#22c55e' :
            req.status === 'rejected' ? '#ef4444' :
            '#f59e0b';

          const statusIcon = 
            req.status === 'approved' ? 'check-circle' :
            req.status === 'rejected' ? 'times-circle' :
            'clock';

          const requestCard = document.createElement('div');
          requestCard.className = 'review-box';
          requestCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
              <div>
                <strong>${req.examType} ${req.examYear} - ${req.streamGroup}</strong>
                <div style="color:#64748b; font-size:0.9rem; margin-top:4px;">
                  Roll: ${req.rollNumber} | Reg: ${req.regNumber}
                </div>
                <div style="color:#64748b; font-size:0.85rem;">
                  ${new Date(req.timestamp).toLocaleString()}
                </div>
              </div>
              <div style="text-align:right;">
                <span style="color:${statusColor}; font-weight:bold;">
                  <i class="fas fa-${statusIcon}"></i> ${req.status.toUpperCase()}
                </span>
              </div>
            </div>
            ${req.adminNote ? `
              <div style="margin-top:10px; padding:8px; background:#f3f4f6; border-radius:6px;">
                <strong>Admin Note:</strong> ${req.adminNote}
              </div>
            ` : ''}
          `;
          listContainer.appendChild(requestCard);
        });
      }, (error) => {
        console.error('Error loading user requests:', error);
      });
    }

    // === Admin Functions ===
    let currentFilter = 'all';

    function filterRequests(status) {
      currentFilter = status;
      loadAdminRequests();
    }
    window.filterRequests = filterRequests;

    function loadAdminRequests() {
      if (!isAdmin) return;
      
      console.log('Loading admin requests...');
      const requestsRef = ref(db, 'removalRequests');
      
      onValue(requestsRef, (snapshot) => {
        const tbody = document.getElementById('adminRequestsTable');
        
        if (!snapshot.exists()) {
          tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No requests found.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        const allRequests = [];

        snapshot.forEach((child) => {
          const req = child.val();
          req.id = child.key;
          
          if (currentFilter === 'all' || req.status === currentFilter) {
            allRequests.push(req);
          }
        });

        // Sort by timestamp (newest first)
        allRequests.sort((a, b) => b.timestamp - a.timestamp);

        if (allRequests.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No requests found.</td></tr>';
          return;
        }

        allRequests.forEach(req => {
          const row = document.createElement('tr');
          const statusColor = 
            req.status === 'approved' ? '#22c55e' :
            req.status === 'rejected' ? '#ef4444' :
            '#f59e0b';

          row.innerHTML = `
            <td>${new Date(req.timestamp).toLocaleDateString()}</td>
            <td><strong>${req.studentName}</strong></td>
            <td>${req.examType}</td>
            <td>${req.examYear}</td>
            <td>${req.streamGroup}</td>
            <td>${req.rollNumber}</td>
            <td>${req.regNumber}</td>
            <td><small>${req.removalReason || 'N/A'}</small></td>
            <td><span style="color:${statusColor}; font-weight:bold;">${req.status.toUpperCase()}</span></td>
            <td>
              ${req.status === 'pending' ? `
                <button onclick="approveRequest('${req.id}')" style="background:#22c55e; color:#fff; padding:4px 8px; margin:2px;">
                  <i class="fas fa-check"></i> Approve
                </button>
                <button onclick="rejectRequest('${req.id}')" style="background:#ef4444; color:#fff; padding:4px 8px; margin:2px;">
                  <i class="fas fa-times"></i> Reject
                </button>
              ` : `
                <small style="color:#64748b;">Processed</small>
              `}
            </td>
          `;
          tbody.appendChild(row);
        });
      }, (error) => {
        console.error('Error loading admin requests:', error);
        const tbody = document.getElementById('adminRequestsTable');
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Error loading requests. Check console.</td></tr>';
      });
    }

    // === Approve Request ===
    async function approveRequest(requestId) {
      const note = prompt('Add a note for the user (optional):');
      
      try {
        await update(ref(db, `removalRequests/${requestId}`), {
          status: 'approved',
          processedAt: Date.now(),
          processedBy: userId,
          adminNote: note || 'Your request has been approved.'
        });
        
        alert('Request approved successfully!');
      } catch (error) {
        console.error('Error approving request:', error);
        alert('Failed to approve request: ' + error.message);
      }
    }
    window.approveRequest = approveRequest;

    // === Reject Request ===
    async function rejectRequest(requestId) {
      const note = prompt('Reason for rejection:');
      
      if (!note) {
        alert('Please provide a reason for rejection.');
        return;
      }
      
      try {
        await update(ref(db, `removalRequests/${requestId}`), {
          status: 'rejected',
          processedAt: Date.now(),
          processedBy: userId,
          adminNote: note
        });
        
        alert('Request rejected.');
      } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Failed to reject request: ' + error.message);
      }
    }
    window.rejectRequest = rejectRequest;