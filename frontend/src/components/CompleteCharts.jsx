import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';

const CompleteCharts = ({
  poids = [],
  mensurations = [],
  entrainements = [],
  supplements = []
}) => {
  const [periode, setPeriode] = useState('3mois'); // Période par défaut : 3 mois

  // Filtrer les données en fonction de la période sélectionnée
  const filterDataByPeriod = (data, dateField = 'date') => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let startDate;
    
    switch (periode) {
      case '1mois':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3mois':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6mois':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1an':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate;
    });
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  // Parser les valeurs numériques
  const parseValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Préparer les données pour le graphique du poids
  const getPoidsChartData = () => {
    const filteredData = filterDataByPeriod(poids);
    if (filteredData.length === 0) return null;

    const sorted = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      labels: sorted.map(p => formatDate(p.date)),
      datasets: [
        {
          label: 'Poids (kg)',
          data: sorted.map(p => p.valeur),
          borderColor: '#FF6384',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 5,
          pointBackgroundColor: '#FF6384',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true
        }
      ]
    };
  };

  // Préparer les données pour le graphique des 11 mensurations
  const getMensurationsChartData = () => {
    const filteredData = filterDataByPeriod(mensurations);
    if (filteredData.length === 0) return null;
    
    const dates = filteredData.map(m => formatDate(m.date));
    
    // Vérifier quelles mensurations sont disponibles
    const availableMeasurements = [];
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7298A', '#66C2A5', '#FC8D62', '#8DA0CB', '#A6D854', '#FFD92F'];
    
    // Liste des mesures avec leurs libellés (correspondant au modèle de données)
    const measures = [
      { key: 'cou', label: 'Cou (cm)' },
      { key: 'epaules', label: 'Épaules (cm)' },
      { key: 'poitrine', label: 'Poitrine (cm)' },
      { key: 'taille', label: 'Taille (cm)' },
      { key: 'nombril', label: 'Nombril (cm)' },
      { key: 'hanches', label: 'Hanches (cm)' },
      { key: 'biceps_gauche', label: 'Biceps G (cm)' },
      { key: 'biceps_droit', label: 'Biceps D (cm)' },
      { key: 'cuisse_gauche', label: 'Cuisse G (cm)' },
      { key: 'cuisse_droite', label: 'Cuisse D (cm)' },
      { key: 'mollet_gauche', label: 'Mollet G (cm)' },
      { key: 'mollet_droit', label: 'Mollet D (cm)' }
    ];
    
    measures.forEach((measure, index) => {
        // Vérifier si la propriété existe et si au moins une valeur existe pour cette mesure
        const hasData = filteredData.some(m => m[measure.key] !== undefined && parseValue(m[measure.key]) !== null);
        if (hasData) {
          availableMeasurements.push({
            label: measure.label,
            data: filteredData.map(m => parseValue(m[measure.key])),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            borderDash: index >= 6 ? [5, 5] : [] // Pointillés pour les mesures secondaires
          });
        }
      });
    
    return {
      labels: dates,
      datasets: availableMeasurements
    };
  };

  // Préparer les données pour le graphique des entraînements par exercice
  const getEntrainementsChartData = () => {
    const filteredData = filterDataByPeriod(entrainements);
    if (filteredData.length === 0) return null;
    
    // Regrouper les entraînements par exercice
    const exercices = {};
    filteredData.forEach(entrainement => {
      if (!exercices[entrainement.exercice]) {
        exercices[entrainement.exercice] = [];
      }
      exercices[entrainement.exercice].push(entrainement);
    });
    
    // Préparer les datasets pour chaque exercice
    const datasets = Object.keys(exercices).map((exercice, index) => {
      const color = `hsl(${index * 30}, 70%, 50%)`;
      return {
        label: exercice,
        data: exercices[exercice].map(e => ({
          x: formatDate(e.date),
          y: e.charge || 0
        })),
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
        pointStyle: 'rect',
        fill: false
      };
    });
    
    // Obtenir toutes les dates uniques
    const allDates = [...new Set(filteredData.map(e => formatDate(e.date)))].sort();
    
    return {
      labels: allDates,
      datasets: datasets
    };
  };

  // Préparer les données pour le graphique des suppléments
  const getSupplementsChartData = () => {
    const filteredData = filterDataByPeriod(supplements, 'date_debut');
    if (filteredData.length === 0) return null;
    
    // Regrouper les suppléments par nom
    const supplementsByName = {};
    filteredData.forEach(supplement => {
      if (!supplementsByName[supplement.nom]) {
        supplementsByName[supplement.nom] = [];
      }
      supplementsByName[supplement.nom].push(supplement);
    });
    
    const supplementNames = Object.keys(supplementsByName);
    const dates = supplementNames.map(name => {
      const supplement = supplementsByName[name][0];
      return formatDate(supplement.date_debut);
    });
    
    return {
      labels: supplementNames,
      datasets: [
        {
          label: 'Date de début',
          data: dates,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Options communes pour les graphiques
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 13,
            family: 'Arial, sans-serif',
            weight: '500'
          },
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        displayColors: true,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 0,
          font: { size: 12 }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [3, 3]
        },
        beginAtZero: true,
        ticks: {
          font: { size: 12 }
        }
      }
    }
  };

  // Options spécifiques pour le graphique des mensurations
  const mensurationsOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: 'Mensurations (cm)',
          font: { size: 14, weight: '500' },
          padding: { top: 10, bottom: 10 }
        },
        beginAtZero: false
      }
    }
  };

  // Options spécifiques pour le graphique des entraînements
  const entrainementsOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: 'Charge (kg)',
          font: { size: 14, weight: '500' },
          padding: { top: 10, bottom: 10 }
        }
      }
    }
  };

  return (
    <div className="charts-wrapper">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Tableau de bord complet</h2>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontWeight: '500' }}>Periode :</span>
        <select
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="form-input"
          style={{ width: 'auto', cursor: 'pointer' }}
        >
          <option value="1mois">1 mois</option>
          <option value="3mois">3 mois</option>
          <option value="6mois">6 mois</option>
          <option value="1an">1 an</option>
        </select>
      </div>

      {/* Graphique du poids */}
      <div className="chart-card">
        <h3 style={{ marginBottom: '15px', color: '#444' }}>Evolution du poids</h3>
        <div className="chart-container">
          {poids.length > 0 && getPoidsChartData() ? (
            <Line data={getPoidsChartData()} options={{
              ...commonOptions,
              scales: {
                ...commonOptions.scales,
                y: {
                  ...commonOptions.scales.y,
                  beginAtZero: false,
                  title: {
                    display: true,
                    text: 'Poids (kg)',
                    font: { size: 14, weight: '500' },
                    padding: { top: 10, bottom: 10 }
                  },
                  ticks: {
                    font: { size: 12 },
                    callback: (value) => value + ' kg'
                  }
                }
              }
            }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Aucune mesure de poids enregistree pour cette periode.</p>
            </div>
          )}
        </div>
      </div>

      {/* Graphique des 12 mensurations */}
      <div className="chart-card">
        <h3 style={{ marginBottom: '15px', color: '#444' }}>Evolution des mensurations</h3>
        <div className="chart-container">
          {mensurations.length > 0 && getMensurationsChartData() ? (
            <Line data={getMensurationsChartData()} options={mensurationsOptions} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Aucune mensuration enregistree pour cette periode.</p>
            </div>
          )}
        </div>
      </div>

      {/* Graphique des entrainements */}
      <div className="chart-card">
        <h3 style={{ marginBottom: '15px', color: '#444' }}>Progression des entrainements par exercice</h3>
        <div className="chart-container">
          {entrainements.length > 0 ? (
            <Line data={getEntrainementsChartData()} options={entrainementsOptions} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Aucun entrainement enregistre pour cette periode.</p>
            </div>
          )}
        </div>
      </div>

      {/* Graphique des supplements */}
      <div className="chart-card">
        <h3 style={{ marginBottom: '15px', color: '#444' }}>Tendances des supplements</h3>
        <div className="chart-container">
          {supplements.length > 0 ? (
            <Bar data={getSupplementsChartData()} options={commonOptions} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Aucun supplement enregistre pour cette periode.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompleteCharts;