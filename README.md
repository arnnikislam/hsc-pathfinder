# 🎓 HSC PathFinder — তোমার লক্ষ্য, তোমার পথ

<div align="center">

![HSC PathFinder Banner](https://img.shields.io/badge/HSC%20PathFinder-2026%20Edition-0ea5e9?style=for-the-badge&logo=graduation-cap)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-22c55e?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Powered-f97316?style=for-the-badge&logo=firebase)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)

**The ultimate study tracker for HSC 2026 candidates in Bangladesh**

*Track your study hours · Compete on leaderboards · Stay motivated*

[🚀 Live App](https://hsc-pathfinder.vercel.app) · [📸 Developer](https://arnnikislam.vercel.app) · [🐛 Report Bug](https://github.com/arnnikislam/hsc-pathfinder/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| ⏳ **Live Countdown** | Real-time days & hours until HSC 2026 exam (02 July 2026) |
| 📊 **Study Tracker** | Log study time in hours & minutes with daily progress ring |
| 🏆 **Leaderboard** | Today / Week / Month / All-time rankings with group filters |
| 📅 **Exam Routine** | Official HSC 2026 routine for Science, Arts & Commerce |
| 👤 **Profile & Stats** | Streaks, total hours, daily averages & full study history |
| 📄 **PDF Export** | Download a beautiful personal study report as PDF |
| 🔔 **Reminders** | Email + push notifications if daily goal is missed |
| 🌐 **Bilingual** | Full Bangla & English language support |
| 📱 **PWA** | Install on Android/iPhone like a native app |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Auth:** Firebase Authentication (Google Sign-In)
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Push Notifications:** Firebase Cloud Messaging
- **Email:** EmailJS
- **PDF:** jsPDF + html2canvas
- **i18n:** react-i18next
- **PWA:** vite-plugin-pwa
- **Hosting:** Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Firebase project (see setup below)

### 1. Clone the repository
```bash
git clone https://github.com/arnnikislam/hsc-pathfinder.git
cd hsc-pathfinder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) and enable:
- ✅ Authentication → Google Sign-In
- ✅ Firestore Database (Production mode)
- ✅ Storage

Then update `src/firebase/config.js` with your config keys.

### 4. Set Firestore Security Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

### 5. Run the app
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 PWA Installation

### Android
1. Open the app in Chrome
2. Tap the **three-dot menu** → "Add to Home Screen"
3. Tap "Install" — done! 🎉

### iPhone (iOS Safari)
1. Open the app in Safari
2. Tap the **Share button** (bottom bar)
3. Tap "Add to Home Screen"
4. Tap "Add" — done! 🎉

---

## 🔐 Firestore Security Rules

The app uses production-grade security rules that:
- ✅ Allow users to read/write only **their own** data
- ✅ Allow all logged-in users to **read** the leaderboard
- ✅ Block all unauthorized access

See `firestore.rules` for the complete rules.

---

## 📂 Project Structure

```
hsc-pathfinder/
├── public/
│   └── icons/              # PWA icons (all sizes)
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx   # Mobile navigation
│   │   └── CountdownBanner.jsx  # HSC exam countdown
│   ├── contexts/
│   │   └── AuthContext.jsx # Firebase auth state
│   ├── firebase/
│   │   └── config.js       # Firebase setup
│   ├── i18n/
│   │   ├── en.json         # English translations
│   │   ├── bn.json         # Bangla translations
│   │   └── index.js        # i18next config
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Routine.jsx
│   │   ├── Account.jsx
│   │   └── Developer.jsx
│   └── utils/
│       ├── pdfExport.js    # PDF report generator
│       └── emailReminder.js # Email notification logic
├── firestore.rules         # Firestore security rules
├── vite.config.js
└── README.md
```

---

## 🌐 Deployment (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Framework: **Vite** (auto-detected)
4. Click Deploy — live in 60 seconds! ⚡

---

## 📧 Email Reminders Setup (EmailJS)

1. Create a free account at [emailjs.com](https://www.emailjs.com)
2. Create an Email Service (Gmail recommended)
3. Create an Email Template with these variables:
   - `{{to_name}}`, `{{to_email}}`, `{{studied_time}}`, `{{remaining_time}}`
   - `{{motivation_en}}`, `{{motivation_bn}}`
4. Update `src/utils/emailReminder.js` with your Service ID, Template ID, and Public Key

---

## 👨‍💻 Developer

<div align="center">

**Arnnik Islam Payel**
*Web Developer · Wi-Fi Pentester · Tech Content Creator*

🇧🇩 Bangladesh

[![Portfolio](https://img.shields.io/badge/Portfolio-0ea5e9?style=flat-square&logo=vercel)](https://arnnikislam.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github)](https://github.com/arnnikislam)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=flat-square&logo=youtube)](https://youtube.com/@arnnikislam)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/arnnikislam)

📧 arnnikislam.socials@gmail.com

</div>

---

## 📝 License

MIT License — feel free to use, fork, and improve!

---

<div align="center">

Built with ❤️ for HSC 2026 candidates of Bangladesh

**তোমার লক্ষ্য, তোমার পথ — Your Goal, Your Path**

⭐ Star this repo if it helps you!

</div>

## 📸 Custom Profile Photos

Users can upload and crop their own profile photos:
- Tap the camera icon on the Account page
- Select a photo from phone gallery
- Crop to a perfect circle with zoom & rotate controls
- Photo stored in Firebase Storage (free tier)
- Shows everywhere: dashboard, leaderboard, account

### Firebase Storage Setup
Paste `storage.rules` content in Firebase Console → Storage → Rules → Publish
