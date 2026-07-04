function roundTo2(n) {
  return Math.round(n * 100) / 100
}

export function splitEqual(total, participants) {
  const count = participants.length
  if (count === 0) return {}

  const raw = total / count
  const rounded = participants.map(() => Math.floor(raw * 100) / 100)
  const sumRounded = rounded.reduce((a, b) => a + b, 0)
  const remainder = roundTo2(total - sumRounded)
  const remainderCents = Math.round(remainder * 100)

  for (let i = 0; i < remainderCents; i++) {
    rounded[i] = roundTo2(rounded[i] + 0.01)
  }

  const result = {}
  participants.forEach((p, i) => {
    result[p] = rounded[i]
  })
  return result
}

export function splitByShares(total, shares) {
  const userIds = Object.keys(shares)
  const totalShares = userIds.reduce((sum, id) => sum + shares[id], 0)
  if (totalShares === 0) return {}

  const rawAmounts = {}
  userIds.forEach((id) => {
    rawAmounts[id] = (shares[id] / totalShares) * total
  })

  const rounded = {}
  userIds.forEach((id) => {
    rounded[id] = Math.floor(rawAmounts[id] * 100) / 100
  })

  const sumRounded = userIds.reduce((sum, id) => sum + rounded[id], 0)
  const remainder = roundTo2(total - sumRounded)
  const remainderCents = Math.round(remainder * 100)

  for (let i = 0; i < remainderCents; i++) {
    rounded[userIds[i]] = roundTo2(rounded[userIds[i]] + 0.01)
  }

  return rounded
}

export function splitCustom(amounts) {
  const entries = Object.entries(amounts)
  if (entries.length === 0) return {}

  const result = {}
  entries.forEach(([userId, amount]) => {
    result[userId] = roundTo2(Number(amount))
  })
  return result
}

export function validateCustomTotal(amounts, expectedTotal) {
  const sum = Object.values(amounts).reduce((s, v) => s + Number(v), 0)
  return Math.abs(sum - expectedTotal) < 0.01
}
