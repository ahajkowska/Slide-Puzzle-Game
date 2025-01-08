import { navigateTo } from '../router.js';

export async function loadAdminDashboard() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <button id="return-btn">Return</button>
        <div class="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <table id="users-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- User data will be populated here -->
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/login');
    });

    await fetchAndDisplayUsers();
}

async function fetchAndDisplayUsers() {
    try {
        const username = localStorage.getItem('username'); // Get username from localStorage
        const role = localStorage.getItem('role'); // Get role from localStorage

        const response = await fetch('/api/users', {
            method: 'GET',
            headers: {
                'x-user-role': role, // Upewnij się, że wysyłasz rolę admina
                'x-user-name': username, // Opcjonalnie dodaj nazwę użytkownika
            },
        });

        const users = await response.json();
        console.log('Fetched users:', users);

        const tableBody = document.querySelector('#users-table tbody');
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>
                    <select class="role-select" data-id="${user._id}">
                        <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>Guest</option>
                        <option value="logged" ${user.role === 'logged' ? 'selected' : ''}>Logged</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <button class="update-role-btn" data-id="${user._id}">Update</button>
                    <button class="delete-user-btn" data-id="${user._id}">Delete</button>
                </td>
            </tr>
        `).join('');

        attachRoleChangeListeners();
        attachDeleteListeners();
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

function attachRoleChangeListeners() {
    document.querySelectorAll('.update-role-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.dataset.id;
            const select = document.querySelector(`.role-select[data-id="${userId}"]`);
            const newRole = select.value;

            try {
                const response = await fetch(`/api/users/role/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-role': localStorage.getItem('role'), // Include logged-in user's role
                        'x-user-name': localStorage.getItem('username'), // Include logged-in username
                    },
                    body: JSON.stringify({ role: newRole }),
                });

                if (response.ok) {
                    alert('Role updated successfully');
                    fetchAndDisplayUsers(); // Refresh the table
                } else {
                    const error = await response.json();
                    alert(`Failed to update role: ${error.error}`);
                }
            } catch (error) {
                console.error('Error updating role:', error);
                alert('Failed to update role');
            }
        });
    });
}


function attachDeleteListeners() {
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.dataset.id;

            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'x-user-role': localStorage.getItem('role'),
                        'x-user-name': localStorage.getItem('username'),
                    },
                });

                if (response.ok) {
                    alert('User deleted successfully');
                    fetchAndDisplayUsers(); // refresh the table
                } else {
                    const error = await response.json();
                    alert(`Failed to delete user: ${error.error}`);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user');
            }
        });
    });
}
