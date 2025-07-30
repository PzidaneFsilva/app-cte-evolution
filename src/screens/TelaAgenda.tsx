import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { addDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigation } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList, Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Importações do Firebase
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from '../../src/config/firebaseConfig';

// Configuração do calendário para Português-Brasil
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

type Turma = { id: string; horario: string; titulo: string; coach: string; vagas: number; };

export default function TelaAgenda() {
  const navigation = useNavigation();
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [calendarioVisivel, setCalendarioVisivel] = useState(false);
  
  const [turmasDoDia, setTurmasDoDia] = useState<Turma[]>([]);
  const [carregando, setCarregando] = useState(true);

  // CORREÇÃO APLICADA AQUI: Removido o "React."
  const diasDaSemana = useMemo(() => {
    const inicioDaSemana = startOfWeek(dataSelecionada, { weekStartsOn: 0 });
    return Array.from({ length: 7 }).map((_, i) => {
      const dia = addDays(inicioDaSemana, i);
      return {
        id: format(dia, 'yyyy-MM-dd'),
        diaSemana: format(dia, 'E', { locale: ptBR }).charAt(0).toUpperCase(),
        diaMes: format(dia, 'd'),
        dataCompleta: dia,
      };
    });
  }, [dataSelecionada]);
  
  // CORREÇÃO APLICADA AQUI: Removido o "React."
  const nomeDoMes = useMemo(() => {
    const mesFormatado = format(dataSelecionada, 'MMMM', { locale: ptBR });
    return mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1);
  }, [dataSelecionada]);

  useEffect(() => {
    const buscarTurmas = async () => {
      setCarregando(true);
      setTurmasDoDia([]);

      try {
        const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
        const q = query(collection(firestore, "turmas"), where("data", "==", dataFormatada));
        
        const querySnapshot = await getDocs(q);
        const turmasBuscadas: Turma[] = [];
        querySnapshot.forEach((doc) => {
          turmasBuscadas.push({ id: doc.id, ...doc.data() } as Turma);
        });
        
        turmasBuscadas.sort((a, b) => a.horario.localeCompare(b.horario));
        
        setTurmasDoDia(turmasBuscadas);
      } catch (error) {
        console.error("Erro ao buscar turmas: ", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarTurmas();
  }, [dataSelecionada]);

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  const TurmaCard = ({ item }: { item: Turma }) => ( 
    <View style={styles.turmaCard}><View style={styles.turmaInfo}><Feather name="clock" size={20} color="#555" /><View style={styles.turmaTextos}><Text style={styles.turmaHorario}>{item.horario}</Text><Text style={styles.turmaTitulo}>{item.titulo} com {item.coach}</Text></View></View><TouchableOpacity style={[styles.botaoAgendar, item.vagas === 0 && styles.botaoLotado]} disabled={item.vagas === 0}><Text style={styles.textoBotaoAgendar}>{item.vagas > 0 ? `Agendar (${item.vagas} vagas)` : 'Lotado'}</Text></TouchableOpacity></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarioContainer}>
        <View style={styles.mesSelector}>
          <TouchableOpacity onPress={openDrawer}>
            <Feather name="chevron-left" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mesBotao} onPress={() => setCalendarioVisivel(true)}>
            <Text style={styles.mesTexto}>{nomeDoMes}</Text>
            <Feather name="calendar" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity>
              <Feather name="filter" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={diasDaSemana} horizontal showsHorizontalScrollIndicator={false} keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.diaContainer, item.id === format(dataSelecionada, 'yyyy-MM-dd') && styles.diaSelecionado]} onPress={() => setDataSelecionada(item.dataCompleta)}>
              <Text style={[styles.diaSemanaTexto, item.id === format(dataSelecionada, 'yyyy-MM-dd') && styles.diaTextoSelecionado]}>{item.diaSemana}</Text>
              <Text style={[styles.diaMesTexto, item.id === format(dataSelecionada, 'yyyy-MM-dd') && styles.diaTextoSelecionado]}>{item.diaMes}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.listaContainer}>
        {carregando ? (
          <ActivityIndicator style={{marginTop: 50}} size="large" color="#005A9C" />
        ) : turmasDoDia.length > 0 ? (
          <FlatList data={turmasDoDia} keyExtractor={item => item.id} renderItem={TurmaCard} contentContainerStyle={{padding: 20}} />
        ) : (
          <View style={styles.descansoContainer}><Feather name="coffee" size={60} color="#ccc" /><Text style={styles.descansoTitulo}>Dia de descanso!</Text><Text style={styles.descansoSubtitulo}>Nenhuma turma cadastrada para este dia.</Text></View>
        )}
      </View>

      <Modal visible={calendarioVisivel} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.calendarPopup}>
            <Calendar
              current={format(dataSelecionada, 'yyyy-MM-dd')}
              onDayPress={(day) => {
                setDataSelecionada(new Date(day.timestamp));
                setCalendarioVisivel(false);
              }}
              monthFormat={'MMMM yyyy'}
              theme={{
                todayTextColor: '#005A9C',
                arrowColor: '#005A9C',
                selectedDayBackgroundColor: '#005A9C',
              }}
            />
            <TouchableOpacity onPress={() => setCalendarioVisivel(false)}>
              <Text style={styles.fecharModalTexto}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#005A9C', },
  headerActions: {
    width: 28,
  },
  calendarioContainer: { backgroundColor: '#005A9C', paddingBottom: 20, paddingTop: 40, },
  mesSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20, },
  mesBotao: { flexDirection: 'row', alignItems: 'center', },
  mesTexto: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: 'white', 
    marginRight: 10,
  },
  diaContainer: { alignItems: 'center', justifyContent: 'center', width: 50, height: 70, borderRadius: 12, marginHorizontal: 3, },
  diaSelecionado: { backgroundColor: 'white', },
  diaSemanaTexto: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, },
  diaMesTexto: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 2, },
  diaTextoSelecionado: { color: '#005A9C', },
  listaContainer: { flex: 1, backgroundColor: '#f0f2f5', borderTopLeftRadius: 25, borderTopRightRadius: 25, },
   descansoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descansoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
  },
  descansoSubtitulo: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  turmaCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  turmaInfo: { flexDirection: 'row', alignItems: 'center', },
  turmaTextos: { marginLeft: 15, },
  turmaHorario: { fontSize: 16, fontWeight: 'bold', color: '#333', },
  turmaTitulo: { fontSize: 14, color: '#777', },
  botaoAgendar: { backgroundColor: '#005A9C', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, },
  botaoLotado: { backgroundColor: '#ccc', },
  textoBotaoAgendar: { color: 'white', fontWeight: 'bold', },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', },
  calendarPopup: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '90%', },
  fecharModalTexto: { textAlign: 'center', color: '#005A9C', fontWeight: 'bold', marginTop: 15, fontSize: 16, }
});