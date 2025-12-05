import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Ammo from "ammojs-typed";

let camera, controls, scene, renderer;
let textureLoader;
const clock = new THREE.Clock();

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });

// Mundo físico con Ammo
let physicsWorld;
const gravityConstant = 7.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
const margin = 0.05; //margen colisiones

// Objetos rígidos
const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
//Variables temporales para actualizar transformación en el bucle
let transformAux1;
let tempBtVec3_1;

//Inicialización ammo
Ammo(Ammo).then(start);

function start() {
  const nameLabel = document.createElement("div");
  nameLabel.textContent = "Alejandro van Baumberghen Quintana";
  nameLabel.style.position = "absolute";
  nameLabel.style.top = "10px";
  nameLabel.style.textAlign = "center";
  //nameLabel.style.left = "10px";
  nameLabel.style.color = "white";
  nameLabel.style.fontFamily = "sans-serif";
  nameLabel.style.fontSize = "20px";
  nameLabel.style.textShadow = "0 0 5px black";
  document.body.appendChild(nameLabel);

  //Elementos gráficos
  initGraphics();
  //Elementos del mundo físico
  initPhysics();
  //Objetos
  createObjects();
  //Eventos
  initInput();

  animationLoop();
}

function initGraphics() {
  //Cámara, escena, renderer y control de cámara
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);
  camera.position.set(0, 8, 40);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();

  textureLoader = new THREE.TextureLoader();

  //Luces
  const ambientLight = new THREE.AmbientLight(0x707070);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(-10, 18, 5);
  light.castShadow = true;
  const d = 14;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;

  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;

  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  scene.add(light);
  //Redimensión de la ventana
  window.addEventListener("resize", onWindowResize);
}

function initPhysics() {
  // Configuración Ammo
  // Colisiones
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  // Gestor de colisiones convexas y cóncavas
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  // Colisión fase amplia
  broadphase = new Ammo.btDbvtBroadphase();
  // Resuelve resricciones de reglas físicas como fuerzas, gravedad, etc.
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  // Crea en mundo físico
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  // Establece gravedad
  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();
  tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
}

function createObjects() {
  // Suelo
  pos.set(0, -0.5, 0);
  quat.set(0, 0, 0, 1);
  const suelo = createBoxWithPhysics(
    40,
    1,
    40,
    0,
    pos,
    quat,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  suelo.receiveShadow = true;

  textureLoader.load(
    "https://threejs.org/examples/textures/terrain/grasslight-big.jpg",
    function (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
      suelo.material.map = texture;
      suelo.material.needsUpdate = true;
    }
  );

  createClayPigeon();
}

function createClayPigeon() {
  const plateRadius = 1.1;
  const plateHeight = 0.08;
  const plateMass = 1;

  // Posición inicial (desde el suelo o lanzador)
  pos.set(Math.floor(Math.random() * (10 - -10 + 1)) - 10, 1, 20);
  quat.set(0, 0, 0, 1);
  quat.setFromAxisAngle(new THREE.Vector3(0.3, 0, 0), Math.PI / 2);

  const plate = createCylinderWithPhysics(
    plateRadius,
    plateHeight,
    plateMass,
    pos,
    quat,
    new THREE.MeshPhongMaterial({ color: 0xff6600 })
  );
  plate.castShadow = true;
  plate.receiveShadow = true;

  // AÑADIR ESTAS LÍNEAS - Marcar como plato para detección de colisión
  plate.userData.isPlate = true;
  plate.userData.broken = false;
  plate.userData.mass = plateMass;
  plate.userData.radius = plateRadius;
  plate.userData.height = plateHeight;

  // Aplicar velocidad inicial hacia arriba y adelante
  const physicsBody = plate.userData.physicsBody;
  const launchVelocity = new Ammo.btVector3(0, 10, -15);
  physicsBody.setLinearVelocity(launchVelocity);

  const angularVelocity = new Ammo.btVector3(0, 0, 0);
  physicsBody.setAngularVelocity(angularVelocity);

  return plate;
}

// Crear fragmentos poligonales irregulares
function breakPlateIntoFragments(plate, impactPoint) {
  if (plate.userData.broken) return;
  plate.userData.broken = true;

  const plateBody = plate.userData.physicsBody;
  const vel = plateBody.getLinearVelocity();
  const angVel = plateBody.getAngularVelocity();
  const platePos = plate.position.clone();
  const plateQuat = plate.quaternion.clone();

  const numFragments = 8; // Número de fragmentos irregulares
  const radius = plate.userData.radius;
  const height = plate.userData.height;

  for (let i = 0; i < numFragments; i++) {
    // Crear geometría irregular para cada fragmento
    const fragmentVertices = [];
    const angle1 = (i / numFragments) * Math.PI * 2;
    const angle2 = ((i + 1) / numFragments) * Math.PI * 2;

    // Variación aleatoria en el tamaño de cada fragmento
    const innerRadius = radius * (0.2 + Math.random() * 0.3);
    const outerRadius = radius * (0.8 + Math.random() * 0.4);

    // Crear forma de cuña/triángulo irregular (como pedazo de plato)
    fragmentVertices.push(
      new THREE.Vector3(0, 0, 0), // Centro
      new THREE.Vector3(
        Math.cos(angle1) * outerRadius,
        (Math.random() - 0.5) * height * 2,
        Math.sin(angle1) * outerRadius
      ),
      new THREE.Vector3(
        Math.cos(angle2) * outerRadius,
        (Math.random() - 0.5) * height * 2,
        Math.sin(angle2) * outerRadius
      ),
      new THREE.Vector3(
        Math.cos((angle1 + angle2) / 2) * innerRadius,
        (Math.random() - 0.5) * height,
        Math.sin((angle1 + angle2) / 2) * innerRadius
      )
    );

    // Crear geometría del fragmento
    const fragmentGeometry = new THREE.BufferGeometry().setFromPoints(
      fragmentVertices
    );
    fragmentGeometry.computeVertexNormals();

    // Crear mesh del fragmento
    const fragment = new THREE.Mesh(
      fragmentGeometry,
      new THREE.MeshPhongMaterial({
        color: 0xff6600,
        side: THREE.DoubleSide,
      })
    );

    // Posición del fragmento (cerca del plato original)
    const offsetAngle = ((i + 0.5) / numFragments) * Math.PI * 2;
    fragment.position
      .copy(platePos)
      .add(
        new THREE.Vector3(
          Math.cos(offsetAngle) * 0.2,
          (Math.random() - 0.5) * 0.1,
          Math.sin(offsetAngle) * 0.2
        )
      );
    fragment.quaternion.copy(plateQuat);

    fragment.castShadow = true;
    fragment.receiveShadow = true;

    // Crear física para el fragmento (usar caja pequeña como aproximación)
    const fragmentSize = radius * 0.3;
    const fragmentMass = plate.userData.mass / numFragments;
    const fragmentShape = new Ammo.btBoxShape(
      new Ammo.btVector3(fragmentSize, height, fragmentSize)
    );
    fragmentShape.setMargin(margin);

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(
      new Ammo.btVector3(
        fragment.position.x,
        fragment.position.y,
        fragment.position.z
      )
    );
    transform.setRotation(
      new Ammo.btQuaternion(
        fragment.quaternion.x,
        fragment.quaternion.y,
        fragment.quaternion.z,
        fragment.quaternion.w
      )
    );

    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    fragmentShape.calculateLocalInertia(fragmentMass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
      fragmentMass,
      motionState,
      fragmentShape,
      localInertia
    );
    const fragmentBody = new Ammo.btRigidBody(rbInfo);
    fragmentBody.setFriction(0.5);
    fragmentBody.setActivationState(4);

    // Heredar velocidad del plato + explosión radial
    const explosionDir = new THREE.Vector3(
      Math.cos(offsetAngle),
      (Math.random() - 0.5) * 0.5,
      Math.sin(offsetAngle)
    );
    const explosionForce = 4 + Math.random() * 3;

    fragmentBody.setLinearVelocity(
      new Ammo.btVector3(
        vel.x() + explosionDir.x * explosionForce,
        vel.y() + explosionDir.y * explosionForce,
        vel.z() + explosionDir.z * explosionForce
      )
    );

    fragmentBody.setAngularVelocity(
      new Ammo.btVector3(
        angVel.x() + (Math.random() - 0.5) * 15,
        angVel.y() + (Math.random() - 0.5) * 15,
        angVel.z() + (Math.random() - 0.5) * 15
      )
    );

    fragment.userData.physicsBody = fragmentBody;
    physicsWorld.addRigidBody(fragmentBody);
    scene.add(fragment);
    rigidBodies.push(fragment);
  }

  // Eliminar plato original
  physicsWorld.removeRigidBody(plateBody);
  scene.remove(plate);
  const index = rigidBodies.indexOf(plate);
  if (index > -1) rigidBodies.splice(index, 1);
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1),
    material
  );
  //Estructura geométrica de colisión
  //Crea caja orientada en el espacio, especificando dimensiones
  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  //Margen para colisione
  shape.setMargin(margin);

  createRigidBody(object, shape, mass, pos, quat);

  return object;
}

function createCylinderWithPhysics(radius, height, mass, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 16),
    material
  );
  const shape = new Ammo.btCylinderShape(
    new Ammo.btVector3(radius, height * 0.5, radius)
  );
  shape.setMargin(margin);
  createRigidBody(object, shape, mass, pos, quat);
  return object;
}

// Creación de cuerpo rígido, con masa, sujeto a fuerzas, colisiones...
function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
  //Posición
  if (pos) {
    object.position.copy(pos);
  } else {
    pos = object.position;
  }
  //Cuaternión, es decir orientación
  if (quat) {
    object.quaternion.copy(quat);
  } else {
    quat = object.quaternion;
  }
  //Matriz de transformación
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);
  //Inercia inicial y parámetros de rozamiento, velocidad
  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);
  //Crea el cuerpo
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(0.5);

  if (mass > 0) {
    // Umbral de velocidad para activar CCD
    body.setCcdMotionThreshold(0.1);
    // Radio de la esfera de detección (usa el radio más pequeño del objeto)
    body.setCcdSweptSphereRadius(0.05);
  }

  if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }

  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  //Enlaza primitiva gráfica con física
  object.userData.physicsBody = body;
  object.userData.collided = false;

  scene.add(object);
  //Si tiene masa
  if (mass > 0) {
    rigidBodies.push(object);
    // Disable deactivation
    body.setActivationState(4);
  }
  //Añadido al universo físico
  physicsWorld.addRigidBody(body);

  return body;
}

//Evento de ratón
function initInput() {
  window.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      createClayPigeon();
    }
  });

  window.addEventListener("pointerdown", function (event) {
    //Coordenadas del puntero
    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    // Crea bola como cuerpo rígido y la lanza según coordenadas de ratón
    const ballMass = 50;
    const ballRadius = 0.5;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 14, 10),
      ballMaterial
    );
    ball.castShadow = true;
    ball.receiveShadow = true;
    //Ammo
    //Estructura geométrica de colisión esférica
    const ballShape = new Ammo.btSphereShape(ballRadius);
    ballShape.setMargin(margin);
    pos.copy(raycaster.ray.direction);
    pos.add(raycaster.ray.origin);
    quat.set(0, 0, 0, 1);
    const ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);

    pos.copy(raycaster.ray.direction);
    pos.multiplyScalar(150);
    ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);

  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);

  renderer.render(scene, camera);
}

function updatePhysics(deltaTime) {
  // Avanza la simulación en función del tiempo
  physicsWorld.stepSimulation(deltaTime, 10);

  // AÑADIR - Detectar colisiones entre bala y plato
  const numManifolds = dispatcher.getNumManifolds();
  for (let i = 0; i < numManifolds; i++) {
    const contactManifold = dispatcher.getManifoldByIndexInternal(i);
    const numContacts = contactManifold.getNumContacts();

    if (numContacts > 0) {
      const rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
      const rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);

      // Buscar si alguno de los cuerpos es un plato
      let plate = null;
      let impactPoint = null;

      for (let j = 0; j < rigidBodies.length; j++) {
        const obj = rigidBodies[j];
        if (obj.userData.isPlate && !obj.userData.broken) {
          if (
            obj.userData.physicsBody === rb0 ||
            obj.userData.physicsBody === rb1
          ) {
            plate = obj;

            // Obtener punto de impacto
            const contact = contactManifold.getContactPoint(0);
            const posB = contact.getPositionWorldOnB();
            impactPoint = new THREE.Vector3(posB.x(), posB.y(), posB.z());
            break;
          }
        }
      }

      // Si encontramos un plato, verificar fuerza y romperlo
      if (plate && impactPoint) {
        const contact = contactManifold.getContactPoint(0);
        const impulse = contact.getAppliedImpulse();

        if (impulse > 5) {
          // Umbral de fuerza para romper
          breakPlateIntoFragments(plate, impactPoint);
        }
      }
    }
  }

  // Actualiza cuerpos rígidos (código existente sin cambios)
  for (let i = 0, il = rigidBodies.length; i < il; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();

    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

      objThree.userData.collided = false;
    }
  }
}
