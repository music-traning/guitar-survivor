import './style.css';

// HTML Landing Page Logic
const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
<div id="landing-page" style="
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: #000; display: flex; flex-direction: column;
  justify-content: center; align-items: center; z-index: 10000;
  font-family: 'Orbitron', sans-serif;
">
  <h1 style="
    font-size: 64px; color: #00f3ff; text-align: center;
    text-shadow: 0 0 20px #00f3ff, 4px 4px 0px #bc13fe;
    margin-bottom: 40px; line-height: 1.2;
  ">GUITAR<br>SURVIVOR</h1>
  
  <p style="color: #fff; margin-bottom: 40px; font-size: 18px;">Web Audio High Performance Game</p>

  <button id="start-btn" style="
    background: transparent; border: 2px solid #00f3ff;
    color: #fff; padding: 15px 50px; font-size: 24px;
    font-family: 'Orbitron', sans-serif; cursor: pointer;
    box-shadow: 0 0 15px #00f3ff; transition: all 0.2s;
    text-transform: uppercase; letter-spacing: 2px;
  ">Click to Load</button>

  <p style="
    margin-top: 20px; font-size: 12px; color: #666;
  ">High-End Device Recommended</p>
</div>
`;

// Button Interaction
const btn = document.getElementById('start-btn');
if (btn) {
    btn.addEventListener('mouseover', () => {
        btn.style.backgroundColor = '#00f3ff';
        btn.style.color = '#000';
    });
    btn.addEventListener('mouseout', () => {
        btn.style.background = 'transparent';
        btn.style.color = '#fff';
    });
    btn.addEventListener('click', async () => {
        btn.textContent = "LOADING...";
        btn.style.pointerEvents = 'none';

        // Remove loading text, let the game handle it or keep it until game canvas appears?
        // We will just clear innerHTML right before game load or let game replace it.
        // Phaser appends canvas. We should clear the landing page.

        // Dynamic Import the heavy game bundle
        try {
            await import('./game');
            // The game.ts will initialize Phaser, which appends canvas to #app.
            // We should remove the landing page *after* a slight delay or let Phaser cover it?
            // Phaser defaults to 'parent: app'.
            // Let's remove the landing page now.
            const landing = document.getElementById('landing-page');
            if (landing) landing.remove();
        } catch (e) {
            console.error("Failed to load game:", e);
            btn.textContent = "ERROR RELOAD";
            btn.style.pointerEvents = 'auto';
        }
    });
}
