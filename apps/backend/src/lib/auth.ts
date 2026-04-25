export function requireServiceKey(
  headers: Record<string, string | undefined>,
  set: { status?: number | string },
): { success: false; message: string } | null {
  const key = process.env.SECRET_SERVICE_KEY;
  if (key && headers['x-service-key'] !== key) {
    set.status = 401;
    return { success: false, message: 'Unauthorized' };
  }
  return null;
}

export function requireModToken(
  headers: Record<string, string | undefined>,
  set: { status?: number | string },
): { success: false; message: string } | null {
  const token = process.env.MODERATE_KEY;
  if (!token || headers['x-mod-token'] !== token) {
    set.status = 401;
    return { success: false, message: 'Unauthorized' };
  }
  return null;
}
