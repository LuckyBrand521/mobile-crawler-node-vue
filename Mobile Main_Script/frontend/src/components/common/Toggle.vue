<template>
    <div>
        <v-container fluid>
            <span class="float-left" :style="{marginRight: '5px'}">Results: </span>
            <v-radio-group
                v-model="content"
                row
                :class="float-left"
                :style="{marginTop: 0+'px'}"
            >
                <v-radio
                    label="All"
                    value="-1"
                ></v-radio>
                <v-radio
                    label="0 or None"
                    value="0"
                ></v-radio>
                <v-radio
                    label="Not Empty"
                    value="1"
                ></v-radio>
            </v-radio-group>
        </v-container>
    </div>
</template>

<script>
  export default {
    name: 'Toggle',
    props: ['selectedItem'],

    data() {
      return {
        content: this.selectedItem
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
        this.$emit('input', this.content);
      }
    },
  }
</script>
<style>
.v-input--radio-group--row{
    margin-top:0;
}
.v-input--radio-group--row .v-input__slot{
    margin-bottom:5px;
}
.v-input--radio-group--row .v-input__control .v-messages.theme--light{
    display:none;
}
</style>
