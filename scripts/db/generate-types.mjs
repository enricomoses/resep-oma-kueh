import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';

import { format, resolveConfig } from 'prettier';

import { runCli } from './cli.mjs';

export async function generateTypes({
  destination,
  runner = () =>
    runCli(['gen', 'types', '--lang', 'typescript', '--schema', 'public']),
  check = false,
}) {
  const temporary = new URL(`database.${randomUUID()}.tmp`, destination);
  try {
    const result = await runner();
    if (result.code !== 0)
      throw new Error('Type generator failed; previous types were preserved.');
    if (
      !/export type Database\s*=/.test(result.stdout) ||
      !/["']?public["']?\s*:/.test(result.stdout)
    )
      throw new Error(
        'Generator output is not a Database type; previous types preserved.',
      );
    const output = await format(result.stdout, {
      ...(await resolveConfig(destination)),
      parser: 'typescript',
    });
    if (check) {
      if ((await readFile(destination, 'utf8')) !== output)
        throw new Error('Generated schema types drift; run db:types:local.');
      return;
    }
    await mkdir(new URL('./', destination), { recursive: true });
    await writeFile(temporary, output, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, destination);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}
