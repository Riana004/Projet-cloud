import { createRouter, createWebHistory } from 'vue-router';
import TestPage from '../views/TestPage.vue';
import LoginPage from '../views/LoginPage.vue';
import SignupPage from '../views/SignupPage.vue';
import CartePage from '../views/CartePage.vue';
import SignalementPage from '../views/SignalementPage.vue';
import SignalementDetailPage from '../views/SignalementDetailPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/test',
    name: 'Test',
    component: TestPage,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupPage,
  },
  {
    path: '/carte',
    name: 'Carte',
    component: CartePage,
  },
  {
    path: '/signalement',
    name: 'Signalement',
    component: SignalementPage,
  },
  {
    path: '/signalement/:id',
    name: 'SignalementDetail',
    component: SignalementDetailPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;