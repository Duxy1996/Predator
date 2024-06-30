
noise.seed(Math.random());


class Terrain {
  // Constructor function to initialize properties
  // Adjust the perling value scale. When gigher the perling values change less.
  // Altitude of the terrain. When the value is higher the terrain is high.
  constructor(resolution, maxHeight, columns, rows, sizeX, sizeY) {
      this.resolution = resolution;
      this.maxHeight = maxHeight;
      this.columns = columns;
      this.rows = rows;
      this.sizeX = sizeX;
      this.sizeY = sizeY;
  }

  getTerrainElevation(positionDrone) {

    let posX =  this.columns / 2.0 + positionDrone.x * this.columns / this.sizeX;
    let posZ =  this.rows / 2.0 + positionDrone.z * this.rows / this.sizeY;

    let perlingVal = Math.abs(noise.simplex2(posZ / this.resolution, posX / this.resolution)) * this.maxHeight;

    if (Math.random() > 0.95) {
      return ((perlingVal-20) > positionDrone.y);
    }
    return false;
  }

  initTerrain() {

    var geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeY, this.rows, this.columns );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, flatShading : THREE.FlatShading, side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
    var plane = new THREE.Mesh( geometry, material );

    plane.rotateX(-Math.PI / 2);
    plane.position.y = -20;

    this.columns = this.columns + 1;
    this.rows    = this.rows + 1;

    for (let i = 0; i < this.columns; i=i+1) {
      for (let j = 0; j < this.rows; j=j+1) {
        let offset = j + i * this.rows;
        let perlingVal = Math.abs(noise.simplex2(i/ this.resolution, j/ this.resolution)) * this.maxHeight;

        let perlingValColor       = Math.abs(noise.simplex2(i/ 160, j/ 160));
        let perlingValGroundColor = Math.abs(noise.simplex2(i/ 160, j/ 160));
        let perlingValSnowColor   = Math.abs(noise.simplex2(i/ 160 + 1000, j/ 160 + 1000));

        geometry.vertices[offset].z = perlingVal;

        let r_v = Math.random() * 0.1;
        let g_v = (perlingVal / this.maxHeight) * 0.8;
        let b_v = 0;

        if(g_v < 0.15) {
          g_v = 0.13 +  Math.random() * 0.02;
        }

        if(g_v > 0.75) {
          g_v = 0.75 * Math.random();
        }

        /// when the altitude is below 1.5 meters. shohuld me water.
        if (perlingVal < 1.5) {
          r_v = 0;
          g_v = Math.random() * 0.05;
          b_v = perlingValColor * 0.5 + 0.5;

          if(perlingVal < 2){
            b_v = perlingValColor * 0.9 + 0.1;
          }

          if (b_v < 0.3)
          {
            b_v = 0.3;
          }

          geometry.vertices[offset].z = 1 ;
        }

        // dirt
        if ((perlingVal > 8) && (perlingVal < 12)) {
          if (perlingValGroundColor < (0.3 + 0.1 * Math.random())) {
            r_v = 0.3 + perlingValGroundColor * 0.2;
            g_v = 0.2 + perlingValGroundColor * 0.2 + perlingVal /this. maxHeight * 0.4;
            b_v = 0;
          }
        }

        if (perlingVal > (16 + Math.random() * 2)) {
          if (perlingValSnowColor < (0.3 + 0.1 * Math.random()))
          {
            r_v = perlingValSnowColor * 0.29 + Math.random() * 0.01 + 0.7;
            g_v = perlingValSnowColor * 0.29 + Math.random() * 0.01 + 0.7;
            b_v = perlingValSnowColor * 0.29 + Math.random() * 0.01 + 0.7;
          }
        }

        if (offset < plane.geometry.faces.length / 2 + this.columns - 2) {
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

}
