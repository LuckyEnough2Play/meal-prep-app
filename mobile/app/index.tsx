import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marble Meal Planner</Text>
      <Text style={styles.subtitle}>Local-first. Private. Mobile-only.</Text>
      <Link href="/(onboarding)/profile" style={styles.link}>
        Start Setup
      </Link>
      <Link href="/(main)/home" style={styles.linkSecondary}>
        Explore App
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 24 },
  link: { fontSize: 18, color: '#0a7', marginBottom: 8 },
  linkSecondary: { fontSize: 16, color: '#07a' }
});

