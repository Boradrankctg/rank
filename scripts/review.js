        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
        import {
          getDatabase,
          ref,
          push,
          set,
          onValue,
          runTransaction,
          remove,
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
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        
        // === User ===
        let userId = localStorage.getItem("userId");
        if (!userId) {
          userId = crypto.randomUUID();
          localStorage.setItem("userId", userId);
        }
        const ADMIN_ID = "admin1234";
        
        // === Star Rating ===
        function rateSite(rating) {
          const stars = document.getElementById("starContainer").children;
          for (let i = 0; i < stars.length; i++) {
            stars[i].textContent = i < rating ? "★" : "☆";
          }
          localStorage.setItem("userRating", rating);
        }
        window.rateSite = rateSite;
        
        // === Submit Review ===
        async function submitReview() {
          const nameField = document.getElementById("reviewName");
          const textField = document.getElementById("reviewText");
          const name = nameField.value.trim();
const comment = textField.value.trim();

          const rating = parseInt(localStorage.getItem("userRating") || 0);
        
          if (!name || !comment || rating === 0) {
            alert("Please fill in all fields and select a rating.");
            return;
          }
        
          const newReviewRef = push(ref(db, "reviews"));
          await set(newReviewRef, {
            name,
            comment,
            rating,
            likes: 0,
            replies: {},
            timestamp: Date.now(),
            userId: userId,
          });
          nameField.value = "";
textField.value = "";

          rateSite(0);
          localStorage.removeItem("userRating");
        }
        window.submitReview = submitReview;
        
        // === Submit Reply (now with isAdmin flag) ===
        window.submitReply = async function (id) {
  const input = document.getElementById(`reply-${id}`);
  const text = (input.value || '').trim();
  if (!text) return;

  const replyRef = push(ref(db, `reviews/${id}/replies`));
  await set(replyRef, {
    text,
    isAdmin: userId === ADMIN_ID,
    userId: userId,
    likes: 0,
    timestamp: Date.now()
  });
  input.value = '';
};

        
        // === Delete Review ===
        window.deleteReview = async function (id) {
          if (confirm("Are you sure you want to delete this review?")) {
            await remove(ref(db, `reviews/${id}`));
          }
        };
        
        // === Delete Reply ===
        window.deleteReply = async function (reviewId, replyId) {
          if (confirm("Delete this reply?")) {
            await remove(ref(db, `reviews/${reviewId}/replies/${replyId}`));
          }
        };
        window.likeReply = function (reviewId, replyId) {
  const key = 'replyLike_' + reviewId + '_' + replyId;
  if (localStorage.getItem(key) === '1') return;
  localStorage.setItem(key, '1');
  runTransaction(ref(db, `reviews/${reviewId}/replies/${replyId}/likes`), v => (v || 0) + 1);
};

        // === Load Reviews (with ADMIN badge on replies) ===
        function loadReviews() {
          const container = document.getElementById("reviewsContainer");
          const reviewsRef = ref(db, "reviews");
        
          onValue(reviewsRef, (snapshot) => {
            container.innerHTML = "";
            const data = snapshot.val();
            if (!data) return;
        
            Object.entries(data)
              .reverse()
              .forEach(([id, review]) => {
                const isOwner = review.userId === userId || userId === ADMIN_ID;
                const replies = review.replies
  ? Object.entries(review.replies)
      .map(([rid, r]) => {
        const adminTag = r.isAdmin ? `<span class="badge-admin">[ADMIN]</span>` : "";
        const canDelete = (r.userId && (r.userId === userId || userId === ADMIN_ID));
        const likeCount = r.likes || 0;
        return `
          <div class="reply-box">↪️ ${adminTag} ${r.text}
            <span class="reply-actions" style="margin-left:8px;">
              <button class="reply-like-btn" onclick="likeReply('${id}','${rid}')">👍</button>
              <span class="reply-like-count" style="font-weight:800;">${likeCount}</span>
              ${canDelete ? `<button class="reply-del-btn" onclick="deleteReply('${id}','${rid}')">🗑️</button>` : ``}
            </span>
          </div>
        `;
      })
      .join("")
  : "";

        
                container.innerHTML += `
                  <div class="review-box">
                    <div>
                      <strong>${review.name || "Anonymous"}</strong>
                      <small style="color: gray; margin-left: 10px;">${new Date(
                        review.timestamp
                      ).toLocaleString()}</small>
                      <div>⭐ ${review.rating || "No rating"}</div>
                    </div>
                    <div class="review-comment">${review.comment}</div>
                    <div>
                      <button onclick="voteReview('${id}', 'like')">👍 ${review.likes || 0}</button>
                      <button onclick="voteReview('${id}', 'dislike')">👎 ${review.dislikes || 0}</button>
                      <input type="text" placeholder="Reply..." id="reply-${id}" style="width: 80%;" />
                      <button onclick="submitReply('${id}')">Reply</button>
                      ${isOwner ? `<button onclick="deleteReview('${id}')">🗑️ Delete</button>` : ""}
                    </div>
                    ${replies}
                  </div>
                `;
              });
          });
        }
        window.loadReviews = loadReviews;
        
        // === Like/Dislike ===
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
        
        // === Visit Counter ===
        function updateVisitStats() {
          const totalRef = ref(db, "siteStats/totalVisits");
          const userRef = ref(db, "siteStats/activeUsers/" + userId);
          runTransaction(totalRef, (n) => (n || 0) + 1);
          set(userRef, Date.now());
        }
        
        // === On Load ===
        document.addEventListener("DOMContentLoaded", () => {
          loadReviews();
          updateVisitStats();
        });