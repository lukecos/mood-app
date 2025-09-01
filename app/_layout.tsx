import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This file is not needed without expo-router, but keeping for future use
export default function Layout() {
  return (
    <View style={styles.container}>
      <Text>Layout Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
