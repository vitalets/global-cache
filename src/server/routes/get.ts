import { Express, Router } from 'express';
import { getMemoryStore, MemoryStore, ValueInfo } from '../storage/memory';
import { getFileSystemStore } from '../storage/fs';
import { isExpired, TTL } from '../ttl';
import { getConfig } from '../config';

export const router = Router();

export type GetValueQuery = {
  /* Will value be computed on the client if not found. */
  compute?: string;
  /* Time to live for the value: if set, value is stored on the filesystem. */
  ttl?: string;
};

/**
 * Route for geting a value.
 */
router.get('/:namespace/:runId/:key', async (req, res) => {
  try {
    const { namespace, runId, key } = req.params;
    const query: GetValueQuery = req.query;
    const { basePath } = getConfig(req.app as Express);

    const getter = new Getter(namespace, runId, key, basePath);
    await getter.loadValue({
      ttl: query.ttl as TTL | undefined,
      compute: Boolean(query.compute),
    });
    if (getter.isMissing) {
      res.sendStatus(404);
    } else {
      res.json(getter.value);
    }
  } catch (error) {
    const message = (error as Error)?.message || String(error);
    res.status(500).send(message);
  }
});

class Getter {
  isMissing?: boolean;
  value?: unknown;
  private memoryStore: MemoryStore;
  private valueInfo?: ValueInfo;

  // eslint-disable-next-line max-params
  constructor(
    private namespace: string,
    runId: string,
    private key: string,
    private basePath: string,
  ) {
    this.memoryStore = getMemoryStore(namespace, runId);
  }

  // eslint-disable-next-line visual/complexity
  async loadValue({ ttl, compute }: { ttl?: TTL; compute: boolean }) {
    this.loadFromMemory();

    if (ttl) {
      this.clearIfExpired(ttl);
    }

    if (ttl && !this.valueInfo) {
      await this.loadFromFileSystem(ttl);
    }

    if (!this.valueInfo) {
      this.handleMissing(compute);
    } else if (this.valueInfo.pending) {
      await this.waitForCompute();
    } else {
      this.value = this.valueInfo.value;
    }
  }

  private loadFromMemory() {
    this.valueInfo = this.memoryStore.get(this.key);
  }

  private async loadFromFileSystem(ttl: TTL) {
    const fileSystemStore = getFileSystemStore(this.basePath, this.namespace);
    this.valueInfo = await fileSystemStore.load(this.key, ttl);
    // store value in memory as well for faster access next time
    if (this.valueInfo) this.memoryStore.set(this.key, this.valueInfo);
  }

  private clearIfExpired(ttl: TTL) {
    if (this.valueInfo && isExpired(this.valueInfo.computedAt, ttl)) {
      this.memoryStore.delete(this.key);
      this.valueInfo = undefined;
    }
  }

  private handleMissing(compute: boolean) {
    if (compute) {
      this.memoryStore.set(this.key, { key: this.key, pending: true });
    }
    this.isMissing = true;
  }

  private async waitForCompute() {
    const valueInfo = this.valueInfo!;
    this.value = await new Promise((resolve, reject) => {
      valueInfo.listeners = valueInfo.listeners || [];
      valueInfo.listeners.push({ resolve, reject });
      this.memoryStore.set(this.key, valueInfo);
    });
  }
}
