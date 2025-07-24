/**
 * File system storage implementation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ValueInfo } from '../value-info';
import { parseValue, stringifyValue } from '../../utils/value';

export function fsStorage(basePath: string) {
  return new FileSystemStorage(basePath);
}

class FileSystemStorage {
  constructor(private basePath: string) {}

  async get(key: string): Promise<ValueInfo | undefined> {
    const filePath = this.getFilePath(key);
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) return;

    const { mtimeMs: computedAt } = await fs.promises.stat(filePath);
    const content = await fs.promises.readFile(filePath, 'utf8');
    const value = parseValue(content);

    return { key, value, computedAt, persistent: true, state: 'computed' };
  }

  async set(key: string, value: unknown) {
    const filePath = this.getFilePath(key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const content = stringifyValue(value);
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
