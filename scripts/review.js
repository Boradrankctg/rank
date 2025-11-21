 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import {
      getDatabase,
      ref,
      push,
      set,
      get,
      onValue,
      runTransaction,
      remove,
    } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

    // =========================
    // Firebase
    // =========================
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
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    // =========================
    // Helpers & User State
    // =========================
    const ADMIN_EMAIL = "hasnyne2007@gmail.com"; // update if needed
    const PAGE_SIZE = 10;

    let allReviewsEntries = []; // [[id, review], ...]
    let currentSort = "top"; // "top" | "new"
    let visibleCount = PAGE_SIZE;

    function getOrCreateAnonId() {
      let uid = localStorage.getItem("anonUserId");
      if (!uid) {
        uid = (self.crypto?.randomUUID?.() || "u_" + Math.random().toString(36).slice(2));
        localStorage.setItem("anonUserId", uid);
      }
      return uid;
    }
    const anonUserId = getOrCreateAnonId();

    function isLoggedIn() {
      return localStorage.getItem("userLoggedIn") === "true";
    }
    function currentUserId() {
      return localStorage.getItem("loggedInUserId") || anonUserId;
    }
    function currentUserEmail() {
      return (localStorage.getItem("userEmail") || "").toLowerCase();
    }
    function isAdmin() {
      return currentUserEmail() === ADMIN_EMAIL.toLowerCase();
    }
    function esc(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    // Safe fallback if other scripts don’t define it
    window.requireLogin = window.requireLogin || function (msg) {
      alert(msg || "Please log in to continue.");
      window.location.href = "login.html";
    };

    // =========================
    // UI: Login state toggle
    // =========================
    function checkLoginStatus() {
      const loggedInForm = document.getElementById("reviewFormLoggedIn");
      const loginPrompt = document.getElementById("loginPrompt");

      if (isLoggedIn()) {
        loggedInForm.style.display = "block";
        loginPrompt.style.display = "none";

        const userName = localStorage.getItem("userName") || "User";
        const nameEl = document.getElementById("reviewingAsName");
        if (nameEl) nameEl.textContent = userName;

        document.querySelectorAll(".logged-in-only").forEach((el) => (el.style.display = "block"));
        document.querySelectorAll(".logged-out-only").forEach((el) => (el.style.display = "none"));
      } else {
        loggedInForm.style.display = "none";
        loginPrompt.style.display = "block";

        document.querySelectorAll(".logged-in-only").forEach((el) => (el.style.display = "none"));
        document.querySelectorAll(".logged-out-only").forEach((el) => (el.style.display = "block"));
      }
    }

    // =========================
    // Stars
    // =========================
    function rateSite(rating) {
      const container = document.getElementById("starContainer");
      if (!container) return;
      const stars = container.children;
      for (let i = 0; i < stars.length; i++) {
        stars[i].textContent = i < rating ? "★" : "☆";
      }
      localStorage.setItem("userRating", String(rating));
    }
    window.rateSite = rateSite;

    // =========================
    // Submit Review
    // =========================
    let isSubmittingReview = false;
    async function submitReview(e) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      if (!isLoggedIn()) return requireLogin("Please sign in to submit a review.");
      if (isSubmittingReview) return;

      const btn = document.getElementById("submitReviewBtn");
      const textField = document.getElementById("reviewText");
      const comment = (textField?.value || "").trim();
      const rating = parseInt(localStorage.getItem("userRating") || "0", 10);

      // Clear errors
      const starErr = document.getElementById("starError");
      const commentErr = document.getElementById("commentError");
      if (starErr) starErr.textContent = "";
      if (commentErr) commentErr.textContent = "";

      let hasError = false;
      if (!rating || rating < 1 || rating > 5) {
        if (starErr) starErr.textContent = "Please select a rating";
        hasError = true;
      }
      if (!comment) {
        if (commentErr) commentErr.textContent = "Please write your feedback";
        hasError = true;
      }
      if (hasError) return;

      try {
        isSubmittingReview = true;
        if (btn) { btn.disabled = true; btn.textContent = "Submitting..."; }

        const uid = currentUserId();
        let name = localStorage.getItem("userName") || "Anonymous User";

        // Try to read profile name if exists
        if (isLoggedIn() && uid) {
          try {
            const snap = await get(ref(db, `users/${uid}`));
            if (snap.exists()) {
              const u = snap.val();
              name = u.fullName || u.firstName || name;
            }
          } catch (_) {}
        }

        const newRef = push(ref(db, "reviews"));
        await set(newRef, {
          name,
          comment,
          rating,
          likes: 0,
          dislikes: 0,
          replies: {},
          timestamp: Date.now(),
          userId: uid,
          userEmail: localStorage.getItem("userEmail") || "",
        });

        if (textField) textField.value = "";
        rateSite(0);
        localStorage.removeItem("userRating");

showModal({ title: "Thank you!", message: "Your review has been submitted." });

      } catch (err) {
        console.error("Error submitting review:", err);
showModal({ title: "Couldn’t submit", message: "Failed to submit review. Please try again." });

      } finally {
        isSubmittingReview = false;
        if (btn) { btn.disabled = false; btn.textContent = "Submit Review"; }
      }
    }
    window.submitReview = submitReview;

    // =========================
    // Replies
    // =========================
    window.submitReply = async function (reviewId) {
      if (!isLoggedIn()) return requireLogin("Please sign in to reply to reviews.");

      const input = document.getElementById(`reply-${reviewId}`);
      const text = (input?.value || "").trim();
      if (!text) return;

      try {
        const uid = currentUserId();
        let userName = localStorage.getItem("userName") || "User";

        // Try to read profile name
        if (uid) {
          try {
            const snap = await get(ref(db, `users/${uid}`));
            if (snap.exists()) {
              const u = snap.val();
              userName = u.fullName || u.firstName || userName;
            }
          } catch (_) {}
        }

        const replyRef = push(ref(db, `reviews/${reviewId}/replies`));
        await set(replyRef, {
          text,
          name: userName,
          isAdmin: isAdmin(),
          userId: uid,
          likes: 0,
          timestamp: Date.now(),
        });

        if (input) input.value = "";
      } catch (error) {
        console.error("Error submitting reply:", error);
showModal({ title: "Couldn’t submit reply", message: "Please try again." });

      }
    };

    window.deleteReview = async function (id) {
      if (!confirm("Are you sure you want to delete this review?")) return;
      try {
        await remove(ref(db, `reviews/${id}`));
      } catch (e) {
        console.error(e);
showModal({ title: "Delete failed", message: "Failed to delete review." });

      }
    };

    window.deleteReply = async function (reviewId, replyId) {
      if (!confirm("Delete this reply?")) return;
      try {
        await remove(ref(db, `reviews/${reviewId}/replies/${replyId}`));
      } catch (e) {
        console.error(e);
showModal({ title: "Delete failed", message: "Failed to delete reply." });

      }
    };

    window.likeReply = function (reviewId, replyId) {
      const key = `replyLike_${reviewId}_${replyId}`;
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
      runTransaction(ref(db, `reviews/${reviewId}/replies/${replyId}/likes`), (v) => (v || 0) + 1);
    };

    // =========================
    // Like / Dislike
    // =========================
    window.voteReview = function (id, type) {
      const key = "reviewVote_" + id;
      const prev = localStorage.getItem(key);
      if (prev === type) return;

      const path = `reviews/${id}/${type === "like" ? "likes" : "dislikes"}`;
      runTransaction(ref(db, path), (v) => (v || 0) + 1);

      if (prev && prev !== type) {
        const undo = `reviews/${id}/${prev === "like" ? "likes" : "dislikes"}`;
        runTransaction(ref(db, undo), (v) => Math.max(0, (v || 0) - 1));
      }
      localStorage.setItem(key, type);
    };

    // =========================
    // Sorting + Pagination
    // =========================
    function getSortedEntries() {
      const entries = allReviewsEntries.slice();
      if (currentSort === "top") {
        // Most liked (desc), tie-breaker: newest first
        entries.sort((a, b) => {
          const lb = (b[1]?.likes || 0), la = (a[1]?.likes || 0);
          if (lb !== la) return lb - la;
          const tb = (b[1]?.timestamp || 0), ta = (a[1]?.timestamp || 0);
          return tb - ta;
        });
      } else {
        // Newest first
        entries.sort((a, b) => (b[1]?.timestamp || 0) - (a[1]?.timestamp || 0));
      }
      return entries;
    }

    function renderReviews() {
      const container = document.getElementById("reviewsContainer");
      const loadMoreBtn = document.getElementById("loadMoreBtn");
      const countEl = document.getElementById("reviewsCount");
      if (!container) return;

      container.innerHTML = "";

      if (!allReviewsEntries.length) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No reviews yet. Be the first to review!</p>';
        if (loadMoreBtn) loadMoreBtn.style.display = "none";
        if (countEl) countEl.textContent = "";
        return;
      }

      const uid = currentUserId();
      const admin = isAdmin();

      const entries = getSortedEntries();
      const total = entries.length;
      const limit = Math.min(visibleCount, total);
      const page = entries.slice(0, limit);

      for (const [id, review] of page) {
        const owner = (review.userId === uid) || admin;

        // Replies (ascending by time)
        let repliesHTML = "";
        if (review.replies && typeof review.replies === "object") {
          const replyEntries = Object.entries(review.replies)
            .sort((a, b) => (a[1]?.timestamp || 0) - (b[1]?.timestamp || 0));
          repliesHTML = replyEntries.map(([rid, r]) => {
            const adminTag = r.isAdmin ? `<span class="badge-admin">[ADMIN]</span>` : "";
            const canDelete = r.userId && (r.userId === uid || admin);
            const likeCount = r.likes || 0;
            const replyName = esc(r.name || "Anonymous");
            const replyText = esc(r.text || "");

            return `
              <div class="reply-box">
                ↪️ ${adminTag} <strong>${replyName}:</strong> ${replyText}
                <span class="reply-actions">
                  <button class="reply-like-btn" onclick="likeReply('${id}','${rid}')">👍</button>
                  <span class="reply-like-count" style="font-weight:800;">${likeCount}</span>
                  ${canDelete ? `<button class="reply-del-btn" onclick="deleteReply('${id}','${rid}')">🗑️</button>` : ``}
                </span>
              </div>
            `;
          }).join("");
        }

        const safeName = esc(review.name || "Anonymous");
        const safeComment = esc(review.comment || "");
        const ts = review.timestamp ? new Date(review.timestamp).toLocaleString() : "";
        const rating = review.rating || 0;

        container.innerHTML += `
          <div class="review-box">
            <div>
              <strong>${safeName}</strong>
              <small class="muted" style="margin-left: 10px;">${ts}</small>
              <div>⭐ ${"★".repeat(rating)}${"☆".repeat(5 - rating)}</div>
            </div>
            <div class="review-comment">${safeComment}</div>
            <div style="margin-top:10px;">
              <button onclick="voteReview('${id}', 'like')">👍 ${review.likes || 0}</button>
              <button onclick="voteReview('${id}', 'dislike')">👎 ${review.dislikes || 0}</button>
              ${
                isLoggedIn()
                  ? `<input type="text" placeholder="Write a reply..." id="reply-${id}" style="width: 60%; margin-left:10px;" />
                     <button onclick="submitReply('${id}')">Reply</button>`
                  : `<a href="login.html" style="margin-left:10px; color:#0284c7;">Sign in to reply</a>`
              }
              ${owner ? `<button onclick="deleteReview('${id}')">🗑️ Delete</button>` : ""}
            </div>
            ${repliesHTML}
          </div>
        `;
      }

      // Count + Load more visibility
      if (countEl) countEl.textContent = `Showing ${limit} of ${total}`;
      if (loadMoreBtn) loadMoreBtn.style.display = limit < total ? "inline-block" : "none";
    }

    // =========================
    // Load Reviews (subscribe)
    // =========================
    function loadReviews() {
      const container = document.getElementById("reviewsContainer");
      if (container) {
        container.innerHTML = `<p style="text-align:center;color:#64748b;padding:20px;">Loading reviews…</p>`;
      }
      const reviewsRef = ref(db, "reviews");
      onValue(reviewsRef, (snapshot) => {
        const data = snapshot.val();
        allReviewsEntries = data ? Object.entries(data) : [];
        renderReviews();
      });
    }
    window.loadReviews = loadReviews;

    // =========================
    // Visit Counter
    // =========================
    function updateVisitStats() {
      const totalRef = ref(db, "siteStats/totalVisits");
      const userRef = ref(db, "siteStats/activeUsers/" + currentUserId());
      runTransaction(totalRef, (n) => (n || 0) + 1);
      set(userRef, Date.now());
    }

    // =========================
    // Logout
    // =========================
    window.doLogout = function () {
      localStorage.clear();
      window.location.href = "login.html";
    };

    // =========================
    // Init
    // =========================
    document.addEventListener("DOMContentLoaded", () => {
      // Always show Profile/Favorite in the navbar, but gate with login on click
      ["profile.html", "favorite.html"].forEach((href) => {
        const a = document.querySelector(`.nav-links a[href="${href}"]`);
        if (a && a.closest("li")) {
          a.closest("li").style.display = "block";
          a.addEventListener("click", (e) => {
            if (!isLoggedIn()) {
              e.preventDefault();
              requireLogin("Please log in to access your profile/favourites.");
            }
          });
        }
      });

      // Sorting control
      const sortSelect = document.getElementById("sortSelect");
      const loadMoreBtn = document.getElementById("loadMoreBtn");
      if (sortSelect) {
        sortSelect.value = currentSort;
        sortSelect.addEventListener("change", (e) => {
          currentSort = e.target.value;
          visibleCount = PAGE_SIZE;
          renderReviews();
        });
      }
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
          visibleCount += PAGE_SIZE;
          renderReviews();
        });
      }

      checkLoginStatus();
      loadReviews();
      updateVisitStats();
    });