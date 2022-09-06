<template v-if="!$route.path.includes('login')">
  <v-app :dark="dark">
    <v-app-bar app color="#082344" dark dense>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-btn href="#" text>
        <span class="mr-2">Mobile crawler</span>
      </v-btn>

      <v-spacer></v-spacer>

      <v-switch v-model="dark" :label="`Dark mode`" hide-details></v-switch>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      absolute
      temporary
      color="#082344"
      dark
    >
      <v-list nav dense>
        <v-list-item-group v-model="group">
          <!--  <v-list-item>
            <v-list-item-icon>
              <v-icon>{{ homeIcon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Mobile</v-list-item-title>
          </v-list-item>  -->

          <v-list-item>
            <v-list-item-title>ADESA</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>AUTOBID</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>ALDCARMARKET</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>BCA</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>EBAY</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>KLEINANZEIGEN</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <Adesa v-if="group === 0" />
      <Autobid v-if="group === 1" />
      <Aldcarmarket v-if="group === 2" />
      <Bca v-if="group === 3" />
      <Ebay v-if="group === 4" />
      <Klein v-if="group === 5" />
    </v-main>
    <v-content>
      <keep-alive :include="['Login']">
        <router-view></router-view>
      </keep-alive>
    </v-content>
  </v-app>
</template>

<script>
//import Mobile from './components/mobile/Cars.vue';
import Adesa from "./components/adesa/Auctions.vue";
import Autobid from "./components/autobid/Auctions.vue";
import Aldcarmarket from "./components/aldcarmarket/Auctions.vue";
import Bca from "./components/bca/Auctions.vue";
import Ebay from "./components/ebay/Auctions.vue";
import Klein from "./components/klein/Auctions.vue";
import { mdiHome } from "@mdi/js";

export default {
  name: "App",

  components: {
    Adesa,
    Autobid,
    Aldcarmarket,
    Bca,
    Ebay,
    Klein
  },

  data: () => ({
    homeIcon: mdiHome,
    dark: null,
    drawer: false,
    group: 0
  }),

  watch: {
    dark: {
      handler(val) {
        this.$vuetify.theme.dark = val;
        localStorage.setItem("dark", val);
      }
    }
  },

  mounted() {
    if (localStorage.getItem("dark") !== null) {
      this.dark = localStorage.getItem("dark") === "true" ? true : false;
    } else {
      this.dark = false;
      localStorage.setItem("dark", "false");
    }
  }
};
</script>
<style>
.hidden {
  display: none;
}
.vw-94 {
  width: 95vw;
  overflow: auto !important;
}
.vw-94 .v-data-table__wrapper {
  height: 80vh;
  overflow-y: auto;
}
.v-data-table > .v-data-table__wrapper > table > tbody > tr > td,
.v-data-table > .v-data-table__wrapper > table > thead > tr > td,
.v-data-table > .v-data-table__wrapper > table > tfoot > tr > td {
  heigth: 60px;
}
.form-inline {
  display: -webkit-inline-box;
}
.form-inline .v-input {
  margin-left: 1rem;
}
th.text-start {
  padding-right: 0 !important;
  min-width: 82px !important;
}
.red-background {
  background: #f3bebe63;
}
.green-background {
  background: #dbf7c9;
}
.margin-left-1 {
  margin-left: 1rem;
}
.min-width-105 {
  min-width: 105px !important;
}
.slidein {
  overflow-y: scroll;
  max-width: 600px;
  padding: 2em 3em;
  position: fixed;
  z-index: 100;
  top: 0;
  right: 0;
  background: #eee;
  height: 100%;
  box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.5);
  transition: all 0.5s ease-in-out;
}

/* before the element is shown, start off the screen to the right */
.slide-enter,
.slide-leave-active {
  right: -100%;
}

.close-btn {
  border: none;
  font-weight: bold;
  font-size: 2em;
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0.5em;
}
.filter-btn {
  border: 1px solid;
  border-radius: 20px;
  padding: 1px 1rem;
  text-decoration: none;
}
</style>
