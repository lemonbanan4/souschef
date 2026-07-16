/** Guards every localStorage write against quota errors / disabled storage (e.g. Safari private browsing). */

export function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // storage disabled — nothing to do
  }
}
