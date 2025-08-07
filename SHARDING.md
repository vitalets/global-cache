# Using parallel-storage with sharding

*This document is a working draft.*

You can share data between multiple shards on CI.
To achieve it:

1. Setup a standalone global storage server.
2. Pass a consistent run ID to all shards.

## Standalone server

You can start global-storage server as a standalone app.

1. Create server script:
```js
// server.js
import { globalStorageServer } from 'global-storage/server';

globalStorageServer.start({
    port: 3000,
    storage: 
});
```
Run:
```sh
node server.js
```

// todo: docker.

2. Provide server URL in the Playwright config:
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage';

globalStorage.defineConfig({
    externalServer: {
        url: 'https://my-global-storage-server.com',
    }
  serverUrl: 'https://my-global-storage-server.com',
});

export default defineConfig({
  globalSetup: globalStorage.setup,
  globalTeardown: globalStorage.teardown,
  // ...
});
```

## Consistent Run ID

To let all shards share the same data, you should pass a consistent `shardedRunId` to all global-storage instances.

1. Populate env variable with the same run id for all shards:
```yml
name: Playwright Tests
on:
  pull_request:

env:
  SHARDED_RUN_ID: ${{ github.run_id }} # <-- consistent run id 

jobs:
  playwright-tests:
    # ...

  merge-reports:
    # ...
```

2. Set `shardedRunId` in the Playwright config:
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage';

globalStorage.defineConfig({
    externalServer: process.env.CI && {
        url: 'https://my-global-storage-server.com',
        shardedRunId: process.env.SHARDED_RUN_ID,
    },
    // serverUrl: 'https://my-global-storage-server.com',
    // shardedRunId: process.env.SHARDED_RUN_ID,
});


export default defineConfig({
    globalSetup: globalStorage.setup,
    globalTeardown: globalStorage.teardown,
    // ...
});
```

## Cleanup

In sharded runs, you should cleanup data only after **all shards finish**. 

Imagine you allready have a custom cleanup script used in non-sharded runs:
```ts
// global-teardown.js
import { defineConfig } from '@playwright/test';
import { globalStorage } from 'global-storage';

export default async function() {
    const userId = await globalStorage.get('userId');
    if (userId) {
        /* remove user from database */
    }
}
```

You can re-use this script in the sharded runs. For that, wrap it into a separate script:
```ts
// sharded-teardown.js
import './playwright.config.ts';                // <-- import Playwright config to configure global storage
import globalTeardown from './global-teardown'; // <-- import your teardown script, that cleans up data
import { globalStorage } from 'global-storage';

main();

async function main() {
  await globalTeardown();
  await globalStorage.cleanupRun(); // <-- call this to clear session values for this run
}
```

2. Add an additional step to `merge-reports` job, that calls `sharded-teardown.js`:
```yml
name: Playwright Tests
on:
  push:
  pull_request:

env:
  SHARDED_RUN_ID: ${{ github.run_id }}

jobs:
  playwright-tests:
    # ...

  merge-reports:
    # ...

    - name: Sharded teardown
      run: npx tsx ./sharded-teardown.js # <-- cleanup in additional step
```

> You can also setup a separate job for cleanup, but it will take more time to set up.