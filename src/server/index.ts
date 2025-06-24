import http from 'node:http';
import express from 'express';
import routeGet from './routes/get';
import routeSet from './routes/set';

const app = express();
app.use(express.json());
app.use(routeGet);
app.use(routeSet);

let server: http.Server;

// See: https://github.com/nodejs/node/issues/21482#issuecomment-626025579
export function startServer() {
  return new Promise<http.Server>((resolve, reject) => {
    server = app
      .listen()
      .once('listening', () => resolve(server))
      .once('error', reject);
  });
}

export function stopServer() {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

// Read all files, filter by prefix
// Should I check for expired? But it's impossible, as each key may have different ttl.
// app.get('/get-all/:prefix', (req, res) => {
//   const prefix = req.params.prefix;
//   const result: Record<string, any> = {};
//   for (const [key, entry] of Object.entries(storage)) {
//     if (key.startsWith(prefix) && (!entry.expiresAt || Date.now() <= entry.expiresAt)) {
//       result[key] = entry.value;
//     }
//   }
//   res.json(result);
// });
