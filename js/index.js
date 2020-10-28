
let speedY = 0;
let speedZ = 0;

var loader    = new THREE.OBJLoader();

var mtlLoader = new THREE.MTLLoader();

var listener = new THREE.AudioListener();

var scene = new THREE.Scene();

noise.seed(Math.random());

let resolution = 60;
let muntains = 6;

let columns = 500;
let rows    = 500;

let sizeX = 500;
let sizeY = 500;

var geometry = new THREE.PlaneGeometry( sizeX, sizeY, rows, columns );
var material = new THREE.MeshBasicMaterial( { color: 0xffffff, flatShading : THREE.FlatShading, side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
var plane = new THREE.Mesh( geometry, material );

plane.rotateX(-3.14 / 2);
plane.position.y = -6;

columns = columns + 1;
rows    = rows + 1;

for (let i = 0; i < columns; i=i+1)
{
  for (let j = 0; j < rows; j=j+1)
  {
    let offset = j + i * rows;
    let perlingVal = Math.abs(noise.simplex2(i/ resolution, j/ resolution)) * muntains;

    geometry.vertices[offset].z = perlingVal;

    let r_v = 0;
    let g_v = perlingVal / muntains;
    let b_v = 0;

    if (perlingVal < 1)
    {
      geometry.vertices[offset].z = 1 ;
      b_v = 1;
      g_v = 0;
    }

    if (perlingVal > 5)
    {
      r_v = 1;
      g_v = 1;
      b_v = 1;
    }

    if (offset < plane.geometry.faces.length / 2 + columns - 2)
    {
      plane.geometry.faces[offset * 2 + 1 - i * 2].color.setRGB(r_v, g_v, b_v);
      plane.geometry.faces[offset * 2 + 0 - i * 2].color.setRGB(r_v, g_v, b_v);
    }
  }
}

geometry.dynamic = true;
geometry.__dirtyVertices = true;
geometry.__dirtyNormals = true;

scene.add( plane );

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
camera.position.z = 4;
camera.add( listener );

var ambientLight = new THREE.AmbientLight( 0xffffff, 1 );

scene.add( ambientLight );

var controls = new THREE.OrbitControls( camera );

var renderer = new THREE.WebGLRenderer({antialias:true});

var raycaster = new THREE.Raycaster();

var time = 0;

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
  var tmpMesh = new THREE.Mesh( geometry, material )
  tmpMesh.position.z = z;
  tmpMesh.position.y = y;
  tmpMesh.position.x = x;
  return tmpMesh;
}

function getAxisBetweenTwoPoints(pointA,pointB)
{
  var posX = pointA.x - pointB.x;
  var posY = pointA.y - pointB.y;
  var posZ = pointA.z - pointB.z;

  var norm  = Math.sqrt(posX*posX+posY*posY+posZ*posZ);

  var axis  = new THREE.Vector3(posX/norm,posY/norm,posZ/norm);

  return axis;
}

var aircarftList = []

var body = [];
var propeller;
var isPropeller;

var realPitch =  0;
var realRoll  =  0;

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


var gearUP       = false;
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


setTimeout(function(){ loaderMTLTexture( path, fileName, bodyAircraft, loadAircraft ); }, 500);
setTimeout(function(){ loaderMTLTexture( path, weaponR, threeObject, loadWithPivot, helperPivoteGBURRef ); }, 1500);
setTimeout(function(){ loaderMTLTexture( path, weaponL, threeObject, loadWithPivot, helperPivoteGBULRef ); }, 2000);
setTimeout(function(){ loaderMTLTexture( path, propT, threeObject, loadPropeller ); }, 2500);
setTimeout(function(){ loaderMTLTexture( path, gearF, gearObject, loadWithPivot, helperPivotGearFRef ); }, 3000);
setTimeout(function(){ loaderMTLTexture( path, gearL, gearObjectR, loadWithPivot, helperPivotGearRRef ); }, 3500);
setTimeout(function(){ loaderMTLTexture( path, gearR, gearObjectL, loadWithPivot, helperPivotGearLRef); }, 4000);

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

//scene.add( sphere );

sound.setRefDistance( 1 );
sound.setDirectionalCone( 180, 250, 0.1 );

var helper = new THREE.PositionalAudioHelper( sound, 0.1 );
helper.rotation.y = 2 * Math.PI;
helper.scale.set(10,10,10);

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
    body.position.z -= 0.005;

    body.position.y += locX / 100;
    body.position.x -= locY / 500;

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
    locX += realPitch;
    bodyAircraft[0].rotateZ( realRoll );
    locY += realRoll;
    bodyAircraft[0].add(helperPivoteGBULRef[0]);
    bodyAircraft[0].add(helperPivotGearFRef[0]);
    bodyAircraft[0].add(helperPivotGearLRef[0]);
    bodyAircraft[0].add(helperPivotGearRRef[0]);
    bodyAircraft[0].add(helperPivoteGBURRef[0]);
    bodyAircraft[0].add(sphereHelper[0]);
    bodyAircraft[0].add(sphere)
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
        var tmpPitch = -locX * 0.01;
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
window.addEventListener( 'click' , getObject, false);
window.addEventListener( 'mousemove', onMouseMove, false );

window.addEventListener( 'mousedown', onmousedownF, false );
window.addEventListener( 'mouseup', onmouseupF, false );

window.addEventListener('keypress', logKey, false);

function onmousedownF()
{
  //console.log("DOWN");

}

function onmouseupF()
{
  //console.log("UP");

}

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

function onMouseMove( event )
{
  mouse.x = + ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function getObject()
{
  // raycaster.setFromCamera( mouse, camera );

  // var intersects = raycaster.intersectObjects( scene.children );

  // for ( var i = 0; i < intersects.length; i++ )
  // {
  //   intersects[ i ].object.material.color.set( 0xffff00 );
  // }
  // renderer.render( scene, camera );

  //scene.add(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000) );
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

function loaderMTLTexture(path, fileName, threeObject, callback, pivot)
{
  mtlLoader
  .setPath( path )
  .load(
    fileName + '.mtl',
    function ( material )
    {
      material.preload();
      loadObjModel( path, fileName + '.obj', material, threeObject, callback, pivot );
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
  threeObject.push(body)
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

function loadWithPivot(object, threeObject, pivot)
{
  isFrontGear = true;

  var helperPivot = pivot[0];
  object.position.z      = - helperPivot.position.z;
  object.position.x      = - helperPivot.position.x;
  object.position.y      = - helperPivot.position.y;

  threeObject.push(helperPivot);

  helperPivot.add(object);

  //object.scale.set(10,10,10);
  //scene.add(helperPivot)
}

function gearChange()
{
  gearUP = !gearUP;
  gearsound.play();
}

function pitchUp()
{
  realPitch -= 0.0005
}

function pitchDown()
{
  realPitch += 0.0005
}

function rollRight()
{
  realRoll -= 0.0005
}

function rollLeft()
{
  realRoll += 0.0005
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