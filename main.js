/* CURSOR */
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

/* THEME */
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('light');
};

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

const particles = Array.from({ length: 120 }, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  r: Math.random() * 2 + 1,
  dx: (Math.random() - 0.5) * 0.3,
  dy: (Math.random() - 0.5) * 0.3
}));

function animate() {
  ctx.clearRect(0, 0, w, h);
  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;

    if (p.x < 0 || p.x > w) p.dx *= -1;
    if (p.y < 0 || p.y > h) p.dy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(178,108,255,0.6)';
    ctx.fill();
  });
  requestAnimationFrame(animate);
}
animate();

/* MUSIC REACTIVITY */
const audio = document.getElementById('audio');
const audioCtx = new AudioContext();
const src = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
src.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 64;

const data = new Uint8Array(analyser.frequencyBinCount);

function pulse() {
  analyser.getByteFrequencyData(data);
  const avg = data.reduce((a,b)=>a+b) / data.length;
  document.documentElement.style.setProperty(
    '--accent',
    `hsl(270, 100%, ${50 + avg / 5}%)`
  );
  requestAnimationFrame(pulse);
}

audio.onplay = () => audioCtx.resume();
pulse();
