const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const finitePositive = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function resolveBoundedCameraCenter({ bounds, x, y, viewHeight, viewportWidth, viewportHeight, zoom = 1 }) {
  const safeZoom = finitePositive(zoom, 1);
  const safeViewHeight = finitePositive(viewHeight, 720);
  const safeViewportWidth = finitePositive(viewportWidth, 1);
  const safeViewportHeight = finitePositive(viewportHeight, 1);
  const halfHeight = safeViewHeight / (2 * safeZoom);
  const halfWidth = halfHeight * (safeViewportWidth / safeViewportHeight);
  const minX = Number(bounds.x) || 0;
  const minY = Number(bounds.y) || 0;
  const width = finitePositive(bounds.width, halfWidth * 2);
  const height = finitePositive(bounds.height, halfHeight * 2);
  const maxX = minX + width;
  const maxY = minY + height;

  return {
    x: width <= halfWidth * 2 ? minX + width / 2 : clamp(Number(x) || 0, minX + halfWidth, maxX - halfWidth),
    y: height <= halfHeight * 2 ? minY + height / 2 : clamp(Number(y) || 0, minY + halfHeight, maxY - halfHeight),
    zoom: safeZoom
  };
}

export function setBoundedCameraCenter(renderer, bounds, x, y, zoom = 1) {
  const center = resolveBoundedCameraCenter({
    bounds,
    x,
    y,
    viewHeight: renderer.viewHeight,
    viewportWidth: renderer.width,
    viewportHeight: renderer.height,
    zoom
  });
  renderer.setCameraCenter(center.x, center.y, center.zoom);
  return center;
}
