/**
 * Dev/test-only mock helpers. Never enable in production builds.
 */
export function isDevMockDataEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function assertDevMockDataEnabled(): void {
  if (!isDevMockDataEnabled()) {
    throw new Error("Mock data is only available in development");
  }
}
