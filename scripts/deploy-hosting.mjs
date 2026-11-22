import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadEnv } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const firebasePackage = 'firebase-tools@15.37.0';
const target = 'escrowhealth';
const evidenceSite = 'escrowhealth-hybrid-test';
const stagingPrefix = 'escrowhealth-hosting-';
const usage = 'npm run deploy:hosting -- --project PROJECT_ID --site SITE_ID [--check]';

function npm(args, { cwd = root, env = process.env, capture = false } = {}) {
  const executable = process.env.npm_execpath;
  if (!executable) throw new Error(`Run this command through npm. ${usage}`);
  const result = spawnSync(process.execPath, [executable, ...args], {
    cwd,
    env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const operation = args.slice(0, args[0] === 'exec' ? 5 : 2).join(' ');
    throw new Error(`npm ${operation} failed. Check the Firebase account and project permissions if applicable.`);
  }
  return result.stdout;
}

function firebase(args, options) {
  return npm(['exec', '--yes', `--package=${firebasePackage}`, '--', 'firebase', ...args], options);
}

function validateEnvironment(project) {
  const fields = {
    VITE_FIREBASE_API_KEY: /^AIza[A-Za-z0-9_-]{35}$/,
    VITE_FIREBASE_PROJECT_ID: /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/,
    VITE_FIREBASE_APP_ID: /^1:\d+:web:[0-9a-f]+$/i,
    VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY: /^[A-Za-z0-9_-]{20,}$/,
  };
  const env = loadEnv('production', root, 'VITE_');
  const invalid = Object.entries(fields).filter(([name, pattern]) => !pattern.test(env[name]?.trim() ?? ''));
  if (invalid.length) throw new Error(`Set the Firebase Web app values in .env.local. Missing or invalid: ${invalid.map(([name]) => name).join(', ')}`);
  if (env.VITE_FIREBASE_PROJECT_ID.trim() !== project) throw new Error('The Firebase project in the build environment differs from --project.');
}

function verifySite(project, site) {
  const output = firebase(['hosting:sites:list', '--project', project, '--json', '--non-interactive'], { capture: true });
  const response = JSON.parse(output);
  if (response.status !== 'success' || !response.result?.sites?.some(({ name }) => name === `projects/${project}/sites/${site}`)) {
    throw new Error('The requested Hosting site was not found in the authenticated Firebase project.');
  }
}

function main() {
  const { values } = parseArgs({ options: {
    project: { type: 'string' }, site: { type: 'string' }, check: { type: 'boolean' }, help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log(usage);
    console.log('--check builds and validates the environment without contacting Firebase.');
    return;
  }
  const { project, site, check } = values;
  if (!project || !site || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project) || !/^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/.test(site)) {
    throw new Error(`Provide a Firebase project ID and Hosting site ID. ${usage}`);
  }
  if (!check && site === evidenceSite) {
    throw new Error('This standalone build would replace the existing spike and dashboard evidence site. Choose a separate Hosting site.');
  }
  validateEnvironment(project);
  if (!check) verifySite(project, site);

  const temp = realpathSync(tmpdir());
  const stage = realpathSync(mkdtempSync(join(temp, stagingPrefix)));
  if (dirname(stage) !== temp || !basename(stage).startsWith(stagingPrefix)) throw new Error('Unexpected staging path.');
  try {
    npm(['run', 'build', '--', '--base', '/', '--outDir', join(stage, 'dist')], {
      env: { ...process.env, VITE_ENABLE_LIVE_JUDGE: 'true' },
    });
    if (check) {
      console.log(`Live Judge Mode build passed for ${project}. No Hosting deployment was made.`);
      return;
    }

    const { hosting } = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
    writeFileSync(join(stage, 'firebase.json'), JSON.stringify({ hosting: { ...hosting, target } }, null, 2));
    firebase(['target:apply', 'hosting', target, site, '--project', project, '--non-interactive'], { cwd: stage });
    firebase(['deploy', '--only', `hosting:${target}`, '--project', project, '--non-interactive'], { cwd: stage });
    console.log(`Run the hosted smoke test at https://${site}.web.app/`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
