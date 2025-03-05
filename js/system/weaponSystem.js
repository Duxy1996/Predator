
let releasedGBULCheck = false;
let releasedGBURCheck = false;
let releasedGBUL;
let releasedGBUR;

function launchGBU() {
  if (!releasedGBUL) {
    releasedGBULCheck = true;
    releasedGBUL = helperPivoteGBULRef[0].children[0];

    let position = new THREE.Vector3();
    releasedGBUL.getWorldPosition(position);

    helperPivoteGBULRef[0].remove(releasedGBUL);

    releasedGBUL.position.x = position.x;
    releasedGBUL.position.y = position.y;
    releasedGBUL.position.z = position.z;

    releasedGBUL.rotation.x = body.rotation.x;
    releasedGBUL.rotation.y = body.rotation.y;
    releasedGBUL.rotation.z = body.rotation.z;

    releasedGBUL.scale.x = 10;
    releasedGBUL.scale.y = 10;
    releasedGBUL.scale.z = 10;

    parts.push(new DirectionalExplosion(position.x, position.y, position.z, direction));

    scene.add(releasedGBUL);
    return;
  }

  if(!releasedGBUR)
    {
      releasedGBURCheck = true;
      releasedGBUR = helperPivoteGBURRef[0].children[0];

      let position = new THREE.Vector3();
      releasedGBUR.getWorldPosition(position);

      helperPivoteGBURRef[0].remove(releasedGBUR);

      releasedGBUR.position.x = position.x;
      releasedGBUR.position.y = position.y;
      releasedGBUR.position.z = position.z;

      releasedGBUR.rotation.x = body.rotation.x;
      releasedGBUR.rotation.y = body.rotation.y;
      releasedGBUR.rotation.z = body.rotation.z;

      releasedGBUR.scale.x = 10;
      releasedGBUR.scale.y = 10;
      releasedGBUR.scale.z = 10;

      parts.push(new DirectionalExplosion(position.x, position.y, position.z, direction));

      scene.add(releasedGBUR);
      return;
    }
}

function updateWeaponSystem()
{
  if (releasedGBULCheck) {
    if (releasedGBUL != undefined) {
      releasedGBUL.position.z += 0.23 * direction.z;
      releasedGBUL.position.y += 0.23 * direction.y;
      releasedGBUL.position.x += 0.23 * direction.x;
    }
  }

  if (releasedGBURCheck) {
    if (releasedGBUR != undefined) {
      releasedGBUR.position.z += 0.23 * direction.z;
      releasedGBUR.position.y += 0.23 * direction.y;
      releasedGBUR.position.x += 0.23 * direction.x;
    }
  }
}