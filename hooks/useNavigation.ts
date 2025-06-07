import { Platform, Linking, Alert } from 'react-native';

export interface NavigationCoordinate {
  latitude: number;
  longitude: number;
}

export function useNavigation() {
  const openTurnByTurnNavigation = async (
    destination: NavigationCoordinate,
    destinationName: string = 'Destination'
  ): Promise<void> => {
    try {
      console.log(`🧭 Starting navigation to ${destinationName} at ${destination.latitude}, ${destination.longitude}`);
      
      let navigationUrl: string;
      let appName: string;

      if (Platform.OS === 'ios') {
        // Try Apple Maps first (native turn-by-turn)
        navigationUrl = `maps://?daddr=${destination.latitude},${destination.longitude}&dirflg=d&t=m`;
        appName = 'Apple Maps';
        
        const canOpenAppleMaps = await Linking.canOpenURL(navigationUrl);
        if (!canOpenAppleMaps) {
          // Fallback to Google Maps app
          navigationUrl = `comgooglemaps://?daddr=${destination.latitude},${destination.longitude}&directionsmode=walking`;
          appName = 'Google Maps';
          
          const canOpenGoogleMaps = await Linking.canOpenURL(navigationUrl);
          if (!canOpenGoogleMaps) {
            // Final fallback to web Google Maps
            navigationUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w`;
            appName = 'Google Maps (Web)';
          }
        }
      } else if (Platform.OS === 'android') {
        // Try Google Maps app first (native turn-by-turn)
        navigationUrl = `google.navigation:q=${destination.latitude},${destination.longitude}&mode=w`;
        appName = 'Google Maps';
        
        const canOpenGoogleMaps = await Linking.canOpenURL(navigationUrl);
        if (!canOpenGoogleMaps) {
          // Fallback to generic maps intent
          navigationUrl = `geo:${destination.latitude},${destination.longitude}?q=${destination.latitude},${destination.longitude}(${destinationName})`;
          appName = 'Maps';
          
          const canOpenGeo = await Linking.canOpenURL(navigationUrl);
          if (!canOpenGeo) {
            // Final fallback to web Google Maps
            navigationUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w`;
            appName = 'Google Maps (Web)';
          }
        }
      } else {
        // Web platform - open Google Maps in new tab with turn-by-turn
        navigationUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w&nav=1`;
        appName = 'Google Maps';
        
        // Force open in new tab for web
        window.open(navigationUrl, '_blank', 'noopener,noreferrer');
        
        Alert.alert(
          '🧭 Navigation Started!',
          `Turn-by-turn navigation to ${destinationName} is now active in ${appName}!\n\nFollow the directions to reach your device.`,
          [{ text: 'Got it!' }]
        );
        return;
      }

      // Open the navigation app
      console.log(`🚀 Opening ${appName} with URL: ${navigationUrl}`);
      
      const supported = await Linking.canOpenURL(navigationUrl);
      if (supported) {
        await Linking.openURL(navigationUrl);
        
        // Show success message
        setTimeout(() => {
          Alert.alert(
            '🧭 Navigation Active!',
            `Turn-by-turn navigation to ${destinationName} is now running in ${appName}!\n\n📍 Follow the directions to reach your device.\n🚶‍♂️ Walking mode enabled for precise location.`,
            [{ text: 'Perfect!' }]
          );
        }, 500);
        
      } else {
        throw new Error(`Cannot open ${appName}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Ultimate fallback - always works
      const webUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w&nav=1`;
      
      try {
        if (Platform.OS === 'web') {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        } else {
          await Linking.openURL(webUrl);
        }
        
        Alert.alert(
          '🗺️ Navigation Started',
          `Navigation to ${destinationName} opened in web browser.\n\nTurn-by-turn directions are now available!`,
          [{ text: 'OK' }]
        );
      } catch (fallbackError) {
        console.error('Fallback navigation error:', fallbackError);
        Alert.alert(
          '❌ Navigation Error',
          `Unable to start navigation to ${destinationName}. Please open your maps app manually and navigate to:\n\n${destination.latitude}, ${destination.longitude}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const openInMapsApp = async (
    destination: NavigationCoordinate,
    destinationName: string = 'Device Location'
  ): Promise<void> => {
    // Alternative method that focuses on opening in maps apps
    const urls = [];
    
    if (Platform.OS === 'ios') {
      urls.push(
        `maps://?daddr=${destination.latitude},${destination.longitude}&dirflg=d`,
        `comgooglemaps://?daddr=${destination.latitude},${destination.longitude}&directionsmode=walking`
      );
    } else if (Platform.OS === 'android') {
      urls.push(
        `google.navigation:q=${destination.latitude},${destination.longitude}&mode=w`,
        `geo:${destination.latitude},${destination.longitude}?q=${destination.latitude},${destination.longitude}(${destinationName})`
      );
    }
    
    // Try each URL until one works
    for (const url of urls) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return;
        }
      } catch (error) {
        console.log(`Failed to open ${url}:`, error);
      }
    }
    
    // If no native app works, use web fallback
    await openTurnByTurnNavigation(destination, destinationName);
  };

  const getDirectionsUrl = (
    destination: NavigationCoordinate,
    origin?: NavigationCoordinate
  ): string => {
    const destParam = `${destination.latitude},${destination.longitude}`;
    const originParam = origin ? `${origin.latitude},${origin.longitude}` : '';
    
    if (Platform.OS === 'ios') {
      return `maps://?saddr=${originParam}&daddr=${destParam}&dirflg=d`;
    } else if (Platform.OS === 'android') {
      return `google.navigation:q=${destParam}&mode=w`;
    } else {
      return `https://maps.google.com/maps?saddr=${originParam}&daddr=${destParam}&dirflg=w&nav=1`;
    }
  };

  const calculateDistance = (
    point1: NavigationCoordinate,
    point2: NavigationCoordinate
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Distance in meters
    
    return Math.round(distance);
  };

  return {
    openTurnByTurnNavigation,
    openInMapsApp,
    getDirectionsUrl,
    calculateDistance,
  };
}