export function renderMemberForm(groupId) {
  let html = '<div class="member-form">'
  html += '<h3>Add Member</h3>'
  html += `<form hx-post="/api/groups/${escapeHtml(groupId)}/members" hx-target="#group-detail-area" hx-swap="outerHTML">`
  html += '<div class="form-field">'
  html += '<label for="member-name">Name</label>'
  html += '<input type="text" id="member-name" name="name" required>'
  html += '</div>'
  html += '<div class="form-actions">'
  html += '<button type="submit" class="btn btn-primary">Add</button>'
  html += `<button type="button" class="btn btn-secondary" hx-get="/api/groups/${escapeHtml(groupId)}" hx-target="#group-detail-area" hx-swap="outerHTML">Cancel</button>`
  html += '</div>'
  html += '</form>'
  html += '</div>'
  return html
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
