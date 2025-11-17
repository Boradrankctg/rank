// 3B-popups-verify-share.js — Visitor verification gating + Share/Rating + minor SEO keywords

// ====== Visitor Verification (gates detailed result after threshold) ======
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
    if (match && match[1]) deviceModel = match[1].replace(/Build\/.+/, '').trim();
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

  const deviceData = { ua, platform, screen: screenRes, deviceMemory, cores, vendor, deviceModel };

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
  // If current URL already has the same roll → allow directly
  const params = new URLSearchParams(window.location.search);
  if (params.has('roll') && params.get('roll') == roll) {
    return showIndividualResult(roll, year, group);
  }

  // Count attempts and allow first 10 freely
  let clickCount = parseInt(localStorage.getItem('detailedResultClickCount') || '0', 10);
  clickCount++;
  localStorage.setItem('detailedResultClickCount', clickCount);

  if (clickCount <= 10) {
    const visitorId = getOrCreateVisitorId();

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
      // Non-blocking if verification check fails
    }
    return showIndividualResult(roll, year, group);
  }

  // Past free threshold → device/fingerprint check
  const { deviceData, fingerprint } = getDeviceDataAndFingerprint();

  // Previously verified on this device?
  if (localStorage.getItem('visitorInfoGiven') === '1' &&
      localStorage.getItem('visitorFingerprint') === fingerprint) {
    visitorInfoCompleted = true;
    return showIndividualResult(roll, year, group);
  }

  // Check Firebase for this fingerprint (if exists, skip form)
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
    console.warn('Fingerprint check failed (ignoring):', err);
  }

  // Build verification popup
  if (document.querySelector('.popup')) return; // avoid duplicates
  const popup = document.createElement('div');
  popup.classList.add('popup');
  popup.innerHTML = `
  <div class="popup-content">
    <div class="popup-header" style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; font-weight: bold; font-size: 1.3rem; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top-left-radius: 8px; border-top-right-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="https://img.icons8.com/color/48/verified-badge.png" alt="Icon" style="width: 28px; height: 28px;">
        <span>Quick Verification</span>
      </div>
      <button class="close-btn" onclick="visitorInfoDenied()" style="background: transparent; border: none; font-size: 1.5rem; color: white; cursor: pointer;">&times;</button>
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

  // Helpers
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

  let originalFormHTML = popup.querySelector('.popup-body').innerHTML;

  function bindSubmit() {
    const submitBtn = popup.querySelector('#submitVisitorInfo');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
      const body = popup.querySelector('.popup-body');
      const footer = popup.querySelector('.popup-footer');

      const name = popup.querySelector('#visitorName')?.value.trim() || '';
      const institution = popup.querySelector('#visitorInstitution')?.value.trim() || '';
      const type = popup.querySelector('#visitorType')?.value || '';
      const source = popup.querySelector('#visitorSource')?.value || '';
      const experience = popup.querySelector('#visitorExperience')?.value || '';
      const messageVal = popup.querySelector('#visitorMessage')?.value.trim() || '';

      // Deny on worst/bad
      if (experience === "worst" || experience === "bad") {
        if (footer) footer.style.display = 'none';
        body.innerHTML = `
          <div style="text-align:center; padding:20px;">
            <div class="access-status">
              <div class="circle" style="border: 4px solid #ccc; border-top: 4px solid #1976d2; border-radius: 50%; width: 40px; height: 40px; margin: auto; animation: spin 1s linear infinite;"></div>
              <div style="margin-top: 10px; font-size: 0.95rem;">Checking your feedback…</div>
            </div>
          </div>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
        setTimeout(() => {
          body.innerHTML = `
            <div style="text-align:center; padding:20px;">
              <h3 style="color:#b91c1c;">🚫 Access Not Granted</h3>
              <p style="margin:10px 0; font-size:0.95rem;">Looks like this feature isn’t available with that feedback. Maybe try again later.</p>
              <p style="color:#666; font-size:0.85rem;">We’re always working to improve — your opinion is noted.</p>
              <button onclick="visitorInfoDenied()" class="secondary-btn" style="margin-top:15px;">Close</button>
            </div>
          `;
        }, 1500);
        return;
      }

      // Basic validation & fake name detection
      if (looksFakeName(name)) {
        if (footer) footer.style.display = 'none';
        body.innerHTML = `
          <div style="text-align:center; padding:20px;">
            <div class="circle" style="border: 4px solid #ccc; border-top: 4px solid #1976d2; border-radius: 50%; width: 40px; height: 40px; margin: auto; animation: spin 1s linear infinite;"></div>
            <div style="margin-top: 10px; font-size: 0.95rem;">Verifying name…</div>
          </div>
          <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
        setTimeout(() => {
          body.innerHTML = `
            <div style="text-align:center; padding:20px;">
              <h3 style="color:#b91c1c;">🚫 Access Not Granted</h3>
              <p style="margin:10px 0; font-size:0.95rem;">The name provided doesn’t seem valid. Please use your real name to continue.</p>
              <button onclick="visitorInfoDenied()" class="secondary-btn" style="margin-top:15px;">Close</button>
            </div>
          `;
        }, 1500);
        return;
      }

      if (!name || name.length < 4) { alert('Name must contain at least 4 characters.'); return; }
      if (!institution || institution.length < 3) { alert('Institution name must contain at least 3 characters.'); return; }
      if (!type || !source) { alert('Please fill all required fields.'); return; }

      // Confirm name step
      if (footer) footer.style.display = 'none';
      const prev = body.innerHTML;
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

      popup.querySelector('#confirmNameBtn')?.addEventListener('click', async () => {
        const { fingerprint } = getDeviceDataAndFingerprint();
        localStorage.setItem('visitorInfoGiven', '1');
        localStorage.setItem('visitorFingerprint', fingerprint);
        visitorInfoCompleted = true;

        try {
          const dbLib = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
          const { getDatabase, ref, push, set } = dbLib;
          const dbv = getDatabase();
          const visitorRef = push(ref(dbv, "visitors"));
          const { deviceData } = getDeviceDataAndFingerprint();

          await set(visitorRef, {
            name, institution, type, source, experience, message: messageVal,
            fingerprint, deviceData, timestamp: Date.now()
          });

          try {
            const verRef = ref(dbv, "visitorsVerified/" + getOrCreateVisitorId());
            await set(verRef, 1);
            localStorage.setItem('visitorVerifiedV2', '1');
          } catch (e) {}

          try { window.__HAS9_notify?.(name); } catch (e) {}
        } catch (err) {
          console.error('Error saving visitor info:', err);
        }

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

      popup.querySelector('#editNameBtn')?.addEventListener('click', () => {
        if (footer) footer.style.display = 'flex';
        body.innerHTML = originalFormHTML;

        // restore values
        popup.querySelector('#visitorName').value = name;
        popup.querySelector('#visitorInstitution').value = institution;
        popup.querySelector('#visitorType').value = type;
        popup.querySelector('#visitorSource').value = source;
        popup.querySelector('#visitorExperience').value = experience;
        popup.querySelector('#visitorMessage').value = messageVal;

        bindSubmit(); // rebind handler after DOM reset
      });
    });
  }

  bindSubmit();
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


// ====== Share popup + rating ======
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

// Auto show share popup once per device after ~2.5 minutes
if (!localStorage.getItem('sharePopupShown')) {
  setTimeout(() => {
    showSharePopup();
    localStorage.setItem('sharePopupShown', '1');
  }, 150000);
}

// Hook share button (safe)
document.getElementById('shareBtn')?.addEventListener('click', showSharePopup);

function rateSite(rating) {
  const stars = document.getElementById('starContainer')?.children || [];
  for (let i = 0; i < stars.length; i++) {
    stars[i].innerHTML = i < rating ? '&#9733;' : '&#9734;';
  }
  localStorage.setItem('userRating', rating);
}

function submitReview() {
  const rating = localStorage.getItem('userRating') || 0;
  const comment = document.getElementById('reviewText')?.value.trim() || '';
  if (!comment && rating == 0) return alert('Please rate or write something.');
  localStorage.setItem('pendingReview', JSON.stringify({ rating, comment }));
  window.location.href = 'review.html';
}


// ====== Minor SEO enhancement (keywords from current data) ======
(function(){
  const words = Array.from(new Set((allData || []).flatMap(s => [ s?.name, s?.Instituation ]).filter(Boolean)));
  if (words.length) upsertMeta('keywords', words.join(', '));
})();