import { setComputed, setError } from '../shared/value-info';
import { IPersistentStorage, ITestRunStorage } from './storage/types';

export class Setter {
  constructor(
    private testRunStorage: ITestRunStorage,
    private persistentStorage: IPersistentStorage,
  ) {}

  // eslint-disable-next-line visual/complexity, max-statements
  async set({ key, value, error }: { key: string; value?: unknown; error?: string }) {
    const valueInfo = await this.testRunStorage.load(key);

    // todo: convert to warnings?
    if (!valueInfo) {
      throw new Error(`Cannot set value for key "${key}" that is not loaded.`);
    }
    if (valueInfo.state !== 'computing') {
      throw new Error(
        `Cannot set value for key "${key}" that is not in "computing" state (${valueInfo.state}).`,
      );
    }

    if (error) {
      setError(valueInfo, error);
      await this.testRunStorage.save(valueInfo, { notify: true });
      // We delete file on error, as error may be related to the invalid value.
      if (valueInfo.persistent) await this.persistentStorage.delete(key);
    } else {
      setComputed(valueInfo, value);
      await this.testRunStorage.save(valueInfo, { notify: true });
      if (valueInfo.persistent) await this.persistentStorage.save(valueInfo);
    }

    return valueInfo;
  }
}
