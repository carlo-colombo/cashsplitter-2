export function renderGroupsList(groups) {
  const groupIds = Object.keys(groups)

  let html = '<div class="groups-page">'

  html += '<div class="create-group-form">'
  html += '<h2>Create Group</h2>'
  html += '<form hx-post="/api/groups" hx-target="#main-content" hx-swap="innerHTML">'
  html += '<input type="text" name="name" placeholder="Group name" required minlength="1">'
  html += '<button type="submit" class="btn btn-primary">Create</button>'
  html += '</form>'
  html += '</div>'

  if (groupIds.length === 0) {
    html += '<div class="empty-state">'
    html += '<p>No groups yet. Create your first group!</p>'
    html += '</div>'
  } else {
    html += '<div class="groups-list">'
    for (const id of groupIds) {
      const g = groups[id]
      html += `<div class="group-card">`
      html += `<h3><a href="#/groups/${escapeHtml(id)}" hx-get="/api/groups/${escapeHtml(id)}" hx-target="#main-content" hx-push-url="/#/groups/${escapeHtml(id)}">${escapeHtml(g.name)}</a></h3>`
      html += '</div>'
    }
    html += '</div>'
  }

  html += '</div>'
  return html
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
