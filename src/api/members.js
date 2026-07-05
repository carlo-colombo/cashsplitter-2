import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, MEMBER_ADDED } from '../db/events.js'
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
  const members = state.members[groupId] || []
  if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
    return new Response(
      '<div class="error">A member with this name already exists</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
  const id = crypto.randomUUID()
  const event = createEvent(MEMBER_ADDED, { groupId, id, name })
  await addEvent(event)
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
