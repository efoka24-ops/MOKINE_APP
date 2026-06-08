import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/dashboard' : 'http://localhost:3000/dashboard';

export default function App() {
  const [rawUrl, setRawUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const normalizedUrl = useMemo(() => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `http://${trimmed}`;
  }, [rawUrl]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MOKINE Mobile (Expo Go)</Text>
        <Text style={styles.subtitle}>Collez ici l'URL web Mokine accessible depuis votre telephone</Text>
        <View style={styles.row}>
          <TextInput
            value={rawUrl}
            onChangeText={setRawUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.x.x:3000/dashboard"
            style={styles.input}
          />
          <TouchableOpacity style={styles.button} onPress={() => setRefreshKey((v) => v + 1)}>
            <Text style={styles.buttonText}>Ouvrir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.webContainer}>
        {!normalizedUrl ? (
          <View style={styles.centerContent}>
            <Text style={styles.helperText}>Entrez une URL valide.</Text>
          </View>
        ) : (
          <>
            <WebView
              key={refreshKey}
              source={{ uri: normalizedUrl }}
              javaScriptEnabled
              domStorageEnabled
              onLoadStart={() => {
                setIsLoading(true);
                setErrorMessage('');
              }}
              onLoadEnd={() => setIsLoading(false)}
              onError={(event) => {
                setIsLoading(false);
                setErrorMessage(event.nativeEvent.description || 'Impossible de charger la page');
              }}
            />
            {isLoading && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color="#178a3b" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            )}
            {!!errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Connexion impossible</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </>
        )}
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faf8',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe7df',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    color: '#4b5563',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#178a3b',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  webContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    color: '#4b5563',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  loadingText: {
    marginTop: 8,
    color: '#374151',
    fontWeight: '500',
  },
  errorBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  errorTitle: {
    color: '#991b1b',
    fontWeight: '700',
    marginBottom: 4,
  },
  errorText: {
    color: '#7f1d1d',
    fontSize: 12,
  },
});
