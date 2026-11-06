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
    this.inverseMaxHeight = maxHeight > 0 ? 1 / maxHeight : 0;
    this.riverFloorHeight = maxHeight * 0.1;
    this.columns = columns;
    this.rows = rows;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.groundOffset = 40;
    this.inverseResolution = 1 / resolution;
    this.inverseMediumNoiseScale = 1 / (resolution * 0.38);
    this.inverseDetailNoiseScale = 1 / (resolution * 0.14);
    this.inverseRiverNoiseScale = 1 / (resolution * 0.75);
    this.inverseFlattenWidth = 1 / 18;
    this.inverseFlattenLength = 1 / 55;
    this.worldXPerColumn = sizeX / columns;
    this.worldZPerRow = sizeY / columns;
    this.worldToColumnScale = rows / sizeX;
    this.worldToRowScale = columns / sizeY;
    this.terrainGridWidth = rows + 1;
    this.terrainGridHeight = columns + 1;
    this.terrainHeightGrid = null;
    this.heightmapColumnScale = 0;
    this.heightmapRowScale = 0;
    this.terrainColor = new THREE.Color();
    this.runwayCenterZ = -18;

    // Null keeps the original procedural terrain behavior.
    this.heightmap = null;

    this.updateRunwayElevation();
  }

  updateRunwayElevation() {
    let elevation = this.getTerrainHeightAtGrid(
      this.rows / 2 - this.runwayCenterZ * this.rows / this.sizeY,
      this.columns / 2
    );

    // Keep the runway above water when using an image heightmap.
    if (this.heightmap) {
      elevation = Math.max(elevation, this.maxHeight * 0.25);
    }

    this.runwayElevation = elevation;
  }

  // ---------------------------------------------------------------------------
  // IMAGE-BASED TERRAIN
  // ---------------------------------------------------------------------------

  /**
   * Load an image and use it to shape the terrain.
   * source: URL (string), File/Blob, HTMLImageElement, canvas, or ImageBitmap.
   * options:
   *   fit            'cover' (default; center-crops while preserving aspect ratio)
   *                  or 'stretch' (stretches the image across the terrain)
   *   waterThreshold how much bluer than red a pixel must be to count as water (24)
   *   size           internal heightmap resolution (256)
   *
   * Call this before initTerrain():
   *   await terrain.loadHeightmap('assets/valencia.png');
   *   scene.add(terrain.initTerrain());
   */
  async loadHeightmap(source, options = {}) {
    const image = await loadImageSource(source);
    this.setHeightmapFromImage(image, options);
    return this;
  }

  clearHeightmap() {
    this.heightmap = null;
    this.terrainHeightGrid = null;
    this.updateRunwayElevation();
  }

  setHeightmapFromImage(image, options = {}) {
    const fit = options.fit || 'cover';
    const waterThreshold = options.waterThreshold !== undefined ? options.waterThreshold : 24;
    const size = options.size || 256;

    const imageWidth = image.naturalWidth || image.videoWidth || image.width;
    const imageHeight = image.naturalHeight || image.videoHeight || image.height;

    // Match the heightmap aspect ratio to the terrain.
    const width = size;
    const height = Math.max(8, Math.round(size * this.sizeY / this.sizeX));
    const count = width * height;

    // 1) Crop or stretch the source image to fit the heightmap.
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = imageWidth;
    let sourceHeight = imageHeight;

    if (fit === 'cover') {
      const targetAspect = width / height;
      const imageAspect = imageWidth / imageHeight;
      if (imageAspect > targetAspect) {
        sourceWidth = imageHeight * targetAspect;
        sourceX = (imageWidth - sourceWidth) / 2;
      } else {
        sourceHeight = imageWidth / targetAspect;
        sourceY = (imageHeight - sourceHeight) / 2;
      }
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

    let pixels;
    try {
      pixels = context.getImageData(0, 0, width, height).data;
    } catch (error) {
      throw new Error(
        'Unable to read image pixels because the canvas is tainted. ' +
        'Serve the page locally (not with file://) or pass a File/Blob.'
      );
    }

    // 2) Detect blue water pixels and use darker land pixels as higher ground.
    const waterRaw = new Float32Array(count);
    const tone = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      waterRaw[i] = (b - r > waterThreshold && b - g > -8) ? 1 : 0;
      tone[i] = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    // Remove isolated pixels and smooth the coastline.
    const waterBlurred = boxBlur(waterRaw, width, height, 2, 1);
    const water = new Float32Array(count);
    let waterCount = 0;
    for (let i = 0; i < count; i++) {
      water[i] = waterBlurred[i] > 0.5 ? 1 : 0;
      waterCount += water[i];
    }
    const hasWater = waterCount > 0;

    // 3) Raise terrain with distance from the water.
    const distance = distanceFromMask(water, width, height);
    const distanceScale = 0.5 * Math.max(width, height);

    // Smooth and normalize land brightness.
    const toneBlurred = boxBlur(tone, width, height, 3, 2);
    let toneMin = 1;
    let toneMax = 0;
    for (let i = 0; i < count; i++) {
      if (water[i] === 0) {
        toneMin = Math.min(toneMin, toneBlurred[i]);
        toneMax = Math.max(toneMax, toneBlurred[i]);
      }
    }
    const toneRange = Math.max(0.001, toneMax - toneMin);

    // Soften the water mask to create sloped shorelines.
    const waterSoft = boxBlur(water, width, height, 2, 2);

    // 4) Generate terrain heights, keeping water at zero.
    const heights = new Float32Array(count);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const u = x / (width - 1);
        const v = y / (height - 1);

        const coast = hasWater
          ? smoothstep(0, 1, Math.min(1, distance[i] / distanceScale))
          : 0.55;

        const toneNormalized = (toneBlurred[i] - toneMin) / toneRange;

        const detail = noise.simplex2(u * 5, v * 5) * 0.6
          + noise.simplex2(u * 13 + 7, v * 13 + 3) * 0.3
          + noise.simplex2(u * 31 + 19, v * 31 + 11) * 0.1;

        const landHeight = Math.max(0.2, Math.min(1,
          0.22
          + 0.48 * coast
          + (toneNormalized - 0.5) * 0.3 * (0.3 + 0.7 * coast)
          + detail * 0.14 * (0.25 + 0.75 * coast)
        ));

        const landWeight = 1 - smoothstep(0.2, 0.8, waterSoft[i]);
        heights[i] = landHeight * landWeight;
      }
    }

    // 5) Copy the same crop at higher resolution for use as a texture.
    const colorSize = options.textureSize || 1024;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = colorSize;
    colorCanvas.height = colorSize;
    const colorContext = colorCanvas.getContext('2d');
    colorContext.imageSmoothingEnabled = true;
    colorContext.imageSmoothingQuality = 'high';
    colorContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, colorSize, colorSize);

    this.heightmap = { width, height, data: heights, colorCanvas };
    this.terrainHeightGrid = null;
    this.heightmapColumnScale = (width - 1) / this.rows;
    this.heightmapRowScale = (height - 1) / this.columns;
    // 0 uses the height palette; 1 uses the source image colors.
    this.imageColorBlend = options.imageColorBlend !== undefined ? options.imageColorBlend : 1;
    this.updateRunwayElevation();
    return this;
  }

  getHeightmapHeightAtGrid(row, column) {
    const { width, height, data } = this.heightmap;

    const x = Math.max(0, Math.min(width - 1, column * this.heightmapColumnScale));
    const y = Math.max(0, Math.min(height - 1, row * this.heightmapRowScale));

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;

    const top = data[y0 * width + x0] * (1 - fx) + data[y0 * width + x1] * fx;
    const bottom = data[y1 * width + x0] * (1 - fx) + data[y1 * width + x1] * fx;

    return (top * (1 - fy) + bottom * fy) * this.maxHeight;
  }

  // ---------------------------------------------------------------------------

  getTerrainHeightAtGrid(row, column) {
    if (this.heightmap) {
      return this.getHeightmapHeightAtGrid(row, column);
    }

    const broadNoise = noise.simplex2(
      row * this.inverseResolution,
      column * this.inverseResolution
    );
    const mediumNoise = noise.simplex2(
      row * this.inverseMediumNoiseScale,
      column * this.inverseMediumNoiseScale
    );
    const detailNoise = noise.simplex2(
      row * this.inverseDetailNoiseScale,
      column * this.inverseDetailNoiseScale
    );
    const elevation = Math.max(0, Math.min(1,
      0.5 + broadNoise * 0.32 + mediumNoise * 0.13 + detailNoise * 0.05
    ));

    return elevation * this.maxHeight;
  }

  getFlattenedTerrainHeight(row, column) {
    const worldX = column * this.worldXPerColumn - this.sizeX * 0.5;
    const worldZ = this.sizeY * 0.5 - row * this.worldZPerRow;
    const flattenDistance = Math.max(
      Math.abs(worldX) * this.inverseFlattenWidth,
      Math.abs(worldZ - this.runwayCenterZ) * this.inverseFlattenLength
    );
    const flattenWeight = 1 - smoothstep(0.75, 1, flattenDistance);
    const rawHeight = this.getTerrainHeightAtGrid(row, column);
    const normalizedHeight = rawHeight * this.inverseMaxHeight;

    // Image water is preserved; procedural rivers are only used without a heightmap.
    let riverWeight = 0;
    if (!this.heightmap) {
      const riverNoise = Math.abs(noise.simplex2(
        row * this.inverseRiverNoiseScale + 13,
        column * this.inverseRiverNoiseScale - 29
      ));
      riverWeight = (1 - smoothstep(0.025, 0.07, riverNoise))
        * (1 - smoothstep(0.2, 0.48, normalizedHeight));
    }

    const naturalHeight = rawHeight * (1 - riverWeight)
      + this.riverFloorHeight * riverWeight;

    return naturalHeight * (1 - flattenWeight) + this.runwayElevation * flattenWeight;
  }

  buildTerrainHeightGrid() {
    const heights = new Float32Array(this.terrainGridWidth * this.terrainGridHeight);

    for (let row = 0; row < this.terrainGridHeight; row++) {
      const rowOffset = row * this.terrainGridWidth;
      for (let column = 0; column < this.terrainGridWidth; column++) {
        heights[rowOffset + column] = this.getFlattenedTerrainHeight(row, column);
      }
    }

    this.terrainHeightGrid = heights;
    return heights;
  }

  sampleTerrainHeightGrid(row, column) {
    const clampedRow = Math.max(0, Math.min(this.columns, row));
    const clampedColumn = Math.max(0, Math.min(this.rows, column));
    const rowStart = Math.floor(clampedRow);
    const columnStart = Math.floor(clampedColumn);
    const rowEnd = Math.min(this.columns, rowStart + 1);
    const columnEnd = Math.min(this.rows, columnStart + 1);
    const rowMix = clampedRow - rowStart;
    const columnMix = clampedColumn - columnStart;
    const topIndex = rowStart * this.terrainGridWidth + columnStart;
    const bottomIndex = rowEnd * this.terrainGridWidth + columnStart;
    const heights = this.terrainHeightGrid;
    const top = heights[topIndex] * (1 - columnMix)
      + heights[topIndex + columnEnd - columnStart] * columnMix;
    const bottom = heights[bottomIndex] * (1 - columnMix)
      + heights[bottomIndex + columnEnd - columnStart] * columnMix;

    return top * (1 - rowMix) + bottom * rowMix;
  }

  getTerrainHeight(position) {
    const row = this.columns * 0.5 + position.z * this.worldToRowScale;
    const column = this.rows * 0.5 + position.x * this.worldToColumnScale;

    if (this.terrainHeightGrid) {
      return this.sampleTerrainHeightGrid(row, column) - this.groundOffset;
    }

    const rowStart = Math.max(0, Math.min(this.columns, Math.floor(row)));
    const columnStart = Math.max(0, Math.min(this.rows, Math.floor(column)));
    const rowEnd = Math.min(this.columns, rowStart + 1);
    const columnEnd = Math.min(this.rows, columnStart + 1);
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
    const normalizedHeight = height * this.inverseMaxHeight;
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
    // With a full image blend, use the source image directly as the texture.
    const imageBlend = this.heightmap ? (this.imageColorBlend || 0) : 0;
    if (imageBlend >= 0.999) {
      return new THREE.CanvasTexture(this.heightmap.colorCanvas);
    }

    const textureSize = 512;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = textureSize;
    canvas.height = textureSize;

    // For partial blends, resample the source image to the texture resolution.
    let imagePixels = null;
    if (imageBlend > 0) {
      context.drawImage(this.heightmap.colorCanvas, 0, 0, textureSize, textureSize);
      imagePixels = context.getImageData(0, 0, textureSize, textureSize).data;
    }

    const image = context.createImageData(textureSize, textureSize);
    const pixels = image.data;
    const rowStep = this.columns / (textureSize - 1);
    const columnStep = this.rows / (textureSize - 1);
    const largeNoiseScale = 1 / 8;
    const fineNoiseScale = 1 / 2.5;
    const hasHeightGrid = this.terrainHeightGrid !== null;

    for (let y = 0; y < textureSize; y++) {
      const row = y * rowStep;
      for (let x = 0; x < textureSize; x++) {
        const column = x * columnStep;
        const height = hasHeightGrid
          ? this.sampleTerrainHeightGrid(row, column)
          : this.getFlattenedTerrainHeight(row, column);
        const largeVariation = noise.simplex2(
          row * largeNoiseScale,
          column * largeNoiseScale
        ) * 0.035;
        const fineVariation = noise.simplex2(
          row * fineNoiseScale,
          column * fineNoiseScale
        ) * 0.018;
        const color = this.getTerrainColor(height, largeVariation + fineVariation);
        const pixelIndex = (y * textureSize + x) * 4;

        let red = color.r * 255;
        let green = color.g * 255;
        let blue = color.b * 255;

        if (imagePixels) {
          red = red * (1 - imageBlend) + imagePixels[pixelIndex] * imageBlend;
          green = green * (1 - imageBlend) + imagePixels[pixelIndex + 1] * imageBlend;
          blue = blue * (1 - imageBlend) + imagePixels[pixelIndex + 2] * imageBlend;
        }

        pixels[pixelIndex] = red;
        pixels[pixelIndex + 1] = green;
        pixels[pixelIndex + 2] = blue;
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
    const terrainHeights = this.buildTerrainHeightGrid();
    const geometry = new THREE.PlaneGeometry(this.sizeX, this.sizeY, this.rows, this.columns);
    const material = new THREE.MeshLambertMaterial({
      map: this.createTerrainTexture(),
      side: THREE.DoubleSide,
    });
    const terrainMesh = new THREE.Mesh(geometry, material);
    const terrainGroup = new THREE.Group();

    for (let row = 0; row <= this.columns; row++) {
      const rowOffset = row * (this.rows + 1);
      for (let column = 0; column <= this.rows; column++) {
        geometry.vertices[rowOffset + column].z = terrainHeights[rowOffset + column];
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

// -----------------------------------------------------------------------------
// Image-based terrain utilities.
// -----------------------------------------------------------------------------

// Accepts a URL, File/Blob, <img>, canvas, or ImageBitmap.
function loadImageSource(source) {
  if (typeof source === 'string') {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image: ' + source));
      image.src = source;
    });
  }

  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    return createImageBitmap(source);
  }

  if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement && !source.complete) {
    return new Promise((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = () => reject(new Error('Failed to load image.'));
    });
  }

  return Promise.resolve(source);
}

// Separable box blur with clamped edges.
function boxBlur(data, width, height, radius, passes) {
  let current = Float32Array.from(data);
  let temp = new Float32Array(data.length);
  const span = radius * 2 + 1;

  for (let pass = 0; pass < (passes || 1); pass++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) {
          sum += current[y * width + Math.min(width - 1, Math.max(0, x + k))];
        }
        temp[y * width + x] = sum / span;
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) {
          sum += temp[Math.min(height - 1, Math.max(0, y + k)) * width + x];
        }
        current[y * width + x] = sum / span;
      }
    }
  }

  return current;
}

// Distance in pixels from each cell to the nearest cell where mask = 1.
function distanceFromMask(mask, width, height) {
  const INF = 1e9;
  const orthogonal = 1;
  const diagonal = 1.4142;
  const dist = new Float32Array(mask.length);

  for (let i = 0; i < mask.length; i++) {
    dist[i] = mask[i] ? 0 : INF;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let d = dist[i];
      if (x > 0) d = Math.min(d, dist[i - 1] + orthogonal);
      if (y > 0) {
        d = Math.min(d, dist[i - width] + orthogonal);
        if (x > 0) d = Math.min(d, dist[i - width - 1] + diagonal);
        if (x < width - 1) d = Math.min(d, dist[i - width + 1] + diagonal);
      }
      dist[i] = d;
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      let d = dist[i];
      if (x < width - 1) d = Math.min(d, dist[i + 1] + orthogonal);
      if (y < height - 1) {
        d = Math.min(d, dist[i + width] + orthogonal);
        if (x < width - 1) d = Math.min(d, dist[i + width + 1] + diagonal);
        if (x > 0) d = Math.min(d, dist[i + width - 1] + diagonal);
      }
      dist[i] = d;
    }
  }

  return dist;
}