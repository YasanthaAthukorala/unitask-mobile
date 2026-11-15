const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({testDir:'./tests',timeout:120000,workers:1,use:{baseURL:'http://localhost:8081',viewport:{width:390,height:844},launchOptions:{channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'}},reporter:'list'});
