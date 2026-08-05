declare module 'async-wait-until' {
  interface WaitUntilOptions {
    timeout?: number;
    intervalBetweenAttempts?: number;
  }

  export function waitUntil<T>(condition: () => T | PromiseLike<T>, options?: WaitUntilOptions): Promise<Awaited<T>>;
}
