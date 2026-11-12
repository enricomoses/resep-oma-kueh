import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const container = 'supabase_db_resep-oma-kueh';
const config = await readFile(
  new URL('../supabase/config.toml', import.meta.url),
  'utf8',
);
assert.match(config, /^project_id = "resep-oma-kueh"$/m);
const inspected = spawnSync('docker', ['inspect', container], {
  encoding: 'utf8',
});
assert.equal(inspected.status, 0, 'bakery local container must be available');
const [local] = JSON.parse(inspected.stdout);
assert.equal(local.Name, `/${container}`);
assert.equal(local.State.Running, true);
assert.ok(
  local.HostConfig.PortBindings['5432/tcp'].some(
    (binding) => binding.HostPort === '54322',
  ),
);

// Docker exec addresses only this verified local container; no URI, env key or hosted target.
const args = [
  'exec',
  '-i',
  container,
  'psql',
  '-X',
  '-U',
  'postgres',
  '-d',
  'postgres',
  '-At',
  '-v',
  'ON_ERROR_STOP=1',
  '-v',
  'VERBOSITY=sqlstate',
];
const aId = 'f0200000-0000-4000-8000-000000000001';
const bId = 'f0200000-0000-4000-8000-000000000002';
function run(sql) {
  const result = spawnSync('docker', args, {
    input: sql,
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.equal(result.status, 0, 'local fixture SQL must succeed');
}
function session() {
  const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '';
  let errors = '';
  const markers = new Map();
  const timeout = setTimeout(() => child.kill(), 30000);
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
    for (const [marker, resolve] of markers) {
      if (output.includes(marker)) {
        markers.delete(marker);
        resolve();
      }
    }
  });
  child.stderr.on('data', (chunk) => {
    errors += chunk.toString();
  });
  const done = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timeout);
      for (const resolveMarker of markers.values()) resolveMarker();
      resolve({ code, errors, output });
    });
  });
  return {
    child,
    done,
    marker(value) {
      if (output.includes(value)) return Promise.resolve();
      return new Promise((resolve) => markers.set(value, resolve)).then(() => {
        assert.ok(
          output.includes(value),
          'local transaction handshake must finish',
        );
      });
    },
  };
}

const sessions = [];
run(`insert into public.categories(id,name,slug) values
  ('${aId}','DEMO concurrency A','demo-f02-concurrency-a'),
  ('${bId}','DEMO concurrency B','demo-f02-concurrency-b');`);
try {
  const first = session();
  sessions.push(first);
  first.child.stdin.write(
    `begin; update public.categories set parent_id='${bId}' where id='${aId}'; select 'F02_A_LOCKED';\n`,
  );
  await first.marker('F02_A_LOCKED');
  const second = session();
  sessions.push(second);
  second.child.stdin.write(
    "begin isolation level repeatable read; select count(*) from public.categories; select 'F02_B_SNAPSHOT';\n",
  );
  await second.marker('F02_B_SNAPSHOT');
  second.child.stdin.end(
    `update public.categories set parent_id='${aId}' where id='${bId}'; commit;\n`,
  );
  first.child.stdin.end('commit;\n');
  const [a, b] = await Promise.all([first.done, second.done]);
  assert.equal(a.code, 0, 'first category writer commits');
  assert.equal(b.code, 3, 'stale snapshot writer must fail SQL execution');
  assert.match(
    b.errors,
    /40001/,
    'real row serialization rejects REPEATABLE READ write skew',
  );
  run(`do $$ begin
    if (select parent_id is not null from public.categories where id='${bId}') then
      raise exception 'cycle writer unexpectedly committed';
    end if;
  end $$;`);
  console.log(
    'PASS: two real local PostgreSQL sessions; stale-snapshot category cycle rejected (40001).',
  );
} finally {
  for (const entry of sessions) entry.child.stdin.end();
  await Promise.all(sessions.map((entry) => entry.done));
  run(
    `delete from public.categories where id='${aId}'; delete from public.categories where id='${bId}';`,
  );
}
