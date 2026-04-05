export const isLowEndDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Use navigator.hardwareConcurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;

  // Use navigator.deviceMemory (RAM in GB) - currently only in Chromium-based browsers
  // Default to 4 if not available
  const memory = (navigator as any).deviceMemory || 4;

  // Detect iOS explicitly, since it tends to perform well even with lower specs,
  // but older iOS devices might struggle
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  if (isIOS) {
    // Basic iOS heuristic - if it doesn't support WebGL2 well, it's likely old
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
  }

  // Determine if it's low end based on cores and memory
  // A typical low-end device today has < 4 cores or <= 4GB RAM
  if (cores < 4 || memory <= 4) {
    return true;
  }

  return false;
};

export const applyDevicePerformanceClass = () => {
  if (typeof window === 'undefined') return;

  if (isLowEndDevice()) {
    document.documentElement.classList.add('low-end-device');
  } else {
    document.documentElement.classList.remove('low-end-device');
  }
};
