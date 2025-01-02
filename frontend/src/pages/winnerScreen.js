import { navigateTo } from '../router.js'; // Ensure you import your router

export function showWinnerScreen({ winner, time }) {
    console.log(`Displaying winner screen: ${winner}, ${time}`);

    // Remove any existing overlay to prevent duplicates
    const existingOverlay = document.querySelector('.win-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';

    overlay.innerHTML = `
        <div class="overlay-content" style="
            text-align: center;
            background: white;
            padding: 20px;
            border-radius: 10px;">
            <p>🎉 <strong>${winner}</strong> Wins!</p>
            <p>Time: ${time} seconds</p>
            <button id="back-home-btn">Back to Home</button>
        </div>
    `;

    // Append the overlay to the body
    document.body.appendChild(overlay);

    document.getElementById('back-home-btn').addEventListener('click', () => {
        overlay.remove(); // remove the overlay
        navigateTo('/'); // navigate back to home
    });
}
