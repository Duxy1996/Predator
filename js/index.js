
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
var gbu;
var isgbu;
var path     = './objects/MQ-9-Predator/';
var fileName = 'Vehicle';
var weaponR  = 'Right-GBU';
var weaponL  = 'Left-GBU';
var propT    = 'Back-Prop';

setTimeout(function(){ loaderMTLTexture( path, fileName ); }, 1100);
setTimeout(function(){ loaderMTLTexture( path, weaponR ); }, 1200);
setTimeout(function(){ loaderMTLTexture( path, weaponL ); }, 1300);
setTimeout(function(){ loaderMTLTexture( path, propT ); }, 1500);


var sound = new THREE.PositionalAudio( listener );

var geometry = new THREE.SphereGeometry( 0.1, 10, 10 );
var material = new THREE.MeshBasicMaterial( {color: 0xffff00,
                                             side: THREE.DoubleSide,
                                             opacity: 0.0,
                                             transparent: true,
                                             depthWrite: false} );
var sphere = new THREE.Mesh( geometry, material );

sphere.rotation.y = 2 * Math.PI;

var audioLoader = new THREE.AudioLoader();
audioLoader.load( './objects/MQ-9-Predator-Audio/Prop.mp3', function( buffer ) {
  sound.setBuffer( buffer );
  sound.setLoop( true );
  sound.setVolume( 0.7 );
  sphere.add(sound);
  sound.play();
});

scene.add( sphere );

sound.setRefDistance( 1 );
sound.setDirectionalCone( 180, 250, 0.1  );

var helper = new THREE.PositionalAudioHelper( sound, 0.1 );
helper.rotation.y = 2 * Math.PI;
helper.scale.set(10,10,10);
//scene.add( helper );

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
  if(isgbu)
  {
    gbu.position.z -= 0.0005;
  }
  renderer.render(scene, camera);
};

window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener( 'click' , getObject, false);
window.addEventListener( 'mousemove', onMouseMove, false );

window.addEventListener( 'mousedown', onmousedownF, false );
window.addEventListener( 'mouseup', onmouseupF, false );

function onmousedownF()
{
  console.log("DOWN");
}

function onmouseupF()
{
  console.log("UP");
}

function onWindowResize()
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onMouseMove( event )
{
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
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


function loadObjModel(path, url, callback, material)
{
  loader
  .setMaterials( material )
  .setPath( path )
  .load(
    url,
    function ( object )
    {
      object.traverse( function( node )
      {
          if( node.material )
          {
            node.material.oppacity = 1;
          }
      });
      callback(object);
    },
    onLoad(),
    onError()
  );
}

function loaderMTLTexture(path, fileName)
{
  mtlLoader
  .setPath( path )
  .load(
    fileName + '.mtl',
    function ( material )
    {
      material.preload();
      loadObjModel( path, fileName + '.obj', loadAircraft, material );
    }
  );
}

function loadAircraft(object)
{
  body = object;
  body.position.z = 0;
  body.position.x = 0;
  body.position.y = 0;
  body.scale.set(10,10,10);
  scene.add( object );
}

function loadGBU(object)
{
  gbu = object;
  isgbu = true;
  body.add(gbu);
}

render();