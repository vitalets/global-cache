import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Global Cache',
  tagline: 'Share expensive data across parallel test workers',
  favicon: 'img/favicon.svg',

  url: 'https://vitalets.github.io',
  baseUrl: '/global-cache/',
  organizationName: 'vitalets',
  projectName: 'global-cache',
  trailingSlash: true,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/vitalets/global-cache/edit/docs/website/',
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Global Cache',
      logo: {
        alt: 'Global Cache',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'coreSidebar',
          label: 'Core',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'playwrightSidebar',
          label: 'Playwright',
          position: 'left',
        },
        {
          href: 'https://github.com/vitalets/global-cache',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Core', to: '/' },
            { label: 'Playwright', to: '/playwright' },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: '@global-cache/core',
              href: 'https://www.npmjs.com/package/@global-cache/core',
            },
            {
              label: '@global-cache/playwright',
              href: 'https://www.npmjs.com/package/@global-cache/playwright',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/vitalets/global-cache' },
            { label: 'Issues', href: 'https://github.com/vitalets/global-cache/issues' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Global Cache contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'diff', 'json'],
    },
  },
};

export default config;
