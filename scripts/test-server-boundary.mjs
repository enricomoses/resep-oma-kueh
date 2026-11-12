import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const fixture = mkdtempSync(path.join(os.tmpdir(), 'rok-server-boundary-'));
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    /^(?:PATH|PATHEXT|SYSTEMROOT|WINDIR|TEMP|TMP|COMSPEC|HOME|USERPROFILE|LOCALAPPDATA)$/i.test(
      key,
    ),
  ),
);
env.APP_ENV = 'test';
env.CHAT_PROVIDER_ENABLED = 'false';
env.NEXT_TELEMETRY_DISABLED = '1';

function build() {
  const result = spawnSync(process.execPath, [nextBin, 'build', '--webpack'], {
    cwd: fixture,
    env,
    encoding: 'utf8',
    timeout: 150_000,
  });
  return {
    exit: result.status,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  };
}

try {
  mkdirSync(path.join(fixture, 'app'));
  symlinkSync(
    path.join(root, 'node_modules'),
    path.join(fixture, 'node_modules'),
    'junction',
  );
  writeFileSync(
    path.join(fixture, 'next.config.mjs'),
    `export default { webpack(config) { config.resolve.alias['@'] = ${JSON.stringify(path.join(root, 'src').replaceAll('\\', '/'))}; return config; } };`,
  );
  writeFileSync(
    path.join(fixture, 'package.json'),
    JSON.stringify({ name: 'rok-boundary-fixture', private: true }),
  );
  writeFileSync(
    path.join(fixture, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        paths: { '@/*': [path.join(root, 'src/*').replaceAll('\\', '/')] },
      },
    }),
  );
  writeFileSync(
    path.join(fixture, 'app/layout.tsx'),
    'export default function Layout({children}: {children: React.ReactNode}) { return <html><body>{children}</body></html> }',
  );
  const serverPath = path
    .join(root, 'src/config/environment.server')
    .replaceAll('\\', '/');
  const component = `import {getServerEnvironment} from ${JSON.stringify(serverPath)}; export default function Page() { return <p>{getServerEnvironment().APP_ENV}</p> }`;
  writeFileSync(path.join(fixture, 'app/page.tsx'), component);
  const positive = build();
  if (positive.exit !== 0) {
    console.error(
      positive.output
        .replaceAll(root, '<repo>')
        .replaceAll(fixture, '<fixture>'),
    );
    throw new Error(
      'Server-only positive control failed; sanitized fixture build required investigation.',
    );
  }
  console.log('PASS: server import builds using the installed Next compiler.');
  writeFileSync(
    path.join(fixture, 'app/page.tsx'),
    `'use client';\n${component}`,
  );
  const negative = build();
  if (
    negative.exit === 0 ||
    !/server-only/.test(negative.output) ||
    !/Client Component|use client|only available in Server Components/i.test(
      negative.output,
    )
  ) {
    console.error(JSON.stringify({ negativeExit: negative.exit }));
    console.error(
      negative.output
        .replaceAll(root, '<repo>')
        .replaceAll(fixture, '<fixture>'),
    );
    throw new Error(
      'Client import was not rejected by Next with the expected server-only diagnostic.',
    );
  }
  console.log('PASS: the same import is rejected inside a Client Component.');
} finally {
  // The sole recursive removal target is the verified disposable temp fixture.
  if (
    path.dirname(fixture) !== path.resolve(os.tmpdir()) ||
    !path.basename(fixture).startsWith('rok-server-boundary-')
  ) {
    throw new Error('Unsafe fixture cleanup target.');
  }
  rmSync(fixture, { recursive: true, force: true });
}
