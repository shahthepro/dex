<template>
  <v-app dark>
    <v-toolbar app>
      <v-toolbar-title v-text="title"></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click.stop="accountDrawer = !accountDrawer">
        <v-icon>account_circle</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <router-view></router-view>
    </v-content>
    <v-navigation-drawer temporary right v-model="accountDrawer" fixed app width="500">
      <div>HelloWorld</div>
    </v-navigation-drawer>
    <v-footer app>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script>
import HelloWorld from '@/components/HelloWorld'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  data () {
    return {
      accountDrawer: false,
      title: 'CDEX Bridge'
    }
  }
}
</script>
