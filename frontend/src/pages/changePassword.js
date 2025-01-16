export async function loadChangePasswordPage() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="change-password-container">
            <button id="return-btn">Return</button>
            <h2>Change Password</h2>
            <form id="change-password-form">
                <label for="old-password">Old Password:</label>
                <input type="password" id="old-password" name="oldPassword" required>
                <label for="new-password">New Password:</label>
                <input type="password" id="new-password" name="newPassword" required>
                <button type="submit">Change Password</button>
            </form>
            <div id="change-password-message"></div>
        </div>
    `;

    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/');
    });

    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = localStorage.getItem('username');
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;

        try {
            const response = await fetch(`/api/users/change-password/${username}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('change-password-message').textContent = result.message;
            } else {
                document.getElementById('change-password-message').textContent = result.error;
            }
        } catch (error) {
            console.error('Error changing password:', error);
            document.getElementById('change-password-message').textContent = 'Failed to change password.';
        }
    });
}
