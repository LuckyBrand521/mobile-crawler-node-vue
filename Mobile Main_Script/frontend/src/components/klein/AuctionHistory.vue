<template>
  <v-card>
    <v-card-title>
      History for {{ item.auction_id }}
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
      <template v-slot:item.end_date="{ item }">
        <span>{{ dateTimeFormat.format(new Date(item.end_date)) }}</span>
      </template>
      <template v-slot:item.first_registration="{ item }">
        <span>{{ dateFormat.format(new Date(item.first_registration)) }}</span>
      </template>
      <template v-slot:item.price="{ item }">
        <span>{{ numberFormat.format(item.price) }} €</span>
      </template>
      <template v-slot:item.mileage="{ item }">
        <span>{{ numberFormat.format(item.mileage) }} km</span>
      </template>
      <template v-slot:item.power="{ item }">
        <span>{{ numberFormat.format(item.power) }} PS</span>
      </template>
      <template v-slot:item.gearbox="{ item }">
        <span>{{ item.gearbox_name }}</span>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
  import { featureCheck } from "../../functions/common";

  export default {
    name: 'AuctionHistory',
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
            sortable: false,
            value: 'date',
          },
          {
            text: 'Price',
            align: 'start',
            sortable: true,
            value: 'price',
          },
          {
            text: 'End date',
            align: 'start',
            sortable: true,
            value: 'end_date',
          },
          {
            text: 'First registration',
            align: 'start',
            sortable: true,
            value: 'first_registration',
          },
          {
            text: 'Mileage',
            align: 'start',
            sortable: true,
            value: 'mileage',
          },
          {
            text: 'Fuel type',
            align: 'start',
            sortable: false,
            value: 'fuel',
          },
          {
            text: 'Gearbox Type',
            align: 'start',
            sortable: false,
            value: 'gearbox',
          },
          {
            text: 'Power',
            align: 'start',
            sortable: true,
            value: 'power',
          },
          { 
            text: 'Seats',
            align: 'start',
            sortable: true,
            value: 'seats',
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
      this.numberFormat = new Intl.NumberFormat('default');
      this.dateTimeFormat = new Intl.DateTimeFormat('default', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      });
      this.dateFormat = new Intl.DateTimeFormat('default');
    },
    methods: {
      featureCheck,

      getDataFromApi() {
        this.loading = true
        this.getAuctions().then(data => {
          this.records = data.items
          this.totalRecords = data.recordsTotal
          this.loading = false
        })
      },

      async getAuctions() {
          //const { sortBy, sortDesc, page, itemsPerPage } = this.options
          const params = new URLSearchParams(this.options);
          const req = await fetch(`${process.env.VUE_APP_API}klein/auctions/${this.item.auction_id}/history?${params.toString()}`);
          const data = await req.json();
          return data;
      },
    },
  }
</script>
