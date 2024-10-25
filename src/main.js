import { createApp } from 'vue'
import App from './App.vue';
import router from "./router"; // 引入路由实例

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'

import { RecycleScroller } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

const app = createApp(App);

app.component("RecycleScroller", RecycleScroller);

app.use(router);

app.mount('#app')
