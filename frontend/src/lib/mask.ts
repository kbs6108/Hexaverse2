/** Same rule as the gateway's masking service: first letter + '***' per word. */
export function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w[0] ?? ''}***`)
    .join(' ');
}
