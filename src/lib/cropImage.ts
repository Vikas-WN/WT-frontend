/** Where the crop circle sits on the source image, as a square in source pixels. */
export interface CropSquare {
  x: number;
  y: number;
  size: number;
}

/** Clamp a drag offset so the crop circle never leaves the image. All values are display pixels. */
export function clampCropOffset(offset: number, displaySize: number, circle: number): number {
  const limit = Math.max((displaySize - circle) / 2, 0);
  return Math.min(Math.max(offset, -limit), limit);
}

/** Map the picture's position in the viewport back to a square of the original image. */
export function cropSquareFor(input: {
  naturalWidth: number;
  naturalHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  circle: number;
}): CropSquare {
  const { naturalWidth, naturalHeight, scale, offsetX, offsetY, circle } = input;
  const displayWidth = naturalWidth * scale;
  const displayHeight = naturalHeight * scale;
  return {
    x: (displayWidth / 2 - offsetX - circle / 2) / scale,
    y: (displayHeight / 2 - offsetY - circle / 2) / scale,
    size: circle / scale,
  };
}

/** Draw the chosen square into a JPEG of `outputSize` pixels (white behind transparent pixels). */
export function renderCrop(image: HTMLImageElement, square: CropSquare, outputSize: number, fileName: string): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas is not available"));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, square.x, square.y, square.size, square.size, 0, 0, outputSize, outputSize);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], fileName, { type: "image/jpeg" })) : reject(new Error("Could not encode the image"))),
      "image/jpeg",
      0.92
    );
  });
}
