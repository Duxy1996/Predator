function ExplodeAnimation(x, y, z)
{
  var colors = [0xec0d0d];
  var colorsTwo = [0xf4c01c];


  var movementSpeed = 0.2;
  var totalObjects = 800;
  var objectSize = 1;

  var geometry = new THREE.Geometry();
  var geometryRed = new THREE.Geometry();

  dirs = [];

  for (i = 0; i < totalObjects/2; i ++)
  {
    var vertex = new THREE.Vector3(x,y,z);

    geometry.vertices.push( vertex );

    dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),
               y:(Math.random() * movementSpeed)-(movementSpeed/2),
               z:(Math.random() * movementSpeed)-(movementSpeed/2)});

  }

  for (i = 0; i < totalObjects/2; i ++)
    {
      var vertex = new THREE.Vector3(x,y,z);

      geometryRed.vertices.push( vertex );

      dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),
                 y:(Math.random() * movementSpeed)-(movementSpeed/2),
                 z:(Math.random() * movementSpeed)-(movementSpeed/2)});

    }

  // Select random color from the array of colors
  var randomColor = colors[Math.floor(Math.random() * colors.length)];
  var randomColorTwo = colorsTwo[Math.floor(Math.random() * colorsTwo.length)];

  var materialTwo = new THREE.PointsMaterial( { size: objectSize,  color: randomColorTwo });
  var material = new THREE.PointsMaterial( { size: objectSize,  color: randomColor });

  var particlesTwo = new THREE.Points( geometryRed, materialTwo );
  var particles = new THREE.Points( geometry, material );

  this.objectTwo = particlesTwo;
  this.object = particles;

  this.status = true;

  this.iterations = 0;

  scene.add( this.objectTwo );
  scene.add( this.object );

  this.endInteraction = function() {
    scene.remove( this.object );
    scene.remove( this.objectTwo );
  }

  this.update = function(){
    if (this.status == true){
      var pCount = totalObjects/2;
      while(pCount--) {
        var particle =  this.object.geometry.vertices[pCount]
        particle.y += dirs[pCount].y;
        particle.x -= dirs[pCount].x;
        particle.z += dirs[pCount].z;

        var particle2 =  this.objectTwo.geometry.vertices[pCount]
        particle2.y -= dirs[dirs.length - pCount - 1].x;
        particle2.x += dirs[dirs.length - pCount - 1].z;
        particle2.z += dirs[dirs.length - pCount - 1].y;
      }
      this.object.geometry.verticesNeedUpdate = true;
      this.objectTwo.geometry.verticesNeedUpdate = true;
      this.iterations++;
    }
  }
}

function DirectionalExplosion(x, y, z, direction)
{
  let color = 0x100C08;

  let movementSpeed = 0.45;
  let totalObjects = 600;
  let objectSize = 0.2;

  let geometry = new THREE.Geometry();

  dirs = [];

  let directionThree = new THREE.Vector3(direction.x, direction.y, direction.z);
  directionThree.normalize();

  for (i = 0; i < totalObjects/2; i ++)
  {
    var vertex = new THREE.Vector3(x,y,z);

    geometry.vertices.push( vertex );


    particleDispersion = {x:(Math.random() * movementSpeed/100) - (movementSpeed/100),
                          y:(Math.random() * movementSpeed/100) - (movementSpeed/100),
                          z:(Math.random() * movementSpeed) - (movementSpeed/2)};


    let velocity = new THREE.Vector3(particleDispersion.x, particleDispersion.y, particleDispersion.z);

    let initialDirection = new THREE.Vector3(0, 0, -1);

    // Crear un cuaternión para rotar de initialDirection a direction
    let quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(initialDirection, direction);

    // Aplicar el cuaternión al vector de velocidad
    let alignedVelocity = velocity.clone().applyQuaternion(quaternion);



    dirs.push({x: -alignedVelocity.x,
               y: alignedVelocity.y,
               z: alignedVelocity.z});

  }

  let material = new THREE.PointsMaterial( { size: objectSize,  color: color });

  let particles = new THREE.Points( geometry, material );

  this.object = particles;

  this.status = true;

  this.iterations = 0;

  scene.add( this.object );

  this.endInteraction = function() {
    scene.remove( this.object );
  }

  this.update = function(){
    if (this.status == true){
      var pCount = totalObjects/2;
      while(pCount--) {
        var particle =  this.object.geometry.vertices[pCount]
        particle.y += dirs[pCount].y;
        particle.x -= dirs[pCount].x;
        particle.z += dirs[pCount].z;
      }
      this.object.geometry.verticesNeedUpdate = true;
      this.iterations++;
    }
  }
}
