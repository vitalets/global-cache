import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  coreSidebar: [
    'core/index',
    'core/concepts',
    'core/client',
    'core/server',
    'core/configuration',
    'core/api',
  ],
  playwrightSidebar: [
    'playwright/index',
    'playwright/installation',
    'playwright/configuration',
    {
      type: 'category',
      label: 'Usage',
      collapsed: false,
      items: [
        'playwright/usage/basic',
        'playwright/usage/dynamic-keys',
        'playwright/usage/persistent-values',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'playwright/guides/authentication',
        'playwright/guides/before-all',
        'playwright/guides/cache-api-response',
        'playwright/guides/cleanup',
        'playwright/guides/typed-cache',
      ],
    },
    'playwright/debugging',
    'playwright/api',
    'playwright/faq',
  ],
};

export default sidebars;
