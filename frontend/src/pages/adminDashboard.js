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
            <button id="create-user-btn">Create New User</button>
            <div id="create-user-form" style="display: none;">
                <h3>Create New User</h3>
                <input type="text" id="new-username" placeholder="Username">
                <input type="password" id="new-password" placeholder="Password">
                <select id="new-role">
                    <option value="guest">Guest</option>
                    <option value="logged">Logged</option>
                    <option value="admin">Admin</option>
                </select>
                <button id="submit-user-btn">Create User</button>
            </div>
        </div>
    `;

    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/login');
    });

    document.getElementById('create-user-btn').addEventListener('click', () => {
        const form = document.getElementById('create-user-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('submit-user-btn').addEventListener('click', async () => {
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value.trim();
        const role = document.getElementById('new-role').value;
    
        if (!username || !password) {
            alert('Username and password are required.');
            return;
        }
    
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': localStorage.getItem('role'),
                    'x-user-name': localStorage.getItem('username'),
                },
                body: JSON.stringify({ username, password, role }),
            });
    
            if (response.ok) {
                alert('User created successfully');
                document.getElementById('create-user-form').style.display = 'none';
                fetchAndDisplayUsers(); // Refresh the table
            } else {
                const error = await response.json();
                alert(`Failed to create user: ${error.error}`);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user');
        }
    });    

    await fetchAndDisplayUsers();
}

async function fetchAndDisplayUsers() {
    try {
        const username = localStorage.getItem('username'); // get username from localStorage
        const role = localStorage.getItem('role'); // get role from localStorage

        const response = await fetch('/api/users', {
            method: 'GET',
            headers: {
                'x-user-role': role,
                'x-user-name': username,
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
                    <button class="update-username-btn" data-id="${user._id}">Update Username</button>
                    <button class="delete-user-btn" data-id="${user._id}">Delete</button>
                </td>
            </tr>
        `).join('');

        attachRoleChangeListeners();
        attachUpdateUsernameListeners();
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
                        'x-user-role': localStorage.getItem('role'),
                        'x-user-name': localStorage.getItem('username'),
                    },
                    body: JSON.stringify({ role: newRole }),
                });

                if (response.ok) {
                    alert('Role updated successfully');
                    fetchAndDisplayUsers(); // refresh the table
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

function attachUpdateUsernameListeners() {
    document.querySelectorAll('.update-username-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.dataset.id;
            const newUsername = prompt('Enter the new username:');

            if (!newUsername) {
                alert('Username cannot be empty.');
                return;
            }

            try {
                const response = await fetch(`/api/users/update-login/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-role': localStorage.getItem('role'),
                        'x-user-name': localStorage.getItem('username'),
                    },
                    body: JSON.stringify({ newUsername }),
                });

                if (response.ok) {
                    alert('Username updated successfully');
                    fetchAndDisplayUsers(); // refresh the table
                } else {
                    const error = await response.json();
                    alert(`Failed to update username: ${error.error}`);
                }
            } catch (error) {
                console.error('Error updating username:', error);
                alert('Failed to update username');
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
