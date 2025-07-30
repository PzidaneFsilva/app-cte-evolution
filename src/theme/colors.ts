export const lightTheme = {
  background: '#f0f2f5', // Cinza claro
  card: '#ffffff',      // Branco
  text: '#1c1e21',      // Preto suave
  textSecondary: '#65676b', // Cinza para textos secundários
  primary: '#005A9C',   // Seu azul principal
  white: '#ffffff',
  black: '#000000',
};

export const darkTheme = {
  background: '#121212', // Cinza super escuro
  card: '#1e1e1e',      // Cinza um pouco mais claro para "cartões"
  text: '#e1e1e1',      // Branco suave
  textSecondary: '#b0b3b8', // Cinza claro para textos secundários
  primary: '#007bff',   // Um azul um pouco mais vivo, que contrasta melhor no escuro
  white: '#ffffff',
  black: '#000000',
};

// Adicione esta linha no final do arquivo src/theme/colors.ts
export type Theme = typeof lightTheme;