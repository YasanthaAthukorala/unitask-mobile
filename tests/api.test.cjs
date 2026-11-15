const { test } = require('node:test');
const assert = require('node:assert/strict');
test('API adapter authenticates, normalizes ownership and clears session',async()=>{
 process.env.EXPO_PUBLIC_API_URL='https://unitask.test';
 const calls=[];const original=global.fetch;
 global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url.endsWith('/login')?{token:'test-token',user:{_id:'owner'}}:{message:'ok'}}};
 try{
 const api=await import('../src/services/api.js');
 await api.authenticate('login',{email:'student@example.com',password:'test-only'});
 assert.equal(api.getSession().user._id,'owner');
 await api.request('/api/tasks');assert.equal(calls[1].options.headers.Authorization,'Bearer test-token');
 const task=api.normalizeTask({_id:'gig',postedBy:{_id:'owner',name:'Student'}});assert.equal(task.id,'gig');assert.equal(task.is_mine,1);
 global.fetch=async()=>({ok:false,json:async()=>({message:'Not allowed'})});await assert.rejects(api.request('/api/tasks'),/Not allowed/);
 api.signOut();assert.equal(api.getSession(),null);
 }finally{global.fetch=original}
});
