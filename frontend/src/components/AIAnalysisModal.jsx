import { useState } from 'react';
import api from '../api';

const ANALYSIS_TYPES = [
  {
    id: 'poids',
    label: 'Évolution du poids',
    icon: '\u2696\uFE0F',
    description: 'Analyse ta courbe de poids récente, détecte les tendances et ajuste les recommandations.',
    prompt: "Analyse en détail l'évolution de mon poids. Identifie les tendances (perte, prise, stagnation), les périodes de fluctuation, et donne-moi des recommandations nutritionnelles et d'entraînement pour optimiser ma progression. Sois précis avec les chiffres.",
  },
  {
    id: 'entrainement',
    label: 'Routine d\'entraînement',
    icon: '\uD83C\uDFCB\uFE0F',
    description: 'Analyse tes séances passées et propose la prochaine routine adaptée.',
    prompt: "Analyse mes séances d'entraînement récentes. Identifie les groupes musculaires travaillés, la progression des charges, le volume d'entraînement. Propose-moi une planification pour ma prochaine séance en tenant compte de la récupération, de l'équilibre musculaire et de la surcharge progressive. Sois concret avec les exercices, séries, reps et charges suggérées.",
  },
  {
    id: 'general',
    label: 'Bilan général',
    icon: '\uD83D\uDCCA',
    description: 'Analyse croisée de toutes les données pour un bilan complet.',
    prompt: "Fais un bilan général complet de ma transformation physique en croisant toutes les données : poids, mensurations, entraînements et journal. Évalue si mon plan de transformation fonctionne bien globalement. Identifie les corrélations (ex: impact de l'entraînement sur les mensurations, lien sommeil/performance). Donne un score de progression et des axes d'amélioration prioritaires.",
  },
];

const AIAnalysisModal = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyse = async (type) => {
    setSelectedType(type.id);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await api.post('/analyse/', {
        user_prompt: type.prompt,
      });
      setAnalysisResult(response.data.analyse);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'analyse. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Analyse IA</h2>
          <button style={styles.closeBtn} onClick={handleClose}>&times;</button>
        </div>

        {/* Choix du type d'analyse */}
        {!isLoading && !analysisResult && !error && (
          <div style={styles.body}>
            <p style={styles.subtitle}>Choisis le type d'analyse :</p>
            <div style={styles.cardsContainer}>
              {ANALYSIS_TYPES.map((type) => (
                <button
                  key={type.id}
                  style={styles.card}
                  onClick={() => handleAnalyse(type)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#4CAF50';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(76,175,80,0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <span style={styles.cardIcon}>{type.icon}</span>
                  <span style={styles.cardLabel}>{type.label}</span>
                  <span style={styles.cardDesc}>{type.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Mistral analyse tes données...</p>
            <p style={styles.loadingSubtext}>
              {ANALYSIS_TYPES.find((t) => t.id === selectedType)?.label}
            </p>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={styles.body}>
            <div style={styles.errorBox}>{error}</div>
            <button style={styles.retryBtn} onClick={() => { setError(null); setSelectedType(null); }}>
              Réessayer
            </button>
          </div>
        )}

        {/* Resultat */}
        {analysisResult && (
          <div style={styles.body}>
            <div style={styles.resultHeader}>
              <span>{ANALYSIS_TYPES.find((t) => t.id === selectedType)?.icon}</span>
              <span style={{ fontWeight: '600' }}>
                {ANALYSIS_TYPES.find((t) => t.id === selectedType)?.label}
              </span>
            </div>
            <div style={styles.resultContent}>
              {analysisResult.split('\n').map((line, i) => {
                if (line.startsWith('###')) {
                  return <h3 key={i} style={styles.resultH3}>{line.replace(/^###\s*/, '')}</h3>;
                }
                if (line.startsWith('####')) {
                  return <h4 key={i} style={styles.resultH4}>{line.replace(/^####\s*/, '')}</h4>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return <li key={i} style={styles.resultLi}>{formatBold(line.replace(/^[-*]\s*/, ''))}</li>;
                }
                if (line.match(/^\d+\.\s/)) {
                  return <li key={i} style={styles.resultLi}>{formatBold(line.replace(/^\d+\.\s*/, ''))}</li>;
                }
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} style={styles.resultP}>{formatBold(line)}</p>;
              })}
            </div>
            <div style={styles.resultActions}>
              <button
                style={styles.newAnalysisBtn}
                onClick={() => { setAnalysisResult(null); setSelectedType(null); }}
              >
                Nouvelle analyse
              </button>
              <button style={styles.closeBtnSecondary} onClick={handleClose}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

const spinnerKeyframes = `
@keyframes ai-spin {
  to { transform: rotate(360deg); }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('ai-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'ai-spinner-style';
  style.textContent = spinnerKeyframes;
  document.head.appendChild(style);
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '12px', width: '90%', maxWidth: '700px',
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #eee',
  },
  title: { margin: 0, fontSize: '20px', color: '#333' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer',
    color: '#999', lineHeight: 1, padding: '0 4px',
  },
  body: { padding: '24px', overflowY: 'auto', flex: 1 },
  subtitle: { margin: '0 0 16px', color: '#555', fontSize: '15px' },
  cardsContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px',
    padding: '16px 20px', border: '2px solid #e0e0e0', borderRadius: '10px',
    backgroundColor: '#fafafa', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardIcon: { fontSize: '28px' },
  cardLabel: { fontSize: '16px', fontWeight: '600', color: '#333' },
  cardDesc: { fontSize: '13px', color: '#777', lineHeight: '1.4' },
  loadingContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 24px', gap: '16px',
  },
  spinner: {
    width: '40px', height: '40px', border: '4px solid #e0e0e0',
    borderTopColor: '#4CAF50', borderRadius: '50%',
    animation: 'ai-spin 0.8s linear infinite',
  },
  loadingText: { fontSize: '16px', fontWeight: '500', color: '#333' },
  loadingSubtext: { fontSize: '14px', color: '#888' },
  errorBox: {
    padding: '14px 18px', backgroundColor: '#fef2f2', color: '#dc2626',
    borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px',
    fontSize: '14px',
  },
  retryBtn: {
    padding: '10px 20px', backgroundColor: '#4CAF50', color: '#fff',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
  },
  resultHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '16px', fontSize: '17px', color: '#333',
  },
  resultContent: {
    backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '20px',
    fontSize: '14px', lineHeight: '1.7', color: '#333', maxHeight: '50vh',
    overflowY: 'auto',
  },
  resultH3: { fontSize: '17px', color: '#2e7d32', margin: '18px 0 8px', borderBottom: '1px solid #e0e0e0', paddingBottom: '6px' },
  resultH4: { fontSize: '15px', color: '#444', margin: '14px 0 6px' },
  resultLi: { marginLeft: '16px', marginBottom: '4px' },
  resultP: { margin: '6px 0' },
  resultActions: { display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' },
  newAnalysisBtn: {
    padding: '10px 20px', backgroundColor: '#4CAF50', color: '#fff',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
  },
  closeBtnSecondary: {
    padding: '10px 20px', backgroundColor: '#f5f5f5', color: '#555',
    border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
  },
};

export default AIAnalysisModal;
