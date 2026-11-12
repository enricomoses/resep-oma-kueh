import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const repositoryRoot = new URL('../../', import.meta.url);
export function runCli(args, { workdir = repositoryRoot } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(
          new URL('node_modules/supabase/dist/supabase.js', repositoryRoot),
        ),
        '--workdir',
        fileURLToPath(workdir),
        ...args,
      ],
      { cwd: fileURLToPath(repositoryRoot), stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const chunks = [];
    let bytes = 0;
    child.stdout.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > 16 * 1024 * 1024) {
        child.kill();
        return;
      }
      chunks.push(chunk);
    });
    // CLI output may contain local credentials. Never echo stdout/stderr on failure.
    child.stderr.resume();
    child.on('error', () =>
      reject(new Error('Local Supabase CLI could not start; output withheld.')),
    );
    child.on('close', (code) =>
      resolve({ code, stdout: Buffer.concat(chunks).toString('utf8') }),
    );
  });
}
export async function requireCli(args, options) {
  const result = await runCli(args, options);
  if (result.code !== 0)
    throw new Error(
      `Supabase ${args.slice(0, 2).join(' ')} failed (exit ${result.code}); credential-bearing output withheld.`,
    );
  return result.stdout;
}
