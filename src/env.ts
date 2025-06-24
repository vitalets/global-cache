/**
 * Env variables are used to share data between host process and workers.
 */

export const env = {
  get serverUrl() {
    return process.env.GLOBAL_STORAGE_URL || '';
  },

  set serverUrl(value: string) {
    process.env.GLOBAL_STORAGE_URL = value;
  },

  get runId() {
    return process.env.GLOBAL_STORAGE_RUN_ID || '';
  },

  set runId(value: string) {
    process.env.GLOBAL_STORAGE_RUN_ID = value;
  },

  get namespace() {
    return process.env.GLOBAL_STORAGE_NAMESPACE || '';
  },

  set namespace(value: string) {
    process.env.GLOBAL_STORAGE_NAMESPACE = value;
  },
};
