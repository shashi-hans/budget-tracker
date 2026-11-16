const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export const formatINR = (n) => inr.format(n)

// Sums in integer paise so totals do not drift from floating-point error.
export const toPaise = (n) => Math.round(n * 100)
export const sumAmounts = (list) => list.reduce((acc, t) => acc + toPaise(t.amount), 0) / 100

export const localISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const todayISO = () => localISO(new Date())

export const isValidISODate = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export const monthKey = (iso) => iso.slice(0, 7)

const keyToDate = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export const monthLabel = (key) =>
  keyToDate(key).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

export const shortMonthLabel = (key) =>
  keyToDate(key).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

// Returns `count` month keys ending at `endKey`, oldest first.
export const lastMonths = (endKey, count) => {
  const end = keyToDate(endKey)
  return Array.from({ length: count }, (_, i) =>
    localISO(new Date(end.getFullYear(), end.getMonth() - (count - 1 - i), 1)).slice(0, 7)
  )
}

export const formatDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
