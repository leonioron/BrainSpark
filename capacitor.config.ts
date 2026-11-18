import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brainspark.app',
  appName: 'BrainSpark',
  webDir: 'dist',
  backgroundColor: '#090D14',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#090D14',
  },
};

export default config;
