import '@expo/metro-runtime';
import { AppRegistry } from 'react-native';
import { App } from 'expo-router/build/qualified-entry';

// Bypass Expo's dev-only root wrapper, which currently triggers
// expo-keep-awake activity errors in this dev-client setup.
AppRegistry.registerComponent('main', () => App);
