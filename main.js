/* ================= TERMINAL ================= */
const terminal = document.getElementById("terminal");
const terminalText = document.getElementById("terminalText");
const audio = document.getElementById("audio");

const boot = [
  "swat@void:~$ init",
  "loading crystal field...",
  "binding audio stream...",
  "ready."
];

let l = 0;
(function type() {
  if (l < boot.length) {
    terminalText.textContent += boot[l++] + "\n";
    setTimeout(type, 500);
  } else {
    setTimeout(() => {
      terminal.style.opacity = 0;
      setTimeout(() => terminal.remove(), 800);
      audio.play();
    }, 800);
  }
})();

/* ================= THREE ================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("three"),
  alpha: true,
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

/* ================= SHADER ================= */
const material = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    time: { value: 0 },
    mouse: { value: new THREE.Vector2() }
  },
  vertexShader: `
    uniform float time;
    uniform vec2 mouse;
    varying float vGlow;

    void main() {
      vec3 p = position;
      float d = distance(p.xy, mouse * 5.0);
      vGlow = smoothstep(2.0, 0.0, d);
      p.z += sin(time + p.x * 4.0) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = 2.5 + vGlow * 4.0;
    }
  `,
  fragmentShader: `
    varying float vGlow;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.1, d);
      gl_FragColor = vec4(0.7, 0.4, 1.0, a * (0.4 + vGlow));
    }
  `
});

/* ================= PARTICLES (INSTANCED) ================= */
const count = 2000;
const geo = new THREE.BufferGeometry();
const pos = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  pos[i*3] = (Math.random() - 0.5) * 20;
  pos[i*3+1] = (Math.random() - 0.5) * 20;
  pos[i*3+2] = (Math.random() - 0.5) * 10;
}

geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const particles = new THREE.Points(geo, material);
scene.add(particles);

/* ================= AUDIO ================= */
const ctx = new AudioContext();
const src = ctx.createMediaElementSource(audio);
const analyser = ctx.createAnalyser();
src.connect(analyser);
analyser.connect(ctx.destination);
analyser.fftSize = 128;
const data = new Uint8Array(analyser.frequencyBinCount);

/* ================= INTERACTION ================= */
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", e => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  material.uniforms.mouse.value = mouse;
});

/* ================= ANIMATE ================= */
function animate(t) {
  material.uniforms.time.value = t * 0.001;

  analyser.getByteFrequencyData(data);
  camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.05;
  camera.position.y += (mouse.y * 1.5 - camera.position.y) * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/* RESIZE */
addEventListener("resize", () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
