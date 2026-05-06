import { View, StyleSheet, Text, Image, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Auth0LoginContainer } from '@/src/features/auth';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Colores del gradiente (hardcoded para evitar null/undefined)
const GRADIENT_COLORS = ['#1a1a1a', '#363636', '#2a2a2a'];

export default function LoginScreen() {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        style={styles.container}
      >
        <View style={styles.contentContainer}>
          {/* Logo de la Universidad */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/Logo_de_la_Universidad_de_Caldas.svg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Título */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>UniConnect</Text>
            <Text style={styles.subtitle}>Universidad de Caldas</Text>
            <View style={styles.divider} />
          </View>

          {/* Botón de Login */}
          <View style={styles.loginContainer}>
            <Auth0LoginContainer />
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Inicia sesión con tu cuenta institucional</Text>
        </View>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: 120,
    maxWidth: 250,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D9B97E',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    opacity: 0.9,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#D9B97E',
    borderRadius: 2,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 350,
    marginBottom: 30,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});