import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from './theme';

export function Input(props: TextInputProps) {
  return <TextInput {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius,
    padding: 10,
  },
});

