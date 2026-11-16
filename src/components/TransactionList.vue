<script setup>
import { ref, computed } from 'vue'
import { Pencil, Trash2, Search } from 'lucide-vue-next'
import { formatINR, formatDate } from '../lib/format'

const props = defineProps({
  items: { type: Array, required: true },
  editingId: { type: String, default: null },
  periodLabel: { type: String, required: true },
})
const emit = defineEmits(['edit', 'delete'])
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = q
    ? props.items.filter(
        (t) => t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      )
    : props.items
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
})

const confirmDelete = (t) => {
  if (window.confirm(`Delete "${t.text}" (${formatINR(Math.abs(t.amount))})?`)) emit('delete', t.id)
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between gap-3 mb-3">
      <h3 class="text-lg font-semibold text-slate-800">History</h3>
      <span class="text-xs text-slate-400">{{ filtered.length }} of {{ items.length }}</span>
    </div>

    <label class="relative block mb-3">
      <span class="sr-only">Search transactions</span>
      <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input v-model="search" type="search" placeholder="Search description or category" class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
    </label>

    <ul class="space-y-2">
      <li
        v-for="t in filtered"
        :key="t.id"
        class="bg-white p-3 rounded-xl border flex items-center justify-between gap-3 shadow-sm"
        :class="t.id === editingId ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-100'"
      >
        <div class="min-w-0">
          <div class="font-medium text-slate-800 truncate">{{ t.text }}</div>
          <div class="text-xs text-slate-400">{{ formatDate(t.date) }} · {{ t.category }}</div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="font-semibold tabular-nums" :class="t.amount < 0 ? 'text-rose-600' : 'text-emerald-600'">
            {{ t.amount < 0 ? '−' : '+' }}{{ formatINR(Math.abs(t.amount)) }}
          </span>
          <button @click="emit('edit', t)" class="p-1 text-slate-400 hover:text-blue-600" :aria-label="`Edit ${t.text}`">
            <Pencil :size="16" />
          </button>
          <button @click="confirmDelete(t)" class="p-1 text-slate-400 hover:text-rose-600" :aria-label="`Delete ${t.text}`">
            <Trash2 :size="16" />
          </button>
        </div>
      </li>
      <li v-if="filtered.length === 0" class="text-center py-8 text-slate-400 italic">
        {{ items.length ? 'No matches.' : `No transactions in ${periodLabel}.` }}
      </li>
    </ul>
  </section>
</template>
