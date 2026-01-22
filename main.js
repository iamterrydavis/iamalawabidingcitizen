/* CLEAN TERMINAL INTRO */
const terminalLoader = document.getElementById('terminalLoader');
const mainContent = document.querySelector('main');

// Real terminal commands with proper responses
const terminalScript = [
  {text: "swat@void:~$ whoami", delay: 300, type: true},
  {text: "swat", delay: 400, type: false, isResponse: true},
  {text: "swat@void:~$ uname -a", delay: 300, type: true},
  {text: "Linux void 6.5.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09) x86_64 GNU/Linux", delay: 600, type: false, isResponse: true},
  {text: "swat@void:~$ cat /proc/version", delay: 300, type: true},
  {text: "Linux version 6.5.0-kali1-amd64 (devel@kali.org) (gcc (Debian 12.2.0-14) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09)", delay: 500, type: false, isResponse: true},
  {text: "swat@void:~$ systemctl --user status portfolio", delay: 300, type: true},
  {text: "● portfolio.service - swat Portfolio", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "     Loaded: loaded (/home/swat/.config/systemd/user/portfolio.service; enabled; preset: enabled)", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "     Active: active (running) since Fri 2024-01-05 00:00:00 UTC; 2s ago", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "   Main PID: 1337 (portfolio)", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "        CPU: 45ms", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "     Memory: 8.2M", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "swat@void:~$ echo \"System ready.\"", delay: 300, type: true},
  {text: "System ready.", delay: 300, type: false, isResponse: true},
  {text: "swat@void:~$ ", delay: 200, type: true, final: true}
];

async function runTerminalScript() {
  const terminalBody = document.querySelector('.terminal-body');
  terminalBody.innerHTML = '';
  
  // Add initial blank line
  const initialLine = document.createElement('div');
  initialLine.className = 'terminal-line';
  initialLine.textContent = ' ';
  initialLine.style.opacity = '1';
  terminalBody.appendChild(initialLine);
  
  for (const line of terminalScript) {
    const lineElement = document.createElement('div');
    lineElement.className = 'terminal-line';
    if (line.isResponse) {
      lineElement.classList.add('response');
    }
    
    terminalBody.appendChild(lineElement);
    
    if (line.multiline) {
      lineElement.style.whiteSpace = 'pre';
      lineElement.style.fontFamily = 'monospace';
      lineElement.style.fontSize = '15px';
    }
    
    if (line.type) {
      // Show command instantly (like real terminal)
      lineElement.textContent = line.text;
      lineElement.style.opacity = '1';
      
      // Small typing effect for the final command with cursor
      if (line.final) {
        lineElement.textContent = '';
        await typeText(lineElement, line.text, 60);
      }
    } else {
      // Show response with slight delay
      await delay(100);
      lineElement.textContent = line.text;
      lineElement.style.opacity = '1';
    }
    
    // Scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
    
    // Delay between commands
    await delay(line.delay);
  }
  
  // Add blinking cursor to last line
  const lastLine = terminalBody.lastChild;
  const cursor = document.createElement('span');
  cursor.className = 'blink';
  cursor.textContent = '█';
  lastLine.appendChild(cursor);
  
  // Wait a moment, then fade out
  await delay(800);
  
  // Smooth fade out
  terminalLoader.style.opacity = '0';
  terminalLoader.style.transition = 'opacity 0.8s ease';
  
  await delay(800);
  terminalLoader.style.display = 'none';
  
  // Show main content
  showMainContent();
}

function typeText(element, text, speed = 60) {
  return new Promise(resolve => {
    let i = 0;
    
    function typeChar() {
      if (i < text.length) {
        element.textContent = text.substring(0, i + 1);
        i++;
        setTimeout(typeChar, speed);
      } else {
        resolve();
      }
    }
    
    typeChar();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showMainContent() {
  mainContent.classList.remove('hidden');
  mainContent.style.opacity = '0';
  mainContent.style.transition = 'opacity 0.8s ease';
  
  setTimeout(() => {
    mainContent.style.opacity = '1';
    startAudioSystem();
    startParticles();
  }, 300);
}

// Start terminal immediately
runTerminalScript();

/* AUDIO SYSTEM - CLEAN AUTO PLAY */
let audioStarted = false;

function startAudioSystem() {
  if (audioStarted) return;
  
  const audio = document.getElementById('audio');
  
  // Setup visualizer
  const visualizer = document.getElementById('visualizer');
  const ctx = visualizer.getContext('2d');
  
  function resizeVisualizer() {
    visualizer.width = visualizer.clientWidth;
    visualizer.height = visualizer.clientHeight;
  }
  resizeVisualizer();
  window.addEventListener('resize', resizeVisualizer);
  
  // Simple visualizer bars
  function drawVisualizer() {
    if (!audioStarted) return;
    
    requestAnimationFrame(drawVisualizer);
    
    // Create simple bars (no audio analysis for simplicity)
    ctx.clearRect(0, 0, visualizer.width, visualizer.height);
    
    const barCount = 32;
    const barWidth = visualizer.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      // Random bar heights for visual effect
      const randomHeight = Math.sin(Date.now() / 500 + i * 0.3) * 0.5 + 0.5;
      const barHeight = randomHeight * visualizer.height;
      
      // Gradient from purple to pink
      const gradient = ctx.createLinearGradient(0, 0, 0, visualizer.height);
      gradient.addColorStop(0, '#b26cff');
      gradient.addColorStop(1, '#ff6cba');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, visualizer.height - barHeight, barWidth - 1, barHeight);
    }
  }
  
  // Start audio
  function startAudio() {
    audioStarted = true;
    
    // Try to play audio
    audio.volume = 0.5;
    audio.play().then(() => {
      console.log('Audio playing');
      drawVisualizer();
    }).catch(error => {
      console.log('Audio autoplay blocked');
      // Wait for user interaction
      const startOnClick = () => {
        audio.play();
        drawVisualizer();
        document.removeEventListener('click', startOnClick);
      };
      document.addEventListener('click', startOnClick);
    });
  }
  
  // Start audio after terminal
  setTimeout(startAudio, 500);
}

/* PARTICLES - SIMPLE */
function startParticles() {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  
  let w, h;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.2,
    dy: (Math.random() - 0.5) * 0.2,
    color: `hsla(${Math.random() * 60 + 250}, 100%, 70%, 0.6)`
  }));
  
  function animate() {
    ctx.clearRect(0, 0, w, h);
    
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      
      // Bounce off walls
      if (p.x < 0 || p.x > w) p.dx *= -1;
      if (p.y < 0 || p.y > h) p.dy *= -1;
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      
      // Subtle glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('0.6', '0.2');
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  animate();
}

/* CURSOR */
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

// Hover effects
document.querySelectorAll('a, button, .skill-item').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

/* THEME TOGGLE */
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
};

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
}

/* FALLBACK AUDIO */
const audio = document.getElementById('audio');
audio.addEventListener('error', () => {
  // Try fallback source
  const source = audio.querySelector('source');
  if (source && source.src.includes('/files/song.mp3')) {
    source.src = 'https://assets.codepen.io/1468070/synthwave-ambient.mp3';
    audio.load();
  }
});

/* GLITCH EFFECT - SUBTLE */
const glitchText = document.querySelector('.glitch');
setInterval(() => {
  if (Math.random() > 0.9) {
    glitchText.style.textShadow = `
      0 0 10px #b26cff,
      0 0 20px #b26cff,
      ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 #ff6cba
    `;
  } else {
    glitchText.style.textShadow = '0 0 20px rgba(178,108,255,0.6)';
  }
}, 200);
