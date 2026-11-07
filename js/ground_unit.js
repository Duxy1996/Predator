class GroundUnit {
  constructor({ scene, terrain, missileTemplate, position, onIntercept, options = {} }) {
    this.scene = scene;
    this.terrain = terrain;
    this.missileTemplate = missileTemplate;
    this.onIntercept = onIntercept;
    this.detectionRadius = options.detectionRadius || 45;
    this.missileSpeed = options.missileSpeed || 12;
    this.interceptRadius = options.interceptRadius || 0.8;
    this.missile = null;
    this.hasIntercepted = false;
    this.isStopped = false;
    this.direction = new THREE.Vector3();

    this.root = new THREE.Group();
    this.root.position.set(position.x, 0, position.z);
    this.root.position.y = terrain.getTerrainHeight(this.root.position);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.9, 0.35, 12),
      new THREE.MeshLambertMaterial({ color: 0x454b4d })
    );
    base.position.y = 0.18;
    this.root.add(base);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({
        color: 0x9ecbd6,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide
      })
    );
    dome.position.y = 0.35;
    this.root.add(dome);

    this.radarSweep = new THREE.Group();
    this.radarSweep.position.y = 0.45;
    const radarArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 1.0),
      new THREE.MeshBasicMaterial({ color: 0x63ff89 })
    );
    radarArm.position.z = -0.55;
    this.radarSweep.add(radarArm);
    this.root.add(this.radarSweep);

    scene.add(this.root);
  }

  update(targetPosition, deltaTime) {
    if (this.hasIntercepted || this.isStopped || deltaTime <= 0) {
      return;
    }

    this.radarSweep.rotation.y += Math.PI * 2 * deltaTime;

    if (!this.missile) {
      const targetDistance = this.root.position.distanceTo(targetPosition);
      if (targetDistance <= this.detectionRadius) {
        this.launchMissile(targetPosition);
      }
      return;
    }

    const direction = this.direction.subVectors(targetPosition, this.missile.position);
    const distance = direction.length();
    const travelDistance = this.missileSpeed * deltaTime;

    if (distance <= this.interceptRadius + travelDistance) {
      this.scene.remove(this.missile);
      this.missile = null;
      this.hasIntercepted = true;
      this.onIntercept(this);
      return;
    }

    direction.multiplyScalar(1 / distance);
    this.missile.position.addScaledVector(direction, travelDistance);
    this.missile.lookAt(targetPosition);
  }

  launchMissile(targetPosition) {
    this.missile = this.missileTemplate.clone(true);
    this.missile.scale.set(10, 10, 10);
    this.missile.position.set(
      this.root.position.x + this.radarSweep.position.x,
      this.root.position.y + this.radarSweep.position.y + 0.35,
      this.root.position.z + this.radarSweep.position.z
    );
    this.missile.lookAt(targetPosition);
    this.scene.add(this.missile);
  }

  stop() {
    if (this.missile) {
      this.scene.remove(this.missile);
      this.missile = null;
    }
    this.isStopped = true;
  }
}
