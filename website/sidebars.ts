import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  coreSidebar: [
    'core/index',
    'core/concepts',
    'core/client',
    'core/server',
    'core/configuration',
    {
      type: 'category',
      label: 'API reference',
      collapsed: false,
      link: {
        type: 'doc',
        id: 'core/api',
      },
      items: ['core/api/global-cache-client', 'core/api/global-cache-server'],
    },
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
        'playwright/usage/persistent-keys',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'playwright/guides/before-all-before-each',
        'playwright/guides/authentication',
        'playwright/guides/cache-api-response',
        'playwright/guides/cleanup',
        'playwright/guides/typed-keys',
      ],
    },
    'playwright/debugging',
    'playwright/api',
    'playwright/faq',
  ],
};

export default sidebars;
