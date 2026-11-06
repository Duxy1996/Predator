class FlightModel {
  constructor(parameters = {}) {
    // SI units: kg, m, s, N, m^2, and radians.
    // Tune by passing overrides, for example: new FlightModel({ maxThrust: 11000 }).
    // Mass and thrust set acceleration; wing area, lift, and drag set how it flies.
    this.parameters = Object.assign({
      mass: 3200, // Aircraft mass.
      gravity: 9.81,
      airDensity: 1.225,
      wingArea: 25, // Reference wing area; controls lift and drag.
      wingSpan: 20.1, // Used with wing area to estimate induced drag.
      maxThrust: 9120.59, // Thrust at 100% throttle.
      zeroLiftAngle: -2 * DEGREES_TO_RADIANS, // Angle of attack at zero lift.
      liftSlope: 4.5, // Lift coefficient gained per radian below stall.
      stallAngle: 15 * DEGREES_TO_RADIANS,
      maxLiftCoefficient: 1.25,
      zeroLiftDragCoefficient: 0.035,
      oswaldEfficiency: 0.8
    }, parameters);

    // Aspect ratio and induced-drag factor stay fixed for this model instance.
    this.aspectRatio = this.parameters.wingSpan * this.parameters.wingSpan
      / this.parameters.wingArea;
    this.inducedDragFactor = 1
      / (Math.PI * this.aspectRatio * this.parameters.oswaldEfficiency);

    // Reuse these vectors each frame instead of allocating new objects in the hot path.
    this.threeForward = new THREE.Vector3();
    this.threeUp = new THREE.Vector3();
    this.acceleration = { x: 0, y: 0, z: 0 };
  }

  updateThrust(throttle) {
    return Math.max(0, Math.min(1, Number(throttle) / 100));
  }

  simulateStep(position, velocity, throttle, deltaTime, body) {
    const parameters = this.parameters;

    // Convert the aircraft's local nose and top directions into simulation axes:
    // +X is forward, +Y is up, and +Z is to the aircraft's right.
    this.threeForward.set(0, 0, -1).applyQuaternion(body.quaternion);
    this.threeUp.set(0, 1, 0).applyQuaternion(body.quaternion);
    const forwardX = -this.threeForward.z;
    const forwardY = this.threeForward.y;
    const forwardZ = this.threeForward.x;
    const upX = -this.threeUp.z;
    const upY = this.threeUp.y;
    const upZ = this.threeUp.x;

    const speedSquared = velocity.x * velocity.x
      + velocity.y * velocity.y
      + velocity.z * velocity.z;
    const speed = Math.sqrt(speedSquared);
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

    // Lift responds to angle of attack (nose pitch minus the flight-path angle).
    const aircraftPitch = Math.atan2(forwardY, Math.sqrt(forwardX * forwardX + forwardZ * forwardZ));
    const flightPathAngle = Math.atan2(velocity.y, horizontalSpeed);
    const angleOfAttack = aircraftPitch - flightPathAngle;
    let liftCoefficient = parameters.liftSlope
      * (angleOfAttack - parameters.zeroLiftAngle);
    const absoluteAngleOfAttack = Math.abs(angleOfAttack);

    if (absoluteAngleOfAttack > parameters.stallAngle) {
      // Beyond the stall angle, lift falls off instead of growing without limit.
      liftCoefficient = Math.sign(liftCoefficient)
        * parameters.maxLiftCoefficient
        * parameters.stallAngle
        / absoluteAngleOfAttack;
    } else {
      liftCoefficient = Math.max(
        -parameters.maxLiftCoefficient,
        Math.min(parameters.maxLiftCoefficient, liftCoefficient)
      );
    }

    const dynamicPressure = 0.5 * parameters.airDensity * speedSquared;
    const liftMagnitude = dynamicPressure * parameters.wingArea * liftCoefficient;
    const dragCoefficient = parameters.zeroLiftDragCoefficient
      + liftCoefficient * liftCoefficient * this.inducedDragFactor;
    const dragMagnitude = dynamicPressure * parameters.wingArea * dragCoefficient;
    const thrustMagnitude = throttle * parameters.maxThrust;

    // Lift is perpendicular to the airflow and follows the aircraft's bank.
    const velocityUnitX = speed > 0 ? velocity.x / speed : 0;
    const velocityUnitY = speed > 0 ? velocity.y / speed : 0;
    const velocityUnitZ = speed > 0 ? velocity.z / speed : 0;
    const upAlongVelocity = upX * velocityUnitX
      + upY * velocityUnitY
      + upZ * velocityUnitZ;
    let liftX = upX - upAlongVelocity * velocityUnitX;
    let liftY = upY - upAlongVelocity * velocityUnitY;
    let liftZ = upZ - upAlongVelocity * velocityUnitZ;
    const liftDirectionLength = Math.sqrt(liftX * liftX + liftY * liftY + liftZ * liftZ);

    if (liftDirectionLength > 0) {
      liftX /= liftDirectionLength;
      liftY /= liftDirectionLength;
      liftZ /= liftDirectionLength;
    }

    // Apply thrust, lift, drag, and gravity, then integrate velocity and position.
    const inverseMass = 1 / parameters.mass;
    const acceleration = this.acceleration;
    acceleration.x = (thrustMagnitude * forwardX
      + liftMagnitude * liftX
      - dragMagnitude * velocityUnitX) * inverseMass;
    acceleration.y = (thrustMagnitude * forwardY
      + liftMagnitude * liftY
      - dragMagnitude * velocityUnitY) * inverseMass
      - parameters.gravity;
    acceleration.z = (thrustMagnitude * forwardZ
      + liftMagnitude * liftZ
      - dragMagnitude * velocityUnitZ) * inverseMass;

    // Semi-implicit Euler is stable for the simulation's small fixed time step.
    velocity.x += acceleration.x * deltaTime;
    velocity.y += acceleration.y * deltaTime;
    velocity.z += acceleration.z * deltaTime;

    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
    position.z += velocity.z * deltaTime;

    // Turn the nose with the actual horizontal change in flight direction.
    const horizontalSpeedSquared = velocity.x * velocity.x + velocity.z * velocity.z;
    if (horizontalSpeedSquared > 0) {
      const turnRate = (velocity.z * acceleration.x - velocity.x * acceleration.z)
        / horizontalSpeedSquared;
      body.rotateY(turnRate * deltaTime);
    }

    // Keep the existing Three.js-to-simulation scale used by the rest of the app.
    body.position.x = position.z / 40;
    body.position.y = position.y / 100;
    body.position.z = -position.x / 40;

    return acceleration;
  }
}
