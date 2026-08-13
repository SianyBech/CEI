window.CerneApp = window.CerneApp || {};

window.CerneApp.Utils = {
  /**
   * Verifica se uma string de data (YYYY-MM-DD ou DD/MM/YYYY) representa uma data futura.
   * @param {string} dateString 
   * @returns {boolean}
   */
  isFutureDate(dateString) {
    if (!dateString) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Considera apenas dia, mês e ano

    let selectedDate;

    if (dateString.includes('-')) {
      // Formato ISO: YYYY-MM-DD
      const [year, month, day] = dateString.split('-');
      selectedDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    } else if (dateString.includes('/')) {
      // Formato pt-BR: DD/MM/YYYY
      const [day, month, year] = dateString.split('/');
      selectedDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    } else {
      selectedDate = new Date(dateString);
    }

    return selectedDate > today;
  }
};