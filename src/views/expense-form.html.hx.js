export function renderExpenseForm(groupId, members) {
  let html = '<div class="expense-form">'
  html += '<h3>Add Expense</h3>'
  html += `<form hx-post="/api/groups/${escapeHtml(groupId)}/expenses" hx-target="#group-detail-area" hx-swap="outerHTML">`

  html += '<div class="form-field">'
  html += '<label for="description">Description</label>'
  html += '<input type="text" id="description" name="description" required>'
  html += '</div>'

  html += '<div class="form-field">'
  html += '<label for="total">Total (€)</label>'
  html += '<input type="number" id="total" name="total" step="0.01" min="0.01" required>'
  html += '</div>'

  html += '<div class="form-field">'
  html += '<label for="paidBy">Paid by</label>'
  html += '<select id="paidBy" name="paidBy" required>'
  html += '<option value="">Select payer</option>'
  for (const m of members) {
    html += `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`
  }
  html += '</select>'
  html += '</div>'

  html += '<fieldset class="form-field">'
  html += '<legend>Split strategy</legend>'
  html += '<label><input type="radio" name="splitStrategy" value="equal" checked onchange="toggleSplitStrategy(this.value)"> Equal</label>'
  html += '<label><input type="radio" name="splitStrategy" value="shares" onchange="toggleSplitStrategy(this.value)"> By Shares</label>'
  html += '<label><input type="radio" name="splitStrategy" value="custom" onchange="toggleSplitStrategy(this.value)"> Custom</label>'
  html += '</fieldset>'

  html += '<div id="split-details">'
  html += '<p>All members split equally.</p>'
  html += '</div>'

  html += '<div class="form-actions">'
  html += '<button type="submit" class="btn btn-primary">Add Expense</button>'
  html += `<button type="button" class="btn btn-secondary" hx-get="/api/groups/${escapeHtml(groupId)}" hx-target="#group-detail-area" hx-swap="outerHTML">Cancel</button>`
  html += '</div>'

  html += '</form>'

  html += '<script>'
  html += `
function toggleSplitStrategy(value) {
  const container = document.getElementById('split-details')
  const members = ${JSON.stringify(members.map(m => ({ id: m.id, name: m.name })))}
  let html = ''
  if (value === 'equal') {
    html = '<p>All members split equally.</p>'
  } else if (value === 'shares') {
    html = '<p>Enter share ratios:</p>'
    for (const m of members) {
      html += '<label>' + escapeHtml(m.name) + ' <input type=\"number\" name=\"shares_' + m.id + '\" value=\"1\" min=\"1\" step=\"1\"></label>'
    }
  } else if (value === 'custom') {
    html = '<p>Enter exact amounts:</p>'
    for (const m of members) {
      html += '<label>' + escapeHtml(m.name) + ' €<input type=\"number\" name=\"amount_' + m.id + '\" step=\"0.01\" min=\"0\"></label>'
    }
  }
  container.innerHTML = html
}
function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
`
  html += '</script>'

  html += '</div>'
  return html
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
