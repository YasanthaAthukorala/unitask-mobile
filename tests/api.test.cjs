const { test } = require('node:test');
const assert = require('node:assert/strict');
test('API sessions and provider contacts round-trip through the existing server contract',async()=>{
  process.env.EXPO_PUBLIC_API_URL='https://unitask.test';
  const calls=[],original=global.fetch;
  global.fetch=async(url,options)=>{
    calls.push({url,options});
    return {ok:true,json:async()=>url.endsWith('/login') ? {token:'test-token',user:{_id:'owner',name:'Student'}} :
      {...JSON.parse(options.body || '{}'),_id:'gig',postedBy:{_id:'owner',name:'Student'}}};
  };
  try{
    const api=await import('../src/services/api.js');
    const {validateService,toApiService}=await import('../src/utils/serviceDetails.js');
    await api.authenticate('login',{email:'student@example.com',password:'test-only'});
    assert.equal(api.getSession().user._id,'owner');
    const offer=validateService({
      title:'Java course',description:'Learn Java with practical examples.',category:'Education',budget:4500,
      student_name:'Java Tutor',listingType:'Course',priceUnit:'Per course',availability:'Weekends',
      contactEmail:'java@example.com',contactPhone:'0771234567',
    });
    const stored=await api.request('/api/tasks',{method:'POST',body:JSON.stringify(toApiService(offer))});
    assert.equal(calls[1].options.headers.Authorization,'Bearer test-token');
    const listing=api.normalizeTask(stored);
    assert.equal(listing.id,'gig');assert.equal(listing.is_mine,1);
    for(const field of ['contactEmail','contactPhone','student_name','listingType','priceUnit','availability','description']){
      assert.equal(listing[field],offer[field],field);
    }
    const legacy=api.normalizeTask({_id:'old',postedBy:{_id:'owner',name:'Student'},description:'Original content'});
    assert.equal(legacy.priceUnit,'Per project');assert.equal(legacy.description,'Original content');
    global.fetch=async()=>({ok:false,json:async()=>({message:'Not allowed'})});
    await assert.rejects(api.request('/api/tasks'),/Not allowed/);
    api.signOut();assert.equal(api.getSession(),null);
    assert.equal(api.normalizeTask({_id:'orphan'}).is_mine,0);
    assert.equal(api.normalizeTask(stored).is_mine,0);
  }finally{global.fetch=original;}
});
