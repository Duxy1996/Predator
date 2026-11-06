noise.seed(Math.random());

const terrainColorPalette = [
  { height: 0, color: [0.20, 0.27, 0.23] },
  { height: 0.22, color: [0.29, 0.34, 0.25] },
  { height: 0.48, color: [0.38, 0.39, 0.28] },
  { height: 0.72, color: [0.43, 0.41, 0.34] },
  { height: 0.9, color: [0.48, 0.47, 0.42] },
  { height: 1, color: [0.57, 0.56, 0.52] }
];

class Terrain {
  constructor(resolution, maxHeight, columns, rows, sizeX, sizeY) {
    this.resolution = resolution;
    this.maxHeight = maxHeight;
    this.columns = columns;
    this.rows = rows;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.groundOffset = 40;
    this.terrainColor = new THREE.Color();
    this.runwayCenterZ = -18;
    this.runwayElevation = this.getTerrainHeightAtGrid(
      rows / 2 - this.runwayCenterZ * rows / sizeY,
      columns / 2
    );
  }

  getTerrainHeightAtGrid(row, column) {
    const broadNoise = noise.simplex2(row / this.resolution, column / this.resolution);
    const mediumNoise = noise.simplex2(row / (this.resolution * 0.38), column / (this.resolution * 0.38));
    const detailNoise = noise.simplex2(row / (this.resolution * 0.14), column / (this.resolution * 0.14));
    const elevation = Math.max(0, Math.min(1,
      0.5 + broadNoise * 0.32 + mediumNoise * 0.13 + detailNoise * 0.05
    ));

    return elevation * this.maxHeight;
  }

  getFlattenedTerrainHeight(row, column) {
    const worldX = (column / this.columns - 0.5) * this.sizeX;
    const worldZ = (0.5 - row / this.columns) * this.sizeY;
    const flattenDistance = Math.max(Math.abs(worldX) / 18, Math.abs(worldZ - this.runwayCenterZ) / 55);
    const flattenWeight = 1 - smoothstep(0.75, 1, flattenDistance);
    const rawHeight = this.getTerrainHeightAtGrid(row, column);
    const normalizedHeight = this.maxHeight > 0 ? rawHeight / this.maxHeight : 0;
    const riverNoise = Math.abs(noise.simplex2(
      row / (this.resolution * 0.75) + 13,
      column / (this.resolution * 0.75) - 29
    ));
    const riverWeight = (1 - smoothstep(0.025, 0.07, riverNoise))
      * (1 - smoothstep(0.2, 0.48, normalizedHeight));
    const naturalHeight = rawHeight * (1 - riverWeight)
      + this.maxHeight * 0.1 * riverWeight;

    return naturalHeight * (1 - flattenWeight) + this.runwayElevation * flattenWeight;
  }

  getTerrainHeight(position) {
    const row = this.columns / 2 + position.z * this.columns / this.sizeY;
    const column = this.rows / 2 + position.x * this.rows / this.sizeX;
    const rowStart = Math.max(0, Math.min(this.rows, Math.floor(row)));
    const columnStart = Math.max(0, Math.min(this.columns, Math.floor(column)));
    const rowEnd = Math.min(this.rows, rowStart + 1);
    const columnEnd = Math.min(this.columns, columnStart + 1);
    const rowMix = Math.max(0, Math.min(1, row - rowStart));
    const columnMix = Math.max(0, Math.min(1, column - columnStart));
    const top = this.getFlattenedTerrainHeight(rowStart, columnStart) * (1 - columnMix)
      + this.getFlattenedTerrainHeight(rowStart, columnEnd) * columnMix;
    const bottom = this.getFlattenedTerrainHeight(rowEnd, columnStart) * (1 - columnMix)
      + this.getFlattenedTerrainHeight(rowEnd, columnEnd) * columnMix;

    return top * (1 - rowMix) + bottom * rowMix - this.groundOffset;
  }

  getTerrainElevation(position) {
    return this.getTerrainHeight(position) > position.y;
  }

  getTerrainColor(height, colorVariation) {
    const normalizedHeight = this.maxHeight > 0 ? height / this.maxHeight : 0;
    const waterWeight = 1 - smoothstep(0.08, 0.18, normalizedHeight);
    let lower = terrainColorPalette[0];
    let upper = terrainColorPalette[terrainColorPalette.length - 1];

    for (let i = 1; i < terrainColorPalette.length; i++) {
      if (normalizedHeight <= terrainColorPalette[i].height) {
        lower = terrainColorPalette[i - 1];
        upper = terrainColorPalette[i];
        break;
      }
    }

    const colorMix = (normalizedHeight - lower.height) / (upper.height - lower.height);
    const colorScale = normalizedHeight < 0.16 ? 0.72 : 1;
    const red = Math.max(0, Math.min(1,
      ((lower.color[0] + (upper.color[0] - lower.color[0]) * colorMix) * (1 - waterWeight)
        + 0.10 * waterWeight + colorVariation) * colorScale
    ));
    const green = Math.max(0, Math.min(1,
      ((lower.color[1] + (upper.color[1] - lower.color[1]) * colorMix) * (1 - waterWeight)
        + 0.18 * waterWeight + colorVariation) * colorScale
    ));
    const blue = Math.max(0, Math.min(1,
      ((lower.color[2] + (upper.color[2] - lower.color[2]) * colorMix) * (1 - waterWeight)
        + 0.22 * waterWeight + colorVariation) * colorScale
    ));

    return this.terrainColor.setRGB(red, green, blue);
  }

  createTerrainTexture() {
    const textureSize = 512;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = textureSize;
    canvas.height = textureSize;

    const image = context.createImageData(textureSize, textureSize);
    const pixels = image.data;

    for (let y = 0; y < textureSize; y++) {
      for (let x = 0; x < textureSize; x++) {
        const row = y / (textureSize - 1) * this.columns;
        const column = x / (textureSize - 1) * this.rows;
        const height = this.getFlattenedTerrainHeight(row, column);
        const largeVariation = noise.simplex2(row / 8, column / 8) * 0.035;
        const fineVariation = noise.simplex2(row / 2.5, column / 2.5) * 0.018;
        const color = this.getTerrainColor(height, largeVariation + fineVariation);
        const pixelIndex = (y * textureSize + x) * 4;

        pixels[pixelIndex] = color.r * 255;
        pixels[pixelIndex + 1] = color.g * 255;
        pixels[pixelIndex + 2] = color.b * 255;
        pixels[pixelIndex + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);

    return new THREE.CanvasTexture(canvas);
  }

  addRunwayRectangle(parent, width, length, color, x, z, height) {
    const geometry = new THREE.PlaneGeometry(width, length);
    const material = new THREE.MeshLambertMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    const rectangle = new THREE.Mesh(geometry, material);

    rectangle.rotation.x = -Math.PI / 2;
    rectangle.position.set(x, height, z);
    parent.add(rectangle);
  }

  addRunway(parent) {
    const groundHeight = this.runwayElevation - this.groundOffset;
    const shoulderHeight = groundHeight + 0.03;
    const asphaltHeight = groundHeight + 0.06;
    const markingHeight = groundHeight + 0.08;
    const runwayLength = 32;
    const runwayWidth = 4.8;

    this.addRunwayRectangle(parent, 6.4, 36, 0x77766b, 0, 0, shoulderHeight);
    this.addRunwayRectangle(parent, runwayWidth, runwayLength, 0x34383a, 0, 0, asphaltHeight);

    const thresholdOffset = runwayLength / 2 - 3;
    for (let i = -2; i <= 2; i++) {
      this.addRunwayRectangle(parent, 0.48, 0.16, 0xd5d3c8, i * 0.65, -thresholdOffset, markingHeight);
      this.addRunwayRectangle(parent, 0.48, 0.16, 0xd5d3c8, i * 0.65, thresholdOffset, markingHeight);
    }

    for (let z = -10; z <= 10; z += 5) {
      this.addRunwayRectangle(parent, 0.14, 1.8, 0xd5d3c8, 0, z, markingHeight);
    }
  }

  initTerrain() {
    const geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeY, this.rows, this.columns);
    const material = new THREE.MeshLambertMaterial({
      map: this.createTerrainTexture(),
      side: THREE.DoubleSide,
    });
    const terrainMesh = new THREE.Mesh(geometry, material);
    const terrainGroup = new THREE.Group();

    for (let row = 0; row <= this.columns; row++) {
      for (let column = 0; column <= this.rows; column++) {
        const vertexIndex = column + row * (this.rows + 1);
        geometry.vertices[vertexIndex].z = this.getFlattenedTerrainHeight(row, column);
      }
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -this.groundOffset;
    terrainGroup.add(terrainMesh);
    const runway = new THREE.Group();
    runway.position.z = this.runwayCenterZ;
    terrainGroup.add(runway);
    this.addRunway(runway);

    return terrainGroup;
  }
}

function smoothstep(edge0, edge1, value) {
  const amount = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return amount * amount * (3 - 2 * amount);
}
