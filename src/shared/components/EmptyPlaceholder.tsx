import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyPlaceholder: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Coming soon...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#888',
    fontSize: 20,
    fontStyle: 'italic',
  },
});

export default EmptyPlaceholder;
