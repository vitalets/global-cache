import fs from 'node:fs';
import path from 'node:path';
import { isExpired, TTL } from '../ttl';
import { ValueInfo } from './memory';

const fsStores = new Map<string | undefined, FileSystemStore>();

export function getFileSystemStore(basePath: string, namespace: string) {
  if (!fsStores.has(namespace)) {
    fsStores.set(namespace, new FileSystemStore(basePath, namespace));
  }
  return fsStores.get(namespace)!;
}

class FileSystemStore {
  private namespacePath: string;

  constructor(basePath: string, namespace: string) {
    this.namespacePath = path.join(basePath, filenamify(namespace));
  }

  async load(key: string, ttl: TTL): Promise<ValueInfo | undefined> {
    const filePath = this.getFilePath(key);
    const fileExists = fs.existsSync(filePath);
    const computedAt = fileExists ? fs.statSync(filePath).mtimeMs : 0;

    if (!computedAt || isExpired(computedAt, ttl)) {
      this.delete(key);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const value: unknown = content ? JSON.parse(content) : undefined;

    return { key, value, computedAt };
  }

  save(key: string, value: unknown) {
    const filePath = this.getFilePath(key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    // undefined values are stored as empty files
    const content = JSON.stringify(value, null, 2) || '';
    fs.writeFileSync(filePath, content, 'utf8');
  }

  delete(key: string) {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }
  }

  private getFilePath(key: string) {
    const sanitizedKey = filenamify(key);
    return `${this.namespacePath}/${sanitizedKey}.json`;
  }
}

// eslint-disable-next-line no-control-regex
const filenameReservedRegex = /[<>:"/\\|?*\u0000-\u001F]/g;
function filenamify(s: string, replacement = '-') {
  return s
    .replace(filenameReservedRegex, replacement) // prettier-ignore
    .replace(/\s+/g, replacement); // additionally replace spaces
}
