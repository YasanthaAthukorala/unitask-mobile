const {test,expect}=require('@playwright/test');
const {randomUUID}=require('node:crypto');
test.use({actionTimeout:20000,navigationTimeout:90000});
test('separate online accounts exchange an interest request through the private SQLite API',async({browser,request})=>{
 const origin=process.env.PLAYWRIGHT_API_URL;
 test.skip(!origin,'Set PLAYWRIGHT_API_URL and start Expo with EXPO_PUBLIC_API_URL to verify the optional private API.');
 const suffix=randomUUID(),password=randomUUID()+'A1!',errors=[];
 const ownerEmail='owner-'+suffix+'@unitask.test',studentEmail='student-'+suffix+'@unitask.test';
 async function register(name,email){
  const response=await request.post(origin+'/api/auth/register',{data:{name,email,password}});
  expect(response.status()).toBe(201);return response.json();
 }
 const owner=await register('Course Provider',ownerEmail);await register('Course Student',studentEmail);
 const details={title:'Online Java course '+suffix,description:'Java classes for campus students.',category:'Education',budget:1500,
  contactEmail:ownerEmail,contactPhone:'+94771234567'};
 const {toApiService}=await import('../src/utils/serviceDetails.js');
 const created=await request.post(origin+'/api/tasks',{headers:{Authorization:'Bearer '+owner.token},data:toApiService({...details,listingType:'Course',priceUnit:'Per course',availability:'Weekends',student_name:'Course Provider'})});
 expect(created.status()).toBe(201);const listing=await created.json();
 const ownerContext=await browser.newContext({viewport:{width:390,height:844}}),studentContext=await browser.newContext({viewport:{width:390,height:844}});
 const provider=await ownerContext.newPage(),student=await studentContext.newPage();
 for(const page of [provider,student]){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
 async function signIn(page,email){
  await page.goto('http://localhost:8081/auth');
  await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Browse services',exact:true})).toBeVisible();
 }
 try{
  await signIn(provider,ownerEmail);await signIn(student,studentEmail);
  await student.getByRole('button',{name:'Browse services',exact:true}).click();
  await expect(student).toHaveURL(/\/explore$/);
  await student.getByLabel('Search services',{exact:true}).fill(details.title);
  await student.getByRole('button',{name:'View '+details.title,exact:true}).and(student.locator(':not([inert] *)')).click();
  await student.getByLabel('Interest message',{exact:true}).fill('Please send me the Java course schedule.');
  await student.getByRole('button',{name:'Request course',exact:true}).click();
  await expect(student.getByText(/Request sent to Course Provider/).filter({visible:true})).toBeVisible();
  await provider.getByRole('button',{name:/^Notifications,/}).click();
  await expect(provider.getByText('Course Student is interested in "'+details.title+'".',{exact:true}).filter({visible:true})).toBeVisible();
  await expect(provider.getByText('Please send me the Java course schedule.',{exact:true}).filter({visible:true})).toBeVisible();
  await expect(provider.getByRole('link',{name:'Email Course Student',exact:true})).toHaveAttribute('href','mailto:'+encodeURIComponent(studentEmail));
  await provider.getByRole('button',{name:'Mark as read',exact:true}).click();
  await expect(provider.getByText('For Course Provider / 0 unread',{exact:true}).filter({visible:true})).toBeVisible();
  expect(errors).toEqual([]);
 }finally{
  await ownerContext.close();await studentContext.close();
  await request.delete(origin+'/api/tasks/'+listing._id,{headers:{Authorization:'Bearer '+owner.token}});
 }
});
