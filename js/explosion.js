
function ExplodeAnimation(x, y, z) {
  const particleCount = 160;
  const geometry = new THREE.Geometry();
  const particleVelocities = [];

  for (let i = 0; i < particleCount; i++) {
    geometry.vertices.push(new THREE.Vector3());
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.12 + Math.random() * 0.48;

    particleVelocities.push({
      x: Math.cos(angle) * speed,
      y: 0.08 + Math.random() * 0.62,
      z: Math.sin(angle) * speed
    });
  }

  this.object = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xffb52e,
      size: 1.4,
      transparent: true,
      opacity: 1,
      depthWrite: false
    })
  );
  this.object.position.set(x, y, z);

  this.fireball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff6a16,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    })
  );
  this.fireball.position.set(x, y, z);

  this.smoke = new THREE.Mesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0x292522,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    })
  );
  this.smoke.position.set(x, y, z);

  this.iterations = 0;
  this.lifetime = 90;

  scene.add(this.object);
  scene.add(this.fireball);
  scene.add(this.smoke);

  this.endInteraction = function() {
    [this.object, this.fireball, this.smoke].forEach(function(effectObject) {
      scene.remove(effectObject);
      effectObject.geometry.dispose();
      effectObject.material.dispose();
    });
  };

  this.update = function() {
    const progress = this.iterations / this.lifetime;
    const fireballScale = 0.1 + progress * 5;
    const smokeScale = 0.2 + progress * 6;

    this.fireball.scale.set(fireballScale, fireballScale, fireballScale);
    this.fireball.material.opacity = 0.9 * (1 - progress);
    this.smoke.scale.set(smokeScale, smokeScale, smokeScale);
    this.smoke.position.y += 0.025;
    this.smoke.material.opacity = 0.45 * (1 - progress);
    this.object.material.opacity = 1 - progress;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.object.geometry.vertices[i];
      const velocity = particleVelocities[i];

      particle.x += velocity.x;
      particle.y += velocity.y;
      particle.z += velocity.z;
      velocity.y -= 0.018;
      velocity.x *= 0.99;
      velocity.z *= 0.99;
    }

    this.object.geometry.verticesNeedUpdate = true;
    this.iterations++;
  };
}

function DirectionalExplosion(x, y, z, direction)
{
  let color = 0x100C08;

  let movementSpeed = 0.45;
  let totalObjects = 600;
  let objectSize = 0.2;

  let geometry = new THREE.Geometry();

  let particleVelocities = [];

  let directionThree = new THREE.Vector3(direction.x, direction.y, direction.z);
  directionThree.normalize();

  for (let i = 0; i < totalObjects / 2; i++)
  {
    var vertex = new THREE.Vector3(x,y,z);

    geometry.vertices.push( vertex );


    let particleDispersion = {x:(Math.random() * movementSpeed/100) - (movementSpeed/100),
                              y:(Math.random() * movementSpeed/100) - (movementSpeed/100),
                              z:(Math.random() * movementSpeed) - (movementSpeed/2)};


    let velocity = new THREE.Vector3(particleDispersion.x, particleDispersion.y, particleDispersion.z);

    let initialDirection = new THREE.Vector3(0, 0, -1);

    // Create a quaternion to rotate from initialDirection to direction.
    let quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(initialDirection, direction);

    // Apply the quaternion to the velocity vector.
    let alignedVelocity = velocity.clone().applyQuaternion(quaternion);



    particleVelocities.push({x: -alignedVelocity.x,
                             y: alignedVelocity.y,
                             z: alignedVelocity.z});

  }

  let material = new THREE.PointsMaterial( { size: objectSize,  color: color });

  let particles = new THREE.Points( geometry, material );

  this.object = particles;

  this.status = true;

  this.iterations = 0;
  this.lifetime = 500;

  scene.add( this.object );

  this.endInteraction = function() {
    scene.remove( this.object );
    this.object.geometry.dispose();
    this.object.material.dispose();
  }

  this.update = function(){
    if (this.status == true){
      var pCount = totalObjects/2;
      while(pCount--) {
        var particle =  this.object.geometry.vertices[pCount]
        particle.y += particleVelocities[pCount].y;
        particle.x -= particleVelocities[pCount].x;
        particle.z += particleVelocities[pCount].z;
      }
      this.object.geometry.verticesNeedUpdate = true;
      this.iterations++;
    }
  }
}
