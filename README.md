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
- `npm run lint` - Run ESLint

## Project Structure

```
app/
├── _layout.tsx          # Root layout with navigation setup
└── index.tsx            # Main home screen with mood tracking interface
assets/                  # App icons, splash screen, and other assets
```

## Usage

1. **Select Your Mood**: Tap one of the 5 mood levels using the colorful emoji buttons
2. **Journal Your Thoughts**: Write about why you're feeling this way in the text area
3. **Add Actionable Steps**: Create specific tasks or actions to improve your mood:
   - Type in the input field and tap "Add"
   - Check off completed steps by tapping the checkbox
   - Remove steps by tapping "Remove"
4. **Save Your Entry**: Tap "Save Mood Entry" to record your daily mood

## Mobile Features

- **Touch Optimized**: Large, touch-friendly buttons and inputs
- **Native Scrolling**: Smooth, native scrolling behavior
- **Safe Area**: Respects device safe areas (notches, home indicators)
- **Alerts**: Native mobile alert dialogs
- **Keyboard Handling**: Proper keyboard avoidance on mobile

## Development Goals

This app is designed to support anxiety management and mindfulness practices by:
- Encouraging daily self-reflection through mood tracking
- Providing a space to externalize thoughts and feelings through journaling
- Promoting proactive mental health through actionable step planning
- Offering a calming, interactive experience through the planned relaxation game

## Testing the App

### On Your Phone (Recommended)
1. Download **Expo Go** from App Store (iOS) or Google Play (Android)
2. Run `npm start` in your project directory
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### On Computer
- **Web**: Press 'w' to open in browser
- **Android Emulator**: Press 'a' (requires Android Studio)
- **iOS Simulator**: Press 'i' (requires Xcode on macOS)

## Building for Production

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build for app stores
npm run build

# Submit to app stores
npm run submit
```

## Future Enhancements

- AsyncStorage/SQLite for offline data persistence
- Push notifications for daily mood tracking reminders
- Biometric authentication for privacy
- Interactive relaxation game with physics-based orb interactions
- Mood analytics with charts and trends
- Export mood data functionality
- Social sharing features (optional)
- Dark mode support
- Accessibility improvements

## Contributing

This project is in active development. Feel free to contribute ideas and feedback.

## License

This project is private and proprietary.
