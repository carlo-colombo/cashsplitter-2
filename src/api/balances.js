import { getAllEvents } from '../db/store.js'
import { projectState } from '../db/events.js'
import { render } from '../lib/template.js'
import { BASE_PATH } from '../lib/config.js'

function lookupName(users, userId) {
  const u = users[userId]
  return u ? u.name : userId
}

function computeSettlements(balances) {
  const creditors = []
  const debtors = []
  for (const [userId, net] of Object.entries(balances)) {
    if (net > 0) creditors.push({ userId, amount: net })
    else if (net < 0) debtors.push({ userId, amount: -net })
  }
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)
  const settlements = []
  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount)
    if (amount > 0) {
      settlements.push({ from: debtors[di].userId, to: creditors[ci].userId, amount })
    }
    creditors[ci].amount -= amount
    debtors[di].amount -= amount
    if (creditors[ci].amount <= 0) ci++
    if (debtors[di].amount <= 0) di++
  }
  return settlements
}

export async function get(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
  const balances = state.balances[groupId] || {}
  const hasBalances = Object.values(balances).some(b => Math.abs(b) >= 1)
  const data = {
    isBalances: true,
    isSettlements: false,
    hasBalances,
    balanceItems: Object.entries(balances).map(([userId, net]) => ({
      name: lookupName(state.users, userId),
      amount: (Math.abs(net) / 100).toFixed(2),
      cls: net >= 0 ? 'positive' : 'negative',
      label: net >= 0 ? 'is owed' : 'owes'
    })),
    hasSettlements: false,
    settlementItems: [],
    groupId,
    basePath: BASE_PATH
  }
  const html = render('settlements', data)
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function settlements(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)
  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
  const balances = state.balances[groupId] || {}
  const settlementsList = computeSettlements(balances)
  const data = {
    isBalances: false,
    isSettlements: true,
    hasBalances: false,
    balanceItems: [],
    hasSettlements: settlementsList.length > 0,
    settlementItems: settlementsList.map(s => ({
      fromName: lookupName(state.users, s.from),
      toName: lookupName(state.users, s.to),
      amount: (s.amount / 100).toFixed(2)
    })),
    groupId,
    basePath: BASE_PATH
  }
  const html = render('settlements', data)
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
