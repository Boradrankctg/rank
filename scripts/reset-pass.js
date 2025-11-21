  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
    import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

    const authConfig = {
      apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
      authDomain: "loginforme-f4886.firebaseapp.com",
      projectId: "loginforme-f4886",
      appId: "1:634439962888:web:72b9c573e76c8719f9dcbd"
    };

    const app = initializeApp(authConfig);
    const auth = getAuth(app);

    // Read oobCode from URL silently
    const params = new URLSearchParams(location.search);
    const oobCode = params.get("oobCode");

    if (!oobCode) {
      alert("Invalid reset link. Please request a new one.");
      window.location.href = "reset.html";
    }

    document.getElementById("setBtn").addEventListener("click", async () => {
      const newPass = document.getElementById("newPass").value.trim();
      const confirmPass = document.getElementById("confirmPass").value.trim();

      if (!newPass || !confirmPass) {
        alert("Please fill both password fields.");
        return;
      }

      if (newPass.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }

      if (newPass !== confirmPass) {
        alert("Passwords do not match.");
        return;
      }

      try {
        // Validate the code first
        await verifyPasswordResetCode(auth, oobCode);

        // Update password
        await confirmPasswordReset(auth, oobCode, newPass);

        alert("Password updated successfully. Please login.");
        window.location.href = "login.html";

      } catch (e) {
        console.error(e);
        alert("Invalid or expired reset link. Please request a new one.");
      }
    });