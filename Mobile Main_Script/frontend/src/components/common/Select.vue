<template>
  <v-select
    :items="items"
    v-model="content"
    :label="name"
    return-object
    clearable
    dense
  ></v-select>
</template>

<script>
  export default {
    name: 'Select',
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
      handleInput () {
        this.$emit('input', this.content)
      }
    },
  }
</script>
