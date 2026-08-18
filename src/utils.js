// Garantia de namespace seguro para o CerneApp
window.CerneApp = window.CerneApp || {};

// 🎨 Paleta Restrita de Cores Frias e Leves (Estilo Notion / Linear)
// Trabalha apenas com variações de Azul, Slate, Menta, Índigo e Cinza Frio
const PALETA_CORES_FRIAS = [
  { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' }, // Slate Frio
  { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' }, // Azul Suave
  { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' }, // Menta Fria
  { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' }, // Índigo Leve
  { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' }, // Azul Celeste
  { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' }, // Verde Água Frio
  { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' }  // Platinado Neutro
];

// Função determinística: O nome da categoria escolhe sempre a mesma cor fria
function generateCategoryStyle(categoryName) {
  if (!categoryName) return '';

  // 1. Gera um hash numérico único a partir do nome
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 2. Escolhe um índice fixo dentro da paleta fria
  const index = Math.abs(hash) % PALETA_CORES_FRIAS.length;
  const color = PALETA_CORES_FRIAS[index];

  // 3. Retorna o CSS inline pronto
  return `background-color: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border}; font-weight: 500;`;
}

// Registra no namespace do app e no atalho global
window.CerneApp.Utils = window.CerneApp.Utils || {};
window.CerneApp.Utils.getCategoryStyle = generateCategoryStyle;
window.getCategoryStyle = generateCategoryStyle;