/**
 * Global config shared across host and all workers, uses env variables.
 */
import { randomUUID } from 'node:crypto';

export type GlobalConfigData = {
  serverUrl: string;
  namespace: string;
  runId: string;
  ownRunId?: string;
  /* where to store files, ignored if serverUrl is set */
  basePath?: string;
  disabled?: boolean;
};

// No way to pass runId to the config:
// runId can be provided by env variable or generated automatically.
// If passing runId manually - there will be no way to distinguish
// from generated runId, to finally decide, should we clear the run session or not.
// E.g.:
// globalConfig.update({ runId: process.env.MY_RUN_ID });
// vs
// globalConfig.update({ runId: Math.random() });
export type GlobalConfigProvided = Omit<Partial<GlobalConfigData>, 'runId' | 'ownRunId'>;

export class GlobalConfig {
  private config: GlobalConfigData = {
    serverUrl: '',
    namespace: 'default',
    runId: '',
  };

  constructor() {
    Object.assign(this.config, getConfigFromEnv());
    this.setupRunId();
  }

  update(providedConfig: GlobalConfigProvided) {
    Object.assign(this.config, providedConfig);
    saveConfigToEnv(this.config);
  }

  get serverUrl() {
    return this.config.serverUrl;
  }

  get namespace() {
    return this.config.namespace;
  }

  get runId() {
    return this.config.runId;
  }

  get ownRunId() {
    return this.config.ownRunId;
  }

  get basePath() {
    return this.config.basePath;
  }

  get disabled() {
    return Boolean(this.config.disabled);
  }

  private setupRunId() {
    if (this.config.runId) return;

    // For sharded runs user can set runId for all shards.
    const externalRunId = process.env.GLOBAL_STORAGE_RUN_ID;

    if (externalRunId) {
      this.config.runId = externalRunId;
    } else {
      this.config.runId = this.config.ownRunId = randomUUID();
    }
  }
}

function getConfigFromEnv() {
  return JSON.parse(process.env.GLOBAL_STORAGE_CONFIG || '{}');
}

function saveConfigToEnv(config: GlobalConfigData) {
  process.env.GLOBAL_STORAGE_CONFIG = JSON.stringify(config);
}

export const globalConfig = new GlobalConfig();

/*

export const globalConfig = initGlobalConfig();

export function updateGlobalConfig(providedConfig: GlobalConfigProvided) {
  Object.assign(globalConfig, providedConfig);
  saveConfigToEnv(globalConfig);
}

function initGlobalConfig() {
  const config = Object.assign({}, defaults, getConfigFromEnv());
  setupRunId(config);
  return config as GlobalConfigData;
}

function setupRunId(config: GlobalConfigData) {
  if (config.runId) return;

  // For sharded runs user can set runId for all shards.
  const externalRunId = process.env.GLOBAL_STORAGE_RUN_ID;

  if (externalRunId) {
    config.runId = externalRunId;
  } else {
    config.runId = config.ownRunId = randomUUID();
  }
}
*/
