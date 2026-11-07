
let isLeftBombReleased = false;
let isRightBombReleased = false;
let leftBomb;
let rightBomb;

function launchBomb() {
  if (!leftBomb) {
    isLeftBombReleased = true;
    leftBomb = leftBombPivots[0].children[0];

    // Store the bomb's world position before detaching it from the pivot.
    let position = new THREE.Vector3();
    leftBomb.getWorldPosition(position);

    leftBombPivots[0].remove(leftBomb);

    // replace the position on the pivot by the real world position
    leftBomb.position.x = position.x;
    leftBomb.position.y = position.y;
    leftBomb.position.z = position.z;

    // add the rotation of the aircraft to the weapon
    leftBomb.rotation.x = aircraftObject.rotation.x;
    leftBomb.rotation.y = aircraftObject.rotation.y;
    leftBomb.rotation.z = aircraftObject.rotation.z;

    leftBomb.scale.x = 10;
    leftBomb.scale.y = 10;
    leftBomb.scale.z = 10;

    explosionParts.push(new DirectionalExplosion(position.x, position.y, position.z, weaponDirection));

    scene.add(leftBomb);
    return;
  }

  if(!rightBomb)
    {
      isRightBombReleased = true;
      rightBomb = rightBombPivots[0].children[0];

      // Store the bomb's world position before detaching it from the pivot.
      let position = new THREE.Vector3();
      rightBomb.getWorldPosition(position);

      rightBombPivots[0].remove(rightBomb);

      // replace the position on the pivot by the real world position
      rightBomb.position.x = position.x;
      rightBomb.position.y = position.y;
      rightBomb.position.z = position.z;

      // add the rotation of the aircraft to the weapon
      rightBomb.rotation.x = aircraftObject.rotation.x;
      rightBomb.rotation.y = aircraftObject.rotation.y;
      rightBomb.rotation.z = aircraftObject.rotation.z;

      rightBomb.scale.x = 10;
      rightBomb.scale.y = 10;
      rightBomb.scale.z = 10;

      explosionParts.push(new DirectionalExplosion(position.x, position.y, position.z, weaponDirection));

      scene.add(rightBomb);
      return;
    }
}

function updateWeaponSystem(frameScale)
{
  if (isLeftBombReleased) {
    if (leftBomb != undefined) {
      leftBomb.position.z += 0.23 * frameScale * weaponDirection.z;
      leftBomb.position.y += 0.23 * frameScale * weaponDirection.y;
      leftBomb.position.x += 0.23 * frameScale * weaponDirection.x;
    }
  }

  if (isRightBombReleased) {
    if (rightBomb != undefined) {
      rightBomb.position.z += 0.23 * frameScale * weaponDirection.z;
      rightBomb.position.y += 0.23 * frameScale * weaponDirection.y;
      rightBomb.position.x += 0.23 * frameScale * weaponDirection.x;
    }
  }
}