import { createApp } from 'vue'
import App from './App.vue';
import router from "./router"; // 引入路由实例

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'

const app = createApp(App);

app.use(router);

app.mount('#app')
