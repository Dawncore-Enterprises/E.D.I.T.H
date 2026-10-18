import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = { appId: 'com.dawncore.edith', appName: 'E.D.I.T.H.', webDir: 'dist', bundledWebRuntime: false, plugins: { SplashScreen: { launchShowDuration: 800, backgroundColor: '#0b0a13', showSpinner: false } } };
export default config;