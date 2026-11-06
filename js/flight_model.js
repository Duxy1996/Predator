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
      zeroLiftAngle: -2 * degreesToRadians, // Angle of attack at zero lift.
      liftSlope: 4.5, // Lift coefficient gained per radian below stall.
      stallAngle: 15 * degreesToRadians,
      maxLiftCoefficient: 1.25,
      zeroLiftDragCoefficient: 0.035,
      oswaldEfficiency: 0.8,
      maxBankAngle: 55 * degreesToRadians,
      maxPitchAngle: 25 * degreesToRadians,
      maxRollRate: 45 * degreesToRadians,
      maxPitchRate: 25 * degreesToRadians,
      rollResponse: 3,
      pitchResponse: 3,
      rollDamping: 1.5,
      pitchDamping: 1.5,
      maxRollAcceleration: 90 * degreesToRadians,
      maxPitchAcceleration: 60 * degreesToRadians,
      sideSlipDamping: 1.5,
      headingAlignment: 2,
      maxHeadingCorrectionRate: 20 * degreesToRadians
    }, parameters);

    // Aspect ratio and induced-drag factor stay fixed for this model instance.
    this.aspectRatio = this.parameters.wingSpan * this.parameters.wingSpan
      / this.parameters.wingArea;
    this.inducedDragFactor = 1
      / (Math.PI * this.aspectRatio * this.parameters.oswaldEfficiency);

    // Reuse these vectors each frame instead of allocating new objects in the hot path.
    this.threeForward = new THREE.Vector3();
    this.threeUp = new THREE.Vector3();
    this.threeRight = new THREE.Vector3();
    this.threeWorldUp = new THREE.Vector3(0, 1, 0);
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.rollRate = 0;
    this.pitchRate = 0;
  }

  updateThrust(throttle) {
    return Math.max(0, Math.min(1, Number(throttle) / 100));
  }

  updateAttitude(body, rollCommand, pitchCommand, deltaTime) {
    const parameters = this.parameters;
    const rollTarget = Math.max(-1, Math.min(1, rollCommand)) * parameters.maxBankAngle;
    const pitchTarget = Math.max(-1, Math.min(1, pitchCommand)) * parameters.maxPitchAngle;
    const rollError = rollTarget - body.rotation.z;
    const pitchError = pitchTarget - body.rotation.x;
    const targetRollRate = Math.max(-parameters.maxRollRate, Math.min(
      parameters.maxRollRate,
      rollError * parameters.rollResponse - this.rollRate * parameters.rollDamping
    ));
    const targetPitchRate = Math.max(-parameters.maxPitchRate, Math.min(
      parameters.maxPitchRate,
      pitchError * parameters.pitchResponse - this.pitchRate * parameters.pitchDamping
    ));

    this.rollRate += Math.max(
      -parameters.maxRollAcceleration * deltaTime,
      Math.min(parameters.maxRollAcceleration * deltaTime, targetRollRate - this.rollRate)
    );
    this.pitchRate += Math.max(
      -parameters.maxPitchAcceleration * deltaTime,
      Math.min(parameters.maxPitchAcceleration * deltaTime, targetPitchRate - this.pitchRate)
    );

    body.rotateZ(this.rollRate * deltaTime);
    body.rotateX(this.pitchRate * deltaTime);

    const limitedRoll = Math.max(
      -parameters.maxBankAngle,
      Math.min(parameters.maxBankAngle, body.rotation.z)
    );
    const limitedPitch = Math.max(
      -parameters.maxPitchAngle,
      Math.min(parameters.maxPitchAngle, body.rotation.x)
    );
    if (limitedRoll !== body.rotation.z) {
      body.rotation.z = limitedRoll;
      this.rollRate = 0;
    }
    if (limitedPitch !== body.rotation.x) {
      body.rotation.x = limitedPitch;
      this.pitchRate = 0;
    }
  }

  simulateStep(position, velocity, throttle, deltaTime, body) {
    const parameters = this.parameters;

    // Convert the aircraft's local nose and top directions into simulation axes:
    // +X is forward, +Y is up, and +Z is to the aircraft's right.
    this.threeForward.set(0, 0, -1).applyQuaternion(body.quaternion);
    this.threeUp.set(0, 1, 0).applyQuaternion(body.quaternion);
    this.threeRight.set(1, 0, 0).applyQuaternion(body.quaternion);
    const forwardX = -this.threeForward.z;
    const forwardY = this.threeForward.y;
    const forwardZ = this.threeForward.x;
    const upX = -this.threeUp.z;
    const upY = this.threeUp.y;
    const upZ = this.threeUp.x;
    const rightX = -this.threeRight.z;
    const rightY = this.threeRight.y;
    const rightZ = this.threeRight.x;

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

    // Dampen airflow across the fuselage so the aircraft does not accumulate
    // sideways drift in the simulation's no-wind environment.
    const sideSlipSpeed = velocity.x * rightX
      + velocity.y * rightY
      + velocity.z * rightZ;
    const sideSlipAcceleration = -sideSlipSpeed * parameters.sideSlipDamping;
    acceleration.x += sideSlipAcceleration * rightX;
    acceleration.y += sideSlipAcceleration * rightY;
    acceleration.z += sideSlipAcceleration * rightZ;

    // Semi-implicit Euler is stable for the simulation's small fixed time step.
    velocity.x += acceleration.x * deltaTime;
    velocity.y += acceleration.y * deltaTime;
    velocity.z += acceleration.z * deltaTime;

    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
    position.z += velocity.z * deltaTime;

    // Follow the turn and gently align the nose with the no-wind flight path.
    const horizontalSpeedSquared = velocity.x * velocity.x + velocity.z * velocity.z;
    if (horizontalSpeedSquared > 0) {
      const turnRate = (velocity.z * acceleration.x - velocity.x * acceleration.z)
        / horizontalSpeedSquared;
      const headingError = Math.atan2(
        forwardX * velocity.z - forwardZ * velocity.x,
        forwardX * velocity.x + forwardZ * velocity.z
      );
      const headingCorrectionRate = Math.max(
        -parameters.maxHeadingCorrectionRate,
        Math.min(
          parameters.maxHeadingCorrectionRate,
          headingError * parameters.headingAlignment
        )
      );
      body.rotateOnWorldAxis(
        this.threeWorldUp,
        (turnRate - headingCorrectionRate) * deltaTime
      );
    }

    // Keep the existing Three.js-to-simulation scale used by the rest of the app.
    body.position.x = position.z / 40;
    body.position.y = position.y / 100;
    body.position.z = -position.x / 40;

    return acceleration;
  }
}
