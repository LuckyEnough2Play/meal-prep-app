import { View, Text, StyleSheet } from 'react-native';

export default function Groups() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups</Text>
      <Text>Create static or event groups; invite via QR or link.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 }
});

