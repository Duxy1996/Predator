
let scene        = new THREE.Scene();
let ambientLight = new THREE.AmbientLight( 0xffffff, 1 );

heighValue = Math.random() * 40;

// MQ-9 Reaper de la USAF.

// MAX weight 4760

const wingSpan      = 20.1;

terrainLoader = new Terrain(220.0, heighValue, 600.0, 600.0, 1500.0, 1500.0);

let planeTerrain = terrainLoader.initTerrain()

let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
let cameraDrone = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );

cameraDrone.position.z = -1;
camera.position.z = 4;

var directionGlobal = {x: 1, y:0, z:0};
var weaponDirection = {x: 1, y:0, z:0};

camera.add( listener );
scene.add( planeTerrain );
scene.add( ambientLight );

document.getElementById("throttle").value = 50;

var renderer  = new THREE.WebGLRenderer({antialias:true});
var controls  = new THREE.OrbitControls( camera, renderer.domElement );

/// limit the user interaction to 30m. Enough to avoid to see the horizont.
controls.maxDistance = 30;

let pauseSimulation = true;
let droneCrashed    = false;

setTimeout(function(){pauseSimulation = false;}, 4000);

var holdHeading = false;

renderer.setClearColor("#5566FF");

renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

var fullAircraftLoaded = false;


var parts = [];

var isPropeller;

var realHeading      = 0.0;
var realPitch        = 0.0;
var pitchBackp       = 0.0;
var realRoll         = 0.0;
var rollBackup       = 0.0;
var headingCommanded = 0.0;

var path      = './objects/MQ-9-Predator/';

var fileName  = 'Vehicle';
var weaponR   = 'Right-GBU';
var weaponL   = 'Left-GBU';
var propT     = 'Back-Prop';
var gearF     = 'Front-wheel';
var gearL     = 'Left-wheel';
var gearR     = 'Right-wheel';

var body         = [];
var threeObject  = [];
var bodyAircraft = [];
var gearObject   = [];
var gearObjectR  = [];
var gearObjectL  = [];
let GBUObjectL   = [];

// These are the initial values, this like the "Santo grial" og this simulation
var testPosition     = {x: 0, y: 10, z: 0}
var testVelocity     = {x: 80, y: 0, z: 0}
var testAcceleration = {x: 0, y: 0, z: 0}
var flightModel      = new FlightModel();

var gearUP       = true;

var timesAp = 1;

var helperPivoteGBUL = pivotFactory(0, 0, 0);
var helperPivoteGBULRef = [helperPivoteGBUL];

var helperPivoteGBUR = pivotFactory(0, 0, 0);
var helperPivoteGBURRef = [helperPivoteGBUR];

var helperPivotGearF = pivotFactory(0.0043, -0.01, -0.035);
var helperPivotGearFRef = [helperPivotGearF];

var helperPivotGearR = pivotFactory(0, -0.002, 0.020);
var helperPivotGearRRef = [helperPivotGearR];

var helperPivotGearL = pivotFactory(0.01, -0.002, 0.020);
var helperPivotGearLRef = [helperPivotGearL];

function loadModel(file, objects, callback, pivot) {
  return new Promise(function(resolve) {
    loaderMTLTexture(resolve, path, file, objects, callback, pivot);
  });
}

function finishAircraftLoading() {
  if (terrainLoader.getTerrainElevation(testPosition)) {
    console.log("DEP");
    window.location.reload();
  }

  fullAircraftLoaded = true;
  bodyAircraft[0].add(helperPivoteGBULRef[0]);
  bodyAircraft[0].add(helperPivotGearFRef[0]);
  bodyAircraft[0].add(helperPivotGearLRef[0]);
  bodyAircraft[0].add(helperPivotGearRRef[0]);
  bodyAircraft[0].add(helperPivoteGBURRef[0]);
  bodyAircraft[0].add(sphereHelper[0]);
  bodyAircraft[0].add(sphere);
  body.rotateX(5 * DEGREES_TO_RADIANS);
  pitchBackp += 5 * DEGREES_TO_RADIANS;
  scene.add(body);
}

loadModel(fileName, bodyAircraft, loadAircraft)
  .then(function() {
    return loadModel(weaponR, threeObject, loadWithPivot, helperPivoteGBURRef);
  })
  .then(function() {
    return loadModel(weaponL, GBUObjectL, loadWithPivot, helperPivoteGBULRef);
  })
  .then(function() {
    return loadModel(propT, threeObject, loadPropeller);
  })
  .then(function() {
    return loadModel(gearF, gearObject, loadWithPivot, helperPivotGearFRef);
  })
  .then(function() {
    return loadModel(gearL, gearObjectR, loadWithPivot, helperPivotGearRRef);
  })
  .then(function() {
    return loadModel(gearR, gearObjectL, loadWithPivot, helperPivotGearLRef);
  })
  .then(finishAircraftLoading);

var sphereHelper = [pivotFactory()];

function onLoad()
{
  //console.log("Loaded");
}

function onError()
{
  //console.log("Error");
}

function updateBody(generalThrust) {

  if (body.position != undefined)
  {
    directionGlobal = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( body.quaternion );
    weaponDirection = directionGlobal;
    directionGlobal = {x: directionGlobal.z * -1, y: directionGlobal.y, z: directionGlobal.x};

    currentSpeed = Math.round(generalThrust * 2170) / 10;

    let velocityMagnitudeXZ = Math.sqrt(
      testVelocity.x * testVelocity.x + testVelocity.z * testVelocity.z
    );

    document.getElementById("speedMeter").innerHTML = Math.round(velocityMagnitudeXZ * 60.0 * 60.0 / 1000.0 * 10.0) / 10.0 + "\n Km/h";
    document.getElementById("rollRateNumber").innerHTML = Math.round(rollBackup * RADIANS_TO_DEGREES * 10) / 10;
    document.getElementById("pitchRateNumber").innerHTML = Math.round(pitchBackp * RADIANS_TO_DEGREES * 10) / 10;

    controls.target.z = body.position.z;
    controls.target.x = body.position.x;
    controls.target.y = body.position.y;
  }

  if(isPropeller)
  {
    sphereHelper[0].rotation.z -= 0.42;
  }

  if (bodyAircraft.length > 0)
  {
    if (terrainLoader.getTerrainElevation(bodyAircraft[0].position)) {
      parts.push(new ExplodeAnimation(bodyAircraft[0].position.x, bodyAircraft[0].position.y, bodyAircraft[0].position.z));
      droneCrashed = true;
      sound.stop();
    }

    body.rotateX( realPitch );
    pitchBackp += realPitch;
    body.rotateZ( realRoll );
    rollBackup += realRoll;
  }
}

function explosionAnimation()
{
  if (!droneCrashed) {
    if (bodyAircraft.length > 0) {
      if (terrainLoader.getTerrainElevation(bodyAircraft[0].position)) {
        parts.push(new ExplodeAnimation(bodyAircraft[0].position.x, bodyAircraft[0].position.y, bodyAircraft[0].position.z));
        droneCrashed = true;
        sound.stop();
      }
    }
  }

  var pCount = parts.length;
  while(pCount--) {
    if(parts[pCount].iterations < 500)
      {
        parts[pCount].update();
      }
    if(parts[pCount].iterations == 500)
      {
        parts[pCount].endInteraction();
      }
  }
}

var render = function() {

  setTimeout( function() {
    requestAnimationFrame( render );
  }, 1000 / 30 );

  if (fullAircraftLoaded)
  {
    if (!pauseSimulation)
    {
      explosionAnimation()

      updateWeaponSystem();

      controls.update();

      if (!droneCrashed) {
        var generalThrust = flightModel.updateThrust(document.getElementById("throttle").value);

        var testSituation = flightModel.simulateStep(testPosition, testVelocity, testAcceleration, wingSpan, 3200, directionGlobal, generalThrust, 1/30, body, rollBackup);

        testPosition = testSituation.position;
        testVelocity = testSituation.velocity;
        testAcceleration = testSituation.acceleration;

        updateBody(generalThrust);

        landingGearUpdate(gearUP, gearObject[0], gearObjectR[0], gearObjectL[0]);
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

function loadWithPivot(object, threeObject, pivot)
{
  object.position.z = -pivot[0].position.z;
  object.position.x = -pivot[0].position.x;
  object.position.y = -pivot[0].position.y;

  threeObject.push(pivot[0]);

  pivot[0].add(object);
}

function loadObjModel(path, url, material, threeObject, callback, pivot)
{
  let loader       = new THREE.OBJLoader();
  loader
  .setMaterials( material )
  .setPath( path )
  .load(
    url,
    function ( object )
    {
      callback(object, threeObject, pivot);
    },
    onLoad(),
    onError()
  );
}

function loaderMTLTexture(resolve, path, fileName, threeObject, callback, pivot)
{
  let mtlLoader    = new THREE.MTLLoader();
  mtlLoader
  .setPath( path )
  .load(
    fileName + '.mtl',
    function ( material )
    {
      material.preload();
      loadObjModel( path, fileName + '.obj', material, threeObject, callback, pivot );
      resolve(2);
    }
  );
}

function loadAircraft(object, threeObject)
{
  body = object;
  body.position.z = 0;
  body.position.x = 0;
  body.position.y = 0;
  body.scale.set(10, 10, 10);
  body.add(cameraDrone);
  threeObject.push(body);
}

function loadPropeller(object, threeObject)
{
  isPropeller = true;
  object.position.z = 0;
  object.position.x = -0.0043;
  object.position.y = 0.0015;
  sphereHelper[0].position.x = 0.004
  sphereHelper[0].add(object)
  scene.add(sphereHelper[0])
}

function gearChange()
{
  gearUP = !gearUP;
  gearsound.play();
}

function cameraPosition()
{
  let cameraHelper = camera;
  camera           = cameraDrone;
  cameraDrone      = cameraHelper;
}

function pitchUp()
{
  realPitch -= 0.0005;
}

function pitchDown()
{
  realPitch += 0.0005;
}

function rollRight()
{
  realRoll -= 0.0005
  realRoll = Math.max(realRoll, -0.01);
}

function rollLeft()
{
  realRoll += 0.0005
  realRoll = Math.min(realRoll, 0.01);
}

function heading()
{
  holdHeading = !holdHeading
  if (!holdHeading)
  {
    realRoll = 0;
    realPitch = 0;
  }
}

render();
