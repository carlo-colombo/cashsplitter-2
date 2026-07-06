import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, GROUP_CREATED, GROUP_DELETED } from '../db/events.js'
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
      id: e.id,
      description: e.description,
      totalFormatted: (e.total / 100).toFixed(2),
      payerNames: formatPayerNames(e.paidBy, users)
    })),
    hasBalances: Object.values(balances).some(b => Math.abs(b) >= 1),
    balanceItems,
    basePath: BASE_PATH
  }
}

export async function list(_params, _request) {
  const events = await getAllEvents()
  const state = projectState(events)
  const groupsList = Object.entries(state.groups).map(([id, g]) => ({ id, name: g.name }))
  const data = {
    groups: groupsList,
    hasGroups: groupsList.length > 0,
    basePath: BASE_PATH
  }
  const html = render('groups-list', data)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function create(_params, request) {
  const form = await request.formData()
  const name = form.get('name')?.trim()
  if (!name) {
    return new Response(
      '<div class="error">Group name is required</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
  const id = crypto.randomUUID()
  const event = createEvent(GROUP_CREATED, { id, name })
  await addEvent(event)
  const allEvents = await getAllEvents()
  const state = projectState(allEvents)
  const group = state.groups[id]
  const data = {
    ...buildGroupDetailData(group, [], state.users, [], {}),
    hasSettlementHistory: false,
    settlementHistory: [],
  }
  const html = render('group-detail', data)
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'HX-Push-Url': `/#/groups/${id}`,
    },
  })
}

export async function detail(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  const group = state.groups[groupId]
  if (!group) {
    return new Response('<div class="error">Group not found</div>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  const memberIds = state.members[groupId] || []
  const expenses = state.expenses[groupId] || []
  const balances = state.balances[groupId] || {}
  const settlementHistory = getSettlementHistory(events, groupId, state.users)
  const data = {
    ...buildGroupDetailData(group, memberIds, state.users, expenses, balances),
    hasSettlementHistory: settlementHistory.length > 0,
    settlementHistory,
  }
  const html = render('group-detail', data)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function deleteGroup(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  // Append immutable deletion event
  await addEvent(createEvent(GROUP_DELETED, { groupId }))
  // Redirect back to groups list
  const updatedEvents = await getAllEvents()
  const updatedState = projectState(updatedEvents)
  const groupsList = Object.entries(updatedState.groups).map(([id, g]) => ({ id, name: g.name }))
  const data = {
    groups: groupsList,
    hasGroups: groupsList.length > 0,
    basePath: BASE_PATH,
  }
  const html = render('groups-list', data)
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'HX-Push-Url': '/#/',
    },
  })
}
