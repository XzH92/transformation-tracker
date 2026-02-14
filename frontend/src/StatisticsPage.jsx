import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CompleteCharts from './components/CompleteCharts';
import AIAnalysisModal from './components/AIAnalysisModal';

const StatisticsPage = () => {
  const [poids, setPoids] = useState([]);
  const [mensurations, setMensurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const navigate = useNavigate();

  // Récupérer les données depuis les endpoints
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les poids
      try {
        const poidsResponse = await axios.get('http://127.0.0.1:8000/poids/');
        setPoids(poidsResponse.data.poids || []);
      } catch (poidsError) {
        console.error("Erreur lors de la récupération des poids :", poidsError);
        setPoids([]);
      }
      
      // Récupérer les mensurations
      try {
        const mensurationsResponse = await axios.get('http://127.0.0.1:8000/mensurations/');
        setMensurations(mensurationsResponse.data.mensurations || []);
      } catch (mensurationsError) {
        console.error("Erreur lors de la récupération des mensurations :", mensurationsError);
        setMensurations([]);
      }
      
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
      setError("Impossible de charger les données. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fonction utilitaire pour parser les valeurs
  const parseValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Calculer la moyenne des poids
  const calculateAveragePoids = () => {
    if (poids.length === 0) return null;
    
    const validValues = poids
      .map(p => parseValue(p.valeur))
      .filter(val => val !== null);
    
    if (validValues.length === 0) return null;
    
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    return sum / validValues.length;
  };

  // Calculer la moyenne des mensurations
  const calculateAverageMensurations = () => {
    if (mensurations.length === 0) return { taille: null, bras: null, cuisses: null };
    
    const tailleValues = mensurations
      .map(m => parseValue(m.taille))
      .filter(val => val !== null);
    
    const brasValues = mensurations
      .map(m => parseValue(m.bras))
      .filter(val => val !== null);
    
    const cuissesValues = mensurations
      .map(m => parseValue(m.cuisses))
      .filter(val => val !== null);
    
    return {
      taille: tailleValues.length > 0 
        ? tailleValues.reduce((acc, val) => acc + val, 0) / tailleValues.length
        : null,
      bras: brasValues.length > 0 
        ? brasValues.reduce((acc, val) => acc + val, 0) / brasValues.length
        : null,
      cuisses: cuissesValues.length > 0 
        ? cuissesValues.reduce((acc, val) => acc + val, 0) / cuissesValues.length
        : null
    };
  };

  // Calculer l'évolution depuis la première mesure
  const calculateEvolution = () => {
    if (poids.length === 0 || mensurations.length === 0) {
      return { poids: null, mensurations: null };
    }
    
    // Tri par date pour obtenir la première et la dernière mesure
    const sortedPoids = [...poids]
      .filter(p => p.date && !isNaN(new Date(p.date)))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const sortedMensurations = [...mensurations]
      .filter(m => m.date && !isNaN(new Date(m.date)))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (sortedPoids.length === 0 || sortedMensurations.length === 0) {
      return { poids: null, mensurations: null };
    }
    
    const firstPoids = parseValue(sortedPoids[0]?.valeur);
    const lastPoids = parseValue(sortedPoids[sortedPoids.length - 1]?.valeur);
    
    const firstMensuration = {
      taille: parseValue(sortedMensurations[0]?.taille),
      bras: parseValue(sortedMensurations[0]?.bras),
      cuisses: parseValue(sortedMensurations[0]?.cuisses)
    };
    
    const lastMensuration = {
      taille: parseValue(sortedMensurations[sortedMensurations.length - 1]?.taille),
      bras: parseValue(sortedMensurations[sortedMensurations.length - 1]?.bras),
      cuisses: parseValue(sortedMensurations[sortedMensurations.length - 1]?.cuisses)
    };
    
    return {
      poids: firstPoids !== null && lastPoids !== null 
        ? {
            first: firstPoids,
            last: lastPoids,
            difference: lastPoids - firstPoids,
            percentage: ((lastPoids - firstPoids) / firstPoids * 100).toFixed(2)
          }
        : null,
      mensurations: {
        taille: firstMensuration.taille !== null && lastMensuration.taille !== null
          ? {
              first: firstMensuration.taille,
              last: lastMensuration.taille,
              difference: lastMensuration.taille - firstMensuration.taille,
              percentage: ((lastMensuration.taille - firstMensuration.taille) / firstMensuration.taille * 100).toFixed(2)
            }
          : null,
        bras: firstMensuration.bras !== null && lastMensuration.bras !== null
          ? {
              first: firstMensuration.bras,
              last: lastMensuration.bras,
              difference: lastMensuration.bras - firstMensuration.bras,
              percentage: ((lastMensuration.bras - firstMensuration.bras) / firstMensuration.bras * 100).toFixed(2)
            }
          : null,
        cuisses: firstMensuration.cuisses !== null && lastMensuration.cuisses !== null
          ? {
              first: firstMensuration.cuisses,
              last: lastMensuration.cuisses,
              difference: lastMensuration.cuisses - firstMensuration.cuisses,
              percentage: ((lastMensuration.cuisses - firstMensuration.cuisses) / firstMensuration.cuisses * 100).toFixed(2)
            }
          : null
      }
    };
  };

  const averagePoids = calculateAveragePoids();
  const averageMensurations = calculateAverageMensurations();
  const evolution = calculateEvolution();

  if (loading) {
    return (
      <div className="statistics-container">
        <h2>Statistiques</h2>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-container">
        <h2>Statistiques</h2>
        <p className="error">{error}</p>
        <button onClick={fetchData} className="retry-button">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <div className="header">
        <h2>Statistiques de transformation</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="ai-analysis-button"
            disabled={loading || (poids.length === 0 && mensurations.length === 0)}
          >
            🤖 Analyse IA
          </button>
          <button onClick={() => navigate('/')} className="back-button">
            ← Retour à l'accueil
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {/* Moyenne des poids */}
        <div className="stat-card">
          <h3>Moyenne du poids</h3>
          {averagePoids !== null ? (
            <div className="stat-value">
              {averagePoids.toFixed(2)} kg
            </div>
          ) : (
            <div className="stat-value no-data">Aucune donnée</div>
          )}
        </div>

        {/* Moyenne des mensurations */}
        <div className="stat-card">
          <h3>Moyenne des mensurations</h3>
          <div className="mensuration-averages">
            <div>
              <span className="label">Taille:</span>
              {averageMensurations.taille !== null 
                ? <span className="value">{averageMensurations.taille.toFixed(2)} cm</span>
                : <span className="value no-data">-</span>}
            </div>
            <div>
              <span className="label">Bras:</span>
              {averageMensurations.bras !== null 
                ? <span className="value">{averageMensurations.bras.toFixed(2)} cm</span>
                : <span className="value no-data">-</span>}
            </div>
            <div>
              <span className="label">Cuisses:</span>
              {averageMensurations.cuisses !== null 
                ? <span className="value">{averageMensurations.cuisses.toFixed(2)} cm</span>
                : <span className="value no-data">-</span>}
            </div>
          </div>
        </div>

        {/* Évolution du poids */}
        <div className="stat-card">
          <h3>Évolution du poids</h3>
          {evolution.poids !== null ? (
            <div>
              <div className="evolution-info">
                <span>Début: {evolution.poids.first.toFixed(2)} kg</span>
                <span>Actuel: {evolution.poids.last.toFixed(2)} kg</span>
              </div>
              <div className="evolution-difference">
                {evolution.poids.difference >= 0 ? '+' : ''}
                {evolution.poids.difference.toFixed(2)} kg 
                ({evolution.poids.difference >= 0 ? '+' : ''}
                {evolution.poids.percentage}%)
              </div>
            </div>
          ) : (
            <div className="stat-value no-data">Aucune donnée</div>
          )}
        </div>

        {/* Évolution des mensurations */}
        <div className="stat-card">
          <h3>Évolution des mensurations</h3>
          {evolution.mensurations && 
           (evolution.mensurations.taille !== null || 
            evolution.mensurations.bras !== null || 
            evolution.mensurations.cuisses !== null) ? (
            <div className="mensuration-evolution">
              {evolution.mensurations.taille !== null && (
                <div>
                  <span className="label">Taille:</span>
                  <span className={`value ${evolution.mensurations.taille.difference >= 0 ? 'positive' : 'negative'}`}>
                    {evolution.mensurations.taille.difference >= 0 ? '+' : ''}
                    {evolution.mensurations.taille.difference.toFixed(2)} cm 
                    ({evolution.mensurations.taille.difference >= 0 ? '+' : ''}
                    {evolution.mensurations.taille.percentage}%)
                  </span>
                </div>
              )}
              {evolution.mensurations.bras !== null && (
                <div>
                  <span className="label">Bras:</span>
                  <span className={`value ${evolution.mensurations.bras.difference >= 0 ? 'positive' : 'negative'}`}>
                    {evolution.mensurations.bras.difference >= 0 ? '+' : ''}
                    {evolution.mensurations.bras.difference.toFixed(2)} cm 
                    ({evolution.mensurations.bras.difference >= 0 ? '+' : ''}
                    {evolution.mensurations.bras.percentage}%)
                  </span>
                </div>
              )}
              {evolution.mensurations.cuisses !== null && (
                <div>
                  <span className="label">Cuisses:</span>
                  <span className={`value ${evolution.mensurations.cuisses.difference >= 0 ? 'positive' : 'negative'}`}>
                    {evolution.mensurations.cuisses.difference >= 0 ? '+' : ''}
                    {evolution.mensurations.cuisses.difference.toFixed(2)} cm 
                    ({evolution.mensurations.cuisses.difference >= 0 ? '+' : ''}
                    {evolution.mensurations.cuisses.percentage}%)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="stat-value no-data">Aucune donnée</div>
          )}
        </div>
      </div>

      {/* Graphiques complets */}
      <div className="charts-section">
        <h3>Analyse visuelle complète</h3>
        <CompleteCharts 
          mensurations={mensurations}
        />
      </div>
      
      {/* Tableau récapitulatif */}
      <div className="summary-section">
        <h3>Tableau récapitulatif des données</h3>
        
        <div className="summary-tabs">
          <div className="tab-content">
            <h4>Historique des poids</h4>
            {poids.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Poids (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {poids.map((p, index) => (
                    <tr key={p.id || index}>
                      <td>{p.date}</td>
                      <td>{parseValue(p.valeur) !== null ? p.valeur : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Aucun poids enregistré.</p>
            )}
          </div>
          
          <div className="tab-content">
            <h4>Historique des mensurations</h4>
            {mensurations.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Taille (cm)</th>
                    <th>Bras (cm)</th>
                    <th>Cuisses (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {mensurations.map((m, index) => (
                    <tr key={m.id || index}>
                      <td>{m.date}</td>
                      <td>{parseValue(m.taille) !== null ? m.taille : '-'}</td>
                      <td>{parseValue(m.bras) !== null ? m.bras : '-'}</td>
                      <td>{parseValue(m.cuisses) !== null ? m.cuisses : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Aucune mensuration enregistrée.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        poids={poids}
        mensurations={mensurations}
      />
    </div>
  );
};

export default StatisticsPage;