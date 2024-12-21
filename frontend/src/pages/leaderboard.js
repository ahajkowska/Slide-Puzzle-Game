import { navigateTo } from '../router.js';

export async function loadLeaderboardPage() {
    const app = document.getElementById('app');

    app.innerHTML=`
        <div class="leaderboard-container">
            <button id="return-btn">Return</button>
            <h2>Leaderboard</h2>
            <div class="search-container">
                <input type="text" id="search-input" placeholder="Search by player name">
                <button id="search-btn">Search</button>
            </div>
            <table id="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Time (seconds)</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- data will be here -->
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/'); // navigate back to home
    });

    // -- search by pattern --

    document.getElementById('search-btn').addEventListener('click', () => {
        const query = document.getElementById('search-input').value.trim();
        fetchLeaderboardData(query);
    });
    // document.getElementById('search-btn').addEventListener('keypress', (e) => {
    //     if (e.key === 'Enter') {
    //         const query = document.getElementById('search-input').value.trim();
    //         fetchLeaderboardData(query);
    //     }
    // });

    // fetch leaderboard data and display it
    fetchLeaderboardData();
}

async function fetchLeaderboardData(query = '') {
    try {
        const url = query
                ? `/api/leaderboard/search?query=${encodeURIComponent(query)}`
                : '/api/leaderboard';
        const response = await fetch(url);
        const data = await response.json();

        const tableBody = document.querySelector('#leaderboard-table tbody');
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">No results found</td></tr>`;
        } else {
            tableBody.innerHTML = data.map((entry, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.playerName}</td>
                    <td>${entry.time}</td>
                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }
}