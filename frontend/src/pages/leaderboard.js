import { navigateTo } from '../router.js';

export async function loadLeaderboardPage() {
    const app = document.getElementById('app');

    app.innerHTML=`
        <div class="leaderboard-container">
            <button id="return-btn">Return</button>
            <h2>Leaderboard</h2>
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

    // fetch leaderboard data and display it
    fetchLeaderboardData();
}

async function fetchLeaderboardData() {
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        const tableBody = document.querySelector('#leaderboard-table tbody');
        tableBody.innerHTML = data.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.playerName}</td>
                <td>${entry.time}</td>
                <td>${new Date(entry.date).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }
}