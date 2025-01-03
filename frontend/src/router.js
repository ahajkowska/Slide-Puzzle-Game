import { loadHomePage } from './pages/homePage.js';
import { loadLoginPage } from './pages/login.js';
import { loadRegisterPage } from './pages/register.js';
import { loadWaitingRoomPage } from './pages/waitingRoom.js';
import { loadGamePage } from './pages/gamePage.js';
import { loadLeaderboardPage } from './pages/leaderboard.js';
import { loadAdminDashboard } from './pages/adminDashboard.js';

// SPA Router
const routes = {
    '/': loadHomePage,
    '/login': loadLoginPage,
    '/register': loadRegisterPage,
    '/waiting-room': loadWaitingRoomPage,
    '/game': loadGamePage,
    '/leaderboard': loadLeaderboardPage,
    '/admin': loadAdminDashboard,
};

// navigate to different pages
export function navigateTo(path, params = {}) {
    console.log(`Navigating to: ${path}`, params); // Debugging: Track navigation

    // update browser's history
    window.history.pushState({}, '', path);

    const pageLoader = routes[path];
    if (pageLoader) {
        document.getElementById('app').innerHTML = ''; // Clear existing content
        // pageLoader(params); // Pass params to the page loader
        routes[path](params);
    } else {
        console.error('Page not found:', path);
    }
}


function renderPage() {
    const path = window.location.pathname;
    const loadPage = routes[path] || routes['/'];
    loadPage();
}

// Ensure page renders on back/forward navigation
window.onpopstate = renderPage;

// Initial page load
document.addEventListener('DOMContentLoaded', renderPage);
