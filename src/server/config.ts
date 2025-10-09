/**
 * Global storage server configuration.
 */
import { Express } from 'express';
import { removeUndefined } from '../shared/utils/object';

export type GlobalStorageServerConfig = {
  port?: number;
  basePath?: string;
  multiInstance?: boolean;
};

const defaults: Pick<Required<GlobalStorageServerConfig>, 'basePath'> = {
  basePath: '.global-cache',
};

export type GlobalStorageServerConfigResolved = ReturnType<typeof buildResolvedConfig>;

export function setConfig(app: Express, providedConfig: GlobalStorageServerConfig) {
  app.locals.config = buildResolvedConfig(providedConfig);
}

export function getConfig(app: Express) {
  return app.locals.config as GlobalStorageServerConfigResolved;
}

function buildResolvedConfig(providedConfig: GlobalStorageServerConfig) {
  return Object.assign({}, defaults, removeUndefined(providedConfig));
}
