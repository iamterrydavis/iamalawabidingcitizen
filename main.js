/* TERMINAL LOADER */
const terminalLoader = document.getElementById('terminalLoader');
const mainContent = document.querySelector('main');

setTimeout(() => {
  terminalLoader.style.opacity = '0';
  terminalLoader.style.transform = 'translate(-50%, -50%) scale(0.8)';
  terminalLoader.style.transition = 'all 0.8s ease';
  
  setTimeout(() => {
    terminalLoader.style.display = 'none';
    mainContent.classList.remove('hidden');
    mainContent.style.opacity = '0';
    mainContent.style.transition = 'opacity 1.2s ease';
    
    setTimeout(() => {
      mainContent.style.opacity = '1';
    }, 300);
  }, 800);
}, 5000); // Show terminal for 5 seconds

/* CURSOR */
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

// Add hover effect for interactive elements
const interactiveElements = document.querySelectorAll('a, button, .skill-item, .link-btn');
interactiveElements.forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('hover');
  });
  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('hover');
  });
});

/* THEME */
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
};

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light');
}

/* PARTICLES */
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const particles = Array.from({ length: 150 }, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  r: Math.random() * 2.5 + 0.5,
  dx: (Math.random() - 0.5) * 0.5,
  dy: (Math.random() - 0.5) * 0.5,
  color: `hsl(${Math.random() * 60 + 250}, 100%, ${Math.random() * 30 + 60}%)`
}));

function drawParticles() {
  ctx.clearRect(0, 0, w, h);
  
  // Draw connections between particles
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
    
    // Add glow effect
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(p.x, p.y, p.r, p.x, p.y, p.r * 3);
    gradient.addColorStop(0, p.color.replace(')', ', 0.8)').replace('hsl', 'hsla'));
    gradient.addColorStop(1, p.color.replace(')', ', 0)').replace('hsl', 'hsla'));
    ctx.fillStyle = gradient;
    ctx.fill();
  });
  
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* MUSIC REACTIVITY */
const audio = document.getElementById('audio');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const src = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
src.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const visualizer = document.getElementById('visualizer');
const ctxVisualizer = visualizer.getContext('2d');

// Visualizer setup
visualizer.width = visualizer.offsetWidth * window.devicePixelRatio;
visualizer.height = visualizer.offsetHeight * window.devicePixelRatio;

function resizeVisualizer() {
  visualizer.width = visualizer.offsetWidth * window.devicePixelRatio;
  visualizer.height = visualizer.offsetHeight * window.devicePixelRatio;
}
window.addEventListener('resize', resizeVisualizer);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  
  analyser.getByteFrequencyData(dataArray);
  
  ctxVisualizer.clearRect(0, 0, visualizer.width, visualizer.height);
  
  const barWidth = (visualizer.width / bufferLength) * 2.5;
  let barHeight;
  let x = 0;
  
  for(let i = 0; i < bufferLength; i++) {
    barHeight = (dataArray[i] / 255) * visualizer.height;
    
    const gradient = ctxVisualizer.createLinearGradient(0, 0, 0, visualizer.height);
    gradient.addColorStop(0, '#b26cff');
    gradient.addColorStop(1, '#8a2be2');
    
    ctxVisualizer.fillStyle = gradient;
    ctxVisualizer.fillRect(x, visualizer.height - barHeight, barWidth, barHeight);
    
    x += barWidth + 1;
  }
  
  // Update accent color based on audio
  const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
  const hue = 270 + (avg / 5);
  const lightness = 50 + (avg / 10);
  document.documentElement.style.setProperty(
    '--accent',
    `hsl(${hue}, 100%, ${lightness}%)`
  );
  document.documentElement.style.setProperty(
    '--accent-glow',
    `hsla(${hue}, 100%, ${lightness}%, 0.6)`
  );
}

// Audio controls
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volumeSlider');
const currentTimeEl = document.getElementById('currentTime');

playBtn.addEventListener('click', () => {
  audio.play();
  audioCtx.resume();
  drawVisualizer();
});

pauseBtn.addEventListener('click', () => {
  audio.pause();
});

stopBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
  currentTimeEl.textContent = '0:00';
});

volumeSlider.addEventListener('input', (e) => {
  audio.volume = e.target.value / 100;
});

audio.addEventListener('timeupdate', () => {
  const minutes = Math.floor(audio.currentTime / 60);
  const seconds = Math.floor(audio.currentTime % 60);
  currentTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Initialize audio system
audio.addEventListener('play', () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});

// Auto-start visualizer
drawVisualizer();

/* GLITCH EFFECT FOR HERO */
const glitchText = document.querySelector('.glitch');
let glitchInterval;

function randomGlitch() {
  const intensity = Math.random();
  if (intensity > 0.7) {
    glitchText.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
    glitchText.style.textShadow = `0 0 20px hsl(${Math.random() * 60 + 250}, 100%, 70%)`;
  } else {
    glitchText.style.transform = 'translate(0)';
    glitchText.style.textShadow = '0 0 20px rgba(180,140,255,0.6), 0 0 60px rgba(180,140,255,0.25)';
  }
}

setInterval(randomGlitch, 100);

/* TYPING EFFECT FOR TERMINAL */
const terminalLines = document.querySelectorAll('.terminal-line');
terminalLines.forEach((line, index) => {
  const text = line.textContent;
  line.textContent = '';
  
  setTimeout(() => {
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        line.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      }
    };
    typeWriter();
  }, index * 1000);
});
