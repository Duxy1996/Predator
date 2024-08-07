let scene        = new THREE.Scene();
let ambientLight = new THREE.AmbientLight( 0xffffff, 1 );

heighValue = Math.random() * 40;

// MQ-9 Reaper de la USAF.

// MAX weight 4760

const wingSpan      = 16.8;
const airDensity    = 75.6;
const gravityEffort  = 31360; // 3200 kg x 9.8

terrainLoader = new Terrain(220.0, heighValue, 600.0, 600.0, 1000.0, 1000.0);

let planeTerrain = terrainLoader.initTerrain()

let releasedGBULCheck = false;
let releasedGBURCheck = false;
let releasedGBUL;
let releasedGBUR;

let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
let cameraDrone = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );

cameraDrone.position.z = -1;
camera.position.z = 4;

var direction;

camera.add( listener );
scene.add( planeTerrain );
scene.add( ambientLight );

document.getElementById("throttle").value = 50;

var commandedThrust = document.getElementById("throttle").value;
var currentThrust   = 50;

var renderer  = new THREE.WebGLRenderer({antialias:true});
var controls  = new THREE.OrbitControls( camera, renderer.domElement );

/// limit the user interaction to 20m. Enough to avoid to see the horizont.
controls.maxDistance = 30;

let pauseSimulation = true;
let droneCrashed    = false;

setTimeout(function(){pauseSimulation = false;}, 4000);

var holdHeading = false;

renderer.setClearColor("#5566FF");

renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

var dirs = [];
var parts = [];

var isPropeller;

var realPitch    = 0;
var realRoll     = 0;
var headingCommanded = 0;

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

new Promise(function(resolve) {
  loaderMTLTexture(resolve ,path, fileName, bodyAircraft, loadAircraft );
}).then(function(result) {
  new Promise(function(resolve) {
    loaderMTLTexture(resolve ,path, weaponR, threeObject, loadWithPivot, helperPivoteGBURRef );
  }).then(function(result) {
    new Promise(function(resolve) {
      loaderMTLTexture(resolve ,path, weaponL, GBUObjectL, loadWithPivot, helperPivoteGBULRef );
    }).then(function(result) {
      new Promise(function(resolve) {
        loaderMTLTexture(resolve ,path, propT, threeObject, loadPropeller );
      }).then(function(result) {
        new Promise(function(resolve) {
          loaderMTLTexture(resolve ,path, gearF, gearObject, loadWithPivot, helperPivotGearFRef );
        }).then(function(result) {
          new Promise(function(resolve) {
            loaderMTLTexture(resolve ,path, gearL, gearObjectR, loadWithPivot, helperPivotGearRRef );
          }).then(function(result) {
            new Promise(function(resolve) {
              loaderMTLTexture(resolve ,path, gearR, gearObjectL, loadWithPivot, helperPivotGearLRef);
            }).then(function(result) {
              scene.add( body );
            });
          });
        });
      });
    });
  });
});

var sphereHelper = [pivotFactory()];

function launchGBU() {
  if (!releasedGBUL) {
    releasedGBULCheck = true;
    releasedGBUL = helperPivoteGBULRef[0].children[0];

    let position = new THREE.Vector3();
    releasedGBUL.getWorldPosition(position);

    helperPivoteGBULRef[0].remove(releasedGBUL);

    releasedGBUL.position.x = position.x;
    releasedGBUL.position.y = position.y;
    releasedGBUL.position.z = position.z;

    releasedGBUL.rotation.x = body.rotation.x;
    releasedGBUL.rotation.y = body.rotation.y;
    releasedGBUL.rotation.z = body.rotation.z;

    releasedGBUL.scale.x = 10;
    releasedGBUL.scale.y = 10;
    releasedGBUL.scale.z = 10;

    parts.push(new DirectionalExplosion(position.x, position.y, position.z, direction));

    scene.add(releasedGBUL);
    return;
  }

  if(!releasedGBUR)
    {
      releasedGBURCheck = true;
      releasedGBUR = helperPivoteGBURRef[0].children[0];

      let position = new THREE.Vector3();
      releasedGBUR.getWorldPosition(position);

      helperPivoteGBURRef[0].remove(releasedGBUR);

      releasedGBUR.position.x = position.x;
      releasedGBUR.position.y = position.y;
      releasedGBUR.position.z = position.z;

      releasedGBUR.rotation.x = body.rotation.x;
      releasedGBUR.rotation.y = body.rotation.y;
      releasedGBUR.rotation.z = body.rotation.z;

      releasedGBUR.scale.x = 10;
      releasedGBUR.scale.y = 10;
      releasedGBUR.scale.z = 10;

      parts.push(new DirectionalExplosion(position.x, position.y, position.z, direction));

      scene.add(releasedGBUR);
      return;
    }
}

function onLoad()
{
  //console.log("Loaded");
}

function onError()
{
  //console.log("Error");
}

function apUpdate() {
  if(bodyAircraft[0] != undefined)
  {
    if (holdHeading) {
      if ( bodyAircraft[0].rotation.x < 0 )
      {
        let rotationScale = 0.00001;
        if (Math.abs(bodyAircraft[0].rotation.x) < 0.1 ) {rotationScale = 0;}
        if (realPitch > 0) {rotationScale = rotationScale / (timesAp * 10);}
        realPitch += rotationScale;
      }
      if ( bodyAircraft[0].rotation.x > 0 )
      {
        let rotationScale = 0.00001;
        if (Math.abs(bodyAircraft[0].rotation.x) < 0.1 ) {rotationScale = 0;}
        if (realPitch < 0) {rotationScale = rotationScale / (timesAp * 10);}
        realPitch -= rotationScale;
      }
      if ( bodyAircraft[0].rotation.z < 0 )
      {
        let rotationScale = 0.00001;
        if (Math.abs(bodyAircraft[0].rotation.z) < 0.1 ) {rotationScale = 0;}
        if (realRoll > 0) {rotationScale = rotationScale / (timesAp * 10);}
        realRoll += rotationScale;
      }
      if ( bodyAircraft[0].rotation.z > 0 )
      {
        let rotationScale = 0.00001;
        if (Math.abs(bodyAircraft[0].rotation.z) < 0.1 ) {rotationScale = 0;}
        if (realRoll < 0) {rotationScale = rotationScale / (timesAp * 10);}
        realRoll -= rotationScale;
      }
      timesAp += 1;
    }
    timesAp = 1;
  }

  if (realPitch < 0)
  {
    realPitch = realPitch + 0.00001;
  }

  if (realPitch > 0)
  {
    realPitch = realPitch - 0.00001;
  }

  if (realRoll < 0)
    {
      realRoll = realRoll + 0.00001;
    }

    if (realRoll > 0)
    {
      realRoll = realRoll - 0.00001;
    }
}

function mapValues(value, in_min, in_max, out_min, out_max) {
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function getClCoefficient(angleOfAttak) {
  angleOfAttak = angleOfAttak * 90;
  if (angleOfAttak > 80) {
    return -0.01;
  }
  if (angleOfAttak > 45) {
    return 0.01;
  }
  if (angleOfAttak > 35) {
    return mapValues(angleOfAttak, 36, 45, 0.05, 0.01);
  }
  if (angleOfAttak > 10) {
    return mapValues(angleOfAttak, 11, 35, 0.2, 0.05);
  }
  if (angleOfAttak > 5) {
    return 0.15;
  }
  return 0.1;
}

function stallValue(currentSpeed, angleOfAttak) {

  let siSpeed = currentSpeed * 0.27778;

  let clCoefficient = getClCoefficient(angleOfAttak);
  let liftCoeficient = (siSpeed * siSpeed * wingSpan * clCoefficient * airDensity) / 2; // is on newtons

  let stallState = 0;
  if (liftCoeficient < gravityEffort) {
    stallState = (liftCoeficient - gravityEffort) / 3200; // Force/mass = acceleration
  }
  return stallState;
}

function updateThrust() {
  commandedThrust = document.getElementById("throttle").value;

  if (commandedThrust > currentThrust)
  {
    currentThrust = currentThrust + 0.015;
  }

  if (commandedThrust < currentThrust)
  {
    currentThrust = currentThrust - 0.015;
  }

  if(currentThrust < 0)
  {
    currentThrust = 0;
  }

  generalThrust = 0.0005 * currentThrust;

  return generalThrust;
}

function updateBody() {

  if (body.position != undefined)
  {
    direction = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( body.quaternion );

    let generalThrust = updateThrust();

    currentSpeed = Math.round(generalThrust * 43400) / 10;

    if (currentSpeed < 0)
    {
      currentSpeed = Math.abs(currentSpeed);
    }

    let stallState = stallValue(currentSpeed, direction.y) / (450); // acceleration / time. stallState negative

    document.getElementById("speedMeter").innerHTML = currentSpeed + "\n Km/h";
    document.getElementById("rollRateNumber").innerHTML = Math.round(realRoll / 0.0005 * 10) / 10;
    document.getElementById("pitchRateNumber").innerHTML = Math.round(realPitch / 0.0005 * 10) / 10;

    let fallingForce = 0;

    if (direction.y < 0) {
      currentThrust += Math.abs(gravityEffort * Math.sin(direction.y)) / 100000;
    }

    if (stallState < 0 ) {
      currentThrust += stallState;
    }

    body.position.x += direction.x * generalThrust;
    body.position.y += direction.y * generalThrust + stallState;
    body.position.z += direction.z * generalThrust;

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

    bodyAircraft[0].rotateX( realPitch );
    bodyAircraft[0].rotateZ( realRoll );
    bodyAircraft[0].add(helperPivoteGBULRef[0]);
    bodyAircraft[0].add(helperPivotGearFRef[0]);
    bodyAircraft[0].add(helperPivotGearLRef[0]);
    bodyAircraft[0].add(helperPivotGearRRef[0]);
    bodyAircraft[0].add(helperPivoteGBURRef[0]);
    bodyAircraft[0].add(sphereHelper[0]);
    bodyAircraft[0].add(sphere)
  }
}

var render = function () {

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


  if (releasedGBULCheck) {
    if (releasedGBUL != undefined) {
      releasedGBUL.position.z += 0.23 * direction.z;
      releasedGBUL.position.y += 0.23 * direction.y;
      releasedGBUL.position.x += 0.23 * direction.x;
    }
  }

  if (releasedGBURCheck) {
    if (releasedGBUR != undefined) {
      releasedGBUR.position.z += 0.23 * direction.z;
      releasedGBUR.position.y += 0.23 * direction.y;
      releasedGBUR.position.x += 0.23 * direction.x;
    }
  }

  requestAnimationFrame( render );

  if (!pauseSimulation)
  {
    controls.update();

    if (!droneCrashed) {
      updateBody();

      landingGearUpdate(gearUP, gearObject[0], gearObjectR[0], gearObjectL[0]);

      apUpdate();
    }

  }

  renderer.render(scene, camera);
};

window.addEventListener('resize', onWindowResize, false );
window.addEventListener('keypress', logKey, false);
window.requestAnimationFrame(render);

function logKey(e)
{
  let G_KEYBOARD = 103;
  switch (e.keyCode)
  {
    case G_KEYBOARD:
      gearChange();
      break;
    case 119:
      realPitch -=0.0005
      break;
    case 115:
      realPitch +=0.0005
      break;
    case 97:
      realRoll +=0.0005
      break;
    case 100:
      realRoll -=0.0005
      break;
  }
}

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
  realPitch = Math.max(realPitch, -0.005);
}

function pitchDown()
{
  realPitch += 0.0005;
  realPitch = Math.min(realPitch, 0.005);
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
