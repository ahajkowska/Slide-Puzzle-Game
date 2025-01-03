import { navigateTo } from '../router.js';

export function loadLoginPage() {
    const app = document.getElementById('app');

    app.innerHTML=`
        <button id="admin-dashboard" disabled>Change Roles</button>
        <div class="login-container">
            <button id="return-btn">Return</button>
            <button id="logout-btn" style="display: none;">Logout</button>
            <h2>Login</h2>
            <form id="loginForm">
                <input type="text" id="username" placeholder="Username" required autocomplete="username">
                <input type="password" id="password" placeholder="Password" required autocomplete="current-password">
                <button type="submit">Login</button>
            </form>
            <p id="signup-link">Don't have an account? <a href="#" id="goToRegister">Sign up here</a>.</p>        
        </div>
    `;

    // Check if the user is an admin and enable the button
    const adminDashboardButton = document.getElementById('admin-dashboard');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const logoutButton = document.getElementById('logout-btn');

    if (role && username) {
        // User is logged in
        logoutButton.style.display = 'inline-block'; // show the logout button
        if (role === 'admin') {
            adminDashboardButton.disabled = false; // enable button if admin
        }
    }

    document.getElementById('admin-dashboard').addEventListener('click', () => {
        navigateTo('/admin');
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        alert('You have been logged out.');
        navigateTo('/');
    });

    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/'); // navigate back to home
    });
    
    // redirect to register
    document.getElementById('goToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        import('./register.js').then(({ loadRegisterPage }) => {
            loadRegisterPage();
        });
    });

    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:3001/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("username", username); // store the username
                localStorage.setItem("role", data.role); // Store role
                console.log("Username saved to localStorage:", data.username);
                console.log("Role saved to localStorage:", data.role);

                alert(data.message); // display login success message

                // Redirect based on role
                if (data.role === 'admin') {
                    navigateTo('/admin'); // Navigate admin to the dashboard
                } else {
                    navigateTo(`/waiting-room`, { playerName: username }); // Non-admin goes to the waiting room
                }
            } else {
                alert(data.message); // show error message
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong during login.");
        }
    });

}
