const {test}=require('node:test');
const assert=require('node:assert/strict');
const valid={
  title:'Java individual course',description:'Four practical sessions covering Java and OOP.',
  category:'Education',budget:'6000',student_name:'Campus Tutor',listingType:'Course',
  priceUnit:'Per course',availability:'Saturday mornings',contactEmail:' TUTOR@EXAMPLE.COM ',contactPhone:'077 123 4567',
};
test('Sri Lankan local, international and landline formats normalize without truncation',async()=>{
  const {normalizeSriLankanPhone:phone}=await import('../src/utils/serviceDetails.js');
  for(const input of ['0771234567','077 123 4567','+94 77 123 4567','0094771234567','(077) 123-4567']){
    assert.equal(phone(input),'+94771234567',input);
  }
  assert.equal(phone('0112345678'),'+94112345678');
  for(const input of ['',null,'123','07712345678','+44771234567','+940771234567','077abc4567','0000000000','0771234567 extension 1']){
    assert.equal(phone(input),'',String(input));
  }
});
test('every listing requires a provider and valid contacts, in either mode',async()=>{
  const {validateService:validate}=await import('../src/utils/serviceDetails.js');
  const result=validate(valid);
  assert.equal(result.contactEmail,'tutor@example.com');
  assert.equal(result.contactPhone,'+94771234567');
  assert.equal(result.budget,6000);
  for(const field of ['title','description','student_name','contactEmail','contactPhone','category']){
    assert.throws(()=>validate({...valid,[field]:''}),Error,field);
  }
  for(const email of ['no-at-sign','a@','a@b','a b@example.com','a@example.com\nBcc: victim@example.com']){
    assert.throws(()=>validate({...valid,contactEmail:email}),/email/i);
  }
  for(const price of [0,-1,Infinity,'not a number'])assert.throws(()=>validate({...valid,budget:price}),/price/i);
  assert.throws(()=>validate({...valid,listingType:'Job'}),/listing type/i);
});
test('course metadata survives the existing API field allowlist and repeated edits',async()=>{
  const {validateService,toApiService,readApiService}=await import('../src/utils/serviceDetails.js');
  const service=validateService(valid);
  const payload=toApiService(service);
  assert.deepEqual(Object.keys(payload).sort(),['title','description','category','budget','contactEmail','contactPhone'].sort());
  const decoded={...payload,...readApiService(payload)};
  for(const field of ['description','listingType','priceUnit','availability','student_name'])assert.equal(decoded[field],service[field],field);
  assert.deepEqual(toApiService(decoded),payload,'editing does not duplicate the metadata footer');
  assert.deepEqual(readApiService({description:'An existing listing with no footer.'}),{});
  assert.deepEqual(readApiService({description:'Text\n\n--- UniTask service details ---\nAn ordinary paragraph'}),{});
});
