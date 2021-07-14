<template>
    <div>
        <span>{{ name }}</span>
        <div class="d-flex mt-2">
            <v-select
                v-model="content.from"
                :items="items"
                label="From"
                clearable
                dense
            ></v-select>
            <v-select
                v-model="content.to"
                :items="items"
                label="To"
                class="ml-5"
                clearable
                dense
            ></v-select>
        </div>
    </div>
</template>

<script>
  export default {
    name: 'Range',
    props: ['value', 'name', 'items'],

    data() {
      return {
        content: this.value
      }
    },
    watch: {
      content: {
        handler() {
          this.handleInput();
        },
        deep: true,
      },
      value: {
        handler() {
          this.content = this.value;
        },
        deep: true
      }
    },
    methods: {
      handleInput() {
        this.$emit('input', this.content)
      }
    },
  }
</script>
