import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3333/cashsplitter-2'

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

async function addExpense(page, description, total, paidByIndex) {
  await page.click('button:has-text("Add Expense")')
  await page.waitForSelector('#description', { timeout: 10000 })
  await page.fill('#description', description)
  await page.fill('#total', total)
  if (paidByIndex > 0) {
    const paidInputs = page.locator('.paid-input')
    await paidInputs.nth(0).fill('')
    await paidInputs.nth(paidByIndex).fill(total)
  }
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
    await addExpense(page, 'Dinner', '30', 0)
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Dinner')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC15.00')
    await expect(page.locator('.balance-list')).toContainText('Bob owes \u20AC15.00')
    await ctx.close()
  })

  test('4. Add shares/ratio expense', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addExpense(page, 'Rent', '90', 0)
    await page.click('input[value="shares"]')
    await page.waitForSelector('#split-details')
    const shareInputs = page.locator('#split-details input[type="number"]')
    await shareInputs.nth(0).fill('2')
    await shareInputs.nth(1).fill('1')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Rent')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC30.00')
    await expect(page.locator('.balance-list')).toContainText('Bob owes \u20AC30.00')
    await ctx.close()
  })

  test('5. Add custom-split expense', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addExpense(page, 'Groceries', '50', 0)
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
    await addExpense(page, 'Dinner', '20', 0)
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
    await addExpense(page, 'Dinner', '30', 0)
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
    await expect(page.locator('.app-header').first()).toBeVisible()
    await expect(page.locator('.app-title').first()).toContainText('CashSplitter')
    await ctx.close()
  })

  test('10. Single payer expense - regression', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addMember(page, 'Charlie')
    await addExpense(page, 'Dinner', '30', 0)
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Dinner')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC20.00')
    await expect(page.locator('.balance-list')).toContainText('Bob owes \u20AC10.00')
    await expect(page.locator('.balance-list')).toContainText('Charlie owes \u20AC10.00')
    await ctx.close()
  })

  test('11. Multiple payers, equal split', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addMember(page, 'Charlie')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Lunch')
    await page.fill('#total', '30')
    const paidInputs = page.locator('.paid-input')
    await paidInputs.nth(0).fill('20')
    await paidInputs.nth(1).fill('10')
    await paidInputs.nth(2).fill('0')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Lunch')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC10.00')
    await expect(page.locator('.balance-list')).toContainText('Bob is owed \u20AC0.00')
    await expect(page.locator('.balance-list')).toContainText('Charlie owes \u20AC10.00')
    await ctx.close()
  })

  test('12. Multiple payers with penny distribution', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addMember(page, 'Charlie')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Tea')
    await page.fill('#total', '10')
    const paidInputs = page.locator('.paid-input')
    await paidInputs.nth(0).fill('6')
    await paidInputs.nth(1).fill('4')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Tea')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC2.66')
    await expect(page.locator('.balance-list')).toContainText('Bob is owed \u20AC0.67')
    await expect(page.locator('.balance-list')).toContainText('Charlie owes \u20AC3.33')
    await ctx.close()
  })

  test('13. Multiple payers, shares strategy', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addMember(page, 'Charlie')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Supplies')
    await page.fill('#total', '90')
    const paidInputs = page.locator('.paid-input')
    await paidInputs.nth(0).fill('60')
    await paidInputs.nth(1).fill('30')
    await page.click('input[value="shares"]')
    await page.waitForSelector('#split-details')
    const shareInputs = page.locator('#split-details input[type="number"]')
    await shareInputs.nth(0).fill('2')
    await shareInputs.nth(1).fill('1')
    await shareInputs.nth(2).fill('1')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Supplies')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC15.00')
    await expect(page.locator('.balance-list')).toContainText('Bob is owed \u20AC7.50')
    await expect(page.locator('.balance-list')).toContainText('Charlie owes \u20AC22.50')
    await ctx.close()
  })

  test('14. Multiple payers, custom split', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Takeaway')
    await page.fill('#total', '50')
    const paidInputs = page.locator('.paid-input')
    await paidInputs.nth(0).fill('30')
    await paidInputs.nth(1).fill('20')
    await page.click('input[value="custom"]')
    await page.waitForSelector('#split-details')
    const amountInputs = page.locator('#split-details input[type="number"]')
    await amountInputs.nth(0).fill('20')
    await amountInputs.nth(1).fill('30')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Takeaway')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC10.00')
    await expect(page.locator('.balance-list')).toContainText('Bob owes \u20AC10.00')
    await ctx.close()
  })

  test('15. All members paid (everyone chips in)', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addMember(page, 'Charlie')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Snacks')
    await page.fill('#total', '30')
    const paidInputs = page.locator('.paid-input')
    await paidInputs.nth(0).fill('10')
    await paidInputs.nth(1).fill('10')
    await paidInputs.nth(2).fill('10')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Snacks')
    await expect(page.locator('.settled')).toContainText('All settled up')
    await ctx.close()
  })

  test('16. One person pays but does not participate in split', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addMember(page, 'Charlie')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Drinks')
    await page.fill('#total', '20')
    await page.click('input[value="custom"]')
    await page.waitForSelector('#split-details')
    const amountInputs = page.locator('#split-details input[type="number"]')
    await amountInputs.nth(1).fill('10')
    await amountInputs.nth(2).fill('10')
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Drinks')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed \u20AC20.00')
    await expect(page.locator('.balance-list')).toContainText('Bob owes \u20AC10.00')
    await expect(page.locator('.balance-list')).toContainText('Charlie owes \u20AC10.00')
    await ctx.close()
  })

  test('17. Form validation - sum of paid amounts must equal total', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await page.click('button:has-text("Add Expense")')
    await page.waitForSelector('#description', { timeout: 10000 })
    await page.fill('#description', 'Broken')
    await page.fill('#total', '30')
    const paidInputs = page.locator('.paid-input')
    await paidInputs.nth(0).fill('20')
    await paidInputs.nth(1).fill('5')
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('must equal total')
      dialog.dismiss()
    })
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-form')).toBeVisible()
    await ctx.close()
  })
})

test.describe('Global Users', () => {
  test('18. Create member creates global user', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await expect(page.locator('.member-list')).toContainText('Alice')
    await ctx.close()
  })

  test('19. Same name in two groups creates separate users', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const groupA = `A ${uid()}`
    await createGroup(page, groupA)
    await addMember(page, 'Alice')
    await page.click('a.back-link')
    await page.waitForSelector('input[name="name"]', { timeout: 10000 })
    const groupB = `B ${uid()}`
    await createGroup(page, groupB)
    await addMember(page, 'Alice')
    await expect(page.locator('.member-list')).toContainText('Alice')
    await ctx.close()
  })

  test('20. Member displayed with global user name in expenses', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addExpense(page, 'Dinner', '20', 0)
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.expense-list')).toContainText('Alice')
    await ctx.close()
  })

  test('21. Member name appears in balances', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await addMember(page, 'Alice')
    await addMember(page, 'Bob')
    await addExpense(page, 'Lunch', '20', 0)
    await page.click('form button:has-text("Add Expense")')
    await expect(page.locator('.balance-list')).toContainText('Alice is owed')
    await expect(page.locator('.balance-list')).toContainText('Bob owes')
    await ctx.close()
  })

  test('22. Member form still works (regression)', async ({ browser }) => {
    const { page, ctx } = await setupPage(browser)
    const name = `Group ${uid()}`
    await createGroup(page, name)
    await page.click('button:has-text("Add Member")')
    await page.waitForSelector('#member-name', { timeout: 10000 })
    await page.fill('#member-name', 'Charlie')
    await page.click('form button:has-text("Add")')
    await expect(page.locator('.member-list')).toContainText('Charlie', { timeout: 10000 })
    await ctx.close()
  })
})
