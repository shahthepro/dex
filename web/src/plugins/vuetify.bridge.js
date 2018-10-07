import Vue from 'vue'
import {
    Vuetify,
    VApp,
    // VNavigationDrawer,
    VFooter,
    VList,
    VBtn,
    VIcon,
    VGrid,
    VToolbar,
    VCard,
    VForm,
    VTextField,
    // VTabs,
    // VCombobox,
    VSelect,
    // VJumbotron,
    VExpansionPanel,
    VAlert,
    VTextarea,
    VDialog,
    VDivider,
    VCheckbox,
    VAutocomplete,
    transitions
} from 'vuetify'
import 'vuetify/src/stylus/app.styl'

Vue.use(Vuetify, {
    components: {
        VApp,
        // VNavigationDrawer,
        VFooter,
        VList,
        VBtn,
        VIcon,
        VGrid,
        VToolbar,
        VCard,
        VForm,
        VTextField,
        // VTabs,
        // VCombobox,
        VSelect,
        // VJumbotron,
        VExpansionPanel,
        VAlert,
        VTextarea,
        VDialog,
        VDivider,
        VCheckbox,
        VAutocomplete,
        transitions
    },
    theme: {
        accent: '#ee7f00'
    },
    options: {
    }
})
