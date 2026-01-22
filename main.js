/* SIMPLIFIED TERMINAL INTRO */
const terminalLoader = document.getElementById('terminalLoader');
const mainContent = document.querySelector('main');

// Terminal commands - simplified version
const terminalScript = [
  {text: "swat@void:~$ whoami", delay: 300, type: true},
  {text: "swat", delay: 800, type: false, isResponse: true},
  {text: "swat@void:~$ uname -a", delay: 300, type: true},
  {text: "Linux void 6.5.0-kali1 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09) x86_64 GNU/Linux", delay: 800, type: false, isResponse: true},
  {text: "swat@void:~$ cat /proc/version", delay: 300, type: true, final: true}
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
  const terminalBody = document.querySelector('.terminal-body');
  terminalBody.innerHTML = '';
  
  for (const line of terminalScript) {
    const lineElement = document.createElement('div');
    lineElement.className = 'terminal-line';
    if (line.isResponse) {
      lineElement.classList.add('response');
    }
    
    terminalBody.appendChild(lineElement);
    
    if (line.type) {
      await typeText(lineElement, line.text, 40);
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
  lastLine.innerHTML += '<span class="blink">█</span>';
  
  // Start fade out after 1 second
  setTimeout(() => {
    terminalLoader.style.opacity = '0';
    terminalLoader.style.transform = 'translate(-50%, -50%) scale(0.95)';
    terminalLoader.style.transition = 'all 0.8s ease';
    
    setTimeout(() => {
      terminalLoader.style.display = 'none';
      showMainContent();
    }, 800);
  }, 1000);
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

// Start terminal animation immediately
runTerminalScript();

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
  
  // Unlock audio on first user interaction
  function unlockAudio() {
    if (audioStarted) return;
    
    audioStarted = true;
    
    // Resume audio context
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Try to play audio
    audio.play().then(() => {
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
  
  // Try to auto-start after terminal
  setTimeout(() => {
    unlockAudio();
  }, 500);
  
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
  
  const particles = Array.from({ length: 100 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3,
    color: `hsl(${Math.random() * 60 + 250}, 100%, ${Math.random() * 30 + 60}%)`
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

/* GLITCH EFFECT */
const glitchText = document.querySelector('.glitch');
setInterval(() => {
  const intensity = Math.random();
  if (intensity > 0.7) {
    glitchText.style.transform = `translate(${Math.random() * 2 - 1}px, ${Math.random() * 2 - 1}px)`;
  } else {
    glitchText.style.transform = 'translate(0)';
  }
}, 100);
