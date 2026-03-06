// =======================
// CONFIG
// =======================
const API_BASE = "http://127.0.0.1:8000";

// =======================
// TOKEN HANDLING
// =======================
function getToken() {
    return localStorage.getItem("token");
}

if (!getToken()) {
    window.location.href = "login.html";
}

// =======================
// AUTH HEADERS
// =======================
function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

// =======================
// GENERIC API CALL
// =======================
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            headers: authHeaders(),
            ...options
        });

        if (response.status === 401) {
            logout();
            return;
        }

        return await response.json();

    } catch (error) {
        console.error("API Error:", error);
    }
}

// =======================
// USER DATA
// =======================
let userData = {};

async function loadUser() {
    const data = await apiCall("/profile/me");

    if (!data) return;

    userData = data;
    updateUserStats();
}

function updateUserStats() {

    document.getElementById("userLevel").textContent =
        userData.level || 1;

    const percent = userData.max_xp
        ? Math.round((userData.xp / userData.max_xp) * 100)
        : 0;

    document.getElementById("xpFill").style.width =
        percent + "%";

    // DAILY XP BAR
    if (document.getElementById("dailyXPBar")) {
        const dailyPercent = Math.min(
            (userData.daily_xp / 1000) * 100,
            100
        );

        document.getElementById("dailyXPBar").style.width =
            dailyPercent + "%";
    }

    // 🔥 STREAK DISPLAY
    if (document.getElementById("streakValue")) {
        document.getElementById("streakValue").textContent =
            userData.streak + " Days";
    }

    // Profile XP
    if (document.getElementById("profileXP")) {
        document.getElementById("profileXP").textContent =
            userData.xp;

        document.getElementById("profileMaxXP").textContent =
            userData.max_xp;

        document.getElementById("profileXPBar").style.width =
            percent + "%";
    }

    if (userData.is_vip) {
        showNotification("VIP Active 💎", "💎");
    }
}

async function addXP(amount) {

    const data = await apiCall(`/profile/add-xp?amount=${amount}`, {
        method: "POST"
    });

    if (!data) return;

    userData = data.user;
    updateUserStats();

    if (data.badges && data.badges.length > 0) {
        data.badges.forEach(b =>
            showNotification("New Badge: " + b, "🏆")
        );
    }
}

// =======================
// COURSES
// =======================
let courses = [];

async function loadCourses() {
    const data = await apiCall("/course/");

    if (!data) return;

    courses = data;

    renderCourses("dashboardCoursesGrid", courses.slice(0, 6));
    renderCourses("allCoursesGrid", courses);
}

// =======================
// ADD XP
// =======================
async function addXP(amount) {
    await apiCall(`/profile/add-xp?amount=${amount}`, {
        method: "POST"
    });

    await loadUser();
}

// =======================
// LEADERBOARD
// =======================
async function renderLeaderboard() {
    const leaderboardData = await apiCall("/leaderboard/");

    if (!leaderboardData) return;

    const list = document.getElementById("leaderboardList");

    list.innerHTML = leaderboardData
        .map((p, i) => `
            <li class="leaderboard-item">
                <div class="rank">#${i + 1}</div>
                <div>${p.name}</div>
                <div class="player-xp">${p.xp} XP</div>
            </li>
        `)
        .join("");
}

// =======================
// VIP SUBSCRIPTION
// =======================
async function subscribeVIP() {
    const data = await apiCall(
        "/payment/subscribe?payment_method=UPI",
        { method: "POST" }
    );

    if (data) {
        alert(data.message || "Subscription successful!");
    }
}

// =======================
// LOGOUT
// =======================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// =======================
// INITIAL LOAD
// =======================
async function initApp() {
    await loadUser();
    await loadCourses();
    await renderLeaderboard();
}

initApp();