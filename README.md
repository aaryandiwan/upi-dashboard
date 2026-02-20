# 📊 UPI Transaction Analysis Dashboard

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Recharts](https://img.shields.io/badge/Recharts-2.10-22b5bf)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

> An interactive dashboard for analyzing UPI (Unified Payments Interface) transactions in India — built with React, Vite, and Recharts.

## 🌐 Live Demo

👉 **[View Dashboard](https://upi-dashboard.vercel.app)**

---

## ✨ Features

| Tab | What it shows |
|-----|--------------|
| **Overview** | Monthly spend trend, category donut chart, day-of-week bars |
| **Fraud** | Flagged transactions, hourly fraud heatmap, amount distribution |
| **Trends** | Top 10 merchants, hourly volume, payment mode split |
| **Data** | Raw transaction table with status badges |

- 🔍 **Filter** by All / Success / Flagged transactions
- 🚨 **Fraud detection** using rule-based anomaly heuristics
- 📱 **Responsive** layout — works on desktop and tablet
- ⚡ **Fast** — all data generated in-browser, no API calls

---

## 🛠️ Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool & dev server
- **Recharts** — Charts (Area, Bar, Pie, Line)
- **Vercel** — Deployment & hosting

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/upi-dashboard.git
cd upi-dashboard

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
upi-dashboard/
├── index.html          # HTML entry point
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies
└── src/
    ├── main.jsx        # React root
    └── App.jsx         # Dashboard (all components + data)
```

---

## 📊 Dataset

Synthetically generated dataset of **500 UPI transactions** (Jan–Dec 2024) with:
- 8 spending categories
- 40+ merchants across India
- Realistic fraud patterns (high amounts + odd hours)
- Payment modes: UPI ID, QR Code, Phone Number

> ⚠️ This is synthetic data for educational/portfolio purposes only.

---

## 📄 License

MIT — free to use and modify.

---

*Made with ❤️ using React · Vite · Recharts*
