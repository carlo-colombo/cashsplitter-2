export function renderBalances(balances, members) {
  let html = '<div class="balances-section">'
  html += '<h3>Balances</h3>'

  const hasBalances = Object.values(balances).some((b) => Math.abs(b) >= 1)

  if (!hasBalances) {
    html += '<p class="settled">All settled up!</p>'
  } else {
    html += '<table class="balances-table"><thead><tr><th>Member</th><th>Balance</th></tr></thead><tbody>'
    for (const [userId, net] of Object.entries(balances)) {
      const member = members.find((m) => m.id === userId)
      const name = member ? member.name : userId
      const cls = net >= 0 ? 'positive' : 'negative'
      const label = net >= 0 ? 'is owed' : 'owes'
      html += `<tr><td>${escapeHtml(name)}</td><td class="${cls}">${label} €${(Math.abs(net) / 100).toFixed(2)}</td></tr>`
    }
    html += '</tbody></table>'
  }

  const groupId = members.length > 0 ? members[0].groupId || '' : ''
  html += `<button class="btn btn-secondary" hx-get="/api/groups/${escapeHtml(groupId)}/settlements" hx-target="#balances-container" hx-swap="innerHTML">View Settlements</button>`
  html += '</div>'
  return html
}

export function renderSettlements(settlements, members) {
  let html = '<div class="settlements-section">'
  html += '<h3>Settlements</h3>'

  if (settlements.length === 0) {
    html += '<p class="settled">All settled up!</p>'
  } else {
    html += '<ol class="settlements-list">'
    for (const s of settlements) {
      const fromName = members.find((m) => m.id === s.from)?.name || s.from
      const toName = members.find((m) => m.id === s.to)?.name || s.to
      html += `<li>${escapeHtml(fromName)} pays ${escapeHtml(toName)} €${(s.amount / 100).toFixed(2)}</li>`
    }
    html += '</ol>'
  }

  const groupId = members.length > 0 ? members[0].groupId || '' : ''
  html += `<button class="btn btn-secondary" hx-get="/api/groups/${escapeHtml(groupId)}/balances" hx-target="#balances-container" hx-swap="innerHTML">View Raw Balances</button>`
  html += '</div>'
  return html
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
