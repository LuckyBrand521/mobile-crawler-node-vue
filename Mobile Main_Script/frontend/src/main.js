import Vue from "vue";
import App from "./App.vue";
import VueRouter from "vue-router";
import vuetify from "./plugins/vuetify";
import Login from "./components/common/Auth.vue";

Vue.config.productionTip = false;
Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    {
      path: "/login",
      component: Login
    }
  ]
});

// new Vue({
//   vuetify,
//   router: router,
//   render: h => h(App)
// }).$mount("#app");

new Vue({
  router: router,
  el: "#app",
  components: { App },
  template: "<App/>"
});

router.replace("/login");
