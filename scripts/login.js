    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
    import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

    const authConfig = {
      apiKey: "AIzaSyAIsOwpONfGwTDFEbfdno8O3sm2G8GObiU",
      authDomain: "loginforme-f4886.firebaseapp.com",
      projectId: "loginforme-f4886",
      storageBucket: "loginforme-f4886.firebasestorage.app",
      messagingSenderId: "634439962888",
      appId: "1:634439962888:web:72b9c573e76c8719f9dcbd",
      measurementId: "G-VJVC929MK3"
    };

    const dbConfig = {
      apiKey: "AIzaSyBaKVrTWKeaUxa0EaiDBR8OGpGCAjxAcUA",
      authDomain: "boardrankctg.firebaseapp.com",
      databaseURL: "https://boardrankctg-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "boardrankctg",
      storageBucket: "boardrankctg.firebasestorage.app",
      messagingSenderId: "751761229963",
      appId: "1:751761229963:web:43f9dbf71feef6dc9cec8e"
    };

    // Initialize both apps
    const authApp = initializeApp(authConfig);
    const dbApp = initializeApp(dbConfig, "dbApp");
    
    const auth = getAuth(authApp);
    const db = getDatabase(dbApp);
    const googleProvider = new GoogleAuthProvider();

    // Show message function
    function showMessage(message, divId) {
      var messageDiv = document.getElementById(divId);
      messageDiv.style.display = "block";
      messageDiv.innerHTML = message;
      messageDiv.style.opacity = 1;
      
      if (message.includes('Successfully') || message.includes('successful')) {
        messageDiv.className = 'message-div success';
      } else {
        messageDiv.className = 'message-div error';
      }
      
      setTimeout(function() {
        messageDiv.style.opacity = 0;
        setTimeout(() => {
          messageDiv.style.display = 'none';
        }, 300);
      }, 5000);
    }

    // Tab switching
    document.getElementById('signInTabBtn').addEventListener('click', () => {
      document.getElementById('signInTabBtn').classList.add('active');
      document.getElementById('signUpTabBtn').classList.remove('active');
      document.getElementById('signInForm').style.display = 'block';
      document.getElementById('signUpForm').style.display = 'none';
    });

    document.getElementById('signUpTabBtn').addEventListener('click', () => {
      document.getElementById('signUpTabBtn').classList.add('active');
      document.getElementById('signInTabBtn').classList.remove('active');
      document.getElementById('signUpForm').style.display = 'block';
      document.getElementById('signInForm').style.display = 'none';
    });

    // Sign Up
    const signUp = document.getElementById('submitSignUp');
    signUp.addEventListener('click', (event) => {
      event.preventDefault();
      
      const email = document.getElementById('rEmail').value;
      const password = document.getElementById('rPassword').value;
      const confirmPassword = document.getElementById('rPasswordConfirm').value;
      const firstName = document.getElementById('fName').value;
      const lastName = document.getElementById('lName').value || '';

      if (!email || !password || !firstName) {
        showMessage('Please fill required fields', 'signUpMessage');
        return;
      }
      if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'signUpMessage');
        return;
      }
      if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'signUpMessage');
        return;
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          const userData = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            fullName: firstName + (lastName ? ' ' + lastName : ''),
            uid: user.uid,
            createdAt: Date.now()
          };
          
          showMessage('Account Created Successfully!', 'signUpMessage');
          
          // Save to database
          set(ref(db, 'users/' + user.uid), userData)
            .then(() => {
              localStorage.setItem('loggedInUserId', user.uid);
              localStorage.setItem('userLoggedIn', 'true');
              localStorage.setItem('userName', userData.fullName);
              localStorage.setItem('userEmail', email);
              
              setTimeout(() => {
                window.location.href = 'index.html';
              }, 1500);
            })
            .catch((error) => {
              console.error("Error writing user data:", error);
            });
        })
.catch((error) => {
  const code = error.code || '';
  if (code === 'auth/user-not-found') {
    showMessage('Email not found. Please check and try again.', 'signInMessage');
  } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    showMessage('Incorrect password. Please try again.', 'signInMessage');
  } else if (code === 'auth/too-many-requests') {
    showMessage('Too many attempts. Please try later.', 'signInMessage');
  } else {
    showMessage('Login failed. Please try again.', 'signInMessage');
  }
});

    });

    // Sign In
    const signIn = document.getElementById('submitSignIn');
    signIn.addEventListener('click', (event) => {
      event.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showMessage('Please enter email and password', 'signInMessage');
        return;
      }

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          showMessage('Login successful!', 'signInMessage');
          const user = userCredential.user;
          
          localStorage.setItem('loggedInUserId', user.uid);
          localStorage.setItem('userLoggedIn', 'true');
          localStorage.setItem('userEmail', email);
          
          // Get user data from database
          set(ref(db, 'users/' + user.uid + '/lastLogin'), Date.now());
          
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        })
        .catch((error) => {
          const errorCode = error.code;
          if (errorCode === 'auth/invalid-credential') {
            showMessage('Incorrect Email or Password', 'signInMessage');
          } else if (errorCode === 'auth/user-not-found') {
            showMessage('Account does not exist', 'signInMessage');
          } else {
            showMessage('Login failed. Please try again', 'signInMessage');
          }
        });
    });

    // Google Sign In
    document.getElementById('googleSignIn').addEventListener('click', (event) => {
      event.preventDefault();
      
      signInWithPopup(auth, googleProvider)
        .then((result) => {
          const user = result.user;
          
          // Save user data
          const userData = {
            email: user.email,
            fullName: user.displayName,
            photoURL: user.photoURL,
            uid: user.uid,
            provider: 'google',
            createdAt: Date.now()
          };
          
          set(ref(db, 'users/' + user.uid), userData).then(() => {
            localStorage.setItem('loggedInUserId', user.uid);
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', user.displayName);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userPhoto', user.photoURL || '');
            
            showMessage('Welcome!', 'signInMessage');
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 1000);
          });
        })
        .catch((error) => {
          showMessage('Google sign-in failed', 'signInMessage');
          console.error(error);
        });
    });
        // Password show/hide toggles
    document.querySelectorAll('.pw-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isPw = input.type === 'password';
        input.type = isPw ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye', isPw);
          icon.classList.toggle('fa-eye-slash', !isPw);
        }
      });
    });