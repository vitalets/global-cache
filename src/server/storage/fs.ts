import fs from 'node:fs';
import path from 'node:path';
import { isExpired, TTL } from '../ttl';

const fsStores = new Map<string | undefined, FileSystemStore>();

export function getFileSystemStore(namespace: string | undefined) {
  if (!fsStores.has(namespace)) {
    fsStores.set(namespace, new FileSystemStore(namespace));
  }
  return fsStores.get(namespace)!;
}

class FileSystemStore {
  private baseDir: string;

  constructor(namespace = 'default') {
    // todo: configure base dir
    this.baseDir = `.global-storage/${filenamify(namespace)}`;
  }

  async load(key: string, ttl: TTL) {
    const filePath = this.getFilePath(key);
    const fileExists = fs.existsSync(filePath);
    const updatedAt = fileExists ? fs.statSync(filePath).mtimeMs : 0;

    if (!updatedAt || isExpired(updatedAt, ttl)) {
      this.delete(key);
      return;
    }

    const value: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    return { key, value, updatedAt };
  }

  save(key: string, value: unknown) {
    const filePath = this.getFilePath(key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  }

  delete(key: string) {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }
  }

  private getFilePath(key: string) {
    const sanitizedKey = filenamify(key);
    return `${this.baseDir}/${sanitizedKey}.json`;
  }
}

// eslint-disable-next-line no-control-regex
const filenameReservedRegex = /[<>:"/\\|?*\u0000-\u001F]/g;
function filenamify(s: string, replacement = '-') {
  return s
    .replace(filenameReservedRegex, replacement) // prettier-ignore
    .replace(/\s+/g, replacement); // additionally replace spaces
}
