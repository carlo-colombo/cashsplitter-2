export function renderGroupDetail(group, members, expenses, balances) {
  let html = '<div id="group-detail-area">'
  html += '<div class="group-detail">'

  html += `<header class="group-header">`
  html += `<h2>${escapeHtml(group.name)}</h2>`
  html += `<p class="member-count">${members.length} member${members.length !== 1 ? 's' : ''}</p>`
  html += `<a href="#" class="back-link" hx-get="/api/groups" hx-target="#main-content" hx-push-url="true">&larr; Back</a>`
  html += `</header>`

  html += `<nav class="group-actions">`
  html += `<button class="btn btn-primary" hx-get="/api/groups/${escapeHtml(group.id)}/members/form" hx-target="#member-form-area" hx-swap="innerHTML">Add Member</button>`
  html += `<button class="btn btn-primary" hx-get="/api/groups/${escapeHtml(group.id)}/expenses/form" hx-target="#expense-form-area" hx-swap="innerHTML">Add Expense</button>`
  html += `<button class="btn btn-secondary" hx-get="/api/groups/${escapeHtml(group.id)}/balances" hx-target="#balances-container" hx-swap="innerHTML">Balances</button>`
  html += `</nav>`

  html += '<div id="member-form-area"></div>'
  html += '<div id="expense-form-area"></div>'

  html += '<section class="members-section">'
  html += '<h3>Members</h3>'
  if (members.length === 0) {
    html += '<p class="empty">No members yet.</p>'
  } else {
    html += '<ul class="member-list">'
    for (const m of members) {
      html += `<li>${escapeHtml(m.name)}</li>`
    }
    html += '</ul>'
  }
  html += '</section>'

  html += '<section class="expenses-section">'
  html += '<h3>Expenses</h3>'
  if (expenses.length === 0) {
    html += '<p class="empty">No expenses yet.</p>'
  } else {
    html += '<ul class="expense-list">'
    for (const e of expenses) {
      const payer = members.find((m) => m.id === e.paidBy)
      const payerName = payer ? payer.name : e.paidBy
      html += `<li><strong>${escapeHtml(e.description)}</strong> — €${e.total.toFixed(2)} paid by ${escapeHtml(payerName)}</li>`
    }
    html += '</ul>'
  }
  html += '</section>'

  html += '<section class="balances-section">'
  html += '<h3>Balance Snapshot</h3>'
  const hasBalances = Object.values(balances).some((b) => Math.abs(b) > 0.01)
  if (!hasBalances) {
    html += '<p class="settled">All settled up!</p>'
  } else {
    html += '<ul class="balance-list">'
    for (const [userId, net] of Object.entries(balances)) {
      const member = members.find((m) => m.id === userId)
      const name = member ? member.name : userId
      const cls = net >= 0 ? 'positive' : 'negative'
      const label = net >= 0 ? 'is owed' : 'owes'
      html += `<li class="${cls}">${escapeHtml(name)} ${label} €${Math.abs(net).toFixed(2)}</li>`
    }
    html += '</ul>'
  }
  html += '</section>'

  html += '<div id="balances-container"></div>'

  html += '</div>'
  html += '</div>'
  return html
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
