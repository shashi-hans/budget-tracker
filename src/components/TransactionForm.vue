<script setup>
import { ref, computed, watch } from 'vue'
import { PlusCircle, Save, X } from 'lucide-vue-next'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories'
import { todayISO, isValidISODate } from '../lib/format'

const props = defineProps({
  editing: { type: Object, default: null },
})
const emit = defineEmits(['save', 'cancel'])

const text = ref('')
const amount = ref('')
const type = ref('expense')
const category = ref(EXPENSE_CATEGORIES[0])
const date = ref(todayISO())
const error = ref('')

const categories = computed(() => {
  const base = type.value === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  // Keep an older or imported category visible while editing.
  return base.includes(category.value) ? base : [...base, category.value]
})

watch(type, (t) => {
  const base = t === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  if (!base.includes(category.value)) category.value = base[0]
})

const reset = () => {
  text.value = ''
  amount.value = ''
  error.value = ''
}

watch(
  () => props.editing,
  (t) => {
    error.value = ''
    if (!t) return reset()
    type.value = t.amount < 0 ? 'expense' : 'income'
    text.value = t.text
    amount.value = String(Math.abs(t.amount))
    category.value = t.category
    date.value = t.date
  },
  { immediate: true }
)

const submit = () => {
  const n = Number(amount.value)
  if (!text.value.trim()) return (error.value = 'Enter a description.')
  if (!Number.isFinite(n) || n <= 0) return (error.value = 'Enter an amount greater than 0.')
  if (!isValidISODate(date.value)) return (error.value = 'Pick a valid date.')
  emit('save', {
    text: text.value.trim(),
    amount: type.value === 'expense' ? -n : n,
    category: category.value,
    date: date.value,
  })
  if (!props.editing) reset()
}

const input =
  'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none'
</script>

<template>
  <section class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
    <h3 class="text-lg font-semibold mb-4">{{ editing ? 'Edit transaction' : 'Add transaction' }}</h3>
    <form @submit.prevent="submit" class="space-y-3">
      <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          v-for="t in ['expense', 'income']"
          :key="t"
          type="button"
          @click="type = t"
          class="py-1.5 rounded-md text-sm font-medium capitalize transition-colors"
          :class="type === t
            ? (t === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'bg-white text-emerald-600 shadow-sm')
            : 'text-slate-500'"
        >
          {{ t }}
        </button>
      </div>

      <div>
        <label for="tx-text" class="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <input id="tx-text" v-model="text" maxlength="100" type="text" placeholder="Groceries, Salary..." :class="input" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="tx-amount" class="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
          <input id="tx-amount" v-model="amount" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="0.00" :class="input" />
        </div>
        <div>
          <label for="tx-date" class="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input id="tx-date" v-model="date" type="date" :class="input" />
        </div>
      </div>

      <div>
        <label for="tx-cat" class="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select id="tx-cat" v-model="category" :class="input">
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <p v-if="error" class="text-sm text-rose-600" role="alert">{{ error }}</p>

      <div class="flex gap-2">
        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2">
          <component :is="editing ? Save : PlusCircle" :size="18" />
          {{ editing ? 'Save changes' : 'Add transaction' }}
        </button>
        <button v-if="editing" type="button" @click="emit('cancel')" class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
          <X :size="16" /> Cancel
        </button>
      </div>
    </form>
  </section>
</template>
