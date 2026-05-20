import { performance } from "node:perf_hooks";

const roundMs = (value: number): number => Math.round(value * 10) / 10;

export const createRouteTimer = () => {
  const startedAt = performance.now();
  const timings: Record<string, number> = {};

  const measure = async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
    const phaseStartedAt = performance.now();
    try {
      return await operation();
    } finally {
      timings[name] = roundMs(performance.now() - phaseStartedAt);
    }
  };

  const snapshot = () => ({
    ...timings,
    total: roundMs(performance.now() - startedAt),
  });

  return { measure, snapshot };
};
