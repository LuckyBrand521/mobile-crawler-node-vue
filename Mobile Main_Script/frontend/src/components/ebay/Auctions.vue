<template>
  <div class="d-flex pa-5">
    <v-row>
      <v-col :cols="12">
        <v-card>
          <v-card-title>
            Ebay
            <v-form class="pa-5 form-inline">
              <v-autocomplete
                :items="results"
                v-model="filters.results"
                label="Mobile:"
                class="margin-left-1"
                return-object
                clearable
                dense
              ></v-autocomplete>
              <v-autocomplete
                :items="availabilities"
                v-model="filters.available"
                label="Verfügbar"
                class="margin-left-1"
                return-object
                clearable
                dense
              ></v-autocomplete>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Suche"
                single-line
                hide-details
                v-bind:style="{'padding-top':'0', 'margin-top':'inherit'}"
              ></v-text-field>
            </v-form>
            <div class="text-right flex">
              <a @click="toggle" class="filter-btn">Filter</a>
            </div>
          </v-card-title>
          <v-overlay v-if="similarity" :value="similarity" dark=false>
            <v-card>
              <v-card-title>Similar cars as {{ similarity.title }}<v-spacer/><v-icon @click="similarity = null">{{ mdiClose }}</v-icon></v-card-title>
              <v-card-text><CarSimilarity :auction_id="similarity.auction_id" table_name="ebay"/></v-card-text>
            </v-card>
          </v-overlay>
          <v-data-table
            :headers="headers"
            :items="auctions"
            :options.sync="options"
            :server-items-length="totalAuctions"
            :loading="loading"
            :footer-props="{
              itemsPerPageOptions:[10, 20, 50, 100, 500, 1000, 10000]
            }"
            show-expand
            single-expand
            item-key="auction_id"
            :expanded.sync="expanded"
            multi-sort
            class="elevation-1 vw-94"
            :item-class="setRowBackground"
          >
            <template v-slot:expanded-item="{ headers, item }">
              <td style="padding: 30px;" :colspan="headers.length">
                <AuctionHistory v-bind:item="item" />
              </td>
            </template>
            <template v-slot:item.favorite="{ item }" style="text-align:center">
              <span>
                <template v-if="item.favorite == 1">
                  <v-icon @click="favorite_shift(item, item.auction_id)" color="yellow">{{ mdiStar }}</v-icon>
                </template>
                <template v-else>
                  <v-icon @click="favorite_shift(item, item.auction_id)">{{ mdiStarOutline }}</v-icon>
                </template>
              </span>
            </template>
            <template v-slot:item.updated_at="{ item }" class="min-width-105">
              <span>{{ convTimeStamp(item) }}</span>
            </template>
            <template v-slot:item.brand_name="{ item }">
              <span><b>{{ item.brand_name }}</b></span>
            </template>
            <template v-slot:item.model_name="{ item }">
              <span><b>{{ item.model_name }}</b></span>
            </template>
            <template v-slot:item.price="{ item }">
              <span>{{ currencyFormat.format(item.price) }}</span>
            </template>
            <template v-slot:item.differenz="{ item }">
              <span>{{ currencyFormat.format(Math.abs(item.price - item.price_2_5)) }}</span>
            </template>
            <template v-slot:item.percent="{ item }">
              <span v-if="numberFormat.format(100*Math.abs(item.price - item.price_2_5)/(item.price)) == 100">
              
              </span>
              <span v-else-if="numberFormat.format(100*Math.abs(item.price - item.price_2_5)/(item.price)) == NaN">
              
              </span>
              <span v-else-if="numberFormat.format(item.price) == 0">
              
              </span>
              <span v-else>
                {{numberFormat.format(Math.round(100*Math.abs(item.price - item.price_2_5)/(item.price)))}}%
              </span>
            </template>
            <template v-slot:item.count="{ item }">
              <a  :href="`${item.result}`" target="_blank">{{item.count}}</a>
            </template>
            <template v-slot:item.title="{ item }">
              <a :style="[item.is_available == 0 ? { color: 'red' } : {}]" :href="`${item.link}`" target="_blank">LINK</a>
            </template>
            <template v-slot:item.end_date="{ item }">
              <span>{{ dateTimeFormat.format(new Date(item.end_date)) }}</span>
            </template>
            <template v-slot:item.first_registration="{ item }">
              <span><b>{{ item.first_registration }}</b></span>
            </template>
            <template v-slot:item.mileage="{ item }">
              <span>{{ numberFormat.format(item.mileage) }}</span>
            </template>
            <template v-slot:item.power="{ item }">
              <span>{{ numberFormat.format(item.power) }} PS</span>
            </template>
            <template v-slot:item.price_1="{ item }">
              <span>{{ currencyFormat.format(item.price_1) }}</span>
            </template>
            <template v-slot:item.price_2_5="{ item }">
              <span><b>{{ currencyFormat.format(item.price_2_5) }}</b></span>
            </template>
            <template v-slot:item.price_5_10="{ item }">
              <span>{{ currencyFormat.format(item.price_5_10) }}</span>
            </template>
            <template v-slot:item.price20="{ item }">
              <span>{{ currencyFormat.format(item.price_20) }}</span>
            </template>
            <template v-slot:item.four_wheel="{ item }">
              <span>{{ (item.four_wheel == 0? 'Nein' : 'Ja') }}</span>
            </template>
            <template v-slot:item.leather="{ item }">
              <span>{{ item.leather == 1? 'Ja' : 'Nein' }}</span>
            </template>
            <template v-slot:item.navigation="{ item }">
              <span>{{ item.navigation == 0? 'Nein' : 'Ja' }}</span>
            </template>
            <template v-slot:item.heating="{ item }">
              <span>{{ item.heating == 0? 'Nein' : 'Ja' }}</span>
            </template>
            <template v-slot:item.panoramic_roof="{ item }">
              <span>{{ featureCheck(item.panoramic_roof) }}</span>
            </template>
            <template v-slot:item.damages="{ item }">
              <template v-if="item.damages">
                <a v-for="(damage, index) in item.damages.split(',')" :key="index" :href="damage" style="margin-right: 5px;" target="_blank">{{ index + 1 }}</a>
              </template>
            </template>
            <template v-slot:item.gearbox="{ item }">
              <span>{{ item.gearbox_name }}</span>
            </template>
            <template v-slot:item.fuel="{ item }">
              <span>{{ item.fuel_name }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <transition name="slide">
        <div class="slidein" v-if="filteropen">
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
            <v-autocomplete
              :items="parameters.specials"
              v-model="filters.special"
              label="Special"
              return-object
              clearable
              dense
            ></v-autocomplete>
            <Range name="Mileage" :items="parameters.mileages" v-model="filters.mileage" />
            <Range name="Power" :items="parameters.powers" v-model="filters.power" />
            <Range name="Price" :items="parameters.prices" v-model="filters.price" />
            <Range name="Seats" :items="parameters.seats" v-model="filters.seats" />
            <Select name="Basic fuel type" :items="parameters.fuels" v-model="filters.fuel" />
            <Select name="Gearbox" :items="parameters.gearboxes" v-model="filters.gearbox" />
            <Radio name="Leather" v-model="filters.leather" />
            <Radio name="Navigation system" v-model="filters.navigation" />
            <Radio name="Four wheel drive" v-model="filters.four_wheel" />
          </v-form>
          <button class="close-btn" @click="toggle">X</button>
        </div>
      </transition>
    </v-row>
  </div>
</template>

<script>
  import AuctionHistory from './AuctionHistory';
  import Range from '../common/Range.vue';
  import Select from '../common/Select.vue';
  import Radio from '../common/Radio.vue';
  import CarSimilarity from '../mobile/CarSimilarity';
  import { featureCheck } from "../../functions/common";
  import { mdiClose } from '@mdi/js';
  import { mdiStar } from '@mdi/js';
  import { mdiStarOutline } from '@mdi/js';

  export default {
    name: 'Auctions',

    components: {
      AuctionHistory,
      Range,
      Select,
      Radio,
      CarSimilarity,
    },

    data() {
      return {
        filteropen: false,
        search: '',
        expanded: [],
        similarity: null,
        totalAuctions: 0,
        auctions: [],
        loading: true,
        results:['Alle', 'Ok', '0', 'In Prüfung'],
        availabilities: ['Alle', 'Ja', 'Nein'],
        parameters: {
          brands: [],
          models: [],
          sizes: [],
          batches: [],
          catalog: [],
          fuels: [],
          gearboxes: [],
          prices: [],
          registration_dates: [],
          powers: [],
          leathers:[],
          four_wheels:[],
          navigations:[],
          heatings:[],
          seats: [],
          mileages: [],
          favorites:[],
          results: [],
          links: [],
          specials: [],
        },
        filters: { 
          car_brand: null,
          car_model: null,
          batch_id: null,
          auction_id: null,
          first_registration: { from: null, to: null },
          mileage: { from: null, to: null },
          fuel: null,
          gearbox: null,
          four_wheel: null,
          leather: null,
          navigation: null,
          power: { from: null, to: null },
          price: { from: null, to: null },
          seats: { from: null, to: null },
          countfeature: -1,
          result: null,
          available: null,
          special: null,
        },
        options: {
          "page":1,
          "itemsPerPage":50,
          "sortBy":[],
          "sortDesc":[],
          "groupBy":[],
          "groupDesc":[],
          "mustSort":false,
          "multiSort":true
        },
        headers: [
          {
            text: 'Car ID',
            align: 'start',
            sortable: true,
            value: 'auction_id',
          },
          {
            text: 'Aktualisiert',
            align: 'start',
            sortable: true,
            value: 'updated_at',
          },
          {
            text: 'Fav',
            align: 'start',
            sortable: true,
            value: 'favorite',
          },
          {
            text: 'Preis',
            align: 'start',
            sortable: true,
            value: 'price',
          },
          {
            text: 'Differenz',
            align: 'start',
            sortable: true,
            value: 'differenz',
          },
          {
            text: '%',
            align: 'start',
            sortable: true,
            value: 'percent',
          },
          {
            text: 'Mobile',
            align: 'start',
            sortable: true,
            value: 'count',
          },
          {
            text: 'Titel',
            align: 'start',
            sortable: false,
            value: 'title',
          },
          {
            text: 'Marke',
            align: 'start',
            sortable: true,
            value: 'brand_name',
          },
          {
            text: 'Model',
            align: 'start',
            sortable: true,
            value: 'model_name',
          },
          {
            text: 'Special',
            align: 'start',
            sortable: true,
            value: 'special',
          },
          {
            text: 'Typ',
            align: 'start',
            sortable: true,
            value: 'size',
          },
          {
            text: 'Ende',
            align: 'start',
            sortable: true,
            value: 'end_date',
          },
          {
            text: 'Jahr',
            align: 'start',
            sortable: true,
            value: 'first_registration',
          },
          {
            text: 'KM',
            align: 'start',
            sortable: true,
            value: 'mileage',
          },
          {
            text: 'Kraftstoff',
            align: 'start',
            sortable: false,
            value: 'fuel',
          },
          {
            text: 'Schaltung',
            align: 'start',
            sortable: false,
            value: 'gearbox',
          },
          {
            text: 'Leistung',
            align: 'start',
            sortable: true,
            value: 'power',
          },
          {
            text: 'Preis 1',
            align: 'start',
            sortable: false,
            value: 'price_1',
          },
          {
            text: 'Preis 2-5',
            align: 'start',
            sortable: false,
            value: 'price_2_5',
          },
          {
            text: 'Preis 5-10',
            align: 'start',
            sortable: false,
            value: 'price_5_10',
          },
          {
            text: 'Preis 20',
            align: 'start',
            sortable: false,
            value: 'price_20',
          },
          {
            text: '4Rad',
            align: 'start',
            sortable: true,
            value: 'four_wheel',
          },
          {
            text: 'Leder',
            align: 'start',
            sortable: true,
            value: 'leather',
          },
          {
            text: 'Navi',
            align: 'start',
            sortable: true,
            value: 'navigation',
          },
          {
            text: 'Heizung',
            align: 'start',
            sortable: true,
            value: 'heating',
          },
          {
            text: 'Panorama',
            align: 'start',
            sortable: true,
            value: 'panoramic_roof',
          },
          { 
            text: 'Sitze',
            align: 'start',
            sortable: true,
            value: 'seats',
          },
          {
            text: 'Unfall',
            align: 'start',
            sortable: false,
            value: 'damages',
          },
        ],
      }
    },
    watch: {
      options: {
        handler () {
          this.getDataFromApi()
        },
        deep: true,
      },
      search: {
        handler () {
          this.getDataFromApi()
        },
      },
      filters: {
        handler () {
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
      },
      'filters.batch_id': {
        handler(val) {
          if(val) {
            this.getCatalog(val.value);
          }
          else {
            this.parameters.catalog = [];
            this.filters.batch_id = null;
          }
      },
      }
    },
    computed: {
      now() {
        return new Date();
      }
    },
    mounted () {
      this.getDataFromApi()
      this.getParameters()
    },
    created() {
      this.currencyFormat = new Intl.NumberFormat('default', { style: 'currency', currency: 'EUR' });
      this.numberFormat = new Intl.NumberFormat('default');
      this.dateTimeFormat = new Intl.DateTimeFormat('default', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      this.timeFormat = new Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      });
      this.dateFormat = new Intl.DateTimeFormat('default', {
        year: 'numeric',
      });
      this.mdiClose = mdiClose;
      this.mdiStar = mdiStar;
      this.mdiStarOutline = mdiStarOutline;
    },
    methods: {
      featureCheck,

      getDataFromApi() {
        this.loading = true
        this.getAuctions().then(data => {
          this.auctions = data.items
          this.totalAuctions = data.recordsTotal
          this.loading = false
        })
      },

      setRowBackground(item) {
        return item.is_available == 0 ? 'red-background' : 'green-background';
      },

      convTimeStamp(item) {
        let d = new Date(item.updated_at);
        const pad = (n,s=2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
        return `${pad(d.getFullYear(),4)}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      },

      async getAuctions() {
        const params = new URLSearchParams({ ...this.options, search: this.search, filters: encodeURIComponent(JSON.stringify(this.filters)) });
        const req = await fetch(`${process.env.VUE_APP_API}ebay/auctions?${params.toString()}`);
        const data = await req.json();
        return data;
      },

      async getParameters() {
        const req = await fetch(`${process.env.VUE_APP_API}ebay/parameters`);
        const data = await req.json();
        this.parameters = data;
      },

      async getModels(brand_id) {
        const req = await fetch(`${process.env.VUE_APP_API}ebay/models/${brand_id}`);
        const data = await req.json();
        this.parameters = { ...this.parameters, models: data.models };
      },

      async getCatalog(batch_id) {
        const req = await fetch(`${process.env.VUE_APP_API}ebay/catalogs/${batch_id}`);
        const data = await req.json();
        this.parameters = { ...this.parameters, catalog: data.catalog };
      },
      async favorite_shift(item, auction_id) {
        const req = await fetch(`${process.env.VUE_APP_API}ebay/favorite_shift/${auction_id}`);
        const data = await req.json();
        console.log(data.msg);
        if(data.msg == 'success'){
          item.favorite = item.favorite == 1? 0: 1;
        }
      },
      toggle() {
        this.filteropen = !this.filteropen;
      }
    },
  }
</script>

