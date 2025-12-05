import express from 'express';
import http from 'node:http';

/**
 * Start server.
 * See: https://github.com/nodejs/node/issues/21482#issuecomment-626025579
 */
export async function startExpressServer(app: express.Express, port = 0) {
  return new Promise<http.Server>((resolve, reject) => {
    const server = app.listen(port);
    server.once('listening', () => resolve(server));
    server.once('error', reject);
  });
}

export async function stopExpressServer(server: http.Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}
