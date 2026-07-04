export const GROUP_CREATED = 'GROUP_CREATED'
export const MEMBER_ADDED = 'MEMBER_ADDED'
export const EXPENSE_ADDED = 'EXPENSE_ADDED'
export const PAYMENT_MADE = 'PAYMENT_MADE'

export function createEvent(type, data) {
  return { type, data }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function projectState(events) {
  const state = {
    groups: {},
    members: {},
    expenses: {},
    payments: {},
    balances: {},
  }

  for (const event of events) {
    switch (event.type) {
      case GROUP_CREATED: {
        const { id, name } = event.data
        state.groups[id] = { id, name, created: event.timestamp }
        state.members[id] = []
        state.expenses[id] = []
        state.payments[id] = []
        state.balances[id] = {}
        break
      }
      case MEMBER_ADDED: {
        const { groupId, id, name } = event.data
        if (state.members[groupId]) {
          state.members[groupId].push({ id, name })
        }
        if (state.balances[groupId] && !(id in state.balances[groupId])) {
          state.balances[groupId][id] = 0
        }
        break
      }
      case EXPENSE_ADDED: {
        const { groupId, id, description, total, paidBy, split } = event.data
        if (state.expenses[groupId]) {
          state.expenses[groupId].push({
            id,
            description,
            total,
            paidBy,
            split,
          })
        }
        if (state.balances[groupId]) {
          const bal = state.balances[groupId]
          if (bal[paidBy] !== undefined) {
            bal[paidBy] += total
          }
          for (const [userId, amount] of Object.entries(split)) {
            if (bal[userId] !== undefined) {
              bal[userId] -= amount
            }
          }
        }
        break
      }
      case PAYMENT_MADE: {
        const { groupId, id, from, to, amount } = event.data
        if (state.payments[groupId]) {
          state.payments[groupId].push({ id, from, to, amount })
        }
        if (state.balances[groupId]) {
          state.balances[groupId][from] += amount
          state.balances[groupId][to] -= amount
        }
        break
      }
    }
  }

  return deepClone(state)
}
