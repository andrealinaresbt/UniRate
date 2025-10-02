// HomeScreen.jsx
import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Modal,
  Platform, StatusBar, FlatList, ActivityIndicator, Alert, Pressable, ScrollView
} from 'react-native'
import { Svg, Path } from 'react-native-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ProfessorService } from '../services/professorService'
import { useAuth } from '../services/AuthContext'
import { signOut, fetchIsAdmin } from '../services/AuthService'

const COLORS = {
  bg: '#F6F7F8',
  accent: '#FF8200',
  light: '#CFE1FB',
  blue: '#2B529A',
  navy: '#003087',
  text: '#000000',
  white: '#FFFFFF',
  border: '#E0E0E0',
}

const MenuIcon = (props) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M4 6h16M4 12h16M4 18h16" stroke={COLORS.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const MenuItem = ({ text, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuItemText}>{text}</Text>
  </TouchableOpacity>
)

export default function HomeScreen({ navigation }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    let alive = true
    if (user?.id) {
      fetchIsAdmin(user.id)
        .then(f => { if (alive) setIsAdmin(!!f) })
        .catch(() => setIsAdmin(false))
    } else {
      setIsAdmin(false)
    }
    return () => { alive = false }
  }, [user?.id])

  const handleSearch = async () => {
    if (!searchTerm.trim()) { setShowResults(false); return }
    setLoading(true); setShowResults(true)
    const result = await ProfessorService.searchProfessors(searchTerm)
    if (result.success) setProfessors(result.data || [])
    else { console.error('Error buscando:', result.error); setProfessors([]) }
    setLoading(false)
  }

  // Temporal: NO navegamos a "Professor" hasta que exista la pantalla
  const handleProfessorPress = (professor) => {
    Alert.alert('Profesor', `${professor.full_name}\n(la vista de perfil aún no está lista)`)
    // Cuando exista la pantalla:
    // navigation.navigate('Professor', { professorId: professor.id })
  }

  const renderProfessorItem = ({ item }) => (
    <TouchableOpacity style={styles.professorItem} onPress={() => handleProfessorPress(item)}>
      <Text style={styles.professorName}>{item.full_name}</Text>
      <Text style={styles.professorDepartment}>{item.department}</Text>
      <Text style={styles.professorScore}>⭐ {item.avg_score || 'N/A'}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar />

      {/* Menú lateral (Modal) */}
      <Modal
        animationType="fade"
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Opciones</Text>

            {!user ? (
              <>
                <MenuItem
                  text="Iniciar sesión"
                  onPress={() => { setMenuVisible(false); navigation.navigate('Login') }}
                />
                <MenuItem text="Configuración" onPress={() => { setMenuVisible(false) }} />
              </>
            ) : (
              <>
                <MenuItem text="Mi Perfil" onPress={() => { setMenuVisible(false) }} />
                <MenuItem text="Ver Materias" onPress={() => { setMenuVisible(false) }} />

                {/* ✅ NUEVO: Publicar Reseña (HU5) */}
                <MenuItem
                  text="Publicar Reseña"
                  onPress={() => {
                    setMenuVisible(false)
                    navigation.navigate('NuevaResena')
                  }}
                />

                <MenuItem text="Configuración" onPress={() => { setMenuVisible(false) }} />

                {isAdmin && (
                  <>
                    <View style={{ height: 12 }} />
                    <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Admin</Text>
                    <MenuItem
                      text="Panel admin"
                      onPress={() => { setMenuVisible(false); navigation.navigate('Admin') }}
                    />
                    <MenuItem
                      text="Gestión de profesores"
                      onPress={() => { setMenuVisible(false); navigation.navigate('AdminProfessors') }}
                    />
                  </>
                )}

                <MenuItem
                  text="Cerrar Sesión"
                  onPress={async () => {
                    try { await signOut() }
                    catch (e) { Alert.alert('Error', e.message || 'No se pudo cerrar sesión') }
                    finally { setMenuVisible(false) }
                  }}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <MenuIcon />
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>UNIRATE</Text>
        <Text style={styles.subtitle}>
          {user ? `Hola, ${user.email}` : 'Encuentra y califica a tus profesores'}
        </Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setMenuVisible(false)
            searchInputRef.current?.focus()
          }}
        >
          <TextInput
            ref={searchInputRef}
            style={styles.searchBar}
            placeholder="Buscar profesor por nombre o apellido..."
            placeholderTextColor="#888"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            onFocus={() => setMenuVisible(false)}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Buscar</Text>}
        </TouchableOpacity>

        {showResults ? (
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.blue} />
                <Text style={styles.loadingText}>Buscando profesores...</Text>
              </View>
            ) : professors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron profesores</Text>
                <Text style={styles.emptySubtext}>Intenta con otro nombre</Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                <Text style={styles.resultsTitle}>Resultados de búsqueda:</Text>
                <FlatList
                  data={professors}
                  renderItem={renderProfessorItem}
                  keyExtractor={(item) => String(item.id)}
                  style={styles.professorList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>👆 Busca un profesor para comenzar</Text>
            <Text style={styles.welcomeSubtext}>Escribe el nombre o apellido en la barra de arriba</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    left: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  menuButton: { padding: 10 },

  container: { flex: 1, paddingHorizontal: 20, paddingTop: 80 },
  title: { fontSize: 48, fontWeight: 'bold', color: COLORS.navy, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },

  searchBar: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.text,
    borderColor: COLORS.light,
    borderWidth: 1,
    marginBottom: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },

  resultsContainer: { flex: 1, marginTop: 10 },
  resultsList: { flex: 1 },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: COLORS.navy, marginBottom: 10 },
  professorList: { flex: 1 },
  professorItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: COLORS.border,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  professorName: { fontSize: 18, fontWeight: 'bold', color: COLORS.navy },
  professorDepartment: { fontSize: 14, color: '#666', marginTop: 5 },
  professorScore: { fontSize: 14, color: COLORS.blue, marginTop: 5, fontWeight: '600' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  welcomeText: { fontSize: 18, color: COLORS.blue, textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  welcomeSubtext: { fontSize: 14, color: '#666', textAlign: 'center' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    width: '78%',
    height: '100%',
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  menuTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.navy, marginBottom: 30 },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuItemText: { fontSize: 18, color: '#333' },
})

