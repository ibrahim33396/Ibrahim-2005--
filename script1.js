// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
  
  import { getdatabase } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";
  
  
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA3dl0YqJ6BBa1tvlh-II53PToV5PquzXY",
    authDomain: "ibrahim-734bc.firebaseapp.com",
    databaseURL: "https://ibrahim-734bc-default-rtdb.firebaseio.com",
    projectId: "ibrahim-734bc",
    storageBucket: "ibrahim-734bc.firebasestorage.app",
    messagingSenderId: "55862834040",
    appId: "1:55862834040:web:9b3bb1d98b3b3809510e8d",
    measurementId: "G-SFL7TX4KQX"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const database = getdatabase(app);
  const analytics = getAnalytics(app);

  export { database };