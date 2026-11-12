import type { z } from 'zod';

import { CONFIGURATION_COPY } from '@/constants/copy.constant';

export class EnvironmentConfigurationError extends Error {
  constructor(keys: string[]) {
    super(`${CONFIGURATION_COPY}: ${[...new Set(keys)].sort().join(', ')}`);
    this.name = 'EnvironmentConfigurationError';
  }
}

export function parseEnvironment<T>(schema: z.ZodType<T>, input: unknown): T {
  let result: ReturnType<typeof schema.safeParse>;
  try {
    result = schema.safeParse(input);
  } catch {
    // A custom refinement can throw before Zod builds its issue list.
    throw new EnvironmentConfigurationError(['environment']);
  }
  if (!result.success) {
    // Do not attach ZodError/cause/input; they can contain environment values.
    throw new EnvironmentConfigurationError(
      result.error.issues.map((issue) =>
        String(issue.path[0] ?? 'environment'),
      ),
    );
  }
  return result.data;
}
