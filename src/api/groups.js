import { addEvent, getAllEvents } from '../db/store.js'
import { projectState, createEvent, GROUP_CREATED } from '../db/events.js'
import { renderGroupsList } from '../views/groups-list.html.hx.js'
import { renderGroupDetail } from '../views/group-detail.html.hx.js'

export async function list(_params, _request) {
  const events = await getAllEvents()
  const state = projectState(events)
  const html = renderGroupsList(state.groups)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function create(_params, request) {
  const form = await request.formData()
  const name = form.get('name')?.trim()

  if (!name) {
    return new Response(
      '<div class="error">Group name is required</div>',
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const id = crypto.randomUUID()
  const event = createEvent(GROUP_CREATED, { id, name })
  await addEvent(event)

  const allEvents = await getAllEvents()
  const state = projectState(allEvents)
  const group = state.groups[id]
  const html = renderGroupDetail(group, [], [], {})

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'HX-Push-Url': `/#/groups/${id}`,
    },
  })
}

export async function detail(params, _request) {
  const groupId = params.id
  const events = await getAllEvents()
  const state = projectState(events)

  const group = state.groups[groupId]
  if (!group) {
    return new Response('<div class="error">Group not found</div>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const members = state.members[groupId] || []
  const expenses = state.expenses[groupId] || []
  const balances = state.balances[groupId] || {}

  const html = renderGroupDetail(group, members, expenses, balances)
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
