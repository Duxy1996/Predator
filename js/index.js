
var loader       = new THREE.OBJLoader();
var mtlLoader    = new THREE.MTLLoader();
var listener     = new THREE.AudioListener();
var scene        = new THREE.Scene();
var ambientLight = new THREE.AmbientLight( 0xffffff, 1 );

let plane = initTerrain()

let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
let cameraDrone = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );

cameraDrone.position.z = -1;
camera.position.z = 4;

camera.add( listener );
scene.add( plane );
scene.add( ambientLight );

document.getElementById("throttle").value = 50;
var commandedThrust = document.getElementById("throttle").value;
var currentThrust   = 50;

var renderer  = new THREE.WebGLRenderer({antialias:true});
var controls  = new THREE.OrbitControls( camera, renderer.domElement );
var raycaster = new THREE.Raycaster();

var holdHeading = false;
var locX = 0;
var locY = 0;

var mouse = new THREE.Vector2();

renderer.setClearColor("#5566FF");

renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

var geometry = new THREE.SphereGeometry( 0.005, 10, 10 );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00,
                                             side: THREE.DoubleSide,
                                             opacity: 0.0,
                                             transparent: true,
                                             depthWrite: false} );

function pivotFactory(x = 0, y = 0, z = 0)
{
  let tmpMesh = new THREE.Mesh( geometry, material )
  tmpMesh.position.z = z;
  tmpMesh.position.y = y;
  tmpMesh.position.x = x;
  return tmpMesh;
}

var aircarftList = []

var body = [];
var propeller;
var isPropeller;

var realPitch    = 0;
var realRoll     = 0;

var path      = './objects/MQ-9-Predator/';
var audiopath = './objects/MQ-9-Predator-Audio/Prop.mp3';
var gearpath  = './objects/MQ-9-Predator-Audio/gear.mp3';
var fileName  = 'Vehicle';
var weaponR   = 'Right-GBU';
var weaponL   = 'Left-GBU';
var propT     = 'Back-Prop';
var gearF     = 'Front-wheel';
var gearL     = 'Left-wheel';
var gearR     = 'Right-wheel';

var threeObject  = [];
var bodyAircraft = []
var gearObject   = [];
var gearObjectR  = [];
var gearObjectL  = [];

var gearUP       = true;
var maxFrontGear = 360;
var minFrontGear = 0
var isFrontGear  = false;


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
      loaderMTLTexture(resolve ,path, weaponL, threeObject, loadWithPivot, helperPivoteGBULRef );
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
              console.log("Loaded");
            });
          });
        });
      });
    });
  });
});

var sound     = new THREE.PositionalAudio( listener );
var gearsound = new THREE.PositionalAudio( listener );

var sphere       = pivotFactory();
var sphereHelper = [pivotFactory()];

sphere.rotation.y = 2 * Math.PI;

var audioLoader = new THREE.AudioLoader();

audioLoader.load( audiopath, function( buffer )
{
  sound.setBuffer( buffer );
  sound.setLoop( true );
  sound.setVolume( 0.7 );
  sphere.add( sound );
  sound.play();
});

audioLoader.load( gearpath, function( buffer )
{
  gearsound.setBuffer( buffer );
  gearsound.setLoop( false );
  gearsound.setVolume( 0.7 );
});

sound.setRefDistance( 1 );
sound.setDirectionalCone( 180, 250, 0.1 );

function onLoad()
{
  //console.log("Loaded");
}

function onError()
{
  //console.log("Error");
}

var render = function () {

  requestAnimationFrame( render );

  if (body.position != undefined)
  {
    let direction = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( body.quaternion );

    commandedThrust = document.getElementById("throttle").value;

    if (commandedThrust > currentThrust)
    {
      currentThrust = currentThrust + 0.05;
    }

    if (commandedThrust < currentThrust)
    {
      currentThrust = currentThrust - 0.05;
    }

    generalThrust = 0.0005 * currentThrust;

    currentSpeed = Math.round(generalThrust * 43400) / 10;

    document.getElementById("speedMeter").innerHTML = currentSpeed + "\n Km/h";

    let stallDelta  = 1;
    let stallDeltaM = 0;

    if (currentSpeed < 70)
    {
      stallDelta = -1.2;
      stallDeltaM = 0.005;
    }
    else if (currentSpeed < 80)
    {
      stallDelta = -1.0;
      stallDeltaM = 0.001;
    }
    else if (currentSpeed < 90)
    {
      //console.log("Caution STALL");
    }

    body.position.x += direction.x * generalThrust;
    body.position.y += direction.y * generalThrust * stallDelta - stallDeltaM;
    body.position.z += direction.z * generalThrust;

    controls.target.z = body.position.z;
    controls.target.x = body.position.x;
    controls.target.y = body.position.y;
  }

  controls.update();

  if(isPropeller)
  {
    sphereHelper[0].rotation.z -= 0.42;
  }

  if (bodyAircraft.length > 0)
  {
    bodyAircraft[0].rotateX( realPitch );
    bodyAircraft[0].rotateZ( realRoll );
    bodyAircraft[0].add(helperPivoteGBULRef[0]);
    bodyAircraft[0].add(helperPivotGearFRef[0]);
    bodyAircraft[0].add(helperPivotGearLRef[0]);
    bodyAircraft[0].add(helperPivotGearRRef[0]);
    bodyAircraft[0].add(helperPivoteGBURRef[0]);
    bodyAircraft[0].add(sphereHelper[0]);
    bodyAircraft[0].add(sphere)
    locX += realPitch;
    locY += realRoll;
  }

  if (isFrontGear)
  {
    if(gearUP)
    {
      if(gearObject[0] != undefined)
      {
        if (gearObject[0].rotation.x < 0)
        {
          gearObject[0].rotation.x += 0.006;
          gearObjectR[0].rotation.x += 0.0037;
          gearObjectR[0].rotation.z -= 0.0012;

          gearObjectL[0].rotation.x += 0.0037;
          gearObjectL[0].rotation.z += 0.0012;
        }
      }
    }
    else
    {
      if (gearObject[0].rotation.x > -2.5)
      {
        gearObject[0].rotation.x -= 0.006;
        gearObjectR[0].rotation.x -= 0.0037;
        gearObjectR[0].rotation.z += 0.0012;

        gearObjectL[0].rotation.x -= 0.0037;
        gearObjectL[0].rotation.z -= 0.0012;
      }
    }
  }

  if(bodyAircraft[0] != undefined)
  {
    if (holdHeading)
    {
      if ( locX < 0 )
      {
        let tmpPitch = -locX * 0.01;
        if (tmpPitch > 0.002)
        {
          tmpPitch = 0.002;
        }
        realPitch = tmpPitch;
      }
      if ( locX > 0 )
      {
        realPitch = -0.001;
      }

      if ( locY < 0 )
      {
        realRoll = +0.001;
      }
      if ( locY > 0 )
      {
        realRoll = -0.001;
      }
    }
  }

  renderer.render(scene, camera);
};

window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener('keypress', logKey, false);

function logKey(e)
{
  console.log(e.keyCode);
  switch (e.keyCode)
  {
    case 103:
      gearUP = !gearUP;
      gearsound.play();
      break;
    case 56:
      realPitch -=0.0001
      break;
    case 50:
      realPitch +=0.0001
      break;
    case 52:
      realRoll +=0.0001
      break;
    case 54:
      realRoll -=0.0001
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
  isFrontGear = true;

  object.position.z = -pivot[0].position.z;
  object.position.x = -pivot[0].position.x;
  object.position.y = -pivot[0].position.y;

  threeObject.push(pivot[0]);

  pivot[0].add(object);
}
window.requestAnimationFrame(render);

function loadObjModel(path, url, material, threeObject, callback, pivot)
{
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
  mtlLoader
  .setPath( path )
  .load(
    fileName + '.mtl',
    function ( material )
    {
      material.preload();
      loadObjModel( path, fileName + '.obj', material, threeObject, callback, pivot );
      resolve(2)
    }
  );
}

function loadAircraft(object, threeObject)
{
  body = object;
  body.position.z = 0;
  body.position.x = 0;
  body.position.y = 0;
  body.scale.set(10,10,10);
  body.add(cameraDrone);
  threeObject.push(body);
  scene.add( body );
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