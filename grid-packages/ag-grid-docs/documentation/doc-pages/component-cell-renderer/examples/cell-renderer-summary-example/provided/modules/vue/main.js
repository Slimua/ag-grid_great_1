import Vue from 'vue';
import { AgGridVue } from "@ag-grid-community/vue";
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
ModuleRegistry.registerModules([ ClientSideRowModelModule ]);

const CompanyLogoRenderer = {
  template: 
    `
    <span style="display: flex; height: 100%; width: 100%; align-items: center;">
      <img :src="'https://www.ag-grid.com/example-assets/space-company-logos/' + cellValueLowerCase + '.png'" style="display: block; width: 25px; height: auto; max-height: 50%; margin-right: 12px; filter: brightness(1.1);" />
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

const MissionResultRenderer = {
  template: 
    `
    <span style="display: flex; justify-content: center; height: 100%; align-items: center;">
      <img
        :alt="params.value"
        :src="'https://www.ag-grid.com/example-assets/icons/' + cellValue + '.png'"
        style="width: auto; height: auto;"
      />
    </span>
    `,
    data: function () {
      return {
        cellValue: ''
      };
    },
    beforeMount() {
      this.cellValue = this.params.value ? 'tick-in-circle' : 'cross-in-circle';
    },
};

const PriceRenderer = {
  template: `<span style="display: flex; height: 100%; width: 100%; align-items: center;">
      <img v-for="images in arr" :src="src" style="display: block; width: 15px; height: auto; max-height: 50%;" />
      </span>`,
  data: function () {
      return {
          arr: [],
          src: 'https://www.ag-grid.com/example-assets/pound.png',
          priceMultiplier: 1,
      };
  },
  beforeMount() {
      this.updateDisplay(this.params);
  },
  methods: {
      refresh(params) {
          this.updateDisplay(params);
      },
      updateDisplay(params) {
        if (params.value > 5000000) {
          this.priceMultiplier = 2
        }
        if (params.value > 10000000) {
          this.priceMultiplier = 3
        }
        if (params.value > 25000000) {
          this.priceMultiplier = 4
        }
        if (params.value > 20000000) {
          this.priceMultiplier = 5
        }
        this.arr = new Array(this.priceMultiplier);
      },
  },
};

const CompanyRenderer = {
  template: `
    <a :href="parsedValue" target="_blank">{{ value }}</a>
  `,
  data: function () {
    return {
        parsedValue: '',
        value: '',
    };
  },
  beforeMount() {
      this.updateDisplay(this.params);
  },
  methods: {
      refresh(params) {
          this.updateDisplay(params);
      },
      updateDisplay(params) {
        this.value = params.value;
        if (params.value === 'Astra') {
          this.parsedValue = `https://en.wikipedia.org/wiki/Astra_(American_spaceflight_company)`;
        } else this.parsedValue = `https://en.wikipedia.org/wiki/${params.value}`;
      },
  },
};

const CustomButtonComponent = {
  template: `
        <div>        
            <button v-on:click="buttonClicked">Launch!</button>
        </div>
    `,
  methods: {
    buttonClicked() {
      alert("Mission Launched");
    },
  },
};

const App = {
  template: 
    `
    <ag-grid-vue
        style="width: 100%; height: 100%"
        :class="themeClass"
        :columnDefs="colDefs"
        :rowData="rowData"
    >
    </ag-grid-vue>
    `,
  components: {
    AgGridVue,
    CustomButtonComponent,
    CompanyLogoRenderer,
    MissionResultRenderer,
    PriceRenderer,
    CompanyRenderer
  },
  data() {
    return {
      rowData: [],
      colDefs: [
        {
          field: "company", 
          valueGetter: (params) => {
            return params.data.company;
        },
          cellRenderer: 'CompanyRenderer',
        },
        {
          headerName: "Logo",
          valueGetter: (params) => {
            return params.data.company;
        },
          cellRenderer: 'CompanyLogoRenderer', 
        },
        {
          headerName: "Mission Cost",
          valueGetter: (params) => {
              return params.data.price;
          },
          cellRenderer: 'PriceRenderer',
        },
        {
          field: "successful",
          headerName: "Success",
          cellRenderer: 'MissionResultRenderer', 
        },
        {
          field: "button",
          headerName: "Button",
          cellRenderer: 'CustomButtonComponent',
        },
      ],
      themeClass: /** DARK MODE START **/document.documentElement.dataset.defaultTheme || 'ag-theme-quartz'/** DARK MODE END **/,
    };
  },
  methods: {
    fetchData: async function() {
      const response = await fetch('https://www.ag-grid.com/example-assets/small-space-mission-data.json');
      return response.json();
    },
  },
  mounted: async function() {
    this.rowData = await this.fetchData();
  },
};

// Create the Vue instance and mount the component
new Vue({
  render: h => h(App),
}).$mount('#app');
