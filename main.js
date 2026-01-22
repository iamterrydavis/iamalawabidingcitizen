/* ================= TERMINAL INTRO ================= */
const terminalText = document.getElementById("terminalText");
const terminal = document.getElementById("terminal");

const lines = [
  "swat@void:~$ boot",
  "loading shaders...",
  "initializing crystal field...",
  "syncing audio analyzer...",
  "done.",
];

let i = 0;
function typeLine() {
  if (i < lines.length) {
    terminalText.textContent += lines[i] + "\n";
    i++;
    setTimeout(typeLine, 600);
  } else {
    setTimeout(() => terminal.style.display = "none", 800);
  }
}
typeLine();

/* ================= THREE.JS ================= */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("three"),
  alpha: true,
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

/* LIGHTING */
scene.add(new THREE.AmbientLight(0xb48cff, 0.6));
const point = new THREE.PointLight(0xb48cff, 2);
point.position.set(3, 4, 6);
scene.add(point);

/* AMETHYST SHARDS */
const shards = [];
for (let i = 0; i < 60; i++) {
  const geo = new THREE.ConeGeometry(
    Math.random() * 0.3 + 0.1,
    Math.random() * 1.5 + 0.5,
    6
  );
  const mat = new THREE.MeshStandardMaterial({
    color: 0xb48cff,
    emissive: 0x3a145f,
    roughness: 0.25,
    metalness: 0.6
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 12,
    (Math.random() - 0.5) * 12,
    (Math.random() - 0.5) * 12
  );
  mesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  scene.add(mesh);
  shards.push(mesh);
}

/* ================= AUDIO REACTIVITY ================= */
const audio = document.getElementById("audio");
const ctx = new AudioContext();
const src = ctx.createMediaElementSource(audio);
const analyser = ctx.createAnalyser();
src.connect(analyser);
analyser.connect(ctx.destination);
analyser.fftSize = 128;
const data = new Uint8Array(analyser.frequencyBinCount);

audio.onplay = () => ctx.resume();

/* ================= SCROLL CAMERA ================= */
window.addEventListener("scroll", () => {
  camera.position.y = -window.scrollY * 0.003;
});

/* ================= ANIMATE ================= */
function animate() {
  analyser.getByteFrequencyData(data);
  const bass = data[2] / 255;

  shards.forEach(s => {
    s.rotation.y += 0.002 + bass * 0.03;
    s.rotation.x += 0.001;
    s.scale.setScalar(1 + bass * 0.4);
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/* RESIZE */
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
