
function initTerrain() {

  noise.seed(Math.random());

  let resolution = 120;
  let muntains = 17;

  let columns = 500;
  let rows    = 500;

  let sizeX = 500;
  let sizeY = 500;

  var geometry = new THREE.PlaneGeometry( sizeX, sizeY, rows, columns );
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff, flatShading : THREE.FlatShading, side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
  var plane = new THREE.Mesh( geometry, material );

  plane.rotateX(Math.PI / 2);
  plane.position.y = -20;

  columns = columns + 1;
  rows    = rows + 1;

  for (let i = 0; i < columns; i=i+1)
  {
    for (let j = 0; j < rows; j=j+1)
    {
      let offset = j + i * rows;
      let perlingVal = Math.abs(noise.simplex2(i/ resolution, j/ resolution)) * muntains;

      geometry.vertices[offset].z = perlingVal;

      let r_v = 0;
      let g_v = perlingVal / muntains;
      let b_v = 0;

      if (perlingVal < 1.5)
      {
        geometry.vertices[offset].z = 1 ;
        b_v = 1;
        g_v = 0;
      }

      if (perlingVal > 16)
      {
        r_v = 1;
        g_v = 1;
        b_v = 1;
      }

      if (offset < plane.geometry.faces.length / 2 + columns - 2)
      {
        plane.geometry.faces[offset * 2 + 1 - i * 2].color.setRGB(r_v, g_v, b_v);
        plane.geometry.faces[offset * 2 + 0 - i * 2].color.setRGB(r_v, g_v, b_v);
      }
    }
  }

  geometry.dynamic = true;
  geometry.__dirtyVertices = true;
  geometry.__dirtyNormals = true;

  return plane;
}