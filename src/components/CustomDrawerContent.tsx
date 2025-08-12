// Arquivo: src/components/CustomDrawerContent.tsx (VERSÃO ATUALIZADA)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { router, useSegments } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

interface CustomDrawerButtonProps {
  label: string;
  onPress: () => void;
  isActive: boolean;
  iconName?: keyof typeof Feather.glyphMap;
  badgeCount?: number;
}

const CustomDrawerButton = ({ label, iconName, onPress, isActive, badgeCount = 0 }: CustomDrawerButtonProps) => (
  <TouchableOpacity
    style={[styles.customButton, isActive && styles.customButtonActive]}
    onPress={onPress}
  >
    <View>
      <Feather
        name={iconName}
        size={22}
        color={badgeCount > 0 ? '#FFC107' : (isActive ? 'white' : '#555')}
        style={styles.icon}
      />
      {badgeCount > 0 && (
        <View style={styles.notificationBadgeDrawer}>
          <Text style={styles.notificationBadgeTextDrawer}>{badgeCount}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.customButtonText, isActive && styles.customButtonTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export default function CustomDrawerContent(props: any) {
  const { userData, isLoading } = useAuth();
  const segments = useSegments();
  const isAdminOrStaff = userData?.role === 'administrador' || userData?.role === 'staff';
  const unreadCount = useUnreadNotifications();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Erro ao fazer logout: ", error);
    }
  };

  const getInitials = () => {
    if (!userData?.nomeCompleto) return '..';
    const names = userData.nomeCompleto.split(' ');
    const firstInitial = names?.[0]?.[0] || '';
    const lastInitial = names?.length > 1 ? names?.[names.length - 1]?.[0] || '' : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const renderProfileHeader = () => {
    if (isLoading) {
      return (
        <View style={styles.profileContainer}>
          <ActivityIndicator color="#007bff" />
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.profileContainer} onPress={() => router.push('/(app)/perfil')}>
        {userData?.profilePicUrl ? (
          <Image source={{ uri: userData.profilePicUrl }} style={styles.profilePic} />
        ) : (
          <View style={[styles.profilePic, styles.initialsContainer]}>
            <Text style={styles.initialsText}>{getInitials()}</Text>
          </View>
        )}
        <Text style={styles.profileName}>{userData?.nomeCompleto || 'Visitante'}</Text>
      </TouchableOpacity>
    );
  };

  const activeRoute = segments?.[segments.length - 1];

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {renderProfileHeader()}

        <View style={styles.buttonsContainer}>
          <CustomDrawerButton
            label="Início"
            iconName="home"
            onPress={() => router.navigate('/(app)/(tabs)/feed')}
            isActive={activeRoute === 'feed'}
          />
          <CustomDrawerButton
            label="Notificações"
            iconName="bell"
            onPress={() => router.navigate('/(app)/notificacoes')}
            isActive={activeRoute === 'notificacoes'}
            badgeCount={unreadCount}
          />
          <CustomDrawerButton
            label="Nova Postagem"
            iconName="plus-square"
            onPress={() => router.navigate('/(app)/novo-post')}
            isActive={activeRoute === 'novo-post'}
          />
          <CustomDrawerButton
            label="Turmas disponíveis"
            iconName="calendar"
            onPress={() => router.navigate('/(app)/agenda')}
            isActive={activeRoute === 'agenda'}
          />
          <CustomDrawerButton
            label="Rankings"
            iconName="bar-chart-2"
            onPress={() => router.navigate('/(app)/ranking')}
            isActive={activeRoute === 'ranking'}
          />
           {/* A CONDIÇÃO PARA O BOTÃO "Enviar Aviso" FOI REMOVIDA */}
        </View>

      </DrawerContentScrollView>

      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="power" size={28} color="#dc3545" />
        </TouchableOpacity>
        <Text style={styles.logoutButtonText}>Sair</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    marginBottom: 25,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'white',
  },
  initialsContainer: {
    backgroundColor: '#005A9C',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#004a80',
  },
  initialsText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold'
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonsContainer: {
    paddingHorizontal: 15,
  },
  customButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  customButtonActive: {
    backgroundColor: '#007bff',
  },
  icon: {
    marginRight: 15,
  },
  customButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  customButtonTextActive: {
    color: 'white',
  },
  logoutSection: {
    alignItems: 'center',
    marginBottom: 60,
    paddingVertical: 20,
  },
  logoutButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButtonText: {
    marginTop: 10,
    color: '#555',
    fontSize: 14,
    fontWeight: '500'
  },
  notificationBadgeDrawer: {
    position: 'absolute',
    right: 10,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeTextDrawer: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});