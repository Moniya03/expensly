import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { AppRegistry } from 'react-native';

// Bypass Expo's dev-only root wrapper, which currently triggers
// expo-keep-awake activity errors in this dev-client setup.
AppRegistry.registerComponent('main', () => App);
