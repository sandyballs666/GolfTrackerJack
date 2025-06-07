import { Platform, Linking, Alert } from 'react-native';

export interface NavigationCoordinate {
  latitude: number;
  longitude: number;
}

export function useNavigation() {
  const openTurnByTurnNavigation = async (
    destination: NavigationCoordinate,
    destinationName: string = 'Device Location'
  ): Promise<void> => {
    try {
      console.log(`🧭 Starting turn-by-turn navigation to ${destinationName}`);
      console.log(`📍 Coordinates: ${destination.latitude}, ${destination.longitude}`);
      
      let navigationUrl: string;
      let appName: string;
      let success = false;

      if (Platform.OS === 'ios') {
        // Try Apple Maps first (best integration on iOS)
        navigationUrl = `maps://?daddr=${destination.latitude},${destination.longitude}&dirflg=w&t=m`;
        appName = 'Apple Maps';
        
        try {
          const canOpenAppleMaps = await Linking.canOpenURL(navigationUrl);
          if (canOpenAppleMaps) {
            await Linking.openURL(navigationUrl);
            success = true;
            console.log('✅ Opened Apple Maps successfully');
          }
        } catch (error) {
          console.log('Apple Maps failed, trying Google Maps...');
        }
        
        // Fallback to Google Maps app
        if (!success) {
          navigationUrl = `comgooglemaps://?daddr=${destination.latitude},${destination.longitude}&directionsmode=walking`;
          appName = 'Google Maps';
          
          try {
            const canOpenGoogleMaps = await Linking.canOpenURL(navigationUrl);
            if (canOpenGoogleMaps) {
              await Linking.openURL(navigationUrl);
              success = true;
              console.log('✅ Opened Google Maps app successfully');
            }
          } catch (error) {
            console.log('Google Maps app failed, trying web fallback...');
          }
        }
        
      } else if (Platform.OS === 'android') {
        // Try Google Maps navigation intent first (best on Android)
        navigationUrl = `google.navigation:q=${destination.latitude},${destination.longitude}&mode=w`;
        appName = 'Google Maps';
        
        try {
          const canOpenGoogleNav = await Linking.canOpenURL(navigationUrl);
          if (canOpenGoogleNav) {
            await Linking.openURL(navigationUrl);
            success = true;
            console.log('✅ Opened Google Maps navigation successfully');
          }
        } catch (error) {
          console.log('Google Navigation failed, trying generic geo intent...');
        }
        
        // Fallback to generic geo intent
        if (!success) {
          navigationUrl = `geo:${destination.latitude},${destination.longitude}?q=${destination.latitude},${destination.longitude}(${encodeURIComponent(destinationName)})`;
          appName = 'Maps';
          
          try {
            const canOpenGeo = await Linking.canOpenURL(navigationUrl);
            if (canOpenGeo) {
              await Linking.openURL(navigationUrl);
              success = true;
              console.log('✅ Opened geo intent successfully');
            }
          } catch (error) {
            console.log('Geo intent failed, trying web fallback...');
          }
        }
      }

      // Web fallback or if native apps failed
      if (!success) {
        navigationUrl = `https://maps.google.com/maps?daddr=${destination.latitude},${destination.longitude}&dirflg=w&nav=1`;
        appName = 'Google Maps (Web)';
        
        try {
          if (Platform.OS === 'web') {
            window.open(navigationUrl, '_blank', 'noopener,noreferrer');
          } else {
            await Linking.openURL(navigationUrl);
          }
          success = true;
          console.log('✅ Opened web maps successfully');
        } catch (error) {
          console.error('All navigation methods failed:', error);
          throw new Error('Unable to open any navigation app');
        }
      }

      // Show success message
      if (success) {
        setTimeout(() => {
          Alert.alert(
            '🧭 Navigation Started!',
            `Turn-by-turn walking directions to ${destinationName} are now active in ${appName}!\n\n📍 Follow the directions to reach your device.\n🚶‍♂️ Walking mode enabled for precise location.`,
            [{ text: 'Perfect!' }]
          );
        }, 1000);
      }
        
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Ultimate fallback with manual coordinates
      Alert.alert(
        '❌ Navigation Error',
        `Unable to start automatic navigation to ${destinationName}.\n\nManual coordinates:\n${destination.latitude}, ${destination.longitude}\n\nPlease open your maps app and enter these coordinates manually.`,
        [
          { text: 'Copy Coordinates', onPress: () => {
            // Could implement clipboard copy here
            console.log('Coordinates to copy:', `${destination.latitude}, ${destination.longitude}`);
          }},
          { text: 'OK' }
        ]
      );
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
      return `https://maps.google.com/maps?saddr=${originParam}&daddr=${destParam}&dirflg=w&nav=1`;
    }
  };

  return {
    openTurnByTurnNavigation,
    calculateDistance,
    getDirectionsUrl,
  };
}