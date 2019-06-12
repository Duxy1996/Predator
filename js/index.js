
var loader    = new THREE.OBJLoader();
var mtlLoader = new THREE.MTLLoader();

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
camera.position.z = 4;

var ambientLight = new THREE.AmbientLight( 0xffffff, 1 );
scene.add( ambientLight );


var controls = new THREE.OrbitControls( camera );

var renderer = new THREE.WebGLRenderer({antialias:true});

var raycaster = new THREE.Raycaster();

var mouse = new THREE.Vector2();

renderer.setClearColor("#EEEEFF");

renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );

var aircarftList = []

var body = [];
var gbu;
var isgbu;

loaderMTLTexture();
//loadObjModel('./objects/MQ-9-Predator/Right-GBU.obj', loadGBU);


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

  scene.add(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000) );
}


window.requestAnimationFrame(render);


function loadObjModel(url, callback, material)
{
  loader
  .setMaterials( material )
  .setPath( './objects/MQ-9-Predator/' )
  .load(
    url,
    function ( object )
    {
      object.traverse( function( node ) {
          if( node.material ) {
              node.material.oppacity = 1;
              console.log(node.material);
          }
      });
      console.log(object);

      callback(object);
    },
    function ( xhr ) {
      console.log( 'loaded' );
    },
    function ( error )
    {
      console.log( 'An error happened' );
    }
  );
}

function loaderMTLTexture()
{
  mtlLoader
  .setPath( './objects/MQ-9-Predator/' )
  .load(
    'Vehicle.mtl',
    function ( material )
    {
      material.preload();
      loadObjModel('Vehicle.obj', loadAircraft, material);
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
  aircarftList.push(body)

  for ( var it in aircarftList )
  {
    scene.add( aircarftList[it] );
  }
}

function loadGBU(object)
{
  gbu = object;
  isgbu = true;
  body.add(gbu);
}

render();