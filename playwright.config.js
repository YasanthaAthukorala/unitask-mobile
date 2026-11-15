const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({testDir:'./tests',testMatch:'**/*.spec.js',timeout:300000,expect:{timeout:60000},workers:1,use:{baseURL:'http://localhost:8081',viewport:{width:390,height:844},launchOptions:{channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'}},reporter:'list'});


