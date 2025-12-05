/**
 * Global storage server configuration.
 */
import { Express } from 'express';
import { removeUndefined } from '../shared/utils/object';

export type GlobalCacheServerConfig = {
  port?: number;
  basePath?: string;
  multiInstance?: boolean; // not used now
};

const defaults: Pick<Required<GlobalCacheServerConfig>, 'basePath'> = {
  basePath: '.global-cache',
};

export type GlobalCacheServerConfigResolved = ReturnType<typeof resolveConfig>;

export function setConfig(app: Express, config: GlobalCacheServerConfigResolved) {
  app.locals.config = config;
}

export function getConfig(app: Express) {
  return app.locals.config as GlobalCacheServerConfigResolved;
}

export function resolveConfig(providedConfig?: GlobalCacheServerConfig) {
  return Object.assign({}, defaults, removeUndefined(providedConfig));
}
