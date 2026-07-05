import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, USER_CREATED, MEMBER_ADDED } from '../db/events.js'
import { render } from '../lib/template.js'
import { BASE_PATH } from '../lib/config.js'
import { getSettlementHistory } from './settlements.js'

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

export async function form(params, _request) {
  const groupId = params.id
  const data = {
    groupId,
    basePath: BASE_PATH
  }
  const html = render('member-form', data)
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
  const name = form.get('name')?.trim()
  if (!name) {
    return new Response(
      '<div class="error">Member name is required</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
  const userId = crypto.randomUUID()
  const now = new Date().toISOString()
  await addEvent(createEvent(USER_CREATED, { id: userId, name, createdAt: now }))
  await addEvent(createEvent(MEMBER_ADDED, { groupId, userId, addedAt: now }))
  const updatedEvents = await getAllEvents()
  const updatedState = projectState(updatedEvents)
  const settlementHistory = getSettlementHistory(updatedEvents, groupId, updatedState.users)
  const data = {
    ...buildGroupDetailData(
      updatedState.groups[groupId],
      updatedState.members[groupId] || [],
      updatedState.users,
      updatedState.expenses[groupId] || [],
      updatedState.balances[groupId] || {}
    ),
    hasSettlementHistory: settlementHistory.length > 0,
    settlementHistory,
  }
  const html = render('group-detail', data)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: 200,
  })
}
