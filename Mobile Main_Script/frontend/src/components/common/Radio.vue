<template>
    <v-select
      :items="feature"
      item-text="text"
      item-value="value"
      v-model="content"
      :label="name"
      return-object
      clearable
      dense
    ></v-select>
</template>

<script>
  export default {
    name: 'Radio',
    props: ['value', 'name'],

    data() {
      return {
        feature: [{ text: "Ja", value: "1" }, { text: "Nein", value: "0" }],
        content: this.value,
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
        deep: true,
      }
    },
    methods: {
      handleInput() {
        this.$emit('input', this.content);
      }
    },
  }
</script>
