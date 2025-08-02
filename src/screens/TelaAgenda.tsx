// Arquivo: src/screens/TelaAgenda.tsx (VERSÃO COM CABEÇALHO MODERNIZADO)

import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { addDays, addMonths, differenceInCalendarDays, format, getDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient'; // <-- IMPORTAÇÃO DO DEGRADÊ
import { useNavigation } from 'expo-router';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, runTransaction, where, writeBatch } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { firestore } from '../../src/config/firebaseConfig';
import { useAuth } from '../../src/context/AuthContext';

// Configuração do calendário
LocaleConfig.locales['pt-br'] = { monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'], monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'], dayNamesShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'], today: 'Hoje' };
LocaleConfig.defaultLocale = 'pt-br';

// Tipos de dados
type Turma = { id: string; horario: string; titulo: string; coach: string; vagas: number; inscritos: string[]; };
type UsuarioSimples = { id: string; nome: string; };
type AtividadeDiaria = { inscricoes: number; cancelamentos: number; };

export default function TelaAgenda() {
    
    const navigation = useNavigation();
    const { user, userData } = useAuth();
    const [dataSelecionada, setDataSelecionada] = useState(new Date());
    const [calendarioVisivel, setCalendarioVisivel] = useState(false);
    const [turmasDoDia, setTurmasDoDia] = useState<Turma[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const HORARIOS_SEMANA = ['06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00','09:00 - 10:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00'];
    const HORARIOS_LPO_TER_QUI = ['17:00 - 18:00', '19:00 - 20:00'];
    const [modalAdicionarVisivel, setModalAdicionarVisivel] = useState(false);
    const [modalCoachVisivel, setModalCoachVisivel] = useState(false);
    const [modalParticipantesVisivel, setModalParticipantesVisivel] = useState(false);
    const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([]);
    const [dataInicio, setDataInicio] = useState(new Date());
    const [dataFim, setDataFim] = useState(addMonths(new Date(), 1));
    const [isPickerParaInicio, setIsPickerParaInicio] = useState(true);
    const [listaDeCoaches, setListaDeCoaches] = useState<UsuarioSimples[]>([]);
    const [coachSelecionado, setCoachSelecionado] = useState<UsuarioSimples | null>(null);
    const [tipoDeAula, setTipoDeAula] = useState<'Crossfuncional' | 'L.P.O'>('Crossfuncional');
    const [diasSelecionados, setDiasSelecionados] = useState<number[]>([]);
    const [vagas, setVagas] = useState('30');
    const [atividadeDiaria, setAtividadeDiaria] = useState<AtividadeDiaria>({ inscricoes: 0, cancelamentos: 0 });
    const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
    const [participantes, setParticipantes] = useState<UsuarioSimples[]>([]);
    const [carregandoParticipantes, setCarregandoParticipantes] = useState(false);

    useEffect(() => { if (tipoDeAula === 'Crossfuncional') setVagas('30'); else if (tipoDeAula === 'L.P.O') setVagas('20'); }, [tipoDeAula]);
    useEffect(() => { const buscarDados = async () => { setCarregando(true); setTurmasDoDia([]); const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd'); try { const qTurmas = query(collection(firestore, "turmas"), where("data", "==", dataFormatada)); const snapTurmas = await getDocs(qTurmas); const turmasBuscadas = snapTurmas.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turma)).sort((a, b) => a.horario.localeCompare(b.horario)); setTurmasDoDia(turmasBuscadas); if (user && userData?.role === 'aluno') { const atividadeRef = doc(firestore, `usuarios/${user.uid}/atividadesDiarias`, dataFormatada); const snapAtividade = await getDoc(atividadeRef); setAtividadeDiaria(snapAtividade.exists() ? snapAtividade.data() as AtividadeDiaria : { inscricoes: 0, cancelamentos: 0 }); } } catch (error) { console.error("Erro ao buscar dados da agenda: ", error); Alert.alert("Erro", "Não foi possível carregar a agenda."); } finally { setCarregando(false); } }; buscarDados(); }, [dataSelecionada, user, userData]);
    useEffect(() => { const buscarCoaches = async () => { try { const q = query(collection(firestore, "usuarios"), where("status", "==", "aprovado")); const querySnapshot = await getDocs(q); setListaDeCoaches(querySnapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nomeCompleto }))); } catch (error) { console.error("Erro ao buscar coaches: ", error); } }; if (modalAdicionarVisivel) { buscarCoaches(); } }, [modalAdicionarVisivel]);

    const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
    const handleInscricao = async (turma: Turma) => { if (!user || salvando) return; if (atividadeDiaria.inscricoes >= 2) { Alert.alert("Limite Atingido", "Você já se inscreveu no número máximo de 2 aulas para hoje."); return; } setSalvando(true); try { await runTransaction(firestore, async (transaction) => { const turmaRef = doc(firestore, "turmas", turma.id); const atividadeRef = doc(firestore, `usuarios/${user.uid}/atividadesDiarias`, format(dataSelecionada, 'yyyy-MM-dd')); const turmaDoc = await transaction.get(turmaRef); if (!turmaDoc.exists() || turmaDoc.data().vagas <= 0) { throw new Error("Vagas esgotadas ou turma não encontrada!"); } transaction.update(turmaRef, { inscritos: arrayUnion(user.uid), vagas: turmaDoc.data().vagas - 1, }); transaction.set(atividadeRef, { inscricoes: (atividadeDiaria.inscricoes || 0) + 1, cancelamentos: atividadeDiaria.cancelamentos || 0 }, { merge: true }); }); Alert.alert("Sucesso!", `Você foi inscrito na aula de ${turma.titulo}.`); setTurmasDoDia(prev => prev.map(t => t.id === turma.id ? { ...t, vagas: t.vagas - 1, inscritos: [...t.inscritos, user.uid] } : t)); setAtividadeDiaria(prev => ({ ...prev, inscricoes: prev.inscricoes + 1 })); } catch (error) { console.error("Erro na inscrição:", error); Alert.alert("Erro", "Não foi possível realizar a inscrição. Tente novamente."); } finally { setSalvando(false); } };
    const handleCancelarInscricao = (turma: Turma) => { if (!user || salvando) return; if (atividadeDiaria.cancelamentos >= 2) { Alert.alert("Limite Atingido", "Você já atingiu o limite de cancelamentos por hoje e não pode se inscrever em novas aulas."); return; } const mensagemAlerta = atividadeDiaria.cancelamentos === 1 ? "Este é seu último cancelamento do dia. Após confirmar, você não poderá se inscrever em nenhuma outra aula hoje. Deseja continuar?" : `Tem certeza que deseja cancelar sua inscrição?`; Alert.alert("Atenção", mensagemAlerta, [{ text: "Não", style: "cancel" }, { text: "Sim, Cancelar", style: "destructive", onPress: async () => { setSalvando(true); try { await runTransaction(firestore, async (transaction) => { const turmaRef = doc(firestore, "turmas", turma.id); const atividadeRef = doc(firestore, `usuarios/${user.uid}/atividadesDiarias`, format(dataSelecionada, 'yyyy-MM-dd')); transaction.update(turmaRef, { inscritos: arrayRemove(user.uid), vagas: turma.vagas + 1, }); transaction.set(atividadeRef, { inscricoes: atividadeDiaria.inscricoes, cancelamentos: (atividadeDiaria.cancelamentos || 0) + 1, }, { merge: true }); }); Alert.alert("Cancelado", "Sua inscrição foi cancelada."); setTurmasDoDia(prev => prev.map(t => t.id === turma.id ? { ...t, vagas: t.vagas + 1, inscritos: t.inscritos.filter(uid => uid !== user.uid) } : t)); setAtividadeDiaria(prev => ({ ...prev, cancelamentos: prev.cancelamentos + 1 })); } catch (error) { console.error("Erro no cancelamento:", error); Alert.alert("Erro", "Não foi possível cancelar a inscrição."); } finally { setSalvando(false); } } }]); };
    const handleVerInscritos = async (turma: Turma) => { setTurmaSelecionada(turma); setModalParticipantesVisivel(true); if (turma.inscritos.length === 0) { setParticipantes([]); return; } setCarregandoParticipantes(true); try { const q = query(collection(firestore, 'usuarios'), where('__name__', 'in', turma.inscritos)); const snap = await getDocs(q); const nomes = snap.docs.map(doc => ({ id: doc.id, nome: doc.data().nomeCompleto })); setParticipantes(nomes); } catch (error) { console.error("Erro ao buscar participantes: ", error); Alert.alert("Erro", "Não foi possível carregar a lista de inscritos."); setParticipantes([]); } finally { setCarregandoParticipantes(false); } };
    const handleSalvarTurmas = async () => { if (!coachSelecionado || horariosSelecionados.length === 0 || diasSelecionados.length === 0 || differenceInCalendarDays(dataFim, dataInicio) < 0) { Alert.alert("Atenção", "Preencha todos os campos corretamente."); return; } if (salvando) return; setSalvando(true); let turmasCriadas = 0; try { const batch = writeBatch(firestore); const totalDias = differenceInCalendarDays(dataFim, dataInicio); const hoje = new Date(); for (let i = 0; i <= totalDias; i++) { const diaAtual = addDays(dataInicio, i); if (diasSelecionados.includes(getDay(diaAtual))) { const dataFormatada = format(diaAtual, 'yyyy-MM-dd'); horariosSelecionados.forEach(horario => { const horaInicioTurma = parseInt(horario.split(':')[0]); if (format(diaAtual, 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd') && horaInicioTurma <= hoje.getHours()) return; const novaTurmaRef = doc(collection(firestore, "turmas")); batch.set(novaTurmaRef, { data: dataFormatada, horario: horario, titulo: tipoDeAula, coach: coachSelecionado.nome, vagas: parseInt(vagas, 10), inscritos: [] }); turmasCriadas++; }); } } if (turmasCriadas > 0) { await batch.commit(); Alert.alert("Sucesso!", `${turmasCriadas} turma(s) foram criadas.`); setModalAdicionarVisivel(false); setHorariosSelecionados([]); setDiasSelecionados([]); setCoachSelecionado(null); setDataSelecionada(dataInicio); } else { Alert.alert("Nenhuma Turma Criada", "Verifique se os horários para hoje já passaram."); } } catch (error) { console.error("Erro ao criar turmas:", error); Alert.alert("Erro", "Ocorreu um erro ao salvar as turmas."); } finally { setSalvando(false); } };
    const handleToggleHorario = (horario: string) => { setHorariosSelecionados(prev => prev.includes(horario) ? prev.filter(h => h !== horario) : [...prev, horario]); };
    const handleToggleDia = (dia: number) => { setDiasSelecionados(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]); };
    const deletarTurma = async (turmaId: string) => { try { await deleteDoc(doc(firestore, "turmas", turmaId)); Alert.alert("Sucesso", "A turma foi removida."); setTurmasDoDia(prev => prev.filter(t => t.id !== turmaId)); } catch (error) { console.error("Erro ao deletar turma:", error); Alert.alert("Erro", "Não foi possível remover a turma."); } };
    const diasDaSemana = useMemo(() => { const inicioDaSemana = startOfWeek(dataSelecionada, { weekStartsOn: 0 }); return Array.from({ length: 7 }).map((_, i) => { const dia = addDays(inicioDaSemana, i); return { id: format(dia, 'yyyy-MM-dd'), diaSemana: format(dia, 'E', { locale: ptBR }).charAt(0).toUpperCase(), diaMes: format(dia, 'd'), dataCompleta: dia }; }); }, [dataSelecionada]);
    const nomeDoMes = useMemo(() => format(dataSelecionada, 'MMMM', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase()), [dataSelecionada]);

    const TurmaCard = ({ item }: { item: Turma }) => { const isAdminOuStaff = userData?.role === 'administrador' || userData?.role === 'staff'; const isAluno = userData?.role === 'aluno'; const isAlunoInscrito = isAluno && user ? item.inscritos.includes(user.uid) : false; const borderColor = item.titulo === 'L.P.O' ? '#FFA726' : '#29B6F6'; const handlePress = () => { if (isAdminOuStaff) { handleVerInscritos(item); } else if (isAluno) { isAlunoInscrito ? handleCancelarInscricao(item) : handleInscricao(item); } }; const handleLongPress = () => { if (isAdminOuStaff) { Alert.alert("Remover Turma", `Deseja remover a aula de ${item.titulo} às ${item.horario}?`, [{ text: "Não", style: "cancel" }, { text: "Sim", style: "destructive", onPress: () => deletarTurma(item.id) }]); } }; const capacidadeTotal = item.vagas + item.inscritos.length; return (<TouchableOpacity onPress={handlePress} onLongPress={handleLongPress} delayLongPress={700} style={[styles.turmaCard, { borderColor }, isAlunoInscrito && styles.cardInscrito]} disabled={salvando || (isAluno && item.vagas === 0 && !isAlunoInscrito)}><View style={styles.turmaInfo}><Feather name={isAlunoInscrito ? "check-circle" : (isAdminOuStaff ? "users" : "clock")} size={20} color={isAlunoInscrito ? '#28a745' : '#555'} /><View style={styles.turmaTextos}><Text style={styles.turmaHorario}>{item.horario}</Text><Text style={styles.turmaTitulo}>{item.titulo} com {item.coach}</Text></View></View>{isAdminOuStaff ? (<View style={styles.botaoAdmin}><Text style={styles.textoBotaoAdmin}>{`${item.inscritos.length} / ${capacidadeTotal}`}</Text></View>) : isAluno ? (<View style={isAlunoInscrito ? styles.botaoInscrito : item.vagas === 0 ? styles.botaoLotado : styles.botaoAgendar}><Text style={isAlunoInscrito ? styles.textoBotaoInscrito : item.vagas === 0 ? styles.textoBotaoLotado : styles.textoBotaoAgendar}>{isAlunoInscrito ? 'Inscrito' : item.vagas > 0 ? `${item.vagas} vagas` : 'Lotado'}</Text></View>) : null}</TouchableOpacity>); };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#004A80', '#005A9C']} style={styles.calendarioContainer}>
                <View style={styles.mesSelector}><TouchableOpacity onPress={openDrawer}><Feather name="chevron-left" size={30} color="white" /></TouchableOpacity><TouchableOpacity style={styles.mesBotao} onPress={() => setCalendarioVisivel(true)}><Text style={styles.mesTexto}>{nomeDoMes}</Text><Feather name="calendar" size={24} color="white" style={{ marginLeft: 10 }}/></TouchableOpacity><View style={{width: 30}}/></View>
                <FlatList data={diasDaSemana} horizontal showsHorizontalScrollIndicator={false} keyExtractor={item => item.id} contentContainerStyle={{ paddingHorizontal: 10 }} renderItem={({ item }) => (<TouchableOpacity style={styles.diaContainer} onPress={() => setDataSelecionada(item.dataCompleta)}><Text style={[styles.diaSemanaTexto, item.id === format(dataSelecionada, 'yyyy-MM-dd') && styles.diaTextoSelecionadoFixo]}>{item.diaSemana}</Text><View style={[styles.diaMesContainer, item.id === format(dataSelecionada, 'yyyy-MM-dd') && styles.diaSelecionado]}><Text style={[styles.diaMesTexto, item.id === format(dataSelecionada, 'yyyy-MM-dd') && styles.diaTextoSelecionado]}>{item.diaMes}</Text></View></TouchableOpacity>)} />
            </LinearGradient>

            <View style={styles.listaContainer}>{carregando ? (<ActivityIndicator style={{ marginTop: 50 }} size="large" color="#005A9C" />) : turmasDoDia.length > 0 ? (<FlatList data={turmasDoDia} keyExtractor={item => item.id} renderItem={TurmaCard} contentContainerStyle={{ padding: 20 }} />) : (<View style={styles.descansoContainer}><Feather name="coffee" size={60} color="#ccc" /><Text style={styles.descansoTitulo}>Dia de descanso!</Text><Text style={styles.descansoSubtitulo}>Nenhuma turma cadastrada.</Text></View>)}</View>

            {(userData?.role === 'administrador' || userData?.role === 'staff') && (<TouchableOpacity style={styles.fab} onPress={() => setModalAdicionarVisivel(true)}><Feather name="plus" size={28} color="white" /></TouchableOpacity>)}
            
            <Modal visible={modalParticipantesVisivel} transparent={true} animationType="fade" onRequestClose={() => setModalParticipantesVisivel(false)}><View style={styles.modalContainer}><View style={styles.pickerModalView}><Text style={styles.modalTitle}>Inscritos - {turmaSelecionada?.titulo}</Text><Text style={styles.modalSubtitle}>{turmaSelecionada?.horario}</Text>{carregandoParticipantes ? (<ActivityIndicator size="large" color="#005A9C" style={{ marginVertical: 20 }}/>) : participantes.length > 0 ? (<FlatList data={participantes} keyExtractor={(item) => item.id} renderItem={({ item }) => (<View style={styles.participanteItem}><Text style={styles.participanteNome}>{item.nome}</Text></View>)} style={{ width: '100%', maxHeight: 300 }} />) : (<Text style={styles.semInscritosTexto}>Nenhum aluno inscrito nesta turma.</Text>)}<TouchableOpacity onPress={() => setModalParticipantesVisivel(false)}><Text style={styles.fecharModalTexto}>Fechar</Text></TouchableOpacity></View></View></Modal>
            <Modal visible={modalAdicionarVisivel} transparent={true} animationType="slide" onRequestClose={() => setModalAdicionarVisivel(false)}><View style={styles.modalFormContainer}><ScrollView style={styles.modalFormView}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Adicionar Turmas</Text><TouchableOpacity onPress={() => setModalAdicionarVisivel(false)}><Feather name="x" size={24} color="#333" /></TouchableOpacity></View><Text style={styles.label}>Tipo de Aula</Text><View style={styles.optionGroup}><TouchableOpacity style={[styles.optionButton, tipoDeAula === 'Crossfuncional' && styles.optionSelected]} onPress={() => setTipoDeAula('Crossfuncional')}><Text style={[styles.optionText, tipoDeAula === 'Crossfuncional' && styles.optionTextSelected]}>Crossfuncional</Text></TouchableOpacity><TouchableOpacity style={[styles.optionButton, tipoDeAula === 'L.P.O' && styles.optionSelected]} onPress={() => setTipoDeAula('L.P.O')}><Text style={[styles.optionText, tipoDeAula === 'L.P.O' && styles.optionTextSelected]}>L.P.O</Text></TouchableOpacity></View><Text style={styles.label}>Dias da Semana</Text><View style={styles.diasContainer}>{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((diaLabel, index) => (<TouchableOpacity key={index} style={[styles.diaButton, diasSelecionados.includes(index) && styles.diaButtonSelected]} onPress={() => handleToggleDia(index)}><Text style={[styles.diaButtonText, diasSelecionados.includes(index) && styles.diaButtonTextSelected]}>{diaLabel}</Text></TouchableOpacity>))}</View><Text style={styles.label}>Horários</Text><View style={styles.horariosContainer}>{(tipoDeAula === 'L.P.O' ? HORARIOS_LPO_TER_QUI : HORARIOS_SEMANA).map(horario => (<TouchableOpacity key={horario} style={[styles.horarioButton, horariosSelecionados.includes(horario) && styles.optionSelected]} onPress={() => handleToggleHorario(horario)}><Text style={[styles.horarioText, horariosSelecionados.includes(horario) && styles.optionTextSelected]}>{horario.split(' - ')[0]}</Text></TouchableOpacity>))}</View><View style={styles.row}><View style={styles.inputWrapper}><Text style={styles.label}>Início</Text><TouchableOpacity style={styles.input} onPress={() => { setIsPickerParaInicio(true); setCalendarioVisivel(true); }}><Text style={styles.inputText}>{format(dataInicio, 'dd/MM/yyyy')}</Text></TouchableOpacity></View><View style={styles.inputWrapper}><Text style={styles.label}>Fim</Text><TouchableOpacity style={styles.input} onPress={() => { setIsPickerParaInicio(false); setCalendarioVisivel(true); }}><Text style={styles.inputText}>{format(dataFim, 'dd/MM/yyyy')}</Text></TouchableOpacity></View></View><View style={styles.row}><View style={styles.inputWrapper}><Text style={styles.label}>Vagas</Text><TextInput style={styles.input} value={vagas} onChangeText={setVagas} keyboardType="numeric" /></View><View style={styles.inputWrapper}><Text style={styles.label}>Coach</Text><TouchableOpacity style={styles.input} onPress={() => setModalCoachVisivel(true)}><Text style={styles.inputText} numberOfLines={1}>{coachSelecionado ? coachSelecionado.nome : 'Selecionar...'}</Text></TouchableOpacity></View></View><TouchableOpacity style={styles.saveButton} onPress={handleSalvarTurmas} disabled={salvando}>{salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Criar Turmas</Text>}</TouchableOpacity></ScrollView></View></Modal>
            <Modal visible={calendarioVisivel} transparent={true} animationType="fade"><View style={styles.modalContainer}><View style={styles.calendarPopup}><Calendar current={modalAdicionarVisivel ? (isPickerParaInicio ? format(dataInicio, 'yyyy-MM-dd') : format(dataFim, 'yyyy-MM-dd')) : format(dataSelecionada, 'yyyy-MM-dd')} minDate={format(new Date(), 'yyyy-MM-dd')} onDayPress={(day) => { const novaData = new Date(day.timestamp + (new Date().getTimezoneOffset() * 60000)); if (modalAdicionarVisivel) { if (isPickerParaInicio) { setDataInicio(novaData); if (differenceInCalendarDays(dataFim, novaData) < 0) setDataFim(novaData); } else { if (differenceInCalendarDays(novaData, dataInicio) < 0) { Alert.alert("Data Inválida", "A data de fim não pode ser anterior à de início."); return; } setDataFim(novaData); } } else { setDataSelecionada(novaData); } setCalendarioVisivel(false); }} monthFormat={'MMMM yyyy'} theme={{ todayTextColor: '#005A9C', arrowColor: '#005A9C', selectedDayBackgroundColor: '#005A9C' }} /><TouchableOpacity onPress={() => setCalendarioVisivel(false)}><Text style={styles.fecharModalTexto}>Fechar</Text></TouchableOpacity></View></View></Modal>
            <Modal visible={modalCoachVisivel} transparent={true} animationType="fade" onRequestClose={() => setModalCoachVisivel(false)}><View style={styles.modalContainer}><View style={styles.pickerModalView}><Text style={styles.modalTitle}>Selecione o Coach</Text><FlatList data={listaDeCoaches} keyExtractor={(item) => item.id} renderItem={({ item }) => (<TouchableOpacity style={styles.pickerItem} onPress={() => { setCoachSelecionado(item); setModalCoachVisivel(false); }}><Text style={styles.pickerItemText}>{item.nome}</Text></TouchableOpacity>)} style={{ width: '100%' }} /><TouchableOpacity onPress={() => setModalCoachVisivel(false)}><Text style={styles.fecharModalTexto}>Cancelar</Text></TouchableOpacity></View></View></Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FC' },
    listaContainer: { flex: 1, backgroundColor: '#F4F7FC' },
    calendarioContainer: { paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    mesSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 25, },
    mesBotao: { flexDirection: 'row', alignItems: 'center', },
    mesTexto: { fontSize: 24, fontWeight: 'bold', color: 'white', letterSpacing: 1, },
    diaContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, height: 80, },
    diaSemanaTexto: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, fontWeight: '500', marginBottom: 10, },
    diaMesContainer: { width: 40, height: 40, borderRadius: 0, alignItems: 'center', justifyContent: 'center', },
    diaMesTexto: { color: 'white', fontSize: 16, fontWeight: 'bold', },
    diaSelecionado: { backgroundColor: 'white', },
    diaTextoSelecionado: { color: '#005A9C', },
    diaTextoSelecionadoFixo: { color: 'white', fontWeight: 'bold', },
    descansoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    descansoTitulo: { fontSize: 22, fontWeight: 'bold', color: '#4A5568', marginTop: 20, },
    descansoSubtitulo: { fontSize: 16, color: '#718096', marginTop: 8, textAlign: 'center' },
    turmaCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#9DBCE3', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, borderLeftWidth: 5, },
    cardInscrito: { backgroundColor: '#E8F5E9', shadowColor: '#2E7D32', },
    turmaInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    turmaTextos: { marginLeft: 15, flex: 1 },
    turmaHorario: { fontSize: 17, fontWeight: 'bold', color: '#2D3748', },
    turmaTitulo: { fontSize: 15, color: '#718096', },
    botaoAgendar: { backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, },
    textoBotaoAgendar: { color: '#4A5568', fontWeight: 'bold', },
    botaoLotado: { backgroundColor: '#FEE2E2', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, },
    textoBotaoLotado: { color: '#C53030', fontWeight: 'bold' },
    botaoInscrito: { backgroundColor: '#28a745', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, },
    textoBotaoInscrito: { color: 'white', fontWeight: 'bold' },
    botaoAdmin: { backgroundColor: '#6c757d', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, },
    textoBotaoAdmin: { color: 'white', fontWeight: 'bold' },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', },
    calendarPopup: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    fecharModalTexto: { textAlign: 'center', color: '#005A9C', fontWeight: 'bold', marginTop: 20, fontSize: 16, padding: 10 },
    fab: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#005A9C', justifyContent: 'center', alignItems: 'center', right: 20, bottom: 30, elevation: 8, },
    modalFormContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
    modalFormView: { width: '100%', backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
    label: { fontSize: 16, fontWeight: '600', color: '#4A5568', marginBottom: 10, marginTop: 15, },
    optionGroup: { flexDirection: 'row', backgroundColor: '#EDF2F7', borderRadius: 12, overflow: 'hidden' },
    optionButton: { flex: 1, padding: 14, alignItems: 'center', },
    optionSelected: { backgroundColor: '#005A9C', },
    optionText: { fontSize: 15, fontWeight: 'bold', color: '#005A9C', },
    optionTextSelected: { color: 'white', },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -5 },
    inputWrapper: { flex: 1, marginHorizontal: 5 },
    input: { backgroundColor: '#EDF2F7', height: 50, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E0' },
    inputText: { fontSize: 16, color: '#2D3748' },
    diasContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15, },
    diaButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0' },
    diaButtonSelected: { backgroundColor: '#005A9C', borderColor: '#005A9C' },
    diaButtonText: { color: '#005A9C', fontWeight: 'bold', fontSize: 16 },
    diaButtonTextSelected: { color: 'white', },
    horariosContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    horarioButton: { width: '31.5%', paddingVertical: 15, backgroundColor: '#EDF2F7', borderRadius: 10, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#CBD5E0' },
    horarioText: { fontSize: 16, fontWeight: 'bold', color: '#005A9C', },
    saveButton: { backgroundColor: '#005A9C', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 40, },
    saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', },
    pickerModalView: { width: '90%', maxHeight: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
    pickerItem: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#EDF2F7', width: '100%' },
    pickerItemText: { textAlign: 'center', fontSize: 18, color: '#4A5568' },
    modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 15 },
    participanteItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' },
    participanteNome: { fontSize: 16, color: '#333' },
    semInscritosTexto: { fontSize: 16, color: '#888', marginVertical: 20, }
});