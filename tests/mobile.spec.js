const { test, expect } = require('@playwright/test');
test('offline campus workflow persists tasks and favorites',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('/home');await expect(page.getByText('Fresh on campus')).toBeVisible();
 await expect(page.getByRole('button',{name:'View Presentation Slides'})).toBeVisible();
 await page.screenshot({path:'docs/screenshots/home-mobile.png',fullPage:true});
 await page.goto('/explore?category=Programming');await expect(page.getByText('2 tasks found')).toBeVisible();
 await page.getByLabel('Search tasks').fill('Python');await expect(page.getByText('1 tasks found')).toBeVisible();
 await page.getByRole('button',{name:'View Python Debugging'}).click();await page.getByRole('button',{name:'Save to favorites'}).click();await expect(page.getByRole('button',{name:'Remove favorite'})).toBeVisible();
 await page.goto('/profile');await expect(page.getByRole('button',{name:'View Python Debugging'})).toBeVisible();
 await page.goto('/create');await page.getByPlaceholder('Task title',{exact:true}).fill('Browser workflow task');await page.getByPlaceholder('Description',{exact:true}).fill('Created to verify offline persistence and owner editing.');await page.getByPlaceholder('Budget in LKR').fill('1500');
 await page.screenshot({path:'docs/screenshots/create-mobile.png',fullPage:true});
 await page.getByText('Save Task Offline',{exact:true}).click();await expect(page.getByRole('button',{name:'View Browser workflow task'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'View Browser workflow task'}).click();
 await page.getByRole('button',{name:'Edit task',exact:true}).click();await page.getByPlaceholder('Task title',{exact:true}).fill('Updated workflow task');await page.getByText('Update Task',{exact:true}).click();await expect(page.getByText('Updated workflow task',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Completed',exact:true}).click();await expect(page.getByText('Education · Completed')).toBeVisible();await page.getByRole('button',{name:'Delete my task'}).click();await expect(page.getByText('No tasks yet. Create one using the Create tab.')).toBeVisible();
 await page.goto('/explore');await expect(page.getByText('10 tasks found')).toBeVisible();await page.screenshot({path:'docs/screenshots/explore-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto('/home');await expect(page.getByText('Fresh on campus')).toBeVisible();await page.screenshot({path:'docs/screenshots/home-desktop.png',fullPage:true});expect(errors).toEqual([]);
});
