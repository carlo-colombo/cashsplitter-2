import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, EXPENSE_ADDED, LEDGER_ENTRY } from '../db/events.js'
import { splitEqual, splitByShares, splitCustom, validateCustomTotal } from '../lib/split.js'
import { render } from '../lib/template.js'
import { BASE_PATH } from '../lib/config.js'

function lookupName(members, userId) {
  const m = members.find(m => m.id === userId)
  return m ? m.name : userId
}

function formatPayerNames(paidBy, members) {
  return Object.entries(paidBy)
    .map(([id, amt]) => `${lookupName(members, id)} (\u20AC${(amt / 100).toFixed(2)})`)
    .join(', ')
}

function buildGroupDetailData(group, members, expenses, balances) {
  const balanceItems = Object.entries(balances).map(([userId, net]) => ({
    name: lookupName(members, userId),
    amount: (Math.abs(net) / 100).toFixed(2),
    cls: net >= 0 ? 'positive' : 'negative',
    label: net >= 0 ? 'is owed' : 'owes'
  }))
  return {
    group: { id: group.id, name: group.name },
    memberCount: members.length,
    memberLabel: members.length === 1 ? 'member' : 'members',
    hasMembers: members.length > 0,
    members: members.map(m => ({ id: m.id, name: m.name })),
    hasExpenses: expenses.length > 0,
    expenses: expenses.map(e => ({
      description: e.description,
      totalFormatted: (e.total / 100).toFixed(2),
      payerNames: formatPayerNames(e.paidBy, members)
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
  const members = state.members[groupId] || []
  const memberData = members.map(m => ({ id: m.id, name: m.name }))
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

  const members = state.members[groupId] || []
  if (members.length === 0) {
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
    for (const member of members) {
      const val = parseFloat(form.get(`paid_${member.id}`))
      if (!isNaN(val) && val > 0) {
        paidBy[member.id] = Math.round(val * 100)
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
    split = splitEqual(totalCents, members.map((m) => m.id))
  } else if (strategy === 'shares') {
    const shares = {}
    for (const member of members) {
      const val = parseFloat(form.get(`shares_${member.id}`))
      shares[member.id] = val > 0 ? val : 1
    }
    split = splitByShares(totalCents, shares)
  } else if (strategy === 'custom') {
    const amounts = {}
    for (const member of members) {
      const val = parseFloat(form.get(`amount_${member.id}`))
      amounts[member.id] = isNaN(val) ? 0 : Math.round(val * 100)
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
    updatedState.expenses[groupId] || [],
    updatedState.balances[groupId] || {}
  )
  const html = render('group-detail', data)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: 200,
  })
}
