import { getAllEvents } from '../db/store.js'
import { projectState } from '../db/events.js'
import { renderBalances, renderSettlements } from '../views/settlements.html.hx.js'

function computeSettlements(balances) {
  const creditors = []
  const debtors = []

  for (const [userId, net] of Object.entries(balances)) {
    const rounded = Math.round(net * 100) / 100
    if (rounded > 0.01) creditors.push({ userId, amount: rounded })
    else if (rounded < -0.01) debtors.push({ userId, amount: -rounded })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount)
    const rounded = Math.round(amount * 100) / 100
    if (rounded > 0) {
      settlements.push({
        from: debtors[di].userId,
        to: creditors[ci].userId,
        amount: rounded,
      })
    }
    creditors[ci].amount = Math.round((creditors[ci].amount - amount) * 100) / 100
    debtors[di].amount = Math.round((debtors[di].amount - amount) * 100) / 100
    if (creditors[ci].amount < 0.01) ci++
    if (debtors[di].amount < 0.01) di++
  }

  return settlements
}

export async function get(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)

  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const balances = state.balances[groupId] || {}
  const members = (state.members[groupId] || []).map((m) => ({ ...m, groupId }))

  const html = renderBalances(balances, members)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function settlements(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)

  if (!state.groups[groupId]) {
    return new Response('<div class="error">Group not found</div>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const balances = state.balances[groupId] || {}
  const members = (state.members[groupId] || []).map((m) => ({ ...m, groupId }))

  const settlementsList = computeSettlements(balances)
  const html = renderSettlements(settlementsList, members)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
