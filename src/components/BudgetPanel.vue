<script setup>
import { ref, computed } from 'vue'
import { Settings2, Check } from 'lucide-vue-next'
import { EXPENSE_CATEGORIES } from '../lib/categories'
import { formatINR, toPaise } from '../lib/format'

const props = defineProps({
  items: { type: Array, required: true },
  budgets: { type: Object, required: true },
  allTime: { type: Boolean, default: false },
})
const emit = defineEmits(['set-budget'])

const editing = ref(false)
const drafts = ref({})

const startEdit = () => {
  drafts.value = Object.fromEntries(
    EXPENSE_CATEGORIES.map((c) => [c, props.budgets[c] ? String(props.budgets[c]) : ''])
  )
  editing.value = true
}

const saveEdit = () => {
  for (const c of EXPENSE_CATEGORIES) emit('set-budget', c, drafts.value[c])
  editing.value = false
}

const rows = computed(() => {
  const spent = {}
  for (const t of props.items) {
    if (t.amount < 0) spent[t.category] = (spent[t.category] || 0) + toPaise(-t.amount)
  }
  return Object.entries(props.budgets).map(([category, limit]) => {
    const used = (spent[category] || 0) / 100
    const pct = Math.round((used / limit) * 100)
    return { category, limit, used, pct, left: limit - used }
  })
})

const totalLimit = computed(() => rows.value.reduce((a, r) => a + r.limit, 0))
const totalUsed = computed(() => rows.value.reduce((a, r) => a + r.used, 0))

const barColor = (pct) => (pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500')
</script>

<template>
  <section class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Monthly budgets</h3>
      <button v-if="!editing" @click="startEdit" class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
        <Settings2 :size="16" /> Set limits
      </button>
      <button v-else @click="saveEdit" class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
        <Check :size="16" /> Done
      </button>
    </div>

    <div v-if="editing" class="space-y-2">
      <p class="text-xs text-slate-500 mb-2">Monthly limit per category. Leave empty for no limit.</p>
      <label v-for="c in EXPENSE_CATEGORIES" :key="c" class="flex items-center justify-between gap-3">
        <span class="text-sm text-slate-700">{{ c }}</span>
        <input v-model="drafts[c]" type="number" min="0" step="1" inputmode="decimal" placeholder="No limit"
          class="w-32 px-2 py-1 rounded-md border border-slate-200 text-right focus:ring-2 focus:ring-blue-500 outline-none" />
      </label>
    </div>

    <template v-else>
      <p v-if="allTime" class="text-sm text-slate-400 italic">Pick a month to compare spending with budgets.</p>
      <p v-else-if="!rows.length" class="text-sm text-slate-400 italic">No budgets set yet.</p>
      <div v-else class="space-y-3">
        <div v-for="r in rows" :key="r.category">
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium text-slate-700">{{ r.category }}</span>
            <span class="tabular-nums" :class="r.pct >= 100 ? 'text-rose-600 font-medium' : 'text-slate-500'">
              {{ formatINR(r.used) }} / {{ formatINR(r.limit) }}
            </span>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" :aria-valuenow="r.pct" aria-valuemin="0" aria-valuemax="100" :aria-label="`${r.category} budget used`">
            <div class="h-full rounded-full" :class="barColor(r.pct)" :style="{ width: Math.min(r.pct, 100) + '%' }"></div>
          </div>
          <div v-if="r.left < 0" class="text-xs text-rose-600 mt-1">Over by {{ formatINR(-r.left) }}</div>
        </div>
        <div class="pt-2 border-t border-slate-100 flex justify-between text-sm">
          <span class="text-slate-500">Total</span>
          <span class="tabular-nums font-medium">{{ formatINR(totalUsed) }} / {{ formatINR(totalLimit) }}</span>
        </div>
      </div>
    </template>
  </section>
</template>
