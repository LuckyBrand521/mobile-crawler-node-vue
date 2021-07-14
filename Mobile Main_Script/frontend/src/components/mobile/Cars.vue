<template>
  <div class="d-flex pa-5">
    <v-row>
      <v-col :cols="10">
        <v-card>
          <v-card-title>
            Mobile.de
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="cars"
            :options.sync="options"
            :server-items-length="totalCars"
            :loading="loading"
            :footer-props="{
              itemsPerPageOptions:[10, 20, 50, 100, 500, 1000, 10000]
            }"
            show-expand
            single-expand
            item-key="car_id"
            :expanded.sync="expanded"
            multi-sort
            class="elevation-1"
          >
            <template v-slot:expanded-item="{ headers, item }">
              <td style="padding: 30px;" :colspan="headers.length">
                <CarHistory v-bind:item="item" />
              </td>
            </template>
            
            <template v-slot:item.car_title="{ item }">
              <a :style="[item.is_available === '0' ? { color: 'red' } : {}]" :href="item.car_url" target="_blank">{{ item.car_title }}</a>
            </template>
            <template v-slot:item.kilometer="{ item }">
              <span>{{ numberFormat.format(item.kilometer) }}km</span>
            </template>
            <template v-slot:item.power="{ item }">
              <span>{{ numberFormat.format(item.power) }}PS</span>
            </template>
            <template v-slot:item.price="{ item }">
              <span>{{ numberFormat.format(item.price) }}€</span>
            </template>
            <template v-slot:item.gearbox="{ item }">
              <span>{{ item.gearbox_name }}</span>
            </template>
            <template v-slot:item.fuel="{ item }">
              <span>{{ item.fuel_name }}</span>
            </template>
            <template v-slot:item.four_wheel="{ item }">
              <span>{{ featureCheck(item.four_wheel) }}</span>
            </template>
            <template v-slot:item.leather="{ item }">
              <span>{{ item.leather_name }}</span>
            </template>
            <template v-slot:item.navigation="{ item }">
              <span>{{ featureCheck(item.navigation) }}</span>
            </template>
            <template v-slot:item.sliding_roof="{ item }">
              <span>{{ featureCheck(item.sliding_roof) }}</span>
            </template>
            <template v-slot:item.panoramic_roof="{ item }">
              <span>{{ featureCheck(item.panoramic_roof) }}</span>
            </template>
            <template v-slot:item.parking_heater="{ item }">
              <span>{{ featureCheck(item.parking_heater) }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col>
        <v-card class="pa-5">
          <v-card-title class="pa-2">Filter</v-card-title>
          <v-form>
            <v-autocomplete
              :items="parameters.brands"
              v-model="filters.car_brand"
              label="Brand"
              return-object
              clearable
              dense
            ></v-autocomplete>
            <v-autocomplete
              :items="parameters.models"
              v-model="filters.car_model"
              label="Model"
              return-object
              clearable
              dense
            ></v-autocomplete>
            <Select name="Basic fuel type" :items="parameters.fuels" v-model="filters.fuel" />
            <Range name="Registration date" :items="parameters.registration_dates" v-model="filters.reg_date" />
            <Range name="Kilometer" :items="parameters.mileages" v-model="filters.kilometer" />
            <Range name="Power" :items="parameters.powers" v-model="filters.power" />
            <Radio name="Four wheel drive" v-model="filters.four_wheel" />
            <Select name="Gearbox" :items="parameters.gearboxes" v-model="filters.gearbox" />
            <Select name="Leather" :items="parameters.leathers" v-model="filters.leather" />
            <Radio name="Navigation system" v-model="filters.navigation" />
            <Radio name="Sliding roof" v-model="filters.sliding_roof" />
            <Radio name="Panoramic roof" v-model="filters.panoramic_roof" />
            <Radio name="Parking heater" v-model="filters.parking_heater" />
            <Range name="Seats" :items="parameters.seats" v-model="filters.seats" />
            <Range name="Price" :items="parameters.prices" v-model="filters.price" />
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
  import CarHistory from './CarHistory.vue';
  import Range from '../common/Range.vue';
  import Radio from '../common/Radio.vue';
  import Select from '../common/Select.vue';
  import { featureCheck } from "../../functions/common";

  export default {
    name: 'Cars',

    components: {
      CarHistory,
      Range,
      Radio,
      Select,
    },

    data() {
      return {
        search: '',
        parameters: {
          brands: [],
          models: [],
          fuels: [],
          gearboxes: [],
          prices: [],
          registration_dates: [],
          powers: [],
          seats: [],
          mileages: [],
        },
        filters: { 
          four_wheel: null,
          leather: null,
          navigation: null,
          sliding_roof: null,
          panoramic_roof: null,
          parking_heater: null,
          price: { from: null, to: null },
          power: { from: null, to: null },
          kilometer: { from: null, to: null },
          reg_date: { from: null, to: null },
          seats: { from: null, to: null },
        },
        expanded: [],
        totalCars: 0,
        cars: [],
        loading: true,
        options: {
          "page":1,
          "itemsPerPage":10,
          "sortBy":[],
          "sortDesc":[],
          "groupBy":[],
          "groupDesc":[],
          "mustSort":false,
          "multiSort":true
        },
        headers: [
          {
            text: 'Title',
            align: 'start',
            sortable: true,
            value: 'car_title',
          },
          {
            text: 'Brand',
            align: 'start',
            sortable: false,
            value: 'brand_name',
          },
          {
            text: 'Model',
            align: 'start',
            sortable: false,
            value: 'model_name',
          },
          {
            text: 'Category',
            align: 'start',
            sortable: false,
            value: 'category',
          },
          {
            text: 'Basic fuel type',
            align: 'start',
            sortable: false,
            value: 'fuel',
          },
          {
            text: 'First registration',
            align: 'start',
            sortable: true,
            value: 'reg_date',
          },
          {
            text: 'Kilometer',
            align: 'start',
            sortable: true,
            value: 'kilometer',
          },
          {
            text: 'Power',
            align: 'start',
            sortable: true,
            value: 'power',
          },
          {
            text: 'Four wheel drive',
            align: 'start',
            sortable: false,
            value: 'four_wheel',
          },
          {
            text: 'Gearbox',
            align: 'start',
            sortable: false,
            value: 'gearbox',
          },
          {
            text: 'Leather',
            align: 'start',
            sortable: false,
            value: 'leather',
          },
          {
            text: 'Navigation system',
            align: 'start',
            sortable: false,
            value: 'navigation',
          },
          {
            text: 'Sliding roof',
            align: 'start',
            sortable: false,
            value: 'sliding_roof',
          },
          {
            text: 'Panoramic roof',
            align: 'start',
            sortable: false,
            value: 'panoramic_roof',
          },
          {
            text: 'Parking heater',
            align: 'start',
            sortable: false,
            value: 'parking_heater',
          },
          {
            text: 'Seats',
            align: 'start',
            sortable: true,
            value: 'seats',
          },
          {
            text: 'Price',
            align: 'start',
            sortable: true,
            value: 'price',
          },
        ],
      }
    },
    watch: {
      options: {
        handler() {
          this.getDataFromApi()
        },
        deep: true,
      },
      search: {
        handler() {
          this.getDataFromApi()
        },
      },
      filters: {
        handler() {
          this.getDataFromApi();
        },
        deep: true
      },
      'filters.car_brand': {
        handler(val) {
          if(val) {
            this.getModels(val.value);
          }
          else {
            this.parameters.models = [];
            this.filters.car_model = null;
          }
        },
      }
    },
    mounted() {
      this.getDataFromApi()
      this.getParameters()
    },
    created() {
      this.numberFormat = new Intl.NumberFormat();
    },
    methods: {
      featureCheck,

      getDataFromApi() {
        this.loading = true
        this.getCars().then(data => {
          this.cars = data.items
          this.totalCars = data.recordsTotal
          this.loading = false
        })
      },

      async getCars() {
        const params = new URLSearchParams({ ...this.options, search: this.search, filters: encodeURIComponent(JSON.stringify(this.filters)) });
        const req = await fetch(`${process.env.VUE_APP_API}mobile/cars?${params.toString()}`);
        const data = await req.json();
        return data;
      },

      async getParameters() {
        const req = await fetch(`${process.env.VUE_APP_API}mobile/parameters`);
        const data = await req.json();
        this.parameters = data;
      },

      async getModels(brand_id) {
        const req = await fetch(`${process.env.VUE_APP_API}mobile/models/${brand_id}`);
        const data = await req.json();
        this.parameters = { ...this.parameters, models: data.models };
      }
    },
  }
</script>
