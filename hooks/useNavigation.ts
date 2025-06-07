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
      let navigationUrl: string;

      if (Platform.OS === 'ios') {
        // Apple Maps with turn-by-turn navigation
        navigationUrl = `maps://?daddr=${destination.latitude},${destination.longitude}&dirflg=w`;
        
        // Check if Apple Maps is available, fallback to Google Maps
        const canOpenAppleMaps = await Linking.canOpenURL(navigationUrl);
        if (!canOpenAppleMaps) {
          navigationUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w`;
        }
      } else if (Platform.OS === 'android') {
        // Google Maps with turn-by-turn navigation
        navigationUrl = `google.navigation:q=${destination.latitude},${destination.longitude}&mode=w`;
        
        // Check if Google Maps is available, fallback to web
        const canOpenGoogleMaps = await Linking.canOpenURL(navigationUrl);
        if (!canOpenGoogleMaps) {
          navigationUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w`;
        }
      } else {
        // Web platform - open Google Maps in new tab
        navigationUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w`;
        window.open(navigationUrl, '_blank');
        
        Alert.alert(
          '🧭 Navigation Started',
          `Turn-by-turn navigation to ${destinationName} opened in Google Maps!`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Open the navigation app
      const supported = await Linking.canOpenURL(navigationUrl);
      if (supported) {
        await Linking.openURL(navigationUrl);
        
        Alert.alert(
          '🧭 Navigation Started',
          `Turn-by-turn navigation to ${destinationName} is now active!`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('No navigation app available');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Fallback to web Google Maps
      const webUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w`;
      
      if (Platform.OS === 'web') {
        window.open(webUrl, '_blank');
      } else {
        await Linking.openURL(webUrl);
      }
      
      Alert.alert(
        '🗺️ Navigation Opened',
        `Navigation to ${destinationName} opened in web browser.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getDirectionsUrl = (
    destination: NavigationCoordinate,
    origin?: NavigationCoordinate
  ): string => {
    const destParam = `${destination.latitude},${destination.longitude}`;
    const originParam = origin ? `${origin.latitude},${origin.longitude}` : '';
    
    if (Platform.OS === 'ios') {
      return `maps://?saddr=${originParam}&daddr=${destParam}&dirflg=w`;
    } else if (Platform.OS === 'android') {
      return `google.navigation:q=${destParam}&mode=w`;
    } else {
      return `https://maps.google.com/maps?saddr=${originParam}&daddr=${destParam}&dirflg=w`;
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
    getDirectionsUrl,
    calculateDistance,
  };
}