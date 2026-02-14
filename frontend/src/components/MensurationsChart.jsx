import { Line } from 'react-chartjs-2';

const parseMeasurementValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const MensurationsChart = ({ mensurations, onExportCSV }) => {
  return (
    <div style={{ width: '100%', margin: '20px auto', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Évolution des mensurations</h2>
        <button
          onClick={onExportCSV}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          📥 Exporter CSV
        </button>
      </div>
      {mensurations.length > 0 ? (
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          <Line
            data={{
              labels: mensurations.map(m => m.date),
              datasets: [
                {
                  label: 'Tour de taille (cm)',
                  data: mensurations.map(m => parseMeasurementValue(m.taille)),
                  borderColor: 'rgb(220, 38, 127)',
                  backgroundColor: 'rgba(220, 38, 127, 0.1)',
                  tension: 0.4,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  fill: false,
                  pointBackgroundColor: 'rgb(220, 38, 127)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                },
                {
                  label: 'Biceps G (cm)',
                  data: mensurations.map(m => parseMeasurementValue(m.biceps_gauche)),
                  borderColor: 'rgb(25, 135, 84)',
                  backgroundColor: 'rgba(25, 135, 84, 0.1)',
                  tension: 0.4,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  fill: false,
                  pointBackgroundColor: 'rgb(25, 135, 84)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                },
                {
                  label: 'Biceps D (cm)',
                  data: mensurations.map(m => parseMeasurementValue(m.biceps_droit)),
                  borderColor: 'rgb(0, 180, 120)',
                  backgroundColor: 'rgba(0, 180, 120, 0.1)',
                  tension: 0.4,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  fill: false,
                  pointBackgroundColor: 'rgb(0, 180, 120)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                },
                {
                  label: 'Cuisse G (cm)',
                  data: mensurations.map(m => parseMeasurementValue(m.cuisse_gauche)),
                  borderColor: 'rgb(255, 193, 7)',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  tension: 0.4,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  fill: false,
                  pointBackgroundColor: 'rgb(255, 193, 7)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                },
                {
                  label: 'Cuisse D (cm)',
                  data: mensurations.map(m => parseMeasurementValue(m.cuisse_droite)),
                  borderColor: 'rgb(255, 152, 0)',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  tension: 0.4,
                  borderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  fill: false,
                  pointBackgroundColor: 'rgb(255, 152, 0)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  align: 'start',
                  labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                      size: 14,
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
                  title: {
                    display: true,
                    text: 'Date',
                    font: { size: 14, weight: '500' },
                    padding: { top: 10, bottom: 10 }
                  },
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
                  title: {
                    display: true,
                    text: 'Mensurations (cm)',
                    font: { size: 14, weight: '500' },
                    padding: { top: 10, bottom: 10 }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    borderDash: [3, 3]
                  },
                  beginAtZero: false,
                  ticks: {
                    font: { size: 12 },
                    callback: function(value) {
                      return value + ' cm';
                    }
                  }
                }
              },
              interaction: {
                mode: 'index',
                intersect: false
              },
              elements: {
                line: {
                  borderJoinStyle: 'round'
                }
              }
            }}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>Aucune mensuration enregistrée.</p>
          <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '8px' }}>Ajoutez des mensurations pour visualiser votre progression.</p>
        </div>
      )}
    </div>
  );
};

export default MensurationsChart;