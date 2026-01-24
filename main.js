/* REALISTIC TERMINAL INTRO - FULL SCRIPT */
const terminalLoader = document.getElementById('terminalLoader');
const mainContent = document.querySelector('main');

// Full terminal script as requested
const terminalScript = [
  {text: "swat@void:~$ whoami", delay: 50, type: true},
  {text: "swat", delay: 50, type: false, isResponse: true},
  {text: "swat@void:~$ uname -a", delay: 50, type: true},
  {text: "Linux void 6.5.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09) x86_64 GNU/Linux", delay: 50, type: false, isResponse: true},
  {text: "swat@void:~$ cat /proc/version", delay: 50, type: true},
  {text: "Linux version 6.5.0-kali1-amd64 (devel@kali.org) (gcc (Debian 12.2.0-14) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09)", delay: 50, type: false, isResponse: true},
  {text: "swat@void:~$ systemctl --user status portfolio", delay: 50, type: true},
  {text: "● portfolio.service - swat Portfolio", delay: 50, type: false, isResponse: true, multiline: true},
  {text: "     Loaded: loaded (/home/swat/.config/systemd/user/portfolio.service; enabled; preset: enabled)", delay: 50, type: false, isResponse: true, multiline: true},
  {text: "     Active: active (running) since Fri 2024-01-05 00:00:00 UTC; 2s ago", delay: 50, type: false, isResponse: true, multiline: true},
  {text: "   Main PID: 1337 (portfolio)", delay: 50, type: false, isResponse: true, multiline: true},
  {text: "        CPU: 45ms", delay: 50, type: false, isResponse: true, multiline: true},
  {text: "     Memory: 8.2M", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "swat@void:~$ echo \"System ready.\"", delay: 50, type: true},
  {text: "System ready.", delay: 50, type: false, isResponse: true},
  {text: "swat@void:~$ ", delay: 50, type: true, final: true}
];

async function runTerminalScript() {
  const terminalBody = document.querySelector('.terminal-body');
  
  // Clear only the static HTML lines, keep the container
  while (terminalBody.firstChild) {
    terminalBody.removeChild(terminalBody.firstChild);
  }
  
  // Add initial empty line
  const initialLine = document.createElement('div');
  initialLine.className = 'terminal-line';
  initialLine.textContent = ' ';
  initialLine.style.opacity = '1';
  terminalBody.appendChild(initialLine);
  
  // Wait a moment before starting
  await delay(500);
  
  for (const line of terminalScript) {
    const lineElement = document.createElement('div');
    lineElement.className = 'terminal-line';
    if (line.isResponse) {
      lineElement.classList.add('response');
    }
    
    terminalBody.appendChild(lineElement);
    
    if (line.multiline) {
      lineElement.style.whiteSpace = 'pre';
      lineElement.style.fontFamily = 'Consolas, Monaco, Courier New, monospace';
    }
    
    if (line.type) {
      // Type out the command
      await typeText(lineElement, line.text, 60);
      lineElement.style.opacity = '1';
    } else {
      // Show response instantly
      lineElement.textContent = line.text;
      lineElement.style.opacity = '1';
    }
    
    // Scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
    
    // Delay before next line
    await delay(line.delay);
  }
  
  // Add blinking cursor to last line
  const lastLine = terminalBody.lastChild;
  const cursor = document.createElement('span');
  cursor.className = 'blink';
  cursor.textContent = '█';
  lastLine.appendChild(cursor);
  
  // Wait 2 seconds with blinking cursor, then fade out
  await delay(2000);
  
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
    element.textContent = '';
    
    function typeChar() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
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
  mainContent.style.transition = 'opacity 1s ease';
  
  setTimeout(() => {
    mainContent.style.opacity = '1';
    startAudioSystem();
    startParticles();
  }, 300);
}

// Start terminal immediately
runTerminalScript();

/* AUDIO SYSTEM */
let audioStarted = false;
let audioContext;
let analyser;
let dataArray;

function startAudioSystem() {
  if (audioStarted) return;
  
  const audio = document.getElementById('audio');
  
  // Create audio context
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();
  
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256;
  
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  
  // Setup visualizer
  const visualizer = document.getElementById('visualizer');
  const ctx = visualizer.getContext('2d');
  
  function resizeVisualizer() {
    visualizer.width = visualizer.clientWidth;
    visualizer.height = visualizer.clientHeight;
  }
  
  resizeVisualizer();
  window.addEventListener('resize', resizeVisualizer);
  
  // Draw visualizer
  function drawVisualizer() {
    if (!audioStarted) return;
    
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, visualizer.width, visualizer.height);
    
    const barCount = 64;
    const barWidth = visualizer.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const barIndex = Math.floor(i * bufferLength / barCount);
      const barHeight = (dataArray[barIndex] / 255) * visualizer.height;
      const y = visualizer.height - barHeight;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, visualizer.height);
      const hue = 270 + (dataArray[barIndex] / 255) * 30;
      gradient.addColorStop(0, `hsl(${hue}, 100%, 70%)`);
      gradient.addColorStop(1, `hsl(${hue}, 100%, 30%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, y, barWidth - 1, barHeight);
    }
    
    // Update accent colors based on audio
    const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
    const hue = 270 + (avg / 10);
    const lightness = 50 + (avg / 15);
    
    document.documentElement.style.setProperty('--accent', `hsl(${hue}, 100%, ${lightness}%)`);
    document.documentElement.style.setProperty('--accent-glow', `hsla(${hue}, 100%, ${lightness}%, 0.6)`);
  }
  
  // Start audio
  function startAudio() {
    audioStarted = true;
    
    // Resume audio context
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Try to play audio
    audio.volume = 0.7;
    audio.play().then(() => {
      console.log('Audio playing successfully');
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

/* PARTICLES */
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
  
  const particles = Array.from({ length: 100 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.2,
    dy: (Math.random() - 0.5) * 0.2,
    color: `hsla(${Math.random() * 60 + 250}, 100%, 70%, 0.6)`
  }));
  
  function animate() {
    ctx.clearRect(0, 0, w, h);
    
    // Draw particles
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      
      if (p.x < 0 || p.x > w) p.dx *= -1;
      if (p.y < 0 || p.y > h) p.dy *= -1;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
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
document.querySelectorAll('a, button, .skill-item, .link-btn').forEach(el => {
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
    
    // Try to play again
    setTimeout(() => {
      if (audioStarted) {
        audio.play().catch(e => console.log('Fallback audio error:', e));
      }
    }, 1000);
  }
});

/* GLITCH EFFECT */
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
