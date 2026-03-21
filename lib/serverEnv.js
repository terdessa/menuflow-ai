import 'server-only';
import dotenv from 'dotenv';
import path from 'path';

let envLoaded = false;

export function loadServerEnv() {
  if (envLoaded) return;

  const envPaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'app', '.env'),
  ];

  envPaths.forEach((envPath) => {
    dotenv.config({ path: envPath });
  });

  envLoaded = true;
}
