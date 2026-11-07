
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

  this.update = function(frameScale) {
    const progress = this.iterations / this.lifetime;
    const fireballScale = 0.1 + progress * 5;
    const smokeScale = 0.2 + progress * 6;

    this.fireball.scale.set(fireballScale, fireballScale, fireballScale);
    this.fireball.material.opacity = 0.9 * (1 - progress);
    this.smoke.scale.set(smokeScale, smokeScale, smokeScale);
    this.smoke.position.y += 0.025 * frameScale;
    this.smoke.material.opacity = 0.45 * (1 - progress);
    this.object.material.opacity = 1 - progress;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.object.geometry.vertices[i];
      const velocity = particleVelocities[i];

      particle.x += velocity.x * frameScale;
      particle.y += velocity.y * frameScale;
      particle.z += velocity.z * frameScale;
      velocity.y -= 0.018 * frameScale;
      velocity.x *= Math.pow(0.99, frameScale);
      velocity.z *= Math.pow(0.99, frameScale);
    }

    this.object.geometry.verticesNeedUpdate = true;
    this.iterations += frameScale;
  };
}

function DirectionalExplosion(x, y, z, direction)
{
  let color = 0x100C08;

  let movementSpeed = 0.45;
  let totalObjects = 600;
  let objectSize = 0.2;

  let geometry = new THREE.Geometry();

  let particleVelocities = new Float32Array(totalObjects / 2 * 3);

  let directionThree = new THREE.Vector3(direction.x, direction.y, direction.z);
  directionThree.normalize();
  let initialDirection = new THREE.Vector3(0, 0, -1);
  let quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(initialDirection, directionThree);
  let velocity = new THREE.Vector3();

  for (let i = 0; i < totalObjects / 2; i++)
  {
    var vertex = new THREE.Vector3(x,y,z);

    geometry.vertices.push( vertex );

    const velocityIndex = i * 3;
    const dispersionX = (Math.random() - 1) * movementSpeed / 100;
    const dispersionY = (Math.random() - 1) * movementSpeed / 100;
    const dispersionZ = (Math.random() - 0.5) * movementSpeed;
    velocity.set(dispersionX, dispersionY, dispersionZ)
      .applyQuaternion(quaternion);

    particleVelocities[velocityIndex] = -velocity.x;
    particleVelocities[velocityIndex + 1] = velocity.y;
    particleVelocities[velocityIndex + 2] = velocity.z;

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

  this.update = function(frameScale){
    if (this.status == true){
      var pCount = totalObjects/2;
      while(pCount--) {
        var particle = this.object.geometry.vertices[pCount];
        var velocityIndex = pCount * 3;
        particle.y += particleVelocities[velocityIndex + 1] * frameScale;
        particle.x -= particleVelocities[velocityIndex] * frameScale;
        particle.z += particleVelocities[velocityIndex + 2] * frameScale;
      }
      this.object.geometry.verticesNeedUpdate = true;
      this.iterations += frameScale;
    }
  }
}
