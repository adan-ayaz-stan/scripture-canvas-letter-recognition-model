export interface ProcessedLetter {
  id: string;
  imageUrl: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export const extractLetters = async (
  stageCanvas: HTMLCanvasElement
): Promise<ProcessedLetter[]> => {
  const ctx = stageCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const width = stageCanvas.width;
  const height = stageCanvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Visited array to keep track of processed pixels
  // Using a Int8Array for memory efficiency: 0 = unvisited, 1 = visited
  const visited = new Int8Array(width * height);

  const components: { pixels: number[]; minX: number; minY: number; maxX: number; maxY: number }[] = [];

  // Helper to get index
  const getIndex = (x: number, y: number) => (y * width + x) * 4;
  const getVisitedIndex = (x: number, y: number) => y * width + x;

  // Helper to check if pixel is "drawn" (non-transparent and sufficiently opaque)
  const isDrawn = (idx: number) => {
    // Check alpha channel (4th byte)
    // You might also want to check RGB if background isn't transparent
    return data[idx + 3] > 20; 
  };

  // 8-way connectivity for smoother letter grouping
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const vIdx = getVisitedIndex(x, y);
      if (visited[vIdx]) continue;

      const idx = getIndex(x, y);
      if (isDrawn(idx)) {
        // Start of a new component
        const component = {
          pixels: [] as number[], // Stores indices of pixels in this component
          minX: x,
          minY: y,
          maxX: x,
          maxY: y,
        };
        
        // Iterative BFS/Flood Fill
        const stack = [[x, y]];
        visited[vIdx] = 1;

        while (stack.length > 0) {
          const [cx, cy] = stack.pop()!;
          const cIdx = getIndex(cx, cy);
          
          component.pixels.push(cIdx);
          
          // Update bounding box
          if (cx < component.minX) component.minX = cx;
          if (cx > component.maxX) component.maxX = cx;
          if (cy < component.minY) component.minY = cy;
          if (cy > component.maxY) component.maxY = cy;

          // Check neighbors
          for (const [dx, dy] of neighbors) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nVIdx = getVisitedIndex(nx, ny);
              if (!visited[nVIdx]) {
                const nIdx = getIndex(nx, ny);
                if (isDrawn(nIdx)) {
                  visited[nVIdx] = 1;
                  stack.push([nx, ny]);
                }
              }
            }
          }
        }

        // Only add if it has a decent size (ignore tiny noise dots)
        if (component.pixels.length > 10) {
          components.push(component);
        }
      }
    }
  }

  // Sort components left-to-right
  components.sort((a, b) => a.minX - b.minX);

  const processedLetters: ProcessedLetter[] = [];

  for (const comp of components) {
    const boxWidth = comp.maxX - comp.minX + 1;
    const boxHeight = comp.maxY - comp.minY + 1;
    
    // Make it square to preserve aspect ratio when resized
    const maxDim = Math.max(boxWidth, boxHeight);
    const padding = 20; // Increased padding for better centering
    
    const letterCanvas = document.createElement("canvas");
    letterCanvas.width = maxDim + padding * 2;
    letterCanvas.height = maxDim + padding * 2;
    const lCtx = letterCanvas.getContext("2d");
    
    if (lCtx) {
      // Create new ImageData for the letter
      const lImageData = lCtx.createImageData(letterCanvas.width, letterCanvas.height);
      const lData = lImageData.data;

      // FILL WITH WHITE BACKGROUND FIRST (Critical for backend grayscale conversion)
      for (let i = 0; i < lData.length; i += 4) {
        lData[i] = 255;     // R
        lData[i + 1] = 255; // G
        lData[i + 2] = 255; // B
        lData[i + 3] = 255; // A (Opaque)
      }

      // Map pixels from original to new canvas (centering them)
      const offsetX = (maxDim - boxWidth) / 2;
      const offsetY = (maxDim - boxHeight) / 2;

      for (const idx of comp.pixels) {
        // Convert original linear index back to x, y
        const pixelIndex = idx / 4;
        const ox = pixelIndex % width;
        const oy = Math.floor(pixelIndex / width);

        // Calculate new position
        const nx = Math.floor(ox - comp.minX + padding + offsetX);
        const ny = Math.floor(oy - comp.minY + padding + offsetY);
        
        const nIdx = (ny * letterCanvas.width + nx) * 4;

        // Copy RGBA
        lData[nIdx] = data[idx];
        lData[nIdx + 1] = data[idx + 1];
        lData[nIdx + 2] = data[idx + 2];
        lData[nIdx + 3] = data[idx + 3];
      }

      lCtx.putImageData(lImageData, 0, 0);
      
      processedLetters.push({
        id: crypto.randomUUID(),
        imageUrl: letterCanvas.toDataURL("image/jpeg"), // Use JPEG to ensure no transparency
        boundingBox: {
            x: comp.minX,
            y: comp.minY,
            width: boxWidth,
            height: boxHeight
        }
      });
    }
  }

  return processedLetters;
};
