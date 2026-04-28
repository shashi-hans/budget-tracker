<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { PlusCircle, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-vue-next'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

// State
const transactions = ref([])
const text = ref('')
const amount = ref('')
const category = ref('Food')
const type = ref('expense')

const categories = ['Food', 'Rent', 'Salary', 'Entertainment', 'Transport', 'Shopping', 'Health', 'Other']

// Totals
const total = computed(() => {
  return transactions.value.reduce((acc, item) => acc + item.amount, 0).toFixed(2)
})

const income = computed(() => {
  return transactions.value
    .filter(item => item.amount > 0)
    .reduce((acc, item) => acc + item.amount, 0)
    .toFixed(2)
})

const expenses = computed(() => {
  return (transactions.value
    .filter(item => item.amount < 0)
    .reduce((acc, item) => acc + item.amount, 0) * -1)
    .toFixed(2)
})

// Chart Data
const chartData = computed(() => {
  const expenseData = transactions.value.filter(t => t.amount < 0)
  const categoryTotals = {}
  
  expenseData.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount)
  })

  return {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        backgroundColor: ['#41B883', '#E46651', '#00D8FF', '#DD1B16', '#FBBF24', '#8B5CF6', '#EC4899', '#6B7280'],
        data: Object.values(categoryTotals)
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
}

// Actions
const addTransaction = () => {
  if (!text.value || !amount.value) return

  const newTransaction = {
    id: Date.now(),
    text: text.value,
    category: category.value,
    amount: type.value === 'expense' ? -Math.abs(parseFloat(amount.value)) : Math.abs(parseFloat(amount.value))
  }

  transactions.value.push(newTransaction)
  
  // Reset form
  text.value = ''
  amount.value = ''
}

const deleteTransaction = (id) => {
  transactions.value = transactions.value.filter(t => t.id !== id)
}

// Persist data
onMounted(() => {
  const savedTransactions = JSON.parse(localStorage.getItem('transactions'))
  if (savedTransactions) {
    transactions.value = savedTransactions
  }
})

watch(transactions, (newVal) => {
  localStorage.setItem('transactions', JSON.stringify(newVal))
}, { deep: true })

</script>

<template>
  <div class="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
    <header class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-slate-800">Budget Tracker</h1>
      <p class="text-slate-500">Manage your finances with ease</p>
    </header>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <Wallet class="text-blue-500" :size="20" />
          <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Balance</span>
        </div>
        <div class="text-2xl font-bold" :class="total >= 0 ? 'text-slate-800' : 'text-red-500'">
          Rs. {{ total }}
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <ArrowUpCircle class="text-emerald-500" :size="20" />
          <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Income</span>
        </div>
        <div class="text-2xl font-bold text-emerald-600">Rs. {{ income }}</div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3 mb-2">
          <ArrowDownCircle class="text-rose-500" :size="20" />
          <span class="text-sm font-medium text-slate-500 uppercase tracking-wider">Expenses</span>
        </div>
        <div class="text-2xl font-bold text-rose-600">Rs. {{ expenses }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left Column: Form & List -->
      <div class="space-y-8">
        <!-- Form -->
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="text-lg font-semibold mb-4">Add Transaction</h3>
          <form @submit.prevent="addTransaction" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input v-model="text" type="text" placeholder="Rent, Coffee, Salary..." class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input v-model="amount" type="number" step="0.01" placeholder="0.00" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select v-model="type" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select v-model="category" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <PlusCircle :size="18" /> Add Transaction
            </button>
          </form>
        </section>

        <!-- History -->
        <section>
          <h3 class="text-lg font-semibold mb-4 text-slate-800">History</h3>
          <ul class="space-y-3">
            <li v-for="transaction in transactions" :key="transaction.id" 
                class="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between group shadow-sm">
              <div class="flex flex-col">
                <span class="font-medium text-slate-800">{{ transaction.text }}</span>
                <span class="text-xs text-slate-400 font-medium uppercase tracking-tighter">{{ transaction.category }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span :class="transaction.amount < 0 ? 'text-rose-500' : 'text-emerald-500'" class="font-bold">
                  {{ transaction.amount < 0 ? '-' : '+' }}Rs. {{ Math.abs(transaction.amount).toFixed(2) }}
                </span>
                <button @click="deleteTransaction(transaction.id)" class="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 :size="18" />
                </button>
              </div>
            </li>
            <li v-if="transactions.length === 0" class="text-center py-8 text-slate-400 italic">
              No transactions yet.
            </li>
          </ul>
        </section>
      </div>

      <!-- Right Column: Chart -->
      <div class="lg:sticky lg:top-8 h-fit">
        <section class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 class="text-lg font-semibold mb-6">Spending Analysis</h3>
          <div v-if="transactions.filter(t => t.amount < 0).length > 0" class="h-64">
             <Pie :data="chartData" :options="chartOptions" />
          </div>
          <div v-else class="h-64 flex items-center justify-center text-slate-400 italic text-center">
            Add expenses to see <br/> category breakdown
          </div>
        </section>
      </div>
    </div>
  </div>
</template>