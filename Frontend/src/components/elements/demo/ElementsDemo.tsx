import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, AuthButton } from '../index';

/**
 * ElementsDemo - WebForge Elements Showcase
 * 
 * Demonstrates the usage of canonical WebForge Elements
 * Shows how pure UI components receive actions via props
 */
export const ElementsDemo: React.FC = () => {
  const handlePress = (buttonType: string) => {
    console.log(`${buttonType} button pressed`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>WebForge Elements Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Canonical Button Variants</Text>
        
        <Button
          title="Primary Button"
          onPress={() => handlePress('Primary')}
          variant="primary"
          style={styles.buttonSpacing}
        />
        
        <Button
          title="Secondary Button"
          onPress={() => handlePress('Secondary')}
          variant="secondary"
          style={styles.buttonSpacing}
        />
        
        <Button
          title="Outline Button"
          onPress={() => handlePress('Outline')}
          variant="outline"
          style={styles.buttonSpacing}
        />
        
        <Button
          title="Loading Button"
          onPress={() => handlePress('Loading')}
          isLoading={true}
          style={styles.buttonSpacing}
        />
        
        <Button
          title="Disabled Button"
          onPress={() => handlePress('Disabled')}
          disabled={true}
          style={styles.buttonSpacing}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Button Variants</Text>
        
        <AuthButton
          authType="auth0"
          onPress={() => handlePress('Auth0')}
          style={styles.buttonSpacing}
        />
        
        <AuthButton
          authType="logout"
          onPress={() => handlePress('Logout')}
          style={styles.buttonSpacing}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.note}>
          Note: All buttons are pure UI components with no business logic.
          Actions are injected via props from smart containers.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#555',
  },
  buttonSpacing: {
    marginBottom: 10,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});