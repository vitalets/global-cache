/**
 * Global storage server configuration.
 */
import { Express } from 'express';
import { removeUndefined } from '../shared/utils/object';

export type GlobalCacheServerConfig = {
  port?: number;
  basePath?: string;
  multiInstance?: boolean;
};

const defaults: Pick<Required<GlobalCacheServerConfig>, 'basePath'> = {
  basePath: '.global-cache',
};

export type GlobalCacheServerConfigResolved = ReturnType<typeof buildResolvedConfig>;

export function setConfig(app: Express, providedConfig: GlobalCacheServerConfig) {
  app.locals.config = buildResolvedConfig(providedConfig);
}

export function getConfig(app: Express) {
  return app.locals.config as GlobalCacheServerConfigResolved;
}

function buildResolvedConfig(providedConfig: GlobalCacheServerConfig) {
  return Object.assign({}, defaults, removeUndefined(providedConfig));
}
