import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer, camera;
let camcontrols1;
let mapsx, mapsy;
let texturacargada = false;

// Datos de colonización
const datosColonizacion = [];
let currentYearIndex = 0;
let lastUpdateTime = 0;
const updateInterval = 1500; // 1 segundo por año

// Colores por imperio
const coloresImperios = {
  Spain: 0xffd700, // Amarillo
  England: 0xff0000, // Rojo
  France: 0x0000ff, // Azul
  Netherlands: 0xff8c00, // Naranja
  Portugal: 0x00ff00, // Verde
  Sweden: 0x00ffff, // Cyan
};

// Límites geográficos de América
const minlon = -175.0576171875;
const maxlon = -20.0048828125;
const minlat = -57.61010702068389;
const maxlat = 100.35482803013983;

// Mostrar año actual
let yearDisplay;

init();
animate();

function init() {
  // Mostrar año en pantalla
  yearDisplay = document.createElement("div");
  yearDisplay.style.position = "absolute";
  yearDisplay.style.top = "30px";
  yearDisplay.style.width = "100%";
  yearDisplay.style.textAlign = "center";
  yearDisplay.style.color = "#fff";
  yearDisplay.style.fontWeight = "bold";
  yearDisplay.style.backgroundColor = "transparent";
  yearDisplay.style.zIndex = "1";
  yearDisplay.style.fontFamily = "Monospace";
  yearDisplay.style.fontSize = "24px";
  yearDisplay.innerHTML = "Año: 1492";
  document.body.appendChild(yearDisplay);

  // Leyenda de colores
  const legend = document.createElement("div");
  legend.style.position = "absolute";
  legend.style.bottom = "30px";
  legend.style.left = "30px";
  legend.style.color = "#fff";
  legend.style.fontFamily = "Monospace";
  legend.style.fontSize = "14px";
  legend.style.backgroundColor = "rgba(0,0,0,0.5)";
  legend.style.padding = "10px";
  legend.style.borderRadius = "5px";
  legend.innerHTML = `
    <div><span style="color:#ffd700">●</span> Spain</div>
    <div><span style="color:#ff0000">●</span> England</div>
    <div><span style="color:#0000ff">●</span> France</div>
    <div><span style="color:#ff8c00">●</span> Holland</div>
    <div><span style="color:#00ff00">●</span> Portugal</div>
  `;
  document.body.appendChild(legend);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camcontrols1 = new OrbitControls(camera, renderer.domElement);

  const light = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Cargar AMBAS texturas
  const textureLoader = new THREE.TextureLoader();

  // Textura visual (mapa físico bonito)
  const colorMap = textureLoader.load("src/images/america_map.png");

  // Textura de elevación (mapa de altura)
  const heightMap = textureLoader.load(
    "src/images/america_height_map.png",
    (texture) => {
      // Este callback se ejecuta cuando la textura de elevación se carga
      const imgWidth = texture.image.width;
      const imgHeight = texture.image.height;
      const aspectRatio = imgWidth / imgHeight;

      mapsy = 10.8 / 2.5;
      mapsx = mapsy * aspectRatio;

      // Crear plano con textura visual Y mapa de desplazamiento
      Plano(0, 0, 0, mapsx, mapsy, colorMap, heightMap);
      texturacargada = true;

      // Cargar datos CSV desde archivo externo
      cargarCSVDesdeArchivo("src/colonization_data.csv");
    }
  );
}

function Plano(px, py, pz, sx, sy, txt, dismap) {
  let geometry = new THREE.PlaneBufferGeometry(sx, sy, 300, 300);
  let material = new THREE.MeshPhongMaterial({
    wireframe: false,
  });

  if (txt != undefined) {
    material.map = txt;
  }

  if (dismap != undefined) {
    material.displacementMap = dismap;
    material.displacementScale = 0.3;
  }

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
}

// Función para mapear lat/lon a coordenadas del plano
function latLonToPlane(lat, lon) {
  const x = mapRange(lon, minlon, maxlon, -mapsx / 2, mapsx / 2);
  const y = mapRange(lat, minlat, maxlat, -mapsy / 2, mapsy / 2);
  return { x, y };
}

function mapRange(val, vmin, vmax, dmin, dmax) {
  const t = (val - vmin) / (vmax - vmin);
  return dmin + t * (dmax - dmin);
}

// Algoritmo point-in-polygon (ray-casting)
function puntoEnPoligono(punto, vertices) {
  let dentro = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x,
      yi = vertices[i].y;
    const xj = vertices[j].x,
      yj = vertices[j].y;

    const intersecta =
      yi > punto.y !== yj > punto.y &&
      punto.x < ((xj - xi) * (punto.y - yi)) / (yj - yi) + xi;

    if (intersecta) dentro = !dentro;
  }
  return dentro;
}

// Calcular bounding box de un polígono
function calcularBoundingBox(vertices) {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  vertices.forEach((v) => {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  });

  return { minX, maxX, minY, maxY };
}

// Nueva función para crear territorio con polígono - VERSIÓN FINAL CORREGIDA
function CrearTerritorioPoligonal(
  polygonCoords,
  col,
  year,
  region,
  empire,
  densidadPuntos = 50
) {
  const objetos = [];

  // Convertir coordenadas lat/lon a coordenadas del plano
  const vertices = polygonCoords.map((coord) =>
    latLonToPlane(coord.lat, coord.lon)
  );

  // Calcular centroide PRIMERO
  const centroide = {
    x: vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length,
    y: vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length,
  };

  // Crear polígono con vértices RELATIVOS al centroide
  const shape = new THREE.Shape();
  vertices.forEach((v, i) => {
    const relX = v.x - centroide.x;
    const relY = v.y - centroide.y;
    if (i === 0) shape.moveTo(relX, relY);
    else shape.lineTo(relX, relY);
  });

  const shapeGeometry = new THREE.ShapeGeometry(shape);
  const shapeMaterial = new THREE.MeshBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
  // Ahora la posición es el centroide, y la geometría está centrada en 0,0
  shapeMesh.position.set(centroide.x, centroide.y, 0.35);
  shapeMesh.renderOrder = 1;
  shapeMesh.scale.set(0, 0, 1);
  scene.add(shapeMesh);
  objetos.push(shapeMesh);

  // Crear borde del polígono
  const edgesGeometry = new THREE.EdgesGeometry(shapeGeometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: col,
    linewidth: 2,
    transparent: true,
    opacity: 0.9,
  });

  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.position.set(centroide.x, centroide.y, 0.36);
  edges.renderOrder = 2;
  edges.scale.set(0, 0, 1);
  scene.add(edges);
  objetos.push(edges);

  // Calcular bounding box
  const bbox = calcularBoundingBox(vertices);

  // Generar círculos 2D planos dentro del polígono
  let puntosGenerados = 0;
  const maxIntentos = densidadPuntos * 10;
  let intentos = 0;

  while (puntosGenerados < densidadPuntos && intentos < maxIntentos) {
    const x = bbox.minX + Math.random() * (bbox.maxX - bbox.minX);
    const y = bbox.minY + Math.random() * (bbox.maxY - bbox.minY);

    if (puntoEnPoligono({ x, y }, vertices)) {
      const puntoGeometry = new THREE.CircleGeometry(0.012, 8);
      const puntoMaterial = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });

      const punto = new THREE.Mesh(puntoGeometry, puntoMaterial);
      punto.position.set(x, y, 0.38);
      punto.renderOrder = 3;
      punto.scale.set(0, 0, 1);
      scene.add(punto);
      objetos.push(punto);
      puntosGenerados++;
    }
    intentos++;
  }

  // Punto central como círculo 2D plano
  const centralGeometry = new THREE.CircleGeometry(0.05, 16);
  const centralMaterial = new THREE.MeshBasicMaterial({
    color: col,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: false,
  });

  const central = new THREE.Mesh(centralGeometry, centralMaterial);
  central.position.set(centroide.x, centroide.y, 0.4);
  central.renderOrder = 4;
  central.scale.set(0, 0, 1);
  scene.add(central);
  objetos.push(central);

  // Animar todos los objetos
  animarTerritorio(objetos, 800);

  return objetos;
}

function animarTerritorio(objetos, duration) {
  const startTime = Date.now();

  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic para animación suave
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    objetos.forEach((obj, index) => {
      // Pequeño delay entre objetos para efecto cascada
      const delay = index * 0.01; // Reducido de 0.02 a 0.01
      const adjustedProgress = Math.max(
        0,
        Math.min(1, (progress - delay) / (1 - delay))
      );

      // Los objetos ya están en su posición correcta, solo se escalan
      // En THREE.js, scale se aplica desde el centro del objeto por defecto
      const scale = adjustedProgress;
      obj.scale.set(scale, scale, 1); // Mantener escala Z en 1 para objetos 2D
    });

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  update();
}

// Función para cargar CSV desde archivo externo
function cargarCSVDesdeArchivo(rutaArchivo) {
  fetch(rutaArchivo)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Error al cargar el archivo CSV: " + response.statusText
        );
      }
      return response.text();
    })
    .then((content) => {
      procesarCSV(content);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Función para procesar el contenido del CSV con polígonos
function procesarCSV(content) {
  const lines = content.split("\n");

  // Saltar la primera línea (encabezados)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    // Parser CSV que maneja comillas correctamente
    const fields = parseCSVLine(line);

    if (fields.length >= 4) {
      const year = parseInt(fields[0]);
      const region = fields[1];
      const empire = fields[2];
      const polygonStr = fields[3];

      // Parsear coordenadas del polígono
      // Parsear coordenadas del polígono (ahora con : en lugar de ,)
      const coords = polygonStr.split(";").map((coord) => {
        const parts = coord.trim().split(":");
        return {
          lat: parseFloat(parts[0]),
          lon: parseFloat(parts[1]),
        };
      });

      datosColonizacion.push({
        year,
        region,
        empire,
        polygon: coords,
      });
    }
  }

  console.log(`Cargados ${datosColonizacion.length} eventos de colonización`);
}

function parseCSVLine(line) {
  const fields = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }

  // Añadir el último campo
  fields.push(currentField.trim());

  return fields;
}

function actualizarColonizacion(currentTime) {
  if (currentYearIndex >= datosColonizacion.length) {
    return;
  }

  if (currentTime - lastUpdateTime >= updateInterval) {
    const evento = datosColonizacion[currentYearIndex];
    const color = coloresImperios[evento.empire] || 0xffffff;

    // Crear territorio con polígono
    CrearTerritorioPoligonal(
      evento.polygon,
      color,
      evento.year,
      evento.region,
      evento.empire
    );

    yearDisplay.innerHTML = `Year: ${evento.year} - ${evento.region} (${evento.empire})`;

    currentYearIndex++;
    lastUpdateTime = currentTime;
  }
}

// Bucle de animación
function animate(currentTime) {
  requestAnimationFrame(animate);

  if (texturacargada) {
    actualizarColonizacion(currentTime);
  }

  renderer.render(scene, camera);
}
