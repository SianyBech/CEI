window.CerneApp = window.CerneApp || {};

window.CerneApp.Utils = {
  // Converte o nome da categoria em uma cor HSL consistente (fundo claro + texto escuro)
  getCategoryStyle(categoryName) {
    if (!categoryName) return '';

    // 1. Gera um hash numérico único baseado nas letras do nome
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }

    // 2. Transforma o hash em um ângulo do círculo cromático (0 a 360deg)
    const hue = Math.abs(hash % 360);

    // 3. Define Fundo Claro (Luminosidade 93%) e Texto Escuro (Luminosidade 28%)
    const backgroundColor = `hsl(${hue}, 70%, 93%)`;
    const textColor = `hsl(${hue}, 65%, 28%)`;
    const borderColor = `hsl(${hue}, 60%, 82%)`;

    return `background-color: ${backgroundColor}; color: ${textColor}; border: 1px solid ${borderColor};`;
  }
};