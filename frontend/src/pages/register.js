import { navigateTo } from '../router.js';

export function loadRegisterPage() {
    const app = document.getElementById('app');

    app.innerHTML=`
        <div class="register-container">
            <button id="return-btn">Return</button>
            <h2>Sign Up</h2>
            <form id="registerForm">
                <input type="text" id="newUsername" placeholder="Username" required autocomplete="username">
                <input type="password" id="newPassword" placeholder="Password" required autocomplete="new-password">
                <button type="submit">Sign Up</button>
            </form>
            <p id="login-link">Already have an account? <a href="#" id="goToLogin">Login here</a>.</p>
        </div>
    `
    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/login');
    });

    // redirect to login
    document.getElementById('goToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        import('./login.js').then(({ loadLoginPage }) => {
            loadLoginPage();
        });
    });
    
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault(); // prevent the default form submission
        console.log("Register button clicked");
    
        const username = document.getElementById("newUsername").value.trim();
        const password = document.getElementById("newPassword").value.trim();
        console.log(username, password); 
    
        try {
            const response = await fetch("http://localhost:3001/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
    
            if (response.ok) {
                alert("Registration successful! Please log in.");
                import('./login.js').then(({ loadLoginPage }) => {
                    loadLoginPage();
                }); // Redirect to login
            } else {
                const error = await response.json();
                alert(error.message || "Registration failed. Try again.");
            }
        } catch (err) {
            console.error("Registration error:", err);
            alert("An error occurred. Please try again.");
        }
    });
}