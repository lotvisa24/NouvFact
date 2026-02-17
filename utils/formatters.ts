
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

/**
 * Convertit un nombre en lettres (Français)
 * Adapté pour les montants entiers (Francs CFA)
 */
export const numberToWords = (n: number): string => {
  if (n === 0) return "zéro";

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];

  const convertGroup = (num: number): string => {
    let res = "";
    const h = Math.floor(num / 100);
    const t = num % 100;
    const u = num % 10;

    if (h > 0) {
      if (h === 1) res += "cent ";
      else res += units[h] + " cent ";
    }

    if (t >= 10 && t < 20) {
      res += teens[t - 10];
    } else {
      const tenIdx = Math.floor(t / 10);
      if (tenIdx > 0) {
        if (tenIdx === 7 && u > 0) res += "soixante-et-" + teens[u];
        else if (tenIdx === 7) res += "soixante-dix";
        else if (tenIdx === 9 && u > 0) res += "quatre-vingt-" + teens[u];
        else if (tenIdx === 9) res += "quatre-vingt-dix";
        else if (tenIdx === 8 && u === 0) res += "quatre-vingts";
        else res += tens[tenIdx] + (u === 1 && tenIdx !== 8 ? "-et-" : "-") + units[u];
      } else if (u > 0) {
        res += units[u];
      }
    }
    return res.trim();
  };

  let result = "";
  const billion = Math.floor(n / 1000000000);
  const million = Math.floor((n % 1000000000) / 1000000);
  const thousand = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  if (billion > 0) result += convertGroup(billion) + " milliard" + (billion > 1 ? "s " : " ");
  if (million > 0) result += convertGroup(million) + " million" + (million > 1 ? "s " : " ");
  if (thousand > 0) {
    if (thousand === 1) result += "mille ";
    else result += convertGroup(thousand) + " mille ";
  }
  if (remainder > 0) result += convertGroup(remainder);

  const final = result.trim();
  // Capitalize first letter
  return final.charAt(0).toUpperCase() + final.slice(1);
};
