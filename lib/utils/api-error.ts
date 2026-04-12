/** Best-effort message from a failed fetch Response (reads body once). */
export async function apiErrorMessage(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type');
    if (ct?.includes('application/json')) {
      const j = (await res.json()) as { error?: unknown; message?: unknown };
      if (typeof j?.error === 'string') return j.error;
      if (typeof j?.message === 'string') return j.message;
    }
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'You need to sign in again.';
  if (res.status === 403) return "You don't have permission to do that.";
  if (res.status === 503) return 'Server is unavailable (check database configuration).';
  return res.statusText || `Request failed (${res.status}).`;
}
