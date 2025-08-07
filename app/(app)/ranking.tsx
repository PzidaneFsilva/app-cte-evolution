// Arquivo: app/(app)/ranking.tsx (VERSÃO COM NOVO BOTÃO DE CONFIGURAÇÕES)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { collection, doc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../../src/config/firebaseConfig';
import { useCountdown } from '../../src/hooks/useCountdown';

// --- Tipos ---
type Desafio = { id: string; nome: string; dataFim: { toDate: () => Date }; ativo: boolean; };
type Usuario = { id: string; nomeCompleto: string; profilePicUrl?: string; };
type RankedUser = Usuario & { checkins: number; rank: number; };

// --- Componentes Visuais ---

const PodiumPlaceholder = () => (
  <View style={styles.podiumContainer}>
    <View style={styles.podiumItem}>
      <View style={[styles.podiumCircle, styles.silver]}><Text style={styles.podiumRank}>2</Text></View>
      <Text style={styles.podiumLabel}>Segundo</Text>
    </View>
    <View style={styles.podiumItem}>
      <View style={[styles.podiumCircle, styles.gold]}><Text style={styles.podiumRank}>1</Text></View>
      <Text style={styles.podiumLabel}>Primeiro</Text>
    </View>
    <View style={styles.podiumItem}>
      <View style={[styles.podiumCircle, styles.bronze]}><Text style={styles.podiumRank}>3</Text></View>
      <Text style={styles.podiumLabel}>Terceiro</Text>
    </View>
  </View>
);

const WaitingForChallengeView = ({ isJoining, onParticiparClick, challengeActive }: { isJoining: boolean; onParticiparClick: () => void; challengeActive: boolean; }) => (
    <View style={styles.waitingContainer}>
        <PodiumPlaceholder />
        <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
                {challengeActive ? "Um novo desafio começou!" : "Aguardando um novo desafio"}
            </Text>
            <Text style={styles.infoSubtitle}>
                {challengeActive ? "Clique em participar para entrar no ranking e mostrar suas habilidades!" : "Prepare-se para o próximo desafio e mostre suas habilidades no pódio!"}
            </Text>
            <TouchableOpacity
                style={challengeActive ? styles.participateButton : styles.participateButtonDisabled}
                disabled={!challengeActive || isJoining}
                onPress={onParticiparClick}
            >
                {isJoining ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{challengeActive ? 'Participar' : 'Aguarde...'}</Text>}
            </TouchableOpacity>
        </View>
    </View>
);

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
    const [days, hours, minutes, seconds] = useCountdown(targetDate);
    if (days + hours + minutes + seconds <= 0) {
        return <Text style={styles.timerText}>Desafio Encerrado!</Text>;
    }
    return (
        <Text style={styles.timerText}>{`${days}d ${hours}h ${minutes}m ${seconds}s`}</Text>
    );
};

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    const first = names[0]?.[0] || '';
    const last = names.length > 1 ? names[names.length - 1]?.[0] || '' : '';
    return `${first}${last}`.toUpperCase();
};

const renderPodiumItem = (user: RankedUser, position: number) => {
    let positionStyle;
    if (position === 1) positionStyle = styles.firstPlace;
    if (position === 2) positionStyle = styles.secondPlace;
    if (position === 3) positionStyle = styles.thirdPlace;

    let borderStyle;
    if (position === 1) borderStyle = styles.goldBorder;
    if (position === 2) borderStyle = styles.silverBorder;
    if (position === 3) borderStyle = styles.bronzeBorder;

    return (
      <View style={[styles.winnerPodiumItem, positionStyle]}>
        <Text style={styles.winnerPosition}>{position}º</Text>
        <View style={[styles.winnerPhotoContainer, borderStyle]}>
          {user.profilePicUrl ? (
              <Image source={{ uri: user.profilePicUrl }} style={styles.winnerPhoto} />
          ) : (
              <View style={styles.initialsContainerPodium}><Text style={styles.initialsTextPodium}>{getInitials(user.nomeCompleto)}</Text></View>
          )}
        </View>
        <Text style={styles.winnerName} numberOfLines={1}>{user.nomeCompleto}</Text>
        <Text style={styles.winnerCheckins}>{user.checkins} check-ins</Text>
      </View>
    );
};

// --- Componente Principal ---
export default function RankingScreen() {
    const { user, userData } = useAuth();
    const navigation = useNavigation();
    const isAdmin = userData?.role === 'administrador' || userData?.role === 'staff';

    const [desafio, setDesafio] = useState<Desafio | null>(null);
    const [ranking, setRanking] = useState<RankedUser[]>([]);
    const [isParticipating, setIsParticipating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [currentUserRank, setCurrentUserRank] = useState<RankedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [validating, setValidating] = useState(false);
    const [isCheckinWindowActive, setIsCheckinWindowActive] = useState(false);


    const handleParticipar = async () => {
        if (!user || !desafio || !desafio.ativo) return;
        setIsJoining(true);
        try {
            const participanteRef = doc(firestore, `desafios/${desafio.id}/participantes`, user.uid);
            await setDoc(participanteRef, {
                nomeCompleto: userData?.nomeCompleto || 'Usuário',
                profilePicUrl: userData?.profilePicUrl || '',
                checkins: 0,
            });
            setIsParticipating(true);
            Alert.alert("Sucesso!", "Você está participando do desafio. Boa sorte!");
        } catch (error) {
            console.error("Erro ao participar do desafio:", error);
            Alert.alert("Erro", "Não foi possível se inscrever no desafio.");
        } finally {
            setIsJoining(false);
        }
    };

    const fetchRankingData = useCallback(async () => {
        try {
            let qDesafio = query(collection(firestore, "desafios"), where("ativo", "==", true), limit(1));
            let desafioSnap = await getDocs(qDesafio);
            let isChallengeActive = !desafioSnap.empty;

            if (!isChallengeActive) {
                qDesafio = query(collection(firestore, "desafios"), where("ativo", "==", false), orderBy("dataFim", "desc"), limit(1));
                desafioSnap = await getDocs(qDesafio);
            }

            if (desafioSnap.empty) {
                setDesafio(null); 
                setRanking([]);
                return;
            }

            const desafioDoc = desafioSnap.docs[0];
            const desafioData = { id: desafioDoc.id, ...desafioDoc.data() } as Desafio;
            const participantesSnap = await getDocs(collection(firestore, `desafios/${desafioDoc.id}/participantes`));
            const participantesData = participantesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RankedUser));

            participantesData.sort((a, b) => b.checkins - a.checkins || a.nomeCompleto.localeCompare(b.nomeCompleto));
            let currentRank = 0;
            let lastCheckins = -1;
            const finalRanking = participantesData.map((u, index) => {
                if (u.checkins !== lastCheckins) { currentRank = index + 1; }
                lastCheckins = u.checkins;
                return { ...u, rank: currentRank };
            });

            if (user) {
                const meuRank = finalRanking.find(u => u.id === user.uid);
                if (meuRank) {
                    setIsParticipating(true);
                    setCurrentUserRank(meuRank);
                } else {
                    setIsParticipating(false);
                    setCurrentUserRank(null);
                }
            }
            setDesafio(desafioData);
            setRanking(finalRanking);

        } catch (error) {
            console.error("Erro ao buscar ranking:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.uid]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRankingData();
    }, [fetchRankingData]);
    
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchRankingData();
        }, [fetchRankingData])
    );

    useEffect(() => {
        if (!desafio?.ativo || isAdmin || !user?.uid) {
            setIsCheckinWindowActive(false);
            return;
        }
        const checkScheduledClasses = async () => {
            const hoje = new Date();
            const dataFormatada = hoje.toISOString().split('T')[0];
            const qTurmas = query(collection(firestore, "turmas"), where("data", "==", dataFormatada), where("inscritos", "array-contains", user.uid));
            const turmasSnap = await getDocs(qTurmas);
            if (turmasSnap.empty) {
                setIsCheckinWindowActive(false);
                return;
            }
            let isWindowActive = false;
            turmasSnap.forEach((doc) => {
                const turma = doc.data();
                const [horaFim, minutoFim] = turma.horario.split(' - ')[1].split(':').map(Number);
                const horarioFim = new Date();
                horarioFim.setHours(horaFim, minutoFim, 0, 0);
                const inicioJanela = new Date(horarioFim.getTime() - 5 * 60000);
                const fimJanela = new Date(horarioFim.getTime() + 15 * 60000);
                if (hoje >= inicioJanela && hoje <= fimJanela) isWindowActive = true;
            });
            setIsCheckinWindowActive(isWindowActive);
        };
        checkScheduledClasses();
        const interval = setInterval(checkScheduledClasses, 30000);
        return () => clearInterval(interval);
    }, [desafio, user?.uid, isAdmin]);

    const handleValidarCheckin = async () => { /* ... Lógica futura de validação ... */ };

    const renderActiveChallenge = () => (
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{desafio?.nome || 'Desafio'}</Text>
          <View style={styles.cardContentRow}>
              <Text style={styles.cardLabel}>Tempo restante:</Text>
              {desafio && <CountdownTimer targetDate={desafio.dataFim.toDate()} />}
          </View>
      </View>

        {currentUserRank && (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Minha Posição</Text>
                <View style={styles.cardContentRow}>
                    <Text style={styles.myRankText}>{currentUserRank.rank}º Lugar</Text>
                    <Text style={styles.myCheckinsText}>{currentUserRank.checkins} check-ins</Text>
                </View>
            </View>
        )}

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Ranking Geral</Text>
            {ranking.length > 0 ? ranking.map((item) => (
                <View key={item.id} style={styles.listItem}>
                    <Text style={styles.listItemPosition}>{item.rank}</Text>
                    {item.profilePicUrl ? (
                        <Image source={{ uri: item.profilePicUrl }} style={styles.listPhoto} />
                    ) : (
                        <View style={styles.initialsContainerList}><Text style={styles.initialsTextList}>{getInitials(item.nomeCompleto)}</Text></View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.listName}>{item.nomeCompleto}</Text>
                        <Text style={styles.listCheckins}>{item.checkins} check-ins</Text>
                    </View>
                </View>
            )) : <Text style={styles.emptyText}>Seja o primeiro a pontuar!</Text>}
        </View>
      </ScrollView>
    );

    const renderFinishedChallenge = () => (
      <FlatList
        data={ranking.slice(3)}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={
          <>
            <View style={styles.finishedHeader}>
              <View style={styles.winnerPodiumContainer}>
                {ranking.length >= 2 && renderPodiumItem(ranking[1], 2)}
                {ranking.length >= 1 && renderPodiumItem(ranking[0], 1)}
                {ranking.length >= 3 && renderPodiumItem(ranking[2], 3)}
              </View>
            </View>

            {ranking.length === 0 && (
                 <View style={styles.emptyPodiumMessageContainer}>
                    <Text style={styles.emptyText}>Nenhum participante concluiu o desafio.</Text>
                </View>
            )}

            {ranking.length > 3 && <Text style={styles.rankingListTitle}>Demais Posições</Text>}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemPosition}>{item.rank}</Text>
            {item.profilePicUrl ? <Image source={{ uri: item.profilePicUrl }} style={styles.listPhoto} /> : <View style={styles.initialsContainerList}><Text style={styles.initialsTextList}>{getInitials(item.nomeCompleto)}</Text></View>}
            <View style={{ flex: 1 }}><Text style={styles.listName}>{item.nomeCompleto}</Text><Text style={styles.listCheckins}>{item.checkins} check-ins</Text></View>
          </View>
        )}
      />
    );

    const renderContent = () => {
        if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#005A9C" />;
        if (!desafio) return <WaitingForChallengeView challengeActive={false} isJoining={false} onParticiparClick={() => { }} />;
        if (desafio.ativo && !isParticipating) return <WaitingForChallengeView challengeActive={true} isJoining={isJoining} onParticiparClick={handleParticipar} />;
        if (desafio.ativo && isParticipating) return renderActiveChallenge();
        if (!desafio.ativo) return renderFinishedChallenge();
        return null;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}><Feather name="menu" size={26} color="#333" /></TouchableOpacity>
                <Text style={styles.headerTitle}>DESAFIOS</Text>
                <View style={{ width: 26 }} />
            </View>
            
            {renderContent()}
            
            {/* --- BOTÃO FAB ATUALIZADO --- */}
            {isAdmin && (
              <TouchableOpacity style={styles.fab} onPress={() => router.push('/(app)/criar-desafio')}>
                <Feather name="settings" size={28} color="#005A9C" />
              </TouchableOpacity>
            )}

            <Modal animationType="fade" transparent={true} visible={isCheckinWindowActive} onRequestClose={() => setIsCheckinWindowActive(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Validar Check-in</Text>
                        <Text style={styles.modalSubtitle}>Digite o código de 5 dígitos fornecido pelo coach para confirmar sua presença.</Text>
                        <TextInput style={styles.inputCodigo} placeholder="CÓDIGO" maxLength={5} autoCapitalize="characters" value={codigo} onChangeText={setCodigo}/>
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={[styles.modalButton, styles.buttonCancel]} onPress={() => setIsCheckinWindowActive(false)}><Text style={styles.textStyle}>Cancelar</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.buttonConfirm]} onPress={handleValidarCheckin} disabled={validating}>{validating ? <ActivityIndicator color="#fff" /> : <Text style={styles.textStyle}>Validar</Text>}</TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// --- Folha de Estilos ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f8ff' },
    scrollView: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ddd' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    waitingContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60, padding: 20, backgroundColor: '#f8f9fa' },
    podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 40 },
    podiumItem: { alignItems: 'center', marginHorizontal: 10 },
    podiumCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    gold: { backgroundColor: '#ffd700' },
    silver: { backgroundColor: '#c0c0c0' },
    bronze: { backgroundColor: '#cd7f32' },
    podiumRank: { fontSize: 32, fontWeight: 'bold', color: 'white' },
    podiumLabel: { fontSize: 14, fontWeight: '600', color: '#6c757d' },
    infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    infoTitle: { fontSize: 20, fontWeight: 'bold', color: '#343a40', marginBottom: 8, textAlign: 'center' },
    infoSubtitle: { fontSize: 15, color: '#6c757d', textAlign: 'center', marginBottom: 24 },
    participateButton: { backgroundColor: '#007bff', width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
    participateButtonDisabled: { backgroundColor: '#e9ecef', width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 15, marginTop: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, },
    cardContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardLabel: { fontSize: 15, color: '#666' },
    timerText: { fontSize: 16, fontWeight: 'bold', color: '#005A9C' },
    myRankText: { fontSize: 20, fontWeight: 'bold', color: '#005A9C' },
    myCheckinsText: { fontSize: 15, color: '#666' },
    listName: { fontSize: 16, fontWeight: '500' },
    listCheckins: { fontSize: 13, color: 'gray', marginTop: 2 },
    emptyText: { textAlign: 'center', paddingVertical: 20, color: 'gray' },
    listItemPosition: { fontSize: 15, fontWeight: 'bold', color: 'gray', width: 35, textAlign: 'center', marginRight: 5, },
    listPhoto: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
    initialsContainerList: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12, backgroundColor: '#005A9C', justifyContent: 'center', alignItems: 'center'},
    initialsTextList: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    
    finishedHeader: {
        backgroundColor: 'white',
        paddingBottom: 20,
        marginBottom: 10,
    },
    winnerPodiumContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingHorizontal: 10,
        minHeight: 220,
    },
    winnerPodiumItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    firstPlace: {
        height: '90%',
    },
    secondPlace: {
        height: '75%',
    },
    thirdPlace: {
        height: '60%',
    },
    winnerPhotoContainer: {
        borderRadius: 50,
        padding: 4,
        marginBottom: 8,
    },
    goldBorder: { backgroundColor: '#ffd700' },
    silverBorder: { backgroundColor: '#c0c0c0' },
    bronzeBorder: { backgroundColor: '#cd7f32' },
    winnerPhoto: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'white' },
    winnerPosition: { fontSize: 20, fontWeight: 'bold', color: '#343a40', marginBottom: 10 },
    winnerName: { fontWeight: 'bold', textAlign: 'center', marginTop: 8, fontSize: 14, paddingHorizontal: 2 },
    winnerCheckins: { fontSize: 12, color: 'gray' },
    initialsContainerPodium: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#005A9C' },
    initialsTextPodium: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    
    rankingListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
        backgroundColor: 'white'
    },
    listContentContainer: {
        paddingHorizontal: 15,
        backgroundColor: 'white',
    },
    emptyPodiumMessageContainer: {
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        backgroundColor: 'white',
        marginHorizontal: 0,
    },

    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    modalView: { width: '90%', margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    modalSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    inputCodigo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, letterSpacing: 8, width: '100%' },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
    modalButton: { borderRadius: 8, padding: 12, elevation: 2, flex: 1, marginHorizontal: 5, justifyContent: 'center', alignItems: 'center', height: 48 },
    buttonCancel: { backgroundColor: '#6c757d' },
    buttonConfirm: { backgroundColor: '#28a745' },
    textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
    
    // --- ESTILO DO BOTÃO FAB ATUALIZADO ---
    fab: {
      position: 'absolute',
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FFFFFF', // Fundo branco para um look mais "clean"
      justifyContent: 'center',
      alignItems: 'center',
      right: 30,
      bottom: 90,
      elevation: 4, // Sombra para Android
      shadowColor: '#000', // Sombra para iOS
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
});