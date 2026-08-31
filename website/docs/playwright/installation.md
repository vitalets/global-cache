---
title: Installation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Install the Playwright integration as a development dependency:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">

    ```bash
    npm install --save-dev @global-cache/playwright
    ```

  </TabItem>
  <TabItem value="yarn" label="Yarn">

    ```bash
    yarn add --dev @global-cache/playwright
    ```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

    ```bash
    pnpm add --save-dev @global-cache/playwright
    ```

  </TabItem>
</Tabs>

Add the persistent cache directory to `.gitignore`:

```gitignore title=".gitignore"
.global-cache
```

You are ready to [configure Global Cache](./configuration.md).
