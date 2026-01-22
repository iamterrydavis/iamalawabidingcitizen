/* ================= TERMINAL ================= */
const terminal = document.getElementById("terminal");
const terminalText = document.getElementById("terminalText");
const audio = document.getElementById("audio");

const boot = [
  "swat@void:~$ init",
  "loading particle field...",
  "binding audio stream...",
  "ready."
];

let i = 0;
(function type() {
  if (i < boot.length) {
    terminalText.textContent += boot[i++] + "\n";
    setTimeout(type, 500);
  } else {
    setTimeout(() => {
      terminal.style.opacity = 0;
      setTimeout(() => terminal.remove(), 800);

      // FIXED AUTOPLAY
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(audio);
      src.connect(ctx.destination);
      ctx.resume().then(() => audio.play());
    }, 700);
  }
})();

/* ================= PARTICLES ================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("three"),
  alpha: true,
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const count = 1600;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  positions[i*3] = (Math.random() - 0.5) * 14;
  positions[i*3+1] = (Math.random() - 0.5) * 14;
  positions[i*3+2] = (Math.random() - 0.5) * 6;

  colors[i*3] = 0.7;
  colors[i*3+1] = 0.4;
  colors[i*3+2] = 1.0;
}

geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: 0.05,
  vertexColors: true,
  transparent: true,
  opacity: 0.8
});

const points = new THREE.Points(geometry, material);
scene.add(points);

/* ================= MOUSE INTERACTION ================= */
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

/* ================= ANIMATE ================= */
function animate() {
  const pos = geometry.attributes.position.array;
  const col = geometry.attributes.color.array;

  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    const dx = pos[ix] - mouse.x * 6;
    const dy = pos[ix+1] - mouse.y * 6;
    const dist = Math.sqrt(dx*dx + dy*dy);

    const t = Math.max(0, 1 - dist / 2.5);

    // lerp purple → white
    col[ix]   = 0.7 + t * 0.3;
    col[ix+1] = 0.4 + t * 0.6;
    col[ix+2] = 1.0;
    pos[ix+1] += Math.sin(Date.now() * 0.0005 + i) * 0.0006;
  }

  geometry.attributes.color.needsUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/* RESIZE */
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
