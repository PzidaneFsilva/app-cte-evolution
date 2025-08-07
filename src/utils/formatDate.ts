import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Esta função converte o timestamp do Firebase em um texto relativo (ex: "há 5 min")
export const formatTimeAgo = (timestamp: any): string => {
  if (!timestamp || !timestamp.toDate) {
    return '';
  }

  const date = timestamp.toDate();
  const timeAgo = formatDistanceToNow(date, { locale: ptBR, addSuffix: true });

  // Substituições para deixar o formato mais curto, como no Instagram
  return timeAgo
    .replace('cerca de ', '')
    .replace('há menos de um minuto', 'agora')
    .replace(' minutos', ' min')
    .replace(' minuto', ' min')
    .replace(' horas', ' h')
    .replace(' hora', ' h')
    .replace(' dias', ' d')
    .replace(' dia', ' d')
    .replace(' semanas', ' sem')
    .replace(' semana', ' sem')
    .replace(' meses', ' m')
    .replace(' mês', ' m')
    .replace(' anos', ' a')
    .replace(' ano', ' a');
};