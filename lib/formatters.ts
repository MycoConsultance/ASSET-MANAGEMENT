// Formattatore di fase per rimuovere gli enum grezzi dal DB
export function formatPhase(phase: string): string {
  const map: Record<string, string> = {
    'ACQUISTO_DEAL': 'Acquisto & Deal',
    'POST_ROGITO': 'Post-Rogito',
    'CANTIERE': 'Cantiere & Restyling',
    'VALORIZZAZIONE_CANTIERE': 'Cantiere & Restyling',
    'MESSA_A_REDDITO': 'Messa a Reddito',
    'GESTIONE_LOCAZIONE': 'Messa a Reddito',
    'MANUTENZIONE_CARE': 'Manutenzione & Care',
    'REVIEW_EXIT': 'Review & Exit'
  };
  return map[phase] || phase;
}

// Formattatore Valuta EUR (es. € 150.000)
export const formatCurrency = (amount: number | string | null | undefined): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0);
  if (isNaN(num)) return '€ 0';
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(num);
};

// Mappatura delle 6 fasi compatibile con la struttura enum del DB
export const LIFECYCLE_STAGES = [
  { id: 'ACQUISTO_DEAL', label: 'Acquisto & Deal', step: 1 },
  { id: 'POST_ROGITO', label: 'Post-Rogito', step: 2 },
  { id: 'VALORIZZAZIONE_CANTIERE', label: 'Cantiere', step: 3 },
  { id: 'GESTIONE_LOCAZIONE', label: 'Messa a Reddito', step: 4 },
  { id: 'MANUTENZIONE_CARE', label: 'Care & Manutenzione', step: 5 },
  { id: 'REVIEW_EXIT', label: 'Review & Exit', step: 6 }
];