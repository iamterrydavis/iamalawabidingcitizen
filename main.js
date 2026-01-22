/* CUSTOM CURSOR */
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

/* CANVAS */
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

/* MOUSE */
const mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* PARTICLES */
const particles = Array.from({ length: 140 }, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  vx: (Math.random() - 0.5) * 0.25,
  vy: (Math.random() - 0.5) * 0.25,
  size: Math.random() * 2 + 1
}));

function animate() {
  ctx.clearRect(0, 0, w, h);

  particles.forEach(p => {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 160) {
      const force = (160 - dist) / 160;
      p.vx -= dx * force * 0.0006;
      p.vy -= dy * force * 0.0006;
    }

    p.x += p.vx;
    p.y += p.vy
