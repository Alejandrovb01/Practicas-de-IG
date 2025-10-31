import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";

let scene, renderer;
let camera;
let info;
let grid;
let estrella,
  Planetas = [],
  Lunas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;

let camControls;
let camParams = { vista: "Sol" };
let camPivot;

const gui = new GUI();

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML = "Alejandro van Baumberghen Quintana - 2025/26";
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  camControls = new OrbitControls(camera, renderer.domElement);
  camControls.enableDamping = true;

  camPivot = new THREE.Object3D();
  scene.add(camPivot);

  //Texturas
  const loader = new THREE.TextureLoader();
  const sol = loader.load("src/textures/sun_texture.jpg");
  const mercurio = loader.load("src/textures/mercury_texture.jpg");
  const venus = loader.load("src/textures/venus_texture.jpg");
  const tierra = loader.load("src/textures/earth_texture.jpg");
  const luna = loader.load("src/textures/moon_texture.jpg");
  const marte = loader.load("src/textures/mars_texture.jpg");
  const fobos = loader.load("src/textures/phobos_texture.jpg");
  const deimos = loader.load("src/textures/deimos_texture.jpg");
  const jupiter = loader.load("src/textures/jupiter_texture.jpg");
  const saturno = loader.load("src/textures/saturn_texture.jpg");
  const anillos = loader.load("src/textures/saturn_ring_texture.png");
  const urano = loader.load("src/textures/uranus_texture.jpg");
  const neptuno = loader.load("src/textures/neptune_texture.jpg");

  //Objetos
  Estrella(1.5, 0xffd000, sol);
  const Lamb = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(Lamb);

  const Lpunt = new THREE.PointLight(0xffffff, 3, 0, 2);
  Lpunt.position.copy(estrella.position);
  Lpunt.castShadow = true;
  Lpunt.shadow.mapSize.width = 2048;
  Lpunt.shadow.mapSize.height = 2048;
  Lpunt.shadow.bias = -0.005;
  scene.add(Lpunt);

  // Merurio
  Planeta(0.03, 2.0, 1.6, 0xffffff, mercurio, 1.0, 1.0, 0.004);
  // Venus
  Planeta(0.07, 3.0, 1.2, 0xffffff, venus, 1.0, 1.0, 0.001);
  // Tierra
  Planeta(0.08, 4.0, 1.0, 0xffffff, tierra, 1.0, 1.0, 0.02);
  // Marte
  Planeta(0.05, 6.0, 0.8, 0xffffff, marte, 1.0, 1.0, 0.018);
  // Júpiter
  Planeta(0.4, 10.0, 0.4, 0xffffff, jupiter, 1.0, 1.0, 0.04);
  // Saturno
  Planeta(0.35, 12.0, 0.35, 0xffffff, saturno, 1.0, 1.0, 0.038);
  // Urano
  Planeta(0.25, 15.0, 0.3, 0xffffff, urano, 1.0, 1.0, 0.03);
  // Neptuno
  Planeta(0.23, 18.0, 0.28, 0xffffff, neptuno, 1.0, 1.0, 0.029);

  // Luna (Tierra)
  Luna(Planetas[2], 0.02, 0.5, 2.5, 0xffffff, luna, 0.0);
  // Fobos (Marte)
  Luna(Planetas[3], 0.01, 0.3, 3.0, 0xffffff, fobos, 0.0);
  // Deimos (Marte)
  Luna(Planetas[3], 0.008, 0.6, 2.0, 0xffffff, deimos, 0.0);
  // Supongamos que `Planetas[5]` es Saturno
  Anillo(Planetas[5], 0.55, 1.0, anillos);

  const opcionesVista = [
    "Sol",
    "Mercurio",
    "Venus",
    "Tierra",
    "Marte",
    "Júpiter",
    "Saturno",
    "Urano",
    "Neptuno",
  ];
  const camFolder = gui.addFolder("Vista de cámara");
  camFolder.add(camParams, "vista", opcionesVista).name("Ver desde");
  camFolder.open();

  //Inicio tiempo
  t0 = Date.now();
  //EsferaChild(objetos[0],3.0,0,0,0.8,10,10, 0x00ff00);
}

function Estrella(rad, col, texture) {
  let geometry = new THREE.SphereGeometry(rad, 32, 32);
  let material = new THREE.MeshBasicMaterial({ color: col, map: texture });
  estrella = new THREE.Mesh(geometry, material);
  scene.add(estrella);
}

function Planeta(radio, dist, vel, col, texture, f1, f2, rotSpeed) {
  let geometry = new THREE.SphereGeometry(radio, 10, 10);
  let material = new THREE.MeshPhongMaterial({ color: col, map: texture });
  let planeta = new THREE.Mesh(geometry, material);
  planeta.castShadow = true;
  planeta.receiveShadow = false;
  planeta.userData.dist = dist;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;
  planeta.userData.rotationSpeed = rotSpeed || 0.01;
  Planetas.push(planeta);
  scene.add(planeta);

  //Dibuja trayectoria, con
  let curve = new THREE.EllipseCurve(
    0,
    0, // centro
    dist * f1,
    dist * f2 // radios elipse
  );

  //Crea geometría (usa los puntos en 3D)
  let points = curve.getPoints(50);
  let points3d = points.map((p) => new THREE.Vector3(p.x, 0, p.y));
  let geome = new THREE.BufferGeometry().setFromPoints(points3d);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Objeto
  let orbita = new THREE.Line(geome, mate);
  scene.add(orbita);
}

function Luna(planeta, radio, dist, vel, col, texture, angle, rotSpeed) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle;
  planeta.add(pivote);
  let geometry = new THREE.SphereGeometry(radio, 10, 10);
  let material = new THREE.MeshPhongMaterial({ color: col, map: texture });
  var luna = new THREE.Mesh(geometry, material);
  luna.castShadow = true;
  luna.receiveShadow = false;
  luna.userData.dist = dist;
  luna.userData.speed = vel;
  luna.userData.rotationSpeed = rotSpeed || 0.01;

  Lunas.push(luna);
  pivote.add(luna);
}

function Anillo(planeta, innerRadius, outerRadius, texture, segments = 64) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  });

  var anillo = new THREE.Mesh(geometry, material);

  anillo.rotation.x = -Math.PI / 2;
  anillo.position.y = 0.01;

  planeta.add(anillo);
}

//Bucle de animación
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;
  requestAnimationFrame(animationLoop);

  //Modifica rotación de todos los objetos
  for (let object of Planetas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) *
      object.userData.f1 *
      object.userData.dist;
    object.position.z =
      Math.sin(timestamp * object.userData.speed) *
      object.userData.f2 *
      object.userData.dist;
    object.rotation.y += object.userData.rotationSpeed;
  }

  for (let object of Lunas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) * object.userData.dist;
    object.position.z =
      Math.sin(timestamp * object.userData.speed) * object.userData.dist;
    object.rotation.y += object.userData.rotationSpeed;
  }

  if (Planetas[5].userData.ring) {
    //Planetas[5].userData.ring.rotation.z += 0.0005;
  }

  updateCameraView();

  camControls.update();

  renderer.render(scene, camera);
}

function updateCameraView() {
  let targetPlanet = null;

  switch (camParams.vista) {
    case "Sol":
      targetPlanet = estrella;
      break;
    case "Mercurio":
      targetPlanet = Planetas[0];
      break;
    case "Venus":
      targetPlanet = Planetas[1];
      break;
    case "Tierra":
      targetPlanet = Planetas[2];
      break;
    case "Marte":
      targetPlanet = Planetas[3];
      break;
    case "Júpiter":
      targetPlanet = Planetas[4];
      break;
    case "Saturno":
      targetPlanet = Planetas[5];
      break;
    case "Urano":
      targetPlanet = Planetas[6];
      break;
    case "Neptuno":
      targetPlanet = Planetas[7];
      break;
  }

  if (targetPlanet) {
    const planetDelta = new THREE.Vector3().subVectors(
      targetPlanet.position,
      camPivot.position
    );

    camera.position.add(planetDelta);
    camControls.target.add(planetDelta);

    camPivot.position.copy(targetPlanet.position);
    camControls.minDistance = targetPlanet.geometry.parameters.radius * 5;
    camControls.maxDistance = targetPlanet.geometry.parameters.radius * 30;
  }
}
