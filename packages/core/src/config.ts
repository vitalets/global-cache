/**
 * Global config is shared across host and all workers via env variables.
 * Assumption here is that all runners start workers with the same env.
 */
import { randomUUID } from 'node:crypto';
import { removeUndefined } from './shared/utils/object';

export type GlobalCacheConfig = {
  /* Forces all values to be non-persistent, usefull for CI */
  ignoreTTL?: boolean;
  /* Where to store files, ignored if serverUrl is set */
  basePath?: string;
  /* Disables global storage, all values will be computed each time */
  disabled?: boolean;
  /* External server url */
  serverUrl?: string;
};

type GlobalConfigInternal = GlobalCacheConfig & {
  serverUrl: string;
  runId: string;
};

export class GlobalConfig {
  private config: GlobalConfigInternal = {
    serverUrl: '', // will be set later, when server starts.
    runId: '', // will be set later
  };

  constructor() {
    Object.assign(this.config, getConfigFromEnv());
    if (!this.runId) this.newTestRun();
  }

  update(config: Partial<GlobalConfigInternal>) {
    Object.assign(this.config, removeUndefined(config));
    saveConfigToEnv(this.config);
  }

  /**
   * Generate new runId or re-use from env variable.
   * There can be multiple test runs within single server session.
   */
  newTestRun() {
    this.update({ runId: process.env.GLOBAL_CACHE_RUN_ID || randomUUID() });
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

  get runId() {
    return this.config.runId;
  }
}

function getConfigFromEnv() {
  const configFromEnv = process.env.GLOBAL_STORAGE_CONFIG;
  return configFromEnv ? (JSON.parse(configFromEnv) as GlobalCacheConfig) : undefined;
}

function saveConfigToEnv(config: GlobalCacheConfig) {
  process.env.GLOBAL_STORAGE_CONFIG = JSON.stringify(config);
}

/* Export singleton instance */
export const globalConfig = new GlobalConfig();
