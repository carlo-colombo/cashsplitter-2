export function splitEqual(totalCents, participants) {
  const count = participants.length
  if (count === 0) return {}

  const raw = Math.floor(totalCents / count)
  const remainder = totalCents % count

  const result = {}
  participants.forEach((p, i) => {
    result[p] = i < remainder ? raw + 1 : raw
  })
  return result
}

export function splitByShares(totalCents, shares) {
  const userIds = Object.keys(shares)
  const totalShares = userIds.reduce((sum, id) => sum + shares[id], 0)
  if (totalShares === 0) return {}

  let assigned = 0
  const result = {}
  userIds.forEach((id, i) => {
    const amount = i === userIds.length - 1
      ? totalCents - assigned
      : Math.floor((shares[id] / totalShares) * totalCents)
    result[id] = amount
    assigned += amount
  })

  return result
}

export function splitCustom(amounts) {
  const entries = Object.entries(amounts)
  if (entries.length === 0) return {}

  const result = {}
  entries.forEach(([userId, amount]) => {
    result[userId] = amount
  })
  return result
}

export function validateCustomTotal(amounts, expectedTotalCents) {
  const sum = Object.values(amounts).reduce((s, v) => s + Math.round(Number(v)), 0)
  return sum === expectedTotalCents
}
