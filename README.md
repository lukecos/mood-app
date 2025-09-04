# Mood Tracker Mobile App

A mindful mood tracking and journaling mobile application built with React Native and Expo.

## Features

### Current Features
- **Daily Mood Tracking**: Select your mood on a 1-5 scale (Very Sad to Very Happy) with intuitive emoji-based interface
- **Journal Entry**: Write about your feelings and thoughts with a dedicated "Why" text field
- **Actionable Steps**: Create and manage a checklist of specific actions to improve or maintain your mood
- **Mobile-First Design**: Native mobile interface optimized for touch interactions
- **Cross-Platform**: Works on both iOS and Android devices

### Planned Features
- **Visual Relaxation Game**: Interactive lava lamp-style game with glowing orbs that users can swipe, pull, and push around
- **Color Customization**: Ability to change colors of the relaxation game elements
- **Mood Calendar**: Visual calendar showing mood trends over time
- **Data Persistence**: Save entries to local storage or cloud database
- **Push Notifications**: Daily mood tracking reminders
- **Analytics**: Mood trends and insights

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Package Manager**: npm

## Getting Started

### Prerequisites
- Node.js (version 18 or later)
- npm
- **For mobile testing**: 
  - Expo Go app on your phone (iOS/Android)
  - OR Android Studio for Android emulator
  - OR Xcode for iOS Simulator (macOS only)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   npx expo start
   ```

4. Test on your device:
   - **Mobile Device**: Download Expo Go app and scan the QR code
   - **Android Emulator**: Press 'a' in terminal
   - **iOS Simulator**: Press 'i' in terminal (macOS only)
   - **Web Browser**: Press 'w' in terminal

### Available Scripts

- `npm start` or `npx expo start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
# SimpleMoods — Mood Tracker Mobile App

A small, mobile-first mood tracking and journaling app built with React Native + Expo and TypeScript.

This repository contains a lightweight tracker, a journal, and a visual calendar to review past moods.

## Quick overview

- Daily mood scale (1-5) with emoji and color-coded orb
- Short journal prompt per entry
- Actionable steps checklist per day
- Visual calendar and history views
- Local storage via AsyncStorage (no backend required)

## Recent fix

- Calendar navigation now avoids unnecessary remounts to prevent a brief empty/flicker state when switching screens. The calendar only reloads when a new entry is saved (explicit refresh signal).

## Tech

- React Native + Expo
- TypeScript
- AsyncStorage for local persistence
- Tailwind / custom styles (project uses stylesheet files)

## Getting started (developer)

Prerequisites
- Node.js (18+ recommended)
- npm
- Expo CLI (optional) or use `npm start` / `npx expo start`

Install

```powershell
npm install
```

Run (development)

```powershell
npm start
# or
npx expo start
```

Run on device/emulator
- Android emulator: `npm run android` (requires Android Studio)
- iOS simulator: `npm run ios` (macOS + Xcode)
- Expo Go: scan QR code

## Project layout (important files)

- `app/` — primary app screens and components
   - `mood-tracker.tsx` — mood entry UI
   - `calendar.tsx` — calendar & history views
   - `navigation.tsx` — header and screen routing (keeps calendar mounted to avoid flicker)
   - `storage.ts` — AsyncStorage helpers
- `assets/` — icons and images
- `package.json` — scripts and dependencies

## Notes for contributors
- Keep the calendar mounted to avoid visual flicker; use the `refreshSignal` prop to trigger data reloads when necessary.
- Keep UI changes small and test on device for touch/keyboard behavior.

## How to verify the calendar-flicker fix locally
1. Start dev server: `npm start`
2. Open Calendar — entries should show immediately (no flash of empty state)
3. Navigate away (History/Home) and back — calendar should not flash empty
4. Save a new mood entry — calendar should update to show the new entry

## License
Private repository — internal use.

