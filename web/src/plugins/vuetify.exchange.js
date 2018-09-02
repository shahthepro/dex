import Vue from 'vue'
import {
  Vuetify,
  VAutocomplete,
  VApp,
  VNavigationDrawer,
  VFooter,
  VList,
  VBtn,
  VIcon,
  VGrid,
  VToolbar,
  VMenu,
  VCard,
  VTabs,
  VForm,
  VTextField,
  VDataTable,
  transitions
} from 'vuetify'
import 'vuetify/src/stylus/app.styl'

Vue.use(Vuetify, {
  components: {
    VAutocomplete,
    VApp,
    VNavigationDrawer,
    VFooter,
    VList,
    VBtn,
    VIcon,
    VGrid,
    VToolbar,
    VMenu,
    VCard,
    VTabs,
    VForm,
    VTextField,
    VDataTable,
    transitions
  },
  theme: {
    accent: '#ee7f00'
  },
})
