# GolfTrackerJack

A professional golf tracking app with real Bluetooth device discovery and turn-by-turn navigation.

## Features

- **Real Bluetooth Device Tracking**: Discover and track actual nearby Bluetooth devices
- **Turn-by-Turn Navigation**: Get precise walking directions to any tracked device
- **Cross-Platform**: Works on web (Web Bluetooth) and mobile (native Bluetooth)
- **Golf Scorecard**: Track your scores and game statistics
- **Game History**: View past rounds and performance insights

## Platform Support

### Web (Chrome/Edge)
- **Real Device Discovery**: Uses Web Bluetooth API to discover actual nearby devices
- **Immediate Use**: No setup required, works in supported browsers
- **Turn-by-Turn Navigation**: Opens maps app with precise directions

### Mobile (iOS/Android)
- **Development Build Required**: For real Bluetooth scanning on mobile
- **Native Performance**: Full access to device Bluetooth capabilities
- **Background Scanning**: Continuous device tracking

## Development Build Setup

To enable real Bluetooth scanning on mobile devices:

### Prerequisites
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

### Build Commands
```bash
# Development build (for testing)
npm run build:dev

# Preview build (for distribution)
npm run build:preview

# Production build
npm run build:production
```

### Step-by-Step Setup

1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/cli
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure Project**:
   ```bash
   eas build:configure
   ```

4. **Build Development Version**:
   ```bash
   eas build --profile development --platform android
   # or for iOS:
   eas build --profile development --platform ios
   ```

5. **Install on Device**:
   - Download the generated APK/IPA from the EAS dashboard
   - Install on your physical device
   - Open the app from the development build (not Expo Go)

### What's Included in Development Build

- **react-native-ble-manager**: Full native Bluetooth scanning
- **Real Device Discovery**: Scan for actual nearby Bluetooth devices
- **Enhanced Permissions**: All required Bluetooth and location permissions
- **Background Processing**: Continuous device tracking capabilities

## Usage

### Web Browser
1. Open the app in Chrome or Edge
2. Click "Scan for Real Devices"
3. Select a device from the browser's Bluetooth dialog
4. Navigate to the device using turn-by-turn directions

### Mobile Development Build
1. Open the app from your development build
2. Grant Bluetooth and location permissions
3. Tap "Scan for Bluetooth Devices"
4. Discover real nearby devices
5. Navigate to any device with precise GPS directions

## Technical Details

### Bluetooth Implementation
- **Web**: Web Bluetooth API for real device discovery
- **Mobile**: react-native-ble-manager for native scanning
- **Fallback**: Clear instructions for development build setup

### Navigation
- **iOS**: Apple Maps integration with walking directions
- **Android**: Google Maps navigation with walking mode
- **Web**: Google Maps web interface
- **Fallback**: Manual coordinate display

### Permissions
- **Location**: Required for distance calculation and navigation
- **Bluetooth**: Required for device discovery and tracking
- **Background Location**: Enhanced tracking capabilities

## Development

```bash
# Start development server
npm run dev

# Build for web
npm run build:web

# Lint code
npm run lint
```

## Architecture

- **Expo Router**: File-based routing system
- **TypeScript**: Full type safety
- **React Native**: Cross-platform mobile development
- **Expo SDK 53**: Latest Expo features and APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## License

MIT License - see LICENSE file for details