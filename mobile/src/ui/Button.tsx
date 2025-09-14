import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from './theme';

export function Button({ title, onPress, style }: { title: string; onPress?: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, style]}
      android_ripple={{ color: '#e6f7f2' }}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius,
    alignSelf: 'flex-start',
  },
  text: { color: 'white', fontWeight: '700', fontSize: 16 },
});

