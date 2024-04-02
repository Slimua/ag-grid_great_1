export default {
  template: 
    `
    <span class="imgSpanLogo">
      <img :src="'https://www.ag-grid.com/example-assets/software-company-logos/' + cellValueLowerCase + '.png'" class="logo" />
    </span>
    `,
    data: function () {
      return {
        cellValue: '',
        cellValueLowerCase: ''
      };
    },
    beforeMount() {
      this.cellValue = this.params.value;
      this.cellValueLowerCase = this.params.value.toLowerCase();
    },
};
