
function rightGearUpdateDeploy(rightGear) {
  if (rightGear != undefined) {
    if (rightGear.rotation.z > 0) {
      rightGear.rotation.x += 0.0037;
      rightGear.rotation.z -= 0.0012;
    }
  }
}

function leftGearUpdateDeploy(leftGear) {
  if (leftGear != undefined) {
    if (leftGear.rotation.z < 0) {
      leftGear.rotation.x += 0.0037;
      leftGear.rotation.z += 0.0012;
    }
  }
}

function frontGearUpdateDeploy(frontGear) {
  if (frontGear != undefined)
  {
    if (frontGear.rotation.x < 0) {
      frontGear.rotation.x += 0.006;
    }
  }
}

// The following functions update the rotation value
// of the landing gear to deploy the landing gear.

function rightGearUpdateUp(rightGear) {
  if (rightGear != undefined) {
    if (rightGear.rotation.z < 0.5) {
      rightGear.rotation.x -= 0.0037;
      rightGear.rotation.z += 0.0012;
    }
  }
}

function leftGearUpdateUp(leftGear) {
  if (leftGear != undefined) {
    if (leftGear.rotation.z > -0.5) {
      leftGear.rotation.x -= 0.0037;
      leftGear.rotation.z -= 0.0012;
    }
  }
}

function frontGearUpdateUp(frontGear) {
  if (frontGear != undefined)
  {
    if (frontGear.rotation.x > -2.5) {
      frontGear.rotation.x -= 0.006;
    }
  }
}

function landingGearUpdate(gearUPTmp, frontGear, rightGear, leftGear) {
  if(gearUPTmp) {
    leftGearUpdateUp(leftGear);
    frontGearUpdateUp(frontGear);
    rightGearUpdateUp(rightGear);
  }
  else {
    leftGearUpdateDeploy(leftGear);
    frontGearUpdateDeploy(frontGear);
    rightGearUpdateDeploy(rightGear);
  }
}