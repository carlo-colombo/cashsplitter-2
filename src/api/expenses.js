import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, EXPENSE_ADDED, LEDGER_ENTRY } from '../db/events.js'
import { splitEqual, splitByShares, splitCustom, validateCustomTotal } from '../lib/split.js'
import { render } from '../lib/template.js'
import { BASE_PATH } from '../lib/config.js'

function lookupName(users, userId) {
  const u = users[userId]
  return u ? u.name : userId
}

function formatPayerNames(paidBy, users) {
  return Object.entries(paidBy)
    .map(([id, amt]) => `${lookupName(users, id)} (\u20AC${(amt / 100).toFixed(2)})`)
    .join(', ')
}

function buildGroupDetailData(group, memberIds, users, expenses, balances) {
  const balanceItems = Object.entries(balances).map(([userId, net]) => ({
    name: lookupName(users, userId),
    amount: (Math.abs(net) / 100).toFixed(2),
    cls: net >= 0 ? 'positive' : 'negative',
    label: net >= 0 ? 'is owed' : 'owes'
  }))
  return {
    group: { id: group.id, name: group.name },
    memberCount: memberIds.length,
    memberLabel: memberIds.length === 1 ? 'member' : 'members',
    hasMembers: memberIds.length > 0,
    members: memberIds.map(id => ({ id, name: lookupName(users, id) })),
    hasExpenses: expenses.length > 0,
    expenses: expenses.map(e => ({
      description: e.description,
      totalFormatted: (e.total / 100).toFixed(2),
      payerNames: formatPayerNames(e.paidBy, users)
    })),
    hasBalances: Object.values(balances).some(b => Math.abs(b) >= 1),
    balanceItems,
    basePath: BASE_PATH
  }
}

function generateLedgerEntries(paidBy, split, groupId, expenseId, description) {
  const net = {}
  for (const [userId, amount] of Object.entries(paidBy)) {
    net[userId] = (net[userId] || 0) + amount
  }
  for (const [userId, amount] of Object.entries(split)) {
    net[userId] = (net[userId] || 0) - amount
  }

  const debtors = []
  const creditors = []
  for (const [userId, amount] of Object.entries(net)) {
    if (amount < 0) debtors.push({ userId, amount: -amount })
    else if (amount > 0) creditors.push({ userId, amount })
  }

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const entries = []
  let di = 0, ci = 0
  while (di < debtors.length && ci < creditors.length) {
    const transferAmount = Math.min(debtors[di].amount, creditors[ci].amount)
    if (transferAmount > 0) {
      entries.push({
        groupId,
        id: crypto.randomUUID(),
        from: debtors[di].userId,
        to: creditors[ci].userId,
        amount: transferAmount,
        description: `share of ${description}`,
        expenseId,
      })
    }
    debtors[di].amount -= transferAmount
    creditors[ci].amount -= transferAmount
    if (debtors[di].amount <= 0) di++
    if (creditors[ci].amount <= 0) ci++
  }

  return entries
}

export async function form(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  const memberIds = state.members[groupId] || []
  const memberData = memberIds.map(id => ({ id, name: lookupName(state.users, id) }))
  const data = {
    groupId,
    members: memberData,
    membersJson: JSON.stringify(memberData),
    basePath: BASE_PATH
  }
  const html = render('expense-form', data)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function add(params, request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  const form = await request.formData()
  const description = form.get('description')?.trim()
  const totalCents = Math.round(parseFloat(form.get('total')) * 100)
  if (!description) {
    return new Response(
      '<div class="error">Description is required</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
  if (!totalCents || totalCents <= 0) {
    return new Response(
      '<div class="error">Total must be greater than 0</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const memberIds = state.members[groupId] || []
  if (memberIds.length === 0) {
    return new Response(
      '<div class="error">Group has no members</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  let paidBy = {}
  const singlePayer = form.get('paidBy')
  if (singlePayer) {
    paidBy[singlePayer] = totalCents
  } else {
    for (const memberId of memberIds) {
      const val = parseFloat(form.get(`paid_${memberId}`))
      if (!isNaN(val) && val > 0) {
        paidBy[memberId] = Math.round(val * 100)
      }
    }
  }
  if (Object.keys(paidBy).length === 0) {
    return new Response(
      '<div class="error">At least one payer is required</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
  const paidSum = Object.values(paidBy).reduce((s, v) => s + v, 0)
  if (paidSum !== totalCents) {
    return new Response(
      '<div class="error">Sum of paid amounts must equal the total</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const strategy = form.get('splitStrategy')
  let split
  if (strategy === 'equal') {
    split = splitEqual(totalCents, memberIds)
  } else if (strategy === 'shares') {
    const shares = {}
    for (const memberId of memberIds) {
      const val = parseFloat(form.get(`shares_${memberId}`))
      shares[memberId] = val > 0 ? val : 1
    }
    split = splitByShares(totalCents, shares)
  } else if (strategy === 'custom') {
    const amounts = {}
    for (const memberId of memberIds) {
      const val = parseFloat(form.get(`amount_${memberId}`))
      amounts[memberId] = isNaN(val) ? 0 : Math.round(val * 100)
    }
    if (!validateCustomTotal(amounts, totalCents)) {
      return new Response(
        '<div class="error">Custom amounts must sum to the total</div>',
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }
    split = splitCustom(amounts)
  } else {
    return new Response(
      '<div class="error">Invalid split strategy</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const expenseId = crypto.randomUUID()
  const expenseEvent = createEvent(EXPENSE_ADDED, {
    groupId, id: expenseId, description, total: totalCents, paidBy, split, strategy,
  })
  await addEvent(expenseEvent)

  const ledgerEntries = generateLedgerEntries(paidBy, split, groupId, expenseId, description)
  for (const entry of ledgerEntries) {
    await addEvent(createEvent(LEDGER_ENTRY, entry))
  }

  const updatedEvents = await getAllEvents()
  const updatedState = projectState(updatedEvents)
  const data = buildGroupDetailData(
    updatedState.groups[groupId],
    updatedState.members[groupId] || [],
    updatedState.users,
    updatedState.expenses[groupId] || [],
    updatedState.balances[groupId] || {}
  )
  const html = render('group-detail', data)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: 200,
  })
}
