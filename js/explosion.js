var movementSpeed = 2;
var totalObjects = 800;
var objectSize = 1;
var sizeRandomness = 4000;
var colors = 0xFF0000;

function ExplodeAnimation(x, y, z)
{
  var geometry = new THREE.Geometry();

  for (i = 0; i < totalObjects; i ++)
  {
    var vertex = new THREE.Vector3();
    vertex.x = x;
    vertex.y = y;
    vertex.z = z;

    geometry.vertices.push( vertex );
    dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),
               y:(Math.random() * movementSpeed)-(movementSpeed/2),
               z:(Math.random() * movementSpeed)-(movementSpeed/2)});
  }
  var material = new THREE.PointsMaterial( { size: objectSize,  color: colors });
  var particles = new THREE.Points( geometry, material );

  this.object = particles;
  this.status = true;

  this.xDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  this.yDir = (Math.random() * movementSpeed) / 2;
  this.zDir = (Math.random() * movementSpeed)-(movementSpeed/2);

  scene.add( this.object  );

  this.update = function(){
    if (this.status == true){
      var pCount = totalObjects;
      while(pCount--) {
        var particle =  this.object.geometry.vertices[pCount]
        particle.y += dirs[pCount].y;
        particle.x += dirs[pCount].x;
        particle.z += dirs[pCount].z;
      }
      this.object.geometry.verticesNeedUpdate = true;
    }
  }
}