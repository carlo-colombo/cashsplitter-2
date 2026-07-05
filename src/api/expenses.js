import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, EXPENSE_ADDED } from '../db/events.js'
import { splitEqual, splitByShares, splitCustom, validateCustomTotal } from '../lib/split.js'
import { render } from '../lib/template.js'
import { BASE_PATH } from '../lib/config.js'

function lookupName(members, userId) {
  const m = members.find(m => m.id === userId)
  return m ? m.name : userId
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
      payerName: lookupName(members, e.paidBy)
    })),
    hasBalances: Object.values(balances).some(b => Math.abs(b) >= 1),
    balanceItems,
    basePath: BASE_PATH
  }
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
  const paidBy = form.get('paidBy')
  const strategy = form.get('splitStrategy')
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
  if (!paidBy) {
    return new Response(
      '<div class="error">Payer is required</div>',
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
  const id = crypto.randomUUID()
  const event = createEvent(EXPENSE_ADDED, {
    groupId, id, description, total: totalCents, paidBy, split, strategy,
  })
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
