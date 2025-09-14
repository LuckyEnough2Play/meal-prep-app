import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Link href="/(main)/meals" style={styles.link}>Meal Discovery</Link>
      <Link href="/(main)/plan" style={styles.link}>Plans</Link>
      <Link href="/(main)/list" style={styles.link}>Shopping List</Link>
      <Link href="/(main)/groups" style={styles.link}>Groups</Link>
      <Link href="/(main)/prices" style={styles.link}>Prices & Stores</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  link: { fontSize: 18, color: '#07a', marginBottom: 12 }
});
