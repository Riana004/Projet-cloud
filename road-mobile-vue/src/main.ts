import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'

// Ionic CSS
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

// Leaflet CSS
import 'leaflet/dist/leaflet.css'

// App CSS
import './theme/variables.css'

createApp(App)
  .use(IonicVue)
  .use(router)
  .mount('#app')
