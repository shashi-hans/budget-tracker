export const EXPENSE_CATEGORIES = [
  'Food',
  'Rent',
  'Bills',
  'Transport',
  'Shopping',
  'Health',
  'Education',
  'Entertainment',
  'Other',
]

export const INCOME_CATEGORIES = ['Salary', 'Business', 'Interest', 'Gift', 'Refund', 'Other']

const PALETTE = [
  '#2563eb', '#e11d48', '#059669', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#64748b', '#ea580c',
]

export const colorFor = (category) => {
  const i = EXPENSE_CATEGORIES.indexOf(category)
  if (i >= 0) return PALETTE[i % PALETTE.length]
  let h = 0
  for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}
