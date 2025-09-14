import { View, Text, StyleSheet } from 'react-native';

export default function Plan() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plans</Text>
      <Text>Create weekly or event-based plans with budget targets.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 }
});

