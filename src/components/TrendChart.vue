<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import '../lib/chart'
import { formatINR, lastMonths, monthKey, shortMonthLabel, toPaise } from '../lib/format'

const props = defineProps({
  transactions: { type: Array, required: true },
  endMonth: { type: String, required: true },
})

const months = computed(() => lastMonths(props.endMonth, 6))

const series = computed(() => {
  const inc = Object.fromEntries(months.value.map((m) => [m, 0]))
  const exp = { ...inc }
  for (const t of props.transactions) {
    const m = monthKey(t.date)
    if (!(m in inc)) continue
    if (t.amount > 0) inc[m] += toPaise(t.amount)
    else exp[m] += toPaise(-t.amount)
  }
  return {
    income: months.value.map((m) => inc[m] / 100),
    expense: months.value.map((m) => exp[m] / 100),
  }
})

const chartData = computed(() => ({
  labels: months.value.map(shortMonthLabel),
  datasets: [
    { label: 'Income', data: series.value.income, backgroundColor: '#059669', borderRadius: 4 },
    { label: 'Expenses', data: series.value.expense, backgroundColor: '#e11d48', borderRadius: 4 },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12 } },
    tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatINR(c.parsed.y)}` } },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { callback: (v) => formatINR(v).replace(/\.00$/, '') } },
  },
}
</script>

<template>
  <section class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
    <h3 class="text-lg font-semibold mb-4">Last 6 months</h3>
    <div class="h-56">
      <Bar :data="chartData" :options="options" />
    </div>
  </section>
</template>
