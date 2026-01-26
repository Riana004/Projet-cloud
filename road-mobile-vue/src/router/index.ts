import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import CartePage from '../views/CartePage.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/carte',
    name: 'Carte',
    component: CartePage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;