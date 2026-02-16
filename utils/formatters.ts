
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' Frcs CFA';
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const generateNumber = (prefix: string, index: number): string => {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(index + 1).padStart(5, '0')}`;
};
