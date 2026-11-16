<script setup>
import { ref, computed } from 'vue'
import { Wallet, ArrowUpCircle, ArrowDownCircle, Download, Upload, AlertTriangle } from 'lucide-vue-next'
import { useStore } from './lib/store'
import { formatINR, monthKey, monthLabel, sumAmounts, todayISO } from './lib/format'
import { toCSV, fromCSV, downloadCSV } from './lib/csv'
import TransactionForm from './components/TransactionForm.vue'
import TransactionList from './components/TransactionList.vue'
import CategoryChart from './components/CategoryChart.vue'
import BudgetPanel from './components/BudgetPanel.vue'
import TrendChart from './components/TrendChart.vue'

const {
  transactions,
  budgets,
  storageError,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactions,
  setBudget,
} = useStore()

const currentMonth = monthKey(todayISO())
// Empty string means "all time".
const selectedMonth = ref(currentMonth)
const editing = ref(null)
const notice = ref({ kind: '', text: '' })
const fileInput = ref(null)

const monthOptions = computed(() => {
  const keys = new Set(transactions.value.map((t) => monthKey(t.date)))
  keys.add(currentMonth)
  return [...keys].sort().reverse()
})

const periodLabel = computed(() => (selectedMonth.value ? monthLabel(selectedMonth.value) : 'all time'))

const periodTx = computed(() =>
  selectedMonth.value
    ? transactions.value.filter((t) => monthKey(t.date) === selectedMonth.value)
    : transactions.value
)

const income = computed(() => sumAmounts(periodTx.value.filter((t) => t.amount > 0)))
const expenses = computed(() => -sumAmounts(periodTx.value.filter((t) => t.amount < 0)))
const net = computed(() => sumAmounts(periodTx.value))
const balance = computed(() => sumAmounts(transactions.value))

const showNotice = (kind, text) => {
  notice.value = { kind, text }
  setTimeout(() => {
    if (notice.value.text === text) notice.value = { kind: '', text: '' }
  }, 6000)
}

const onSave = (data) => {
  if (editing.value) {
    updateTransaction(editing.value.id, data)
    editing.value = null
  } else {
    addTransaction(data)
  }
  const m = monthKey(data.date)
  if (selectedMonth.value && selectedMonth.value !== m) {
    showNotice('info', `Saved to ${monthLabel(m)}.`)
  }
}

const onDelete = (id) => {
  if (editing.value?.id === id) editing.value = null
  deleteTransaction(id)
}

const exportCSV = () => {
  const list = [...periodTx.value].sort((a, b) => a.date.localeCompare(b.date))
  if (!list.length) return showNotice('error', 'Nothing to export for this period.')
  const suffix = selectedMonth.value || `all-${todayISO()}`
  downloadCSV(`budget-${suffix}.csv`, toCSV(list))
}

const MAX_IMPORT_BYTES = 5 * 1024 * 1024

const importCSV = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (file.size > MAX_IMPORT_BYTES) return showNotice('error', 'File is larger than 5 MB.')
  try {
    const { added, invalid, duplicate } = importTransactions(fromCSV(await file.text()))
    const parts = [`Imported ${added} transaction${added === 1 ? '' : 's'}`]
    if (duplicate) parts.push(`${duplicate} duplicate skipped`)
    if (invalid) parts.push(`${invalid} invalid row${invalid === 1 ? '' : 's'} skipped`)
    showNotice(added ? 'info' : 'error', parts.join(', ') + '.')
  } catch (e) {
    showNotice('error', `Import failed: ${e.message}`)
  }
}
</script>

<template>
  <div class="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
    <header class="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Budget Tracker</h1>
        <p class="text-slate-500 text-sm">Balance across all time: <span class="font-medium" :class="balance < 0 ? 'text-rose-600' : 'text-slate-700'">{{ formatINR(balance) }}</span></p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <label for="month" class="sr-only">Period</label>
        <select id="month" v-model="selectedMonth" class="px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option v-for="m in monthOptions" :key="m" :value="m">{{ monthLabel(m) }}</option>
          <option value="">All time</option>
        </select>
        <button @click="exportCSV" class="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm flex items-center gap-1.5">
          <Download :size="16" /> Export CSV
        </button>
        <button @click="fileInput.click()" class="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm flex items-center gap-1.5">
          <Upload :size="16" /> Import CSV
        </button>
        <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="importCSV" />
      </div>
    </header>

    <div v-if="storageError" class="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex gap-2" role="alert">
      <AlertTriangle :size="18" class="shrink-0" /> {{ storageError }}
    </div>
    <div v-if="notice.text" class="mb-4 p-3 rounded-lg text-sm" role="status"
      :class="notice.kind === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'">
      {{ notice.text }}
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-1 text-sm font-medium text-slate-500">
          <ArrowUpCircle class="text-emerald-500" :size="18" /> Income
        </div>
        <div class="text-2xl font-bold text-emerald-600 tabular-nums">{{ formatINR(income) }}</div>
      </div>
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-1 text-sm font-medium text-slate-500">
          <ArrowDownCircle class="text-rose-500" :size="18" /> Expenses
        </div>
        <div class="text-2xl font-bold text-rose-600 tabular-nums">{{ formatINR(expenses) }}</div>
      </div>
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-1 text-sm font-medium text-slate-500">
          <Wallet class="text-blue-500" :size="18" /> Net ({{ periodLabel }})
        </div>
        <div class="text-2xl font-bold tabular-nums" :class="net < 0 ? 'text-rose-600' : 'text-slate-800'">{{ formatINR(net) }}</div>
        <div v-if="income > 0" class="text-xs text-slate-400 mt-1">
          Saved {{ Math.max(0, Math.round((net / income) * 100)) }}% of income
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <TransactionForm :editing="editing" @save="onSave" @cancel="editing = null" />
        <TransactionList
          :items="periodTx"
          :editing-id="editing?.id ?? null"
          :period-label="periodLabel"
          @edit="editing = $event"
          @delete="onDelete"
        />
      </div>

      <div class="space-y-6">
        <CategoryChart :items="periodTx" />
        <BudgetPanel :items="periodTx" :budgets="budgets" :all-time="!selectedMonth" @set-budget="setBudget" />
        <TrendChart :transactions="transactions" :end-month="selectedMonth || currentMonth" />
      </div>
    </div>
  </div>
</template>
