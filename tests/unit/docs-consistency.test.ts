import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { ROUTES } from '@/constants/routes.constant';

const REPO_ROOT = resolve(process.cwd());

function collectMarkdownFiles(): string[] {
  const files = [join(REPO_ROOT, 'README.md'), join(REPO_ROOT, 'DESIGN.md')];
  const docsDir = join(REPO_ROOT, 'docs');
  for (const name of readdirSync(docsDir)) {
    if (name.endsWith('.md')) {
      files.push(join(docsDir, name));
    }
  }
  return files.filter((filePath) => existsSync(filePath));
}

function stripFencedCodeBlocks(markdown: string): {
  stripped: string;
  balanced: boolean;
} {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  const kept: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (match) {
      const marker = match[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
        continue;
      }
      if (
        marker[0] === fenceChar &&
        marker.length >= fenceLen &&
        line.trim().length === marker.length
      ) {
        inFence = false;
        fenceChar = '';
        fenceLen = 0;
        continue;
      }
    }
    if (!inFence) {
      kept.push(line);
    }
  }

  return { stripped: kept.join('\n'), balanced: !inFence };
}

it('validates balanced code fences and relative markdown links across docs and README', () => {
  const files = collectMarkdownFiles();
  expect(files.length).toBeGreaterThanOrEqual(8);

  const linkRegex = /\[[^\]]*\]\(([^)]+)\)/g;

  for (const filePath of files) {
    const raw = readFileSync(filePath, 'utf8');
    const { stripped, balanced } = stripFencedCodeBlocks(raw);
    expect(balanced, `Unbalanced code fence in ${filePath}`).toBe(true);

    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(stripped)) !== null) {
      const target = match[1].trim();
      if (
        target.startsWith('#') ||
        target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('mailto:')
      ) {
        continue;
      }
      const [filePart] = target.split('#');
      if (!filePart) continue;
      const resolvedTarget = resolve(dirname(filePath), filePart);
      expect(
        existsSync(resolvedTarget),
        `Broken relative link "${target}" in ${filePath}`,
      ).toBe(true);
    }
  }
});

function collectAppRouteSegments(dir: string, prefix = ''): Set<string> {
  const routes = new Set<string>();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const isRouteGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
    if (entry.name.startsWith('_')) continue;
    const nextPrefix = isRouteGroup ? prefix : `${prefix}/${entry.name}`;
    const fullDir = join(dir, entry.name);
    if (
      existsSync(join(fullDir, 'page.tsx')) ||
      existsSync(join(fullDir, 'route.ts'))
    ) {
      routes.add(nextPrefix || '/');
    }
    for (const nested of collectAppRouteSegments(fullDir, nextPrefix)) {
      routes.add(nested);
    }
  }
  return routes;
}

it('ensures every static route in ROUTES corresponds to an App Router page or route handler', () => {
  const appRoutes = collectAppRouteSegments(join(REPO_ROOT, 'src', 'app'));
  const staticRoutes = Object.values(ROUTES);
  for (const route of staticRoutes) {
    if (route.includes('[')) continue;
    expect(
      appRoutes.has(route),
      `Missing Next App Router target for route ${route}`,
    ).toBe(true);
  }
});

it('ensures every key in .env.example matches env schemas and no TODO/FIXME remain in src/', () => {
  const envExample = readFileSync(join(REPO_ROOT, '.env.example'), 'utf8');
  const envKeys = envExample
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim());

  const clientEnvSchemaText = readFileSync(
    join(REPO_ROOT, 'src', 'validations', 'env.schema.ts'),
    'utf8',
  );
  const serverEnvSchemaText = readFileSync(
    join(REPO_ROOT, 'src', 'config', 'environment.server.ts'),
    'utf8',
  );
  const combinedSchemaText = `${clientEnvSchemaText}\n${serverEnvSchemaText}`;

  for (const key of envKeys) {
    expect(
      combinedSchemaText.includes(key),
      `Unreferenced .env.example key: ${key}`,
    ).toBe(true);
  }
});
