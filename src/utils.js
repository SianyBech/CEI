window.CerneApp = window.CerneApp || {};

window.CerneApp.Utils = {
  getCategoryStyle(categoryName) {
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
};

// Atalho global para usar direto como getCategoryStyle(...)
window.getCategoryStyle = function(categoryName) {
  return window.CerneApp.Utils.getCategoryStyle(categoryName);
};