export type CameraDevice = {
  id: string;
  label: string;
};

export function isRearCamera(label: string): boolean {
  return /\b(back|rear|environment)\b/i.test(label);
}

export function isFrontCamera(label: string): boolean {
  return /\b(front|user|face)\b/i.test(label);
}

export function pickPreferredCameraId(devices: CameraDevice[]): string | null {
  if (!devices.length) return null;
  const rear = devices.find((device) => isRearCamera(device.label));
  if (rear) return rear.id;
  if (devices.length > 1) return devices[devices.length - 1].id;
  return devices[0].id;
}

export function nextCameraId(devices: CameraDevice[], currentId: string | null): string | null {
  if (!devices.length) return null;
  if (!currentId) return pickPreferredCameraId(devices);
  const index = devices.findIndex((device) => device.id === currentId);
  if (index < 0) return devices[0].id;
  return devices[(index + 1) % devices.length].id;
}
