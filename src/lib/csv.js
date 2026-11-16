const HEADER = ['date', 'type', 'category', 'description', 'amount']

// A leading quote stops spreadsheet apps from running cell text as a formula
// (OWASP "CSV injection").
const FORMULA_START = /^[=+\-@\t\r]/

const escapeCell = (value) => {
  let s = String(value)
  if (FORMULA_START.test(s)) s = `'${s}`
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export const toCSV = (transactions) => {
  const rows = transactions.map((t) => [
    t.date,
    t.amount < 0 ? 'expense' : 'income',
    t.category,
    t.text,
    Math.abs(t.amount).toFixed(2),
  ])
  return [HEADER, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n')
}

// RFC 4180 parser: handles quoted cells, escaped quotes and newlines inside quotes.
export const parseCSV = (text) => {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

const unescapeFormula = (s) => (s.startsWith("'") && FORMULA_START.test(s.slice(1)) ? s.slice(1) : s)

// Returns raw transaction objects; the store validates each one.
export const fromCSV = (text) => {
  const rows = parseCSV(text.replace(/^﻿/, ''))
  if (rows.length === 0) throw new Error('The file is empty.')
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = Object.fromEntries(HEADER.map((h) => [h, header.indexOf(h)]))
  const missing = HEADER.filter((h) => col[h] < 0)
  if (missing.length) throw new Error(`Missing column(s): ${missing.join(', ')}.`)

  return rows.slice(1).map((r) => {
    const amount = Math.abs(Number(String(r[col.amount] ?? '').replace(/[,\s₹]/g, '')))
    const isExpense = String(r[col.type] ?? '').trim().toLowerCase() === 'expense'
    return {
      date: String(r[col.date] ?? '').trim(),
      category: unescapeFormula(String(r[col.category] ?? '').trim()),
      text: unescapeFormula(String(r[col.description] ?? '').trim()),
      amount: isExpense ? -amount : amount,
    }
  })
}

export const downloadCSV = (filename, csv) => {
  // The BOM makes Excel read the file as UTF-8 (needed for ₹ and non-ASCII text).
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
