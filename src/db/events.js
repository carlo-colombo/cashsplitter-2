export const USER_CREATED = 'USER_CREATED'
export const GROUP_CREATED = 'GROUP_CREATED'
export const MEMBER_ADDED = 'MEMBER_ADDED'
export const EXPENSE_ADDED = 'EXPENSE_ADDED'
export const PAYMENT_MADE = 'PAYMENT_MADE'
export const LEDGER_ENTRY = 'LEDGER_ENTRY'

export function createEvent(type, data) {
  return { type, data }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function projectState(events) {
  const state = {
    users: {},
    groups: {},
    members: {},
    groupMembers: {},
    expenses: {},
    payments: {},
    balances: {},
  }

  for (const event of events) {
    switch (event.type) {
      case USER_CREATED: {
        const { id, name, createdAt } = event.data
        state.users[id] = { id, name, createdAt }
        break
      }
      case GROUP_CREATED: {
        const { id, name } = event.data
        state.groups[id] = { id, name, created: event.timestamp }
        state.members[id] = []
        state.groupMembers[id] = []
        state.expenses[id] = []
        state.payments[id] = []
        state.balances[id] = {}
        break
      }
      case MEMBER_ADDED: {
        const { groupId, userId, addedAt } = event.data
        if (state.members[groupId]) {
          state.members[groupId].push(userId)
        }
        if (state.groupMembers[groupId]) {
          const user = state.users[userId] || { name: userId }
          state.groupMembers[groupId].push({ userId, userName: user.name, addedAt })
        }
        if (state.balances[groupId] && !(userId in state.balances[groupId])) {
          state.balances[groupId][userId] = 0
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
        break
      }
      case PAYMENT_MADE: {
        const { groupId, id, from, to, amount } = event.data
        if (state.payments[groupId]) {
          state.payments[groupId].push({ id, from, to, amount })
        }
        break
      }
      case LEDGER_ENTRY: {
        const { groupId, from, to, amount } = event.data
        if (state.balances[groupId]) {
          state.balances[groupId][from] = (state.balances[groupId][from] || 0) - amount
          state.balances[groupId][to] = (state.balances[groupId][to] || 0) + amount
        }
        break
      }
    }
  }

  return deepClone(state)
}
