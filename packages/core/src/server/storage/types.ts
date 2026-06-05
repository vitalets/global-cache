import { TestRunValueInfo } from '../../shared/value-info';

export type ITestRunStorage = {
  load(key: string): Promise<TestRunValueInfo | undefined>;
  save(valueInfo: TestRunValueInfo, options?: { notify?: boolean }): Promise<void>;
  delete(key: string): Promise<void>;
  waitForComputed(key: string): Promise<TestRunValueInfo>;
  claimForComputing(valueInfo: TestRunValueInfo): boolean;
};

export type IPersistentStorage = {
  load(key: string): Promise<TestRunValueInfo | undefined>;
  save(valueInfo: TestRunValueInfo): Promise<void>;
  delete(key: string): Promise<void>;
};
