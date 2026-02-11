import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [poids, setPoids] = useState([]);
  const [nouveauPoids, setNouveauPoids] = useState({ valeur: '', date_mesure: '' });
  const [mensurations, setMensurations] = useState([]);
const [nouvelleMensuration, setNouvelleMensuration] = useState({
  taille: '',
  bras: '',
  cuisses: '',
  date_mesure: ''
});

  // Récupérer les mesures de poids depuis l'API
  const fetchPoids = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/poids/');
      setPoids(response.data.poids);
    } catch (error) {
      console.error("Erreur lors de la récupération des poids :", error);
    }
  };

  // Ajouter une nouvelle mesure de poids
 const ajouterPoids = async () => {
  try {
    // Formate la date en YYYY-MM-DD
    const formattedData = {
      valeur: parseFloat(nouveauPoids.valeur),
      date_mesure: nouveauPoids.date_mesure,
    };
    await axios.post('http://127.0.0.1:8000/poids/', formattedData);
    fetchPoids(); // Rafraîchir la liste après ajout
    setNouveauPoids({ valeur: '', date_mesure: '' }); // Réinitialiser le formulaire
  } catch (error) {
    console.error("Erreur lors de l'ajout du poids :", error.response?.data || error.message);
  }
};

// Récupérer les mensurations depuis l'API
const fetchMensurations = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/mensurations/');
    setMensurations(response.data.mensurations);
  } catch (error) {
    console.error("Erreur lors de la récupération des mensurations :", error);
  }
};

// Ajouter une nouvelle mensuration
const ajouterMensuration = async () => {
  try {
    await axios.post('http://127.0.0.1:8000/mensurations/', nouvelleMensuration);
    fetchMensurations(); // Rafraîchir la liste après ajout
    setNouvelleMensuration({ taille: '', bras: '', cuisses: '', date_mesure: '' }); // Réinitialiser le formulaire
  } catch (error) {
    console.error("Erreur lors de l'ajout des mensurations :", error.response?.data || error.message);
  }
};


  // Charger les poids au démarrage
  useEffect(() => {
    fetchPoids();
fetchMensurations();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Suivi de transformation physique</h1>

      <h2>Ajouter une mesure</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="number"
          placeholder="Poids (kg)"
          value={nouveauPoids.valeur}
          onChange={(e) => setNouveauPoids({ ...nouveauPoids, valeur: e.target.value })}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <input
          type="date"
          placeholder="Date"
          value={nouveauPoids.date_mesure}
          onChange={(e) => setNouveauPoids({ ...nouveauPoids, date_mesure: e.target.value })}
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <button onClick={ajouterPoids} style={{ padding: '8px 16px' }}>Ajouter</button>
      </div>
<div style={{ marginTop: '30px' }}>
  <h2>Ajouter des mensurations</h2>
  <div style={{ marginBottom: '20px' }}>
    <input
      type="number"
      placeholder="Tour de taille (cm)"
      value={nouvelleMensuration.taille}
      onChange={(e) => setNouvelleMensuration({ ...nouvelleMensuration, taille: e.target.value })}
      style={{ marginRight: '10px', padding: '8px' }}
    />
    <input
      type="number"
      placeholder="Tour de bras (cm)"
      value={nouvelleMensuration.bras}
      onChange={(e) => setNouvelleMensuration({ ...nouvelleMensuration, bras: e.target.value })}
      style={{ marginRight: '10px', padding: '8px' }}
    />
    <input
      type="number"
      placeholder="Tour de cuisses (cm)"
      value={nouvelleMensuration.cuisses}
      onChange={(e) => setNouvelleMensuration({ ...nouvelleMensuration, cuisses: e.target.value })}
      style={{ marginRight: '10px', padding: '8px' }}
    />
    <input
      type="date"
      placeholder="Date"
      value={nouvelleMensuration.date_mesure}
      onChange={(e) => setNouvelleMensuration({ ...nouvelleMensuration, date_mesure: e.target.value })}
      style={{ marginRight: '10px', padding: '8px' }}
    />
    <button onClick={ajouterMensuration} style={{ padding: '8px 16px' }}>Ajouter</button>
  </div>
</div>




      <h2>Historique des mesures</h2>
      <ul>
        {poids.map((p) => (
          <li key={p.id}>
            {p.date} : {p.valeur} kg
          </li>
        ))}
      </ul>
<div style={{ marginTop: '30px' }}>
  <h2>Historique des mensurations</h2>
  <ul>
    {mensurations.map((m) => (
      <li key={m.id}>
        {m.date} : Taille={m.taille} cm, Bras={m.bras} cm, Cuisses={m.cuisses} cm
      </li>
    ))}
  </ul>
</div>

<div style={{ width: '80%', margin: '20px auto' }}>
  <h2>Évolution des mensurations</h2>
  {mensurations.length > 0 ? (
    <Line
      data={{
        labels: mensurations.map(m => m.date),
        datasets: [
          {
            label: 'Tour de taille (cm)',
            data: mensurations.map(m => m.taille || 0),
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          },
          {
            label: 'Tour de bras (cm)',
            data: mensurations.map(m => m.bras || 0),
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.1
          },
          {
            label: 'Tour de cuisses (cm)',
            data: mensurations.map(m => m.cuisses || 0),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      }}
    />
  ) : (
    <p>Aucune mensuration enregistrée.</p>
  )}
</div>



    </div>
  );
}

export default App;
