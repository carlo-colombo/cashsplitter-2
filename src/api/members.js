import { addEvent, getEventsByGroup, getAllEvents } from '../db/store.js'
import { projectState, createEvent, MEMBER_ADDED } from '../db/events.js'

export async function form(params, _request) {
  const groupId = params.id
  const { renderMemberForm } = await import('../views/member-form.html.hx.js')
  const html = renderMemberForm(groupId)
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

  const { renderGroupDetail } = await import('../views/group-detail.html.hx.js')
  const html = renderGroupDetail(
    updatedState.groups[groupId],
    updatedState.members[groupId] || [],
    updatedState.expenses[groupId] || [],
    updatedState.balances[groupId] || {}
  )
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    status: 200,
  })
}
