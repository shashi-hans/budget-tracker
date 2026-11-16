import { ref, watch } from 'vue'
import { isValidISODate, localISO } from './format'

const TX_KEY = 'transactions'
const BUDGET_KEY = 'budgets'
const MAX_TEXT = 100
const MAX_CATEGORY = 40
const MAX_AMOUNT = 1e10

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) ?? fallback : fallback
  } catch {
    return fallback
  }
}

// Returns a clean transaction, or null when the input is not usable.
// Entries saved before dates existed get their date from the numeric id,
// which was a Date.now() timestamp.
export const normalize = (t) => {
  if (!t || typeof t !== 'object') return null
  const amount = Number(t.amount)
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > MAX_AMOUNT) return null
  const text = String(t.text ?? '').trim().slice(0, MAX_TEXT)
  if (!text) return null

  let date = t.date
  if (!isValidISODate(date)) {
    if (t.date !== undefined) return null
    const ts = Number(t.id)
    date = localISO(Number.isFinite(ts) && ts > 0 ? new Date(ts) : new Date())
  }

  return {
    id: t.id != null ? String(t.id) : newId(),
    date,
    text,
    category: String(t.category || 'Other').trim().slice(0, MAX_CATEGORY) || 'Other',
    amount: Math.round(amount * 100) / 100,
  }
}

const loadTransactions = () => {
  const raw = load(TX_KEY, [])
  return Array.isArray(raw) ? raw.map(normalize).filter(Boolean) : []
}

const loadBudgets = () => {
  const raw = load(BUDGET_KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => Number.isFinite(v) && v > 0)
  )
}

const transactions = ref(loadTransactions())
const budgets = ref(loadBudgets())
const storageError = ref('')

const persist = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    storageError.value = ''
  } catch {
    storageError.value =
      'Could not save to browser storage. Export a CSV backup before closing this tab.'
  }
}

watch(transactions, (v) => persist(TX_KEY, v), { deep: true, immediate: true })
watch(budgets, (v) => persist(BUDGET_KEY, v), { deep: true })

const dupKey = (t) => `${t.date}|${t.text.toLowerCase()}|${t.category}|${t.amount}`

export function useStore() {
  const addTransaction = (data) => {
    const t = normalize({ ...data, id: newId() })
    if (t) transactions.value.push(t)
    return Boolean(t)
  }

  const updateTransaction = (id, data) => {
    const i = transactions.value.findIndex((t) => t.id === id)
    if (i < 0) return false
    const t = normalize({ ...data, id })
    if (t) transactions.value[i] = t
    return Boolean(t)
  }

  const deleteTransaction = (id) => {
    transactions.value = transactions.value.filter((t) => t.id !== id)
  }

  // Merges rows into the store, skipping invalid rows and exact duplicates.
  const importTransactions = (rows) => {
    const seen = new Set(transactions.value.map(dupKey))
    let added = 0
    let invalid = 0
    let duplicate = 0
    const fresh = []
    for (const row of rows) {
      const t = normalize({ ...row, id: newId() })
      if (!t) {
        invalid++
        continue
      }
      const k = dupKey(t)
      if (seen.has(k)) {
        duplicate++
        continue
      }
      seen.add(k)
      fresh.push(t)
      added++
    }
    transactions.value.push(...fresh)
    return { added, invalid, duplicate }
  }

  const setBudget = (category, amount) => {
    const n = Number(amount)
    const next = { ...budgets.value }
    if (Number.isFinite(n) && n > 0) next[category] = Math.round(n * 100) / 100
    else delete next[category]
    budgets.value = next
  }

  return {
    transactions,
    budgets,
    storageError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    setBudget,
  }
}
