import fs from 'node:fs';
import { Express, Router } from 'express';
import { join } from 'path';
import { getConfig } from '../config';

export const router: ReturnType<typeof Router> = Router();

/**
 * Home route.
 */
router.get('/', async (req, res) => {
  const version = getVersion();
  const config = getConfig(req.app as Express);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Global Cache Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .info { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h2>Global Cache Server is running (v${version})</h2>
        <div class="info">
          <h3>Config</h3>
          <code>${JSON.stringify(config, null, 2)}</code>
        </div>
      </body>
    </html>
  `);
});

function getVersion(): string {
  const packageJsonPath = join(__dirname, '../../../package.json');
  const { version } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version: string };
  return version;
}
