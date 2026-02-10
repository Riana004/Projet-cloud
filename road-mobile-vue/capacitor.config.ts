import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'road-mobile-vue',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      locationPermissionLevel: 'fine' // ou 'coarse'
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav',
    }
  }
};

export default config;
