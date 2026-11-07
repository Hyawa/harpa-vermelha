import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.harpavermelha.app',
  appName: 'Harpa Vermelha',
  webDir: 'dist',
  backgroundColor: '#F5EFE0',
  android: {
    allowMixedContent: false,
  },
}

export default config
