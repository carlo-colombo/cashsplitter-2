import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3333'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

async function setupPage(browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  await page.goto(`${BASE}/`)
  await page.waitForFunction(() =>
    'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
    { timeout: 15000 }
  )
  await page.reload()
  await page.waitForFunction(() =>
    'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
    { timeout: 15000 }
  )
  return { page, ctx }
}

async function createGroup(page, name) {
  await page.fill('input[name="name"]', name)
  await page.click('button:has-text("Create")')
  await expect(page.locator(`h2:has-text("${name}")`)).toBeVisible()
}

async function addMember(page, name) {
  await page.click('button:has-text("Add Member")')
  await page.waitForSelector('#member-name', { timeout: 10000 })
  await page.fill('#member-name', name)
  await page.click('form button:has-text("Add")')
  await expect(page.locator('.member-list')).toContainText(name, { timeout: 10000 })
}

test.describe('CashSplitter', () => {
  test('1. Create a group - shows in list and empty state gone', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await expect(page.locator('.empty-state')).toContainText('No groups yet', { timeout: 10000 })
    await createGroup(page, name)
    await ctx.close()
  })

  test('2. Add members to a group', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await expect(page.locator('.member-count')).toHaveText('0 members')
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await expect(page.locator('.member-count')).toHaveText('2 members')
    await ctx.close()
  })

  test('3. Add equal-split expense - verify balances', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Dinner')
    await page.fill('#total', '30')
    await page.selectOption('#paidBy', { index: 1 })
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Dinner')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed €15.00')
    await expect(page.locator('.balance-list')).toContainText('Bob owes €15.00')
    await ctx.close()
  })

  test('4. Add shares/ratio expense', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Rent')
    await page.fill('#total', '90')
    await page.selectOption('#paidBy', { index: 1 })
    await page.click('input[value="shares"]')
    await page.waitForSelector('#split-details')
    const shareInputs = page.locator('#split-details input[type="number"]')
    await shareInputs.nth(0).fill('2')
    await shareInputs.nth(1).fill('1')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Rent')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed €30.00')
    await expect(page.locator('.balance-list')).toContainText('Bob owes €30.00')
    await ctx.close()
  })

  test('5. Add custom-split expense', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Groceries')
    await page.fill('#total', '50')
    await page.selectOption('#paidBy', { index: 1 })
    await page.click('input[value="custom"]')
    await page.waitForSelector('#split-details')
    const amountInputs = page.locator('#split-details input[type="number"]')
    await amountInputs.nth(0).fill('30')
    await amountInputs.nth(1).fill('20')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Groceries')
    await ctx.close()
  })

  test('6. View balances display correctly', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Dinner')
    await page.fill('#total', '20')
    await page.selectOption('#paidBy', { index: 1 })
    await page.click('form button:has-text("Add Expense")')
    await page.click('button:has-text("Balances")')
    await expect(page.locator('#balances-container')).toContainText('is owed')
    await expect(page.locator('#balances-container')).toContainText('owes')
    await ctx.close()
  })

  test('7. Toggle between balances and settlements', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Dinner')
    await page.fill('#total', '30')
    await page.selectOption('#paidBy', { index: 1 })
    await page.click('form button:has-text("Add Expense")')
    await page.click('button:has-text("Balances")')
    await expect(page.locator('#balances-container')).toContainText('View Settlements')
    await page.click('button:has-text("View Settlements")')
    await expect(page.locator('#balances-container')).toContainText('pays')
    await expect(page.locator('#balances-container')).toContainText('View Raw Balances')
    await page.click('button:has-text("View Raw Balances")')
    await expect(page.locator('#balances-container')).toContainText('is owed')
    await ctx.close()
  })

  test('8. Empty states display correctly', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    await expect(page.locator('.empty-state')).toContainText('No groups yet')
    await ctx.close()
  })

  test('9. Page shell loads with title and app header', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    await expect(page).toHaveTitle('CashSplitter')
    await expect(page.locator('.app-header')).toBeVisible()
    await expect(page.locator('.app-title')).toContainText('CashSplitter')
    await ctx.close()
  })
})
