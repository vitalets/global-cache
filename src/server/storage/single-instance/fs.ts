/**
 * File system storage implementation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ValueInfo } from '../../../shared/value-info';

export type StoredInfo = {
  computedAt: number;
  sig: string;
  value: unknown;
};

export class FileSystemStorage {
  constructor(private basePath: string) {}

  async load(key: string) {
    const filePath = this.getFilePath(key);
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) return;
    const content = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(content) as StoredInfo;
  }

  async save({ key, value, sig }: ValueInfo) {
    const computedAt = Date.now();
    const storedInfo: StoredInfo = { computedAt, sig, value };
    const content = JSON.stringify(storedInfo, null, 2);
    const filePath = this.getFilePath(key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf8');
  }

  async delete(key: string) {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.rm(filePath);
    }
  }

  private getFilePath(key: string) {
    return path.join(this.basePath, `${filenamify(key)}.json`);
  }
}

// eslint-disable-next-line no-control-regex
const filenameReservedRegex = /[<>:"/\\|?*\u0000-\u001F]/g;
function filenamify(s: string, replacement = '-') {
  return s
    .replace(filenameReservedRegex, replacement) // prettier-ignore
    .replace(/\s+/g, replacement); // additionally replace spaces
}
