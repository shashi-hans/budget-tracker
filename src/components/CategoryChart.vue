<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import '../lib/chart'
import { colorFor } from '../lib/categories'
import { formatINR, toPaise } from '../lib/format'

const props = defineProps({
  items: { type: Array, required: true },
})

const totals = computed(() => {
  const byCat = {}
  for (const t of props.items) {
    if (t.amount < 0) byCat[t.category] = (byCat[t.category] || 0) + toPaise(-t.amount)
  }
  return Object.entries(byCat)
    .map(([category, paise]) => ({ category, amount: paise / 100 }))
    .sort((a, b) => b.amount - a.amount)
})

const chartData = computed(() => ({
  labels: totals.value.map((r) => r.category),
  datasets: [
    {
      data: totals.value.map((r) => r.amount),
      backgroundColor: totals.value.map((r) => colorFor(r.category)),
      borderWidth: 2,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12 } },
    tooltip: { callbacks: { label: (c) => `${c.label}: ${formatINR(c.parsed)}` } },
  },
}
</script>

<template>
  <section class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
    <h3 class="text-lg font-semibold mb-4">Spending by category</h3>
    <div v-if="totals.length" class="h-64">
      <Doughnut :data="chartData" :options="options" />
    </div>
    <div v-else class="h-40 flex items-center justify-center text-slate-400 italic text-center">
      No expenses in this period.
    </div>
  </section>
</template>
