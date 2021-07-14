<template>
  <div class="d-flex pa-5">
    <v-data-table
    :headers="headers"
    :items="cars"
    :server-items-length="totalCars"
    :loading="loading"
    item-key="car_id"
    class="elevation-1"
    >
    <template v-slot:item.score="{ item }">
      <span :style="{ color: 'green' }">&#129045; {{ numberFormat.format(Number((item.score / 10) * 100).toFixed(2)) }} %</span>
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
  </div>
</template>

<script>
  import { featureCheck } from "../../functions/common";

  export default {
    name: 'CarSimilarity',
    props: ['auction_id', 'table_name'],

    data() {
      return {
        totalCars: 0,
        cars: [],
        loading: true,
        headers: [
          {
            text: 'Similarity',
            align: 'start',
            sortable: false,
            value: 'score',
          },
          {
            text: 'Title',
            align: 'start',
            sortable: false,
            value: 'car_title',
          },
          {
            text: 'Fuel type',
            align: 'start',
            sortable: false,
            value: 'fuel',
          },
          {
            text: 'First registration',
            align: 'start',
            sortable: false,
            value: 'reg_date',
          },
          {
            text: 'Kilometer',
            align: 'start',
            sortable: false,
            value: 'kilometer',
          },
          {
            text: 'Power',
            align: 'start',
            sortable: false,
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
            sortable: false,
            value: 'seats',
          },
          {
            text: 'Price',
            align: 'start',
            sortable: false,
            value: 'price',
          },
        ],
      }
    },
    mounted() {
      this.getDataFromApi()
    },
    created() {
      this.numberFormat = new Intl.NumberFormat();
    },
    methods: {
      featureCheck,

      getDataFromApi() {
        this.loading = true
        this.getCars().then(data => {
          this.cars = data.items.slice(0, 5);
          this.totalCars = data.recordsTotal
          this.loading = false
        })
      },

      async getCars() {
        const req = await fetch(`${process.env.VUE_APP_API}${this.table_name}/auctions/${this.auction_id}/similarCars`);
        const data = await req.json();
        return data;
      },
    },
  }
</script>
