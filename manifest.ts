import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: '__MSG_extName__',
  version: '0.1.0',
  default_locale: 'en',
  description: '__MSG_extDesc__',
  action: {
    default_popup: 'src/popup/index.html',
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://*/*', 'http://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['storage', 'tabs', 'scripting', 'contextMenus'],
  host_permissions: ['https://*/*', 'http://*/*'], // Trim scopes for production deployments.
  icons: {
    16: 'icons/red-icons/icon16.png',
    48: 'icons/red-icons/icon48.png',
    128: 'icons/red-icons/icon128.png',
  },
  web_accessible_resources: [
    {
      resources: ['assets/*'],
      matches: ['<all_urls>'],
    },
  ],
})
