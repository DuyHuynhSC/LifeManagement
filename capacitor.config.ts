import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.famlife.app',
  appName: 'FamLife',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
