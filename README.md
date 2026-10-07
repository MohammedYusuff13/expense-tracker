# ExpenseTracker Pro (React Native + Expo)

Offline personal finance app. All data lives in an Excel (.xlsx) file you choose; there is no database.

## Run it
This uses native modules (Android folder access, notifications), so it needs a development build rather than Expo Go.

    npm install
    npx expo prebuild --platform android
    npx expo run:android          # device or emulator with USB debugging

To produce an APK: `npx eas build -p android --profile preview` (or build the prebuilt `android/` project in Android Studio).

## How storage works
- The app asks for access to a folder (Android's Storage Access Framework) and keeps that permission, so it reconnects to the same file on every launch.
- Create new / auto-create / select existing all work against a chosen folder.
- Every save rewrites the workbook: Transactions, Borrowed Money, Lent Money and Summary sheets.
- Extra columns beyond your spec: Payment Method (Transactions), Phone Number, Amount Paid/Returned and Record ID (Borrowed/Lent). Keep the header names if you edit the file by hand, then use Settings > Reload from Excel.
- Available balance = income − expenses + outstanding borrowed − outstanding lent.

## Layout
- `src/excel.ts` read/write workbook, folder access, backup
- `src/store.tsx` app state, serialised writes to Excel
- `src/notifications.ts` due-date and daily reminders
- `src/screens/*` Welcome, Home, forms, Borrowed/Lent lists, Search, Reports, Settings
