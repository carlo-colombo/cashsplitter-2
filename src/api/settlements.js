import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, LEDGER_ENTRY } from '../db/events.js'
import { render } from '../lib/template.js'
import { BASE_PATH } from '../lib/config.js'

function lookupName(users, userId) {
  const u = users[userId]
  return u ? u.name : userId
}

export function getSettlementHistory(events, groupId, users) {
  return events
    .filter(e => e.type === 'LEDGER_ENTRY' && e.data.groupId === groupId && e.data.expenseId === null)
    .map(e => ({
      id: e.id,
      date: new Date(e.timestamp).toLocaleDateString(),
      fromName: lookupName(users, e.data.from),
      toName: lookupName(users, e.data.to),
      amount: (e.data.amount / 100).toFixed(2),
      description: e.data.description || 'settlement',
    }))
    .reverse()
}

export async function form(params, request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const memberIds = state.members[groupId] || []
  const balances = state.balances[groupId] || {}

  let defaultFrom = ''
  let defaultTo = ''
  let minBalance = 0
  let maxBalance = 0
  for (const [userId, net] of Object.entries(balances)) {
    if (net < minBalance) { minBalance = net; defaultFrom = userId }
    if (net > maxBalance) { maxBalance = net; defaultTo = userId }
  }

  const url = new URL(request.url)
  const queryFrom = url.searchParams.get('from')
  const queryTo = url.searchParams.get('to')
  if (queryFrom) defaultFrom = queryFrom
  if (queryTo) defaultTo = queryTo

  const members = memberIds.map(id => ({
    id,
    name: lookupName(state.users, id),
    isDefaultFrom: id === defaultFrom ? 'selected' : '',
    isDefaultTo: id === defaultTo ? 'selected' : '',
  }))

  const data = {
    groupId,
    members,
    basePath: BASE_PATH,
  }
  const html = render('settlement-form', data)
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function create(params, request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const formData = await request.formData()
  const from = formData.get('from')
  const to = formData.get('to')
  const amountStr = formData.get('amount')
  const description = formData.get('description')?.trim() || 'settlement'

  if (!from || !to) {
    return new Response('<div class="error">Both payer and receiver are required</div>', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
  if (from === to) {
    return new Response('<div class="error">Payer and receiver must be different</div>', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const memberIds = state.members[groupId] || []
  if (!memberIds.includes(from)) {
    return new Response('<div class="error">Payer is not a member of this group</div>', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
  if (!memberIds.includes(to)) {
    return new Response('<div class="error">Receiver is not a member of this group</div>', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const amountCents = Math.round(parseFloat(amountStr) * 100)
  if (!amountCents || amountCents <= 0) {
    return new Response('<div class="error">Amount must be greater than 0</div>', { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  const entry = {
    groupId,
    id: crypto.randomUUID(),
    from,
    to,
    amount: amountCents,
    description,
    expenseId: null,
  }
  await addEvent(createEvent(LEDGER_ENTRY, entry))

  const updatedEvents = await getAllEvents()
  const updatedState = projectState(updatedEvents)

  const group = updatedState.groups[groupId]
  const memberIdsList = updatedState.members[groupId] || []
  const expenses = updatedState.expenses[groupId] || []
  const balances = updatedState.balances[groupId] || {}
  const settlementHistory = getSettlementHistory(updatedEvents, groupId, updatedState.users)

  const balanceItems = Object.entries(balances).map(([userId, net]) => ({
    name: lookupName(updatedState.users, userId),
    amount: (Math.abs(net) / 100).toFixed(2),
    cls: net >= 0 ? 'positive' : 'negative',
    label: net >= 0 ? 'is owed' : 'owes',
    userId,
  }))

  const data = {
    group: { id: group.id, name: group.name },
    memberCount: memberIdsList.length,
    memberLabel: memberIdsList.length === 1 ? 'member' : 'members',
    hasMembers: memberIdsList.length > 0,
    members: memberIdsList.map(id => ({ id, name: lookupName(updatedState.users, id) })),
    hasExpenses: expenses.length > 0,
    expenses: expenses.map(e => ({
      description: e.description,
      totalFormatted: (e.total / 100).toFixed(2),
      payerNames: Object.entries(e.paidBy).map(([id, amt]) => `${lookupName(updatedState.users, id)} (€${(amt / 100).toFixed(2)})`).join(', '),
    })),
    hasBalances: Object.values(balances).some(b => Math.abs(b) >= 1),
    balanceItems,
    hasSettlementHistory: settlementHistory.length > 0,
    settlementHistory,
    basePath: BASE_PATH,
  }
  const html = render('group-detail', data)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: 200,
  })
}
