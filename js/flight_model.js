class FlightModel {
  constructor() {
    this.headingBackup = 0.0;
    this.stallAngle = 17 * DEGREES_TO_RADIANS;
  }

  updateThrust(throttle) {
    return Math.max(0, Math.min(1, Number(throttle) / 100));
  }

  simulateStep(
    position,
    velocity,
    acceleration,
    wingspan,
    weight,
    direction,
    throttle,
    deltaTime,
    body,
    rollBackup
  ) {
    const gravity = 9.81;
    const dragCoefficient = 0.06;
    const airDensity = 1.225;
    const maxThrust = 9120.59;
    const alpha_zero = 0.01;
    const alpha_slope = 4.12;
    let liftCoefficient = 0.3;

    let currentPitch = 0.0;

    if (body != undefined) {
      currentPitch = body.rotation.x;
      liftCoefficient = alpha_slope * (currentPitch - alpha_zero);
      if (currentPitch > this.stallAngle) {
        let clMaxStall = alpha_slope * (this.stallAngle - alpha_zero);
        liftCoefficient = clMaxStall - 0.1 * (currentPitch - this.stallAngle) * (currentPitch - this.stallAngle) * 200;
      }
    }

    let velocityMagnitude = Math.sqrt(
      velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z
    );
    let velocityMagnitudeXZ = Math.sqrt(
      velocity.x * velocity.x + velocity.z * velocity.z
    );

    if (velocityMagnitude == 0) {
      velocityMagnitude = 0.01;
    }

    if (velocityMagnitudeXZ == 0) {
      velocityMagnitudeXZ = 0.01;
    }

    const velocityUnit = {
      x: velocity.x / velocityMagnitude,
      y: velocity.y / velocityMagnitude,
      z: velocity.z / velocityMagnitude
    };
    const velocityUnitXZ = {
      x: velocity.x / velocityMagnitudeXZ,
      z: velocity.z / velocityMagnitudeXZ,
    };

    const dynamicPressure = 0.5 * airDensity * velocityMagnitudeXZ * velocityMagnitudeXZ;
    const lift = liftCoefficient * dynamicPressure * wingspan;
    const dragMagnitude = dragCoefficient * dynamicPressure * wingspan;
    const computeThurst = throttle * maxThrust;

    const dynamicPressureYAxis = 0.5 * airDensity * velocity.y * velocity.y;
    const dragMagnitudeYAxis = dragCoefficient * dynamicPressureYAxis * wingspan;

    acceleration.x = -(dragMagnitude * velocityUnitXZ.x) / weight;
    acceleration.z = -(dragMagnitude * velocityUnitXZ.z) / weight;

    acceleration.x += (computeThurst * direction.x) / weight;
    acceleration.z += (computeThurst * direction.z) / weight;
    acceleration.y = ((lift - weight * gravity) / weight) - ((velocity.y * dragMagnitudeYAxis) / weight) * 0.1;

    if (position.y <= 1) {
      if (acceleration.y <= 1) {
        acceleration.y = 0;
      }
    }

    let horizontalAcceleration = 0.0;

    if (body != undefined) {
      horizontalAcceleration = Math.sin(rollBackup) * 1;
    }

    const accelerationRollX = Math.sin(-this.headingBackup) * horizontalAcceleration * 10.0;
    const accelerationRollZ = Math.cos(-this.headingBackup) * horizontalAcceleration * 10.0;

    acceleration.x += accelerationRollX;
    acceleration.z -= accelerationRollZ;

    velocity.x += acceleration.x * deltaTime;
    velocity.y += acceleration.y * deltaTime;
    velocity.z += acceleration.z * deltaTime;

    const theta = Math.atan2(-velocity.z, velocity.x);

    if (theta > 0.0 && this.headingBackup < 0.0) {
      this.headingBackup = -this.headingBackup;
    }

    if (Math.abs(this.headingBackup - theta) > 0.01) {
      if (Math.abs(this.headingBackup - theta) > 0.05) {
        if (this.headingBackup < theta) {
          this.headingBackup += 0.005;
          body.rotateY(0.005);
        } else {
          this.headingBackup -= 0.005;
          body.rotateY(-0.005);
        }
      } else {
        if (this.headingBackup < theta) {
          this.headingBackup += 0.001;
          body.rotateY(0.001);
        } else {
          this.headingBackup -= 0.001;
          body.rotateY(-0.001);
        }
      }
    }

    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
    position.z += velocity.z * deltaTime;

    if (body.position != undefined) {
      body.position.x = position.z / 40;
      body.position.y = position.y / 100;
      body.position.z = -position.x / 40;
    }

    return { position, velocity, acceleration };
  }
}
