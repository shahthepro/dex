<template>
  <v-app dark>
    <v-toolbar app>
      <v-toolbar-title v-text="title"></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
          <v-btn flat href="https://chilra.com/trade">Trade</v-btn>
          <v-btn flat :to="{ name: `deposit` }">Deposit</v-btn>
          <v-btn flat :to="{ name: `withdraw` }">Withdraw</v-btn>
          <v-btn flat :to="{ name: `help` }"><v-icon>help</v-icon></v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      accountDrawer: false,
      title: 'CDEX Bridge'
    }
  }
}
</script>
