import { navigateTo } from '../router.js';

export function loadLoginPage() {
    const app = document.getElementById('app');

    app.innerHTML=`
        <div class="login-container">
            <button id="return-btn">Return</button>
            <h2>Login</h2>
            <form id="loginForm">
                <input type="text" id="username" placeholder="Username" required autocomplete="username">
                <input type="password" id="password" placeholder="Password" required autocomplete="current-password">
                <button type="submit">Login</button>
            </form>
            <p id="signup-link">Don't have an account? <a href="#" id="goToRegister">Sign up here</a>.</p>        
        </div>
    `;

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
                console.log("Username saved to localStorage:", data.username);

                alert(data.message); // display login success message

                navigateTo(`/waiting-room`, { playerName: username }); // Pass roomId as a parameter
            } else {
                alert(data.message); // show error message
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Something went wrong during login.");
        }
    });

}
