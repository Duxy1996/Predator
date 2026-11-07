
function rightGearUpdateDeploy(rightGear, frameScale) {
  if (rightGear != undefined) {
    if (rightGear.rotation.z > 0) {
      rightGear.rotation.x += 0.0037 * frameScale;
      rightGear.rotation.z -= 0.0012 * frameScale;
    }
  }
}

function leftGearUpdateDeploy(leftGear, frameScale) {
  if (leftGear != undefined) {
    if (leftGear.rotation.z < 0) {
      leftGear.rotation.x += 0.0037 * frameScale;
      leftGear.rotation.z += 0.0012 * frameScale;
    }
  }
}

function frontGearUpdateDeploy(frontGear, frameScale) {
  if (frontGear != undefined)
  {
    if (frontGear.rotation.x < 0) {
      frontGear.rotation.x += 0.006 * frameScale;
    }
  }
}

// The following functions update the rotation value
// of the landing gear to deploy the landing gear.

function rightGearUpdateUp(rightGear, frameScale) {
  if (rightGear != undefined) {
    if (rightGear.rotation.z < 0.5) {
      rightGear.rotation.x -= 0.0037 * frameScale;
      rightGear.rotation.z += 0.0012 * frameScale;
    }
  }
}

function leftGearUpdateUp(leftGear, frameScale) {
  if (leftGear != undefined) {
    if (leftGear.rotation.z > -0.5) {
      leftGear.rotation.x -= 0.0037 * frameScale;
      leftGear.rotation.z -= 0.0012 * frameScale;
    }
  }
}

function frontGearUpdateUp(frontGear, frameScale) {
  if (frontGear != undefined)
  {
    if (frontGear.rotation.x > -2.5) {
      frontGear.rotation.x -= 0.006 * frameScale;
    }
  }
}

function landingGearUpdate(isLandingGearUp, frontGear, rightGear, leftGear, frameScale) {
  if(isLandingGearUp) {
    leftGearUpdateUp(leftGear, frameScale);
    frontGearUpdateUp(frontGear, frameScale);
    rightGearUpdateUp(rightGear, frameScale);
  }
  else {
    leftGearUpdateDeploy(leftGear, frameScale);
    frontGearUpdateDeploy(frontGear, frameScale);
    rightGearUpdateDeploy(rightGear, frameScale);
  }
}