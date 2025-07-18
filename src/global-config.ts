/**
 * Global config shared across host and all workers, uses env variables.
 */
import { randomUUID } from 'node:crypto';

export type GlobalConfigInput = {
  /* Namespace for the global storage, used to separate different projects */
  /* when working with standalone server */
  namespace?: string;
  /* Where to store files, ignored if serverUrl is set */
  basePath?: string;
  /* Disables global storage, all values will be computed each time */
  disabled?: boolean;
  /* URL of the standalone storage server */
  serverUrl?: string;
  /* External run ID, used for sharded run */
  externalRunId?: string;
};

type GlobalConfigResolved = GlobalConfigInput & {
  namespace: string;
  runId: string;
};

export class GlobalConfig {
  private config: GlobalConfigResolved = {
    namespace: 'default',
    runId: '',
  };

  constructor() {
    Object.assign(this.config, getConfigFromEnv());
    this.ensureRunId();
  }

  update(config: GlobalConfigInput) {
    Object.assign(this.config, config);

    if (config?.externalRunId) {
      this.config.runId = config.externalRunId;
    }

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

  get externalRunId() {
    return this.config.externalRunId;
  }

  get basePath() {
    return this.config.basePath;
  }

  get disabled() {
    return Boolean(this.config.disabled);
  }

  private ensureRunId() {
    if (!this.config.runId) {
      this.config.runId = randomUUID();
      saveConfigToEnv(this.config);
    }
  }
}

function getConfigFromEnv() {
  const configFromEnv = process.env.GLOBAL_STORAGE_CONFIG;
  return configFromEnv ? (JSON.parse(configFromEnv) as GlobalConfigResolved) : undefined;
}

function saveConfigToEnv(config: GlobalConfigResolved) {
  process.env.GLOBAL_STORAGE_CONFIG = JSON.stringify(config);
}

/* Export singleton instance */
export const globalConfig = new GlobalConfig();
