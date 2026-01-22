/* REALISTIC TERMINAL INTRO */
const terminalLoader = document.getElementById('terminalLoader');
const mainContent = document.querySelector('main');
const terminalBody = document.querySelector('.terminal-body');
let terminalAnimationComplete = false;

// Terminal commands with realistic timing
const terminalScript = [
  {text: "swat@void:~$ whoami", delay: 300, type: true},
  {text: "swat", delay: 100, type: false, isResponse: true},
  {text: "swat@void:~$ uname -a", delay: 800, type: true},
  {text: "Linux void 6.5.0-kali1 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09) x86_64 GNU/Linux", delay: 100, type: false, isResponse: true},
  {text: "swat@void:~$ cat /proc/version", delay: 800, type: true},
  {text: "Linux version 6.5.0-kali1 (kali@kali) (gcc (Debrian 12.2.0-14) 12.2.0, GNU ld (GNU Binutils for Kali) 2.40) #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09)", delay: 100, type: false, isResponse: true},
  {text: "swat@void:~$ ls -la ~/projects", delay: 800, type: true},
  {text: "total 48\ndrwxr-xr-x 12 swat swat 4096 Dec 15 09:30 .\ndrwxr-xr-x 18 swat swat 4096 Dec 15 09:30 ..\ndrwxr-xr-x  6 swat swat 4096 Dec 15 09:30 web-dev\ndrwxr-xr-x  7 swat swat 4096 Dec 15 09:30 security-tools\ndrwxr-xr-x  8 swat swat 4096 Dec 15 09:30 game-dev\ndrwxr-xr-x  5 swat swat 4096 Dec 15 09:30 ai-ml\ndrwxr-xr-x  6 swat swat 4096 Dec 15 09:30 reverse-engineering", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "swat@void:~$ systemctl status portfolio", delay: 800, type: true},
  {text: "● portfolio.service - swat portfolio\n     Loaded: loaded (/etc/systemd/system/portfolio.service; enabled; preset: enabled)\n     Active: active (running) since Thu 2024-12-15 09:30:00 UTC; 2s ago\n   Main PID: 1337 (portfolio)\n      Tasks: 5 (limit: 18827)\n     Memory: 45.7M\n        CPU: 412ms\n     CGroup: /system.slice/portfolio.service", delay: 100, type: false, isResponse: true, multiline: true},
  {text: "swat@void:~$ echo \"Initialization complete\"", delay: 800, type: true},
  {text: "Initialization complete", delay: 100, type: false, isResponse: true},
  {text: "swat@void:~$ ", delay: 300, type: true, final: true}
];

function typeText(element, text, speed = 50) {
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

async function runTerminalScript() {
  terminalBody.innerHTML = '';
  
  for (const line of terminalScript) {
    const lineElement = document.createElement('div');
    lineElement.className = 'terminal-line';
    if (line.isResponse) {
      lineElement.classList.add('response');
    }
    
    terminalBody.appendChild(lineElement);
    
    if (line.multiline) {
      lineElement.style.whiteSpace = 'pre';
    }
    
    if (line.type) {
      await typeText(lineElement, line.text, 40 + Math.random() * 30);
    } else {
      lineElement.textContent = line.text;
      lineElement.style.opacity = '1';
    }
    
    // Scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
    
    await new Promise(resolve => setTimeout(resolve, line.delay));
  }
  
  // Add blinking cursor to last line
  const lastLine = terminalBody.lastChild;
  const cursor = document.createElement('span');
  cursor.className = 'blink';
  cursor.textContent = '█';
  lastLine.appendChild(cursor);
  
  terminalAnimationComplete = true;
  
  // Start fade out after 2 seconds
  setTimeout(() => {
    terminalLoader.style.opacity = '0';
    terminalLoader.style.transform = 'translate(-50%, -50%) scale(0.95)';
    terminalLoader.style.transition = 'all 0.8s ease';
    
    setTimeout(() => {
      terminalLoader.style.display = 'none';
      showMainContent();
    }, 800);
  }, 2000);
}

function showMainContent() {
  mainContent.classList.remove('hidden');
  mainContent.style.opacity = '0';
  mainContent.style.transition = 'opacity 1.2s ease';
  
  setTimeout(() => {
    mainContent.style.opacity = '1';
    startAudioSystem();
    startParticles();
  }, 300);
}

// Start terminal animation
setTimeout(() => {
  runTerminalScript();
}, 1000);

/* AUDIO SYSTEM - AUTO PLAY */
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
    
    const barWidth = (visualizer.width / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * visualizer.height;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, visualizer.height - barHeight, 0, visualizer.height);
      const hue = 270 + (dataArray[i] / 255) * 60;
      gradient.addColorStop(0, `hsl(${hue}, 100%, 70%)`);
      gradient.addColorStop(1, `hsl(${hue}, 100%, 30%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
      
      // Add glow
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
      ctx.shadowBlur = 0;
      
      x += barWidth + 1;
    }
    
    // Update accent colors based on audio
    const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
    const hue = 270 + (avg / 10);
    const lightness = 50 + (avg / 15);
    
    document.documentElement.style.setProperty('--accent', `hsl(${hue}, 100%, ${lightness}%)`);
    document.documentElement.style.setProperty('--accent-glow', `hsla(${hue}, 100%, ${lightness}%, 0.6)`);
    
    // Update buffer status
    const bufferStatus = document.getElementById('bufferStatus');
    if (bufferStatus) {
      const bufferPercent = Math.min(100, Math.floor((audio.buffered.end(0) / audio.duration) * 100));
      bufferStatus.textContent = `${bufferPercent}%`;
    }
  }
  
  // Unlock audio on first user interaction
  function unlockAudio() {
    if (audioStarted) return;
    
    audioStarted = true;
    
    // Resume audio context
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Try to play audio
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Audio playing successfully');
        drawVisualizer();
      }).catch(error => {
        console.log('Autoplay prevented:', error);
        // Wait for user interaction
        document.addEventListener('click', () => {
          audio.play();
          drawVisualizer();
        }, { once: true });
      });
    }
  }
  
  // Try to auto-start after terminal
  setTimeout(() => {
    unlockAudio();
  }, 1500);
  
  // Also start on any user interaction
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
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
  
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) * 0.5,
    dy: (Math.random() - 0.5) * 0.5,
    color: `hsl(${Math.random() * 60 + 250}, 100%, ${Math.random() * 30 + 60}%)`
  }));
  
  function animate() {
    ctx.clearRect(0, 0, w, h);
    
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(178, 108, 255, ${0.2 * (1 - distance/100)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    
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

// Add hover effect
const interactiveElements = document.querySelectorAll('a, button, .skill-item, .link-btn');
interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('hover');
  });
  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('hover');
  });
});

/* THEME TOGGLE */
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
};

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light');
}

/* GLITCH EFFECT */
const glitchText = document.querySelector('.glitch');
setInterval(() => {
  const intensity = Math.random();
  if (intensity > 0.7) {
    glitchText.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
    glitchText.style.textShadow = `0 0 20px hsl(${Math.random() * 60 + 250}, 100%, 70%)`;
  } else {
    glitchText.style.transform = 'translate(0)';
    glitchText.style.textShadow = '0 0 20px rgba(180,140,255,0.6), 0 0 60px rgba(180,140,255,0.25)';
  }
}, 100);

/* SYSTEM STATUS UPDATE */
function updateSystemStatus() {
  const uptimeElement = document.querySelector('.status-item:nth-child(2) .status-value');
  const loadElement = document.querySelector('.status-item:nth-child(3) .status-value');
  
  if (uptimeElement && loadElement) {
    // Simulate system stats
    const uptime = 99.7 + Math.random() * 0.3;
    const load1 = (0.1 + Math.random() * 0.3).toFixed(2);
    const load5 = (0.05 + Math.random() * 0.2).toFixed(2);
    const load15 = (0.02 + Math.random() * 0.1).toFixed(2);
    
    uptimeElement.textContent = `${uptime.toFixed(1)}%`;
    loadElement.textContent = `${load1} ${load5} ${load15}`;
  }
}

// Update system status every 30 seconds
setInterval(updateSystemStatus, 30000);
updateSystemStatus(); // Initial update

/* FALLBACK AUDIO SOURCE */
const audio = document.getElementById('audio');
audio.addEventListener('error', (e) => {
  console.log('Error loading audio:', e);
  // Switch to fallback source if local file fails
  const source = audio.querySelector('source');
  if (source && source.src.includes('/files/song.mp3')) {
    console.log('Switching to fallback audio source');
    source.src = 'https://assets.codepen.io/1468070/synthwave-ambient.mp3';
    audio.load();
    
    // Try to play again after a delay
    setTimeout(() => {
      if (audioStarted) {
        audio.play().catch(e => console.log('Fallback audio error:', e));
      }
    }, 1000);
  }
});
