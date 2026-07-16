import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cookwithgio.app',
  appName: 'Cook with Gio',
  webDir: 'dist',
  // Native builds bundle the web app locally; the kitchen API must be reached
  // over the network — build with VITE_API_BASE=https://<your-server> first.
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
  },
  backgroundColor: '#fffaf0',
};

export default config;
