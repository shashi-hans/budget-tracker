# Budget Tracker

A personal income and expense tracker that runs fully in the browser. Built with Vue 3, Vite, Tailwind CSS and Chart.js.

## Features

- Add, edit and delete transactions with a date, description, category and amount in ₹.
- Month filter for the summary cards, history, category chart and budgets. "All time" is also available.
- Separate category lists for income and expenses.
- Search history by description or category.
- Monthly budget limit per expense category, with a progress bar and an over-budget warning.
- Doughnut chart of spending by category, and a bar chart of income vs expenses for the last 6 months.
- CSV export of the selected period and CSV import that merges rows and skips duplicates.

## Data and privacy

All data is stored in the browser's `localStorage` under the keys `transactions` and `budgets`. Nothing is sent to a server. Data does not sync between browsers or devices, and clearing site data deletes it. Use **Export CSV** as a backup.

Entries saved by older versions, which had no date, get a date from their creation timestamp the first time the app loads.

## CSV format

```csv
date,type,category,description,amount
2026-11-01,expense,Food,Groceries,1250.00
2026-11-01,income,Salary,November salary,60000.00
```

- `date` is `YYYY-MM-DD`. `type` is `income` or `expense`. `amount` is positive.
- Import rejects files over 5 MB and skips rows with a bad date, empty description or zero amount.
- Exported text cells that start with `=`, `+`, `-` or `@` get a leading `'` so spreadsheet apps do not run them as formulas.

## Development

```sh
npm install
npm run dev      # dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Project layout

- `src/App.vue`: page layout, month filter, CSV import and export.
- `src/components/`: form, history list, budgets panel and charts.
- `src/lib/store.js`: transaction and budget state, validation and `localStorage` persistence.
- `src/lib/csv.js`: CSV read and write.
- `src/lib/format.js`: ₹ formatting, date and month helpers.
- `src/lib/categories.js`: category lists and chart colours.
