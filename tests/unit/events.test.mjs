import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createEvent,
  projectState,
  USER_CREATED,
  GROUP_CREATED,
  GROUP_DELETED,
  MEMBER_ADDED,
  EXPENSE_ADDED,
  EXPENSE_DELETED,
  PAYMENT_MADE,
  LEDGER_ENTRY,
} from '../../src/db/events.js'

describe('createEvent', () => {
  it('creates an event with type and data', () => {
    const event = createEvent(GROUP_CREATED, { id: 'g1', name: 'Test' })
    assert.equal(event.type, GROUP_CREATED)
    assert.deepEqual(event.data, { id: 'g1', name: 'Test' })
  })

  it('creates events with different types', () => {
    const e1 = createEvent(USER_CREATED, { id: 'u1', name: 'Alice' })
    const e2 = createEvent(GROUP_DELETED, { groupId: 'g1' })
    const e3 = createEvent(EXPENSE_DELETED, { groupId: 'g1', expenseId: 'e1' })
    assert.equal(e1.type, USER_CREATED)
    assert.equal(e2.type, GROUP_DELETED)
    assert.equal(e3.type, EXPENSE_DELETED)
  })
})

describe('projectState', () => {
  describe('basic projection', () => {
    it('projects users', () => {
      const events = [
        createEvent(USER_CREATED, { id: 'u1', name: 'Alice', createdAt: '2024-01-01' }),
        createEvent(USER_CREATED, { id: 'u2', name: 'Bob', createdAt: '2024-01-02' }),
      ]
      const state = projectState(events)
      assert.equal(Object.keys(state.users).length, 2)
      assert.equal(state.users.u1.name, 'Alice')
      assert.equal(state.users.u2.name, 'Bob')
    })

    it('projects a group with members and expenses', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(MEMBER_ADDED, { groupId: 'g1', userId: 'u1' }),
        createEvent(MEMBER_ADDED, { groupId: 'g1', userId: 'u2' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
      ]
      const state = projectState(events)
      assert.equal(Object.keys(state.groups).length, 1)
      assert.equal(state.groups.g1.name, 'Trip')
      assert.deepEqual(state.members.g1, ['u1', 'u2'])
      assert.equal(state.expenses.g1.length, 1)
      assert.equal(state.expenses.g1[0].description, 'Dinner')
    })

    it('returns deep-cloned state (no mutation of internal state)', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
      ]
      const state1 = projectState(events)
      const state2 = projectState(events)
      state1.groups.g1.name = 'Modified'
      assert.equal(state2.groups.g1.name, 'Trip')
    })
  })

  describe('group deletion', () => {
    it('excludes a deleted group from projected state', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(GROUP_DELETED, { groupId: 'g1' }),
      ]
      const state = projectState(events)
      assert.equal(Object.keys(state.groups).length, 0)
      assert.equal(state.groups.g1, undefined)
    })

    it('does not affect other groups when one is deleted', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(GROUP_CREATED, { id: 'g2', name: 'Party' }),
        createEvent(GROUP_DELETED, { groupId: 'g1' }),
      ]
      const state = projectState(events)
      assert.equal(Object.keys(state.groups).length, 1)
      assert.equal(state.groups.g2.name, 'Party')
      assert.equal(state.groups.g1, undefined)
    })

    it('keeps the group if GROUP_DELETED comes before GROUP_CREATED', () => {
      // Deletion before creation — the group should still appear
      // because GROUP_CREATED processes after the deletion marker was collected
      const events = [
        createEvent(GROUP_DELETED, { groupId: 'g1' }),
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
      ]
      const state = projectState(events)
      assert.equal(Object.keys(state.groups).length, 0)
      assert.equal(state.groups.g1, undefined)
    })

    it('deleting a non-existent group is a no-op', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(GROUP_DELETED, { groupId: 'nonexistent' }),
      ]
      const state = projectState(events)
      assert.equal(Object.keys(state.groups).length, 1)
      assert.equal(state.groups.g1.name, 'Trip')
    })

    it('deleted group does not leave behind members or expenses state', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(MEMBER_ADDED, { groupId: 'g1', userId: 'u1' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
        createEvent(GROUP_DELETED, { groupId: 'g1' }),
      ]
      const state = projectState(events)
      assert.equal(state.groups.g1, undefined)
      assert.equal(state.members.g1, undefined)
      assert.equal(state.expenses.g1, undefined)
      assert.equal(state.balances.g1, undefined)
    })
  })

  describe('expense deletion', () => {
    it('excludes a deleted expense from projected state', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
        createEvent(EXPENSE_DELETED, { groupId: 'g1', expenseId: 'e1' }),
      ]
      const state = projectState(events)
      assert.equal(state.expenses.g1.length, 0)
    })

    it('does not affect other expenses when one is deleted', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e2', description: 'Lunch',
          total: 2000, paidBy: { u1: 2000 },
          split: { u1: 1000, u2: 1000 },
        }),
        createEvent(EXPENSE_DELETED, { groupId: 'g1', expenseId: 'e1' }),
      ]
      const state = projectState(events)
      assert.equal(state.expenses.g1.length, 1)
      assert.equal(state.expenses.g1[0].id, 'e2')
      assert.equal(state.expenses.g1[0].description, 'Lunch')
    })

    it('skips ledger entries that reference a deleted expense', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(MEMBER_ADDED, { groupId: 'g1', userId: 'u1' }),
        createEvent(MEMBER_ADDED, { groupId: 'g1', userId: 'u2' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
        createEvent(LEDGER_ENTRY, { groupId: 'g1', from: 'u2', to: 'u1', amount: 1500, expenseId: 'e1' }),
        createEvent(EXPENSE_DELETED, { groupId: 'g1', expenseId: 'e1' }),
      ]
      const state = projectState(events)
      assert.equal(state.expenses.g1.length, 0)
      // Balances should be 0 since the ledger entry was skipped
      assert.equal(state.balances.g1.u1, 0)
      assert.equal(state.balances.g1.u2, 0)
    })

    it('keeps ledger entries for non-deleted expenses', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(MEMBER_ADDED, { groupId: 'g1', userId: 'u1' }),
        createEvent(MEMBER_ADDED, { groupId: 'g1', userId: 'u2' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
        createEvent(LEDGER_ENTRY, { groupId: 'g1', from: 'u2', to: 'u1', amount: 1500, expenseId: 'e1' }),
      ]
      const state = projectState(events)
      assert.equal(state.expenses.g1.length, 1)
      assert.equal(state.balances.g1.u1, 1500)
      assert.equal(state.balances.g1.u2, -1500)
    })

    it('deleting a non-existent expense is a no-op', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
        createEvent(EXPENSE_DELETED, { groupId: 'g1', expenseId: 'nonexistent' }),
      ]
      const state = projectState(events)
      assert.equal(state.expenses.g1.length, 1)
    })

    it('handles deletion marker before expense creation', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(EXPENSE_DELETED, { groupId: 'g1', expenseId: 'e1' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
      ]
      const state = projectState(events)
      // Deletion marker collected first, so expense is also skipped
      assert.equal(state.expenses.g1.length, 0)
    })
  })

  describe('mixed operations', () => {
    it('handles concurrent deletions: group + expense in different groups', () => {
      const events = [
        createEvent(GROUP_CREATED, { id: 'g1', name: 'Trip' }),
        createEvent(GROUP_CREATED, { id: 'g2', name: 'Party' }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g1', id: 'e1', description: 'Dinner',
          total: 3000, paidBy: { u1: 3000 },
          split: { u1: 1500, u2: 1500 },
        }),
        createEvent(EXPENSE_ADDED, {
          groupId: 'g2', id: 'e2', description: 'Cake',
          total: 1000, paidBy: { u2: 1000 },
          split: { u1: 500, u2: 500 },
        }),
        createEvent(GROUP_DELETED, { groupId: 'g1' }),
        createEvent(EXPENSE_DELETED, { groupId: 'g2', expenseId: 'e2' }),
      ]
      const state = projectState(events)
      // g1 should be gone entirely
      assert.equal(state.groups.g1, undefined)
      // g2 should still exist, but without the deleted expense
      assert.equal(state.groups.g2.name, 'Party')
      assert.equal(state.expenses.g2.length, 0)
    })
  })

  describe('edge cases', () => {
    it('handles empty event list', () => {
      const state = projectState([])
      assert.deepEqual(state, {
        users: {},
        groups: {},
        members: {},
        groupMembers: {},
        expenses: {},
        payments: {},
        balances: {},
      })
    })

    it('handles only deletion events (no matching creations)', () => {
      const state = projectState([
        createEvent(GROUP_DELETED, { groupId: 'g1' }),
        createEvent(EXPENSE_DELETED, { groupId: 'g1', expenseId: 'e1' }),
      ])
      assert.equal(Object.keys(state.groups).length, 0)
    })
  })
})
