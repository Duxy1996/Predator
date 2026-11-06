
let scene        = new THREE.Scene();
let ambientLight = new THREE.AmbientLight( 0xffffff, 0.55 );
let sunlight = new THREE.DirectionalLight( 0xffffff, 0.85 );

terrainHeight = 32 + Math.random() * 8;

// MQ-9 Reaper of the U.S. Air Force.

// MAX weight 4760

terrain = new Terrain(220.0, terrainHeight, 600.0, 600.0, 1500.0, 1500.0);

let terrainMesh = terrain.initTerrain()
sunlight.position.set(-180, 260, 120);

let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
let cameraDrone = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );

cameraDrone.position.z = -1;
camera.position.z = 4;

var aircraftDirection = {x: 1, y:0, z:0};
var weaponDirection = {x: 1, y:0, z:0};

camera.add( listener );
scene.add( terrainMesh );
scene.add( ambientLight );
scene.add( sunlight );
scene.fog = new THREE.Fog(0x9bb8c9, 250, 1200);

document.getElementById("throttle").value = 50;

var renderer  = new THREE.WebGLRenderer({antialias:true});
var controls  = new THREE.OrbitControls( camera, renderer.domElement );

// Limit camera interaction to 30 m to keep the horizon out of view.
controls.maxDistance = 30;

let isSimulationPaused = true;
let hasAircraftCrashed    = false;

var isHeadingHeld = false;

renderer.setClearColor("#9bb8c9");

renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

var isAircraftFullyLoaded = false;


var explosionParts = [];

var isPropellerLoaded;

var currentHeading      = 0.0;
var pitchInput        = 0.0;
var rollInput         = 0.0;
var commandedHeading = 0.0;

var path      = './objects/MQ-9-Predator/';

var rightBombModelName   = 'Right-GBU';
var leftBombModelName   = 'Left-GBU';
var propellerModelName     = 'Back-Prop';
var frontWheelModelName     = 'Front-wheel';
var leftWheelModelName     = 'Left-wheel';
var rightWheelModelName     = 'Right-wheel';
var aircraftObjectScale = 10;
var isAircraftSelectionStarted = false;
var aircraftOptions = {
  predator: {
    label: 'Predator MQ-9',
    path: './objects/MQ-9-Predator/',
    file: 'Vehicle',
    scale: 10,
    hasMaterials: true
  },
  c101: {
    label: 'CASA C-101',
    path: './objects/C-101/',
    file: 'FixedWing.C-101.obj',
    scale: 0.2,
    hasMaterials: false
  }
};

var aircraftObject         = [];
var accessoryPivots  = [];
var loadedAircraftObjects = [];
var frontWheelObjects   = [];
var leftWheelObjects  = [];
var rightWheelObjects  = [];
let leftBombObjects   = [];

// Initial flight state for the simulation.
var aircraftPosition     = {x: 0, y: 10, z: 0}
var aircraftVelocity     = {x: 80, y: 0, z: 0}
// Tune the defaults here, for example: new FlightModel({ maxThrust: 11000, wingArea: 24 }).
var flightModel      = new FlightModel();

var isLandingGearUp       = true;

var timesAp = 1;

var leftBombPivot = pivotFactory(0, 0, 0);
var leftBombPivots = [leftBombPivot];

var rightBombPivot = pivotFactory(0, 0, 0);
var rightBombPivots = [rightBombPivot];

var frontWheelPivot = pivotFactory(0.0043, -0.01, -0.035);
var frontWheelPivots = [frontWheelPivot];

var leftWheelPivot = pivotFactory(0, -0.002, 0.020);
var leftWheelPivots = [leftWheelPivot];

var rightWheelPivot = pivotFactory(0.01, -0.002, 0.020);
var rightWheelPivots = [rightWheelPivot];

function loadModel(file, objects, callback, pivot, modelPath) {
  return new Promise(function(resolve, reject) {
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader
      .setPath(modelPath || path)
      .load(
        file + '.mtl',
        function(material) {
          material.preload();
          loadObjModel(modelPath || path, file + '.obj', material, objects, callback, pivot)
            .then(resolve, reject);
        },
        undefined,
        reject
      );
  });
}

function loadSelectedAircraft(aircraft) {
  aircraftObjectScale = aircraft.scale;

  if (aircraft.hasMaterials) {
    return loadModel(aircraft.file, loadedAircraftObjects, loadAircraft, undefined, aircraft.path);
  }

  return loadObjModel(aircraft.path, aircraft.file, undefined, loadedAircraftObjects, loadAircraft);
}

function startSimulation(modelName) {
  if (isAircraftSelectionStarted || !Object.prototype.hasOwnProperty.call(aircraftOptions, modelName)) {
    return;
  }

  isAircraftSelectionStarted = true;
  var selector = document.getElementById("model-selector");
  var status = document.getElementById("model-selector-status");
  var buttons = selector.querySelectorAll("button");
  var aircraft = aircraftOptions[modelName];

  buttons.forEach(function(button) {
    button.disabled = true;
  });
  status.textContent = "Loading " + aircraft.label + "...";

  loadSelectedAircraft(aircraft)
    .then(function() {
      return Promise.all([
        loadModel(rightBombModelName, accessoryPivots, loadWithPivot, rightBombPivots),
        loadModel(leftBombModelName, leftBombObjects, loadWithPivot, leftBombPivots),
        loadModel(propellerModelName, accessoryPivots, loadPropeller),
        loadModel(frontWheelModelName, frontWheelObjects, loadWithPivot, frontWheelPivots),
        loadModel(leftWheelModelName, leftWheelObjects, loadWithPivot, leftWheelPivots),
        loadModel(rightWheelModelName, rightWheelObjects, loadWithPivot, rightWheelPivots)
      ]);
    })
    .then(finishAircraftLoading)
    .then(function() {
      status.textContent = "";
      selector.hidden = true;
      setTimeout(function() {
        isSimulationPaused = false;
      }, 4000);
    })
    .catch(function(error) {
      console.error("Failed to load " + aircraft.label + ".", error);
      status.textContent = "Failed to load " + aircraft.label + ". Check the console.";
      buttons.forEach(function(button) {
        button.disabled = false;
      });
      isAircraftSelectionStarted = false;
    });
}

function finishAircraftLoading() {
  isAircraftFullyLoaded = true;
  loadedAircraftObjects[0].add(leftBombPivots[0]);
  loadedAircraftObjects[0].add(frontWheelPivots[0]);
  loadedAircraftObjects[0].add(rightWheelPivots[0]);
  loadedAircraftObjects[0].add(leftWheelPivots[0]);
  loadedAircraftObjects[0].add(rightBombPivots[0]);
  loadedAircraftObjects[0].add(propellerAssemblyPivot[0]);
  loadedAircraftObjects[0].add(sphere);
  aircraftObject.rotateX(5 * degreesToRadians);
  scene.add(aircraftObject);
}

var propellerAssemblyPivot = [pivotFactory()];

function onLoad()
{
  //console.log("Loaded");
}

function onError()
{
  //console.log("Error");
}

function updateBody(generalThrust) {

  if (aircraftObject.position != undefined)
  {
    aircraftDirection = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( aircraftObject.quaternion );
    weaponDirection = aircraftDirection;
    aircraftDirection = {x: aircraftDirection.z * -1, y: aircraftDirection.y, z: aircraftDirection.x};

    currentSpeed = Math.round(generalThrust * 2170) / 10;

    let velocityMagnitudeXZ = Math.sqrt(
      aircraftVelocity.x * aircraftVelocity.x + aircraftVelocity.z * aircraftVelocity.z
    );

    document.getElementById("speedMeter").innerHTML = Math.round(velocityMagnitudeXZ * 60.0 * 60.0 / 1000.0 * 10.0) / 10.0 + "\n Km/h";

    controls.target.z = aircraftObject.position.z;
    controls.target.x = aircraftObject.position.x;
    controls.target.y = aircraftObject.position.y;
  }

  if(isPropellerLoaded)
  {
    propellerAssemblyPivot[0].rotation.z -= 0.42;
  }

  if (loadedAircraftObjects.length > 0)
  {
    if (terrain.getTerrainElevation(loadedAircraftObjects[0].position)) {
      triggerAircraftCrash();
    }

  }
}

function explosionAnimation()
{
  for (let i = explosionParts.length - 1; i >= 0; i--) {
    const explosion = explosionParts[i];

    if (explosion.iterations >= explosion.lifetime) {
      explosion.endInteraction();
      explosionParts.splice(i, 1);
    } else {
      explosion.update();
    }
  }
}

function triggerAircraftCrash() {
  if (hasAircraftCrashed) {
    return;
  }

  const impactPosition = loadedAircraftObjects[0].position;
  const impactHeight = terrain.getTerrainHeight(impactPosition);

  explosionParts.push(new ExplodeAnimation(
    impactPosition.x,
    Math.max(impactPosition.y, impactHeight) + 0.3,
    impactPosition.z
  ));
  hasAircraftCrashed = true;
  sound.stop();
}

var render = function() {

  setTimeout( function() {
    requestAnimationFrame( render );
  }, 1000 / 30 );

  if (isAircraftFullyLoaded)
  {
    if (!isSimulationPaused)
    {
      explosionAnimation()

      updateWeaponSystem();

      controls.update();

      if (!hasAircraftCrashed) {
        var generalThrust = flightModel.updateThrust(document.getElementById("throttle").value);

        flightModel.updateAttitude(aircraftObject, rollInput, pitchInput, 1/30);
        flightModel.simulateStep(aircraftPosition, aircraftVelocity, generalThrust, 1/30, aircraftObject);

        updateBody(generalThrust);

        landingGearUpdate(isLandingGearUp, frontWheelObjects[0], leftWheelObjects[0], rightWheelObjects[0]);
      }
    }
  }

  renderer.render(scene, camera);
};

window.addEventListener('resize', onWindowResize, false );
window.addEventListener('keypress', logKey, false);
window.requestAnimationFrame(render);

function onWindowResize()
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function loadWithPivot(object, accessoryPivots, pivot)
{
  object.position.z = -pivot[0].position.z;
  object.position.x = -pivot[0].position.x;
  object.position.y = -pivot[0].position.y;

  accessoryPivots.push(pivot[0]);

  pivot[0].add(object);
}

function loadObjModel(path, url, material, objects, callback, pivot) {
  return new Promise(function(resolve, reject) {
    var loader = new THREE.OBJLoader();

    if (material) {
      loader.setMaterials(material);
    }

    loader
      .setPath(path)
      .load(
        url,
        function(object) {
          callback(object, objects, pivot);
          resolve(object);
        },
        undefined,
        reject
      );
  });
}

function loadAircraft(object, objects)
{
  aircraftObject = object;
  aircraftObject.position.z = 0;
  aircraftObject.position.x = 0;
  aircraftObject.position.y = 0;
  aircraftObject.scale.set(aircraftObjectScale, aircraftObjectScale, aircraftObjectScale);
  aircraftObject.add(cameraDrone);
  objects.push(aircraftObject);
}

function loadPropeller(object, accessoryPivots)
{
  isPropellerLoaded = true;
  object.position.z = 0;
  object.position.x = -0.0043;
  object.position.y = 0.0015;
  propellerAssemblyPivot[0].position.x = 0.004
  propellerAssemblyPivot[0].add(object)
  scene.add(propellerAssemblyPivot[0])
}

function gearChange()
{
  isLandingGearUp = !isLandingGearUp;
  gearsound.play();
}

function cameraPosition()
{
  let cameraHelper = camera;
  camera           = cameraDrone;
  cameraDrone      = cameraHelper;
}

function setupFlightJoystick() {
  var joystick = document.getElementById("flight-joystick");
  var stick = document.getElementById("flight-joystick-stick");
  var activePointer = null;

  function centerJoystick() {
    stick.style.left = "50%";
    stick.style.top = "50%";
    pitchInput = 0;
    rollInput = 0;
  }

  function moveJoystick(event) {
    var bounds = joystick.getBoundingClientRect();
    var stickRadius = stick.offsetWidth / 2;
    var maxOffsetX = bounds.width / 2 - stickRadius;
    var maxOffsetY = bounds.height / 2 - stickRadius;
    var offsetX = event.clientX - (bounds.left + bounds.width / 2);
    var offsetY = event.clientY - (bounds.top + bounds.height / 2);
    var normalizedX = offsetX / maxOffsetX;
    var normalizedY = offsetY / maxOffsetY;
    var magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);

    if (magnitude > 1) {
      normalizedX /= magnitude;
      normalizedY /= magnitude;
    }

    stick.style.left = "calc(50% + " + normalizedX * maxOffsetX + "px)";
    stick.style.top = "calc(50% + " + normalizedY * maxOffsetY + "px)";
    rollInput = -normalizedX;
    pitchInput = normalizedY;
  }

  joystick.addEventListener("pointerdown", function(event) {
    if (activePointer !== null) {
      return;
    }

    activePointer = event.pointerId;
    joystick.setPointerCapture(activePointer);
    moveJoystick(event);
    event.preventDefault();
  });

  joystick.addEventListener("pointermove", function(event) {
    if (event.pointerId === activePointer) {
      moveJoystick(event);
    }
  });

  function releaseJoystick(event) {
    if (event.pointerId !== activePointer) {
      return;
    }

    activePointer = null;
    centerJoystick();
  }

  joystick.addEventListener("pointerup", releaseJoystick);
  joystick.addEventListener("pointercancel", releaseJoystick);
  joystick.addEventListener("lostpointercapture", releaseJoystick);
}

function heading()
{
  isHeadingHeld = !isHeadingHeld
  if (!isHeadingHeld)
  {
    rollInput = 0;
    pitchInput = 0;
  }
}

setupFlightJoystick();

render();
