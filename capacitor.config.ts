import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cogcore.cookwithgio',
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
  plugins: {
    FirebaseAuthentication: {
      // No "facebook.com" — we only offer email/password + Google + Apple.
      providers: ['apple.com', 'google.com'],
    },
  },
  // Works around a SwiftPM package-identity collision for this plugin —
  // see https://github.com/capawesome-team/capacitor-firebase/issues/959
  experimental: {
    ios: {
      spm: {
        packageOptions: {
          '@capacitor-firebase/authentication': {
            symlink: true,
          },
        },
      },
    },
  },
};

export default config;
