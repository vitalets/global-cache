/**
 * Global config singleton shared across host and all workers via env variables.
 */

import { removeUndefined } from './shared/utils/object';

export type GlobalConfigInput = {
  /* Forces all values to be non-persistent, usefull for CI */
  ignoreTTL?: boolean;
  /* Where to store files, ignored if serverUrl is set */
  basePath?: string;
  /* Disables global storage, all values will be computed each time */
  disabled?: boolean;
  /* Custom server URL to connect to an external global-cache server */
  serverUrl?: string;
};

type GlobalConfigResolved = GlobalConfigInput & {
  serverUrl: string;
};

export class GlobalConfig {
  private config: GlobalConfigResolved = {
    serverUrl: '', // serverUrl will be set later, when server starts.
  };

  constructor() {
    Object.assign(this.config, getConfigFromEnv());
  }

  update(config: Partial<GlobalConfigResolved>) {
    Object.assign(this.config, removeUndefined(config));
    saveConfigToEnv(this.config);
  }

  get serverUrl() {
    return this.config.serverUrl;
  }

  get ignoreTTL() {
    return Boolean(this.config.ignoreTTL);
  }

  get basePath() {
    return this.config.basePath;
  }

  get disabled() {
    return Boolean(this.config.disabled);
  }
}

function getConfigFromEnv() {
  const configFromEnv = process.env.GLOBAL_STORAGE_CONFIG;
  return configFromEnv ? (JSON.parse(configFromEnv) as GlobalConfigInput) : undefined;
}

function saveConfigToEnv(config: GlobalConfigInput) {
  process.env.GLOBAL_STORAGE_CONFIG = JSON.stringify(config);
}

/* Export singleton instance */
export const globalConfig = new GlobalConfig();
