<template>
  <v-card>
    <v-card-title>
      History for {{ item.car_title }}
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="records"
      :options.sync="options"
      :server-items-length="totalRecords"
      :loading="loading"
      :footer-props="{
        itemsPerPageOptions:[10, 20, 50, 100, 500, 1000]
      }"
      multi-sort
      class="elevation-1"
    >
      <template v-slot:item.date="{ item }">
        <span>{{ dateTimeFormat.format(new Date(item.date)) }}</span>
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
</template>

<script>
  import { featureCheck } from "../../functions/common";

  export default {
    name: 'CarHistory',
    props: ['item'],

    data() {
      return {
        totalRecords: 0,
        records: [],
        loading: true,
        options: {
          "page":1,
          "itemsPerPage":10,
          "sortBy":["date"],
          "sortDesc":[true],
          "groupBy":[],
          "groupDesc":[],
          "mustSort":false,
          "multiSort":true
        },
        headers: [
          {
            text: 'Date',
            align: 'start',
            sortable: true,
            value: 'date',
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
        handler () {
          this.getDataFromApi()
        },
        deep: true,
      },
    },
    mounted () {
      this.getDataFromApi()
    },
    created() {
      this.numberFormat = new Intl.NumberFormat();
      this.dateTimeFormat = new Intl.DateTimeFormat('default', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      });
    },
    methods: {
      featureCheck,

      getDataFromApi() {
        this.loading = true
        this.getCars().then(data => {
          this.records = data.items
          this.totalRecords = data.recordsTotal
          this.loading = false
        })
      },

      async getCars() {
          const params = new URLSearchParams(this.options);
          const req = await fetch(`${process.env.VUE_APP_API}mobile/cars/${this.item.car_id}/history?${params.toString()}`);
          const data = await req.json();
          return data;
      },
    },
  }
</script>
