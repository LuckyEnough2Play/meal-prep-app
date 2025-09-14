import { View, Text, StyleSheet } from 'react-native';

export default function Meals() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meal Discovery</Text>
      <Text>Suggestions will respect your profile and selected stores.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 }
});

