// Garantia de namespace seguro que nunca sobrescreve o que já existe
window.CerneApp = window.CerneApp || {};

// Função pura de geração de cores
function generateCategoryStyle(categoryName) {
  if (!categoryName) return '';

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  const backgroundColor = `hsl(${hue}, 70%, 93%)`;
  const textColor = `hsl(${hue}, 65%, 28%)`;
  const borderColor = `hsl(${hue}, 60%, 82%)`;

  return `background-color: ${backgroundColor}; color: ${textColor}; border: 1px solid ${borderColor};`;
}

// 1. Registra no namespace CerneApp
window.CerneApp.Utils = window.CerneApp.Utils || {};
window.CerneApp.Utils.getCategoryStyle = generateCategoryStyle;

// 2. Registra o atalho global de forma direta e segura
window.getCategoryStyle = generateCategoryStyle;