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
            <div class="table-container">
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
            <button id="delete-all-btn" disabled>Delete All</button>            
        </div>
    `;
    
    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/'); // navigate back to home
    });

    // -- search by pattern --
    document.getElementById('search-btn').addEventListener('click', () => {
        const query = document.getElementById('search-input').value.trim();
        fetchLeaderboardData(role, query);
    });
    
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = document.getElementById('search-input').value.trim();
            fetchLeaderboardData(role, query);
        }
    });

    document.getElementById('delete-all-btn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all leaderboard entries?')) {
            try {
                await deleteAllLeaderboardEntries();
                alert('All entries deleted successfully');
                fetchLeaderboardData(role, ''); // refresh the leaderboard
            } catch (error) {
                alert('Failed to delete all entries');
            }
        }
    });    

    const role = localStorage.getItem('role');
    if (role === 'admin') {
        document.getElementById('delete-all-btn').disabled = false;
    }

    // fetch leaderboard data and display it
    fetchLeaderboardData(role, '');
}

async function fetchLeaderboardData(role, query = '') {
    try {
        const url = query
                ? `/api/leaderboard/search?query=${encodeURIComponent(query)}`
                : '/api/leaderboard';
        const response = await fetch(url);
        const data = await response.json();

        const tableBody = document.querySelector('#leaderboard-table tbody');
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">No results found</td></tr>`;
        } else {
            tableBody.innerHTML = data.map((entry, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${entry.playerName}</td>
                    <td><span class="editable-time" data-id="${entry._id}">${entry.time}</span></td>
                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                    <td class="actions">
                        <button class="edit-btn" ${role !== 'admin' ? 'disabled' : ''} data-id="${entry._id}">Edit</button>
                        <button class="delete-btn" ${role !== 'admin' ? 'disabled' : ''} data-id="${entry._id}">Delete</button>
                    </td>
                </tr>
             `).join('');
        }

        if (role === 'admin') {
            attachActionListeners(role); // event listeners to buttons
        }
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }
}

// attach event listeners to edit and delete buttons
function attachActionListeners(role) {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const timeElement = document.querySelector(`.editable-time[data-id="${id}"]`);
            const newTime = prompt('Enter the new time (seconds):', timeElement.textContent);

            if (newTime && !isNaN(newTime)) {
                updateLeaderboardEntry(id, parseFloat(newTime))
                    .then(() => {
                        alert('Entry updated successfully');
                        fetchLeaderboardData(role, ''); // refresh the leaderboard
                    })
                    .catch(() => alert('Failed to update entry'));
            } else {
                alert('Invalid time entered. Please enter a number.');
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const id = button.dataset.id;
            if (confirm('Are you sure you want to delete this entry?')) {
                try {
                    await deleteLeaderboardEntry(id);
                    alert('Entry deleted successfully');
                    fetchLeaderboardData(role, ''); // refresh the table
                } catch (error) {
                    alert('Failed to delete entry');
                }
            }
        });
    });
}

async function updateLeaderboardEntry(id, newTime) {
    try {
        const response = await fetch(`/api/leaderboard/${id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-role': localStorage.getItem('role'),
            },
            body: JSON.stringify({ time: newTime }),
        });

        if (!response.ok) throw new Error('Failed to update leaderboard entry');
        return await response.json();
    } catch (error) {
        console.error('Error updating leaderboard entry:', error);
        throw error;
    }
}

async function deleteLeaderboardEntry(id) {
    try {
        const response = await fetch(`/api/leaderboard/${id}`, { 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': localStorage.getItem('role'),
            },
        });

        if (!response.ok) throw new Error('Failed to delete leaderboard entry');
        return response.json();
    } catch (error) {
        console.error('Error deleting leaderboard entry:', error);
        throw error;
    }
}

async function deleteAllLeaderboardEntries() {
    try {
        const response = await fetch(`/api/leaderboard`, { 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': localStorage.getItem('role'),
            },
        });

        if (!response.ok) throw new Error('Failed to delete all leaderboard entries');
        return await response.json();
    } catch (error) {
        console.error('Error deleting all leaderboard entries:', error);
        throw error;
    }
}
