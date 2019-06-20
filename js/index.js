
var loader    = new THREE.OBJLoader();

var mtlLoader = new THREE.MTLLoader();

var listener = new THREE.AudioListener();

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
camera.position.z = 4;
camera.add( listener );

var ambientLight = new THREE.AmbientLight( 0xffffff, 1 );

scene.add( ambientLight );

var controls = new THREE.OrbitControls( camera );

var renderer = new THREE.WebGLRenderer({antialias:true});

var raycaster = new THREE.Raycaster();

var mouse = new THREE.Vector2();

renderer.setClearColor("#5566FF");

renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

var aircarftList = []

var body = [];
var propeller;
var isPropeller;

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

var threeObject = [];
var gearObject = [];
var gearObjectR = [];
var gearObjectL = [];


var gearUP = true;
var maxFrontGear = 360;
var minFrontGear = 0
var isFrontGear = false;


setTimeout(function(){ loaderMTLTexture( path, fileName, threeObject ); }, 1000);
setTimeout(function(){ loaderMTLTexture( path, weaponR, threeObject ); }, 1500);
setTimeout(function(){ loaderMTLTexture( path, weaponL, threeObject ); }, 2000);
setTimeout(function(){ loaderMTLTexture( path, propT, threeObject, loadPropeller ); }, 2500);
setTimeout(function(){ loaderMTLTexture( path, gearF, gearObject, loadWithPivot ); }, 3000);
setTimeout(function(){ loaderMTLTexture( path, gearL, gearObjectR ); }, 3500);
setTimeout(function(){ loaderMTLTexture( path, gearR, gearObjectL ); }, 4000);

var sound     = new THREE.PositionalAudio( listener );
var gearsound = new THREE.PositionalAudio( listener );

var geometry = new THREE.SphereGeometry( 0.05, 10, 10 );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00,
                                             side: THREE.DoubleSide,
                                             opacity: 0.0,
                                             transparent: true,
                                             depthWrite: false} );

function pivotFactory()
{
  return new THREE.Mesh( geometry, material );
}

var sphere       = pivotFactory();
var sphereHelper = pivotFactory();

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

scene.add( sphere );

sound.setRefDistance( 1 );
sound.setDirectionalCone( 180, 250, 0.1 );

var helper = new THREE.PositionalAudioHelper( sound, 0.1 );
helper.rotation.y = 2 * Math.PI;
helper.scale.set(10,10,10);

function onLoad()
{
  console.log("Loaded");
}

function onError()
{
  console.log("Error");
}

var render = function () {
  requestAnimationFrame( render );
  if(isPropeller)
  {
    sphereHelper.rotation.z -= 0.42;
  }

  if (isFrontGear)
  {
    if(gearUP)
    {
      if (gearObject[0].rotation.x < 0)
      {
        gearObject[0].rotation.x += 0.006;
      }
    }
    else
    {
      if (gearObject[0].rotation.x > -2.5)
      {
        gearObject[0].rotation.x -= 0.006;
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
  console.log("DOWN");
}

function onmouseupF()
{
  console.log("UP");
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
  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( scene.children );

  for ( var i = 0; i < intersects.length; i++ )
  {
    intersects[ i ].object.material.color.set( 0xffff00 );
  }
  renderer.render( scene, camera );

  //scene.add(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000) );
}


window.requestAnimationFrame(render);


function loadObjModel(path, url, material, threeObject, callback)
{
  loader
  .setMaterials( material )
  .setPath( path )
  .load(
    url,
    function ( object )
    {
      callback(object, threeObject);
    },
    onLoad(),
    onError()
  );
}

function loaderMTLTexture(path, fileName, threeObject, callback = loadAircraft)
{
  mtlLoader
  .setPath( path )
  .load(
    fileName + '.mtl',
    function ( material )
    {
      material.preload();
      loadObjModel( path, fileName + '.obj', material, threeObject, callback );
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
  scene.add( object );
}

function loadPropeller(object, threeObject)
{
  isPropeller = true;
  object.position.z = 0;
  object.position.x = -0.043;
  object.position.y = 0.015;
  object.scale.set(10,10,10);
  sphereHelper.position.x = 0.04
  sphereHelper.add(object)
  scene.add(sphereHelper)
}

function loadWithPivot(object, threeObject)
{
  isFrontGear = true;

  var helperPivot = pivotFactory();
  helperPivot.position.z = -0.35;
  object.position.z      = +0.30;

  helperPivot.position.x = +0.043;
  object.position.x      = -0.043;

  helperPivot.position.y = -0.1;
  object.position.y      = +0.1;

  threeObject.push(helperPivot);

  helperPivot.add(object);

  object.scale.set(10,10,10);
  scene.add(helperPivot)
}

render();