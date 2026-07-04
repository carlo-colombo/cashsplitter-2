import * as groups from './groups.js'
import * as members from './members.js'
import * as expenses from './expenses.js'
import * as balances from './balances.js'

const routes = [
  { method: 'GET', pattern: new URLPattern({ pathname: '/api/groups' }), handler: groups.list },
  { method: 'POST', pattern: new URLPattern({ pathname: '/api/groups' }), handler: groups.create },
  { method: 'GET', pattern: new URLPattern({ pathname: '/api/groups/:id' }), handler: groups.detail },
  { method: 'GET', pattern: new URLPattern({ pathname: '/api/groups/:id/members/form' }), handler: members.form },
  { method: 'POST', pattern: new URLPattern({ pathname: '/api/groups/:id/members' }), handler: members.add },
  { method: 'GET', pattern: new URLPattern({ pathname: '/api/groups/:id/expenses/form' }), handler: expenses.form },
  { method: 'POST', pattern: new URLPattern({ pathname: '/api/groups/:id/expenses' }), handler: expenses.add },
  { method: 'GET', pattern: new URLPattern({ pathname: '/api/groups/:id/balances' }), handler: balances.get },
  { method: 'GET', pattern: new URLPattern({ pathname: '/api/groups/:id/settlements' }), handler: balances.settlements },
]

export async function handleRequest(request) {
  const url = new URL(request.url)

  for (const route of routes) {
    if (route.method !== request.method) continue

    const match = route.pattern.exec(url)
    if (match) {
      const params = match.pathname.groups
      try {
        return await route.handler(params, request)
      } catch (err) {
        return new Response(`<div class="error">Internal error: ${err.message}</div>`, {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
    }
  }

  return new Response('<div class="error">Not Found</div>', {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
