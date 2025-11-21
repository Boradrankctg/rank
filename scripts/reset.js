    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
    import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

    const authConfig = {
      apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
      authDomain: "loginforme-f4886.firebaseapp.com",
      projectId: "loginforme-f4886",
      appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
    };

    const app = initializeApp(authConfig);
    const auth = getAuth(app);

    document.getElementById('sendResetBtn').addEventListener('click', async () => {
      const email = (document.getElementById('resetEmail').value || '').trim();

      if (!email) {
        alert('Please enter your email');
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email, {
          url: 'https://boradrankctg.github.io/rank/reset-password.html',
          handleCodeInApp: false
        });

        alert('Password reset email sent. Please check your inbox.');
      } catch (e) {
        console.error(e);

        if (e.code === 'auth/user-not-found') {
          alert('No account exists with this email.');
        } else if (e.code === 'auth/invalid-email') {
          alert('Invalid email format.');
        } else {
          alert('Failed to send reset email. Try again later.');
        }
      }
    });