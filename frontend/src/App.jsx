import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [poids, setPoids] = useState([]);
  const [nouveauPoids, setNouveauPoids] = useState({ valeur: '', date_mesure: '' });

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


  // Charger les poids au démarrage
  useEffect(() => {
    fetchPoids();
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

      <h2>Historique des mesures</h2>
      <ul>
        {poids.map((p) => (
          <li key={p.id}>
            {p.date} : {p.valeur} kg
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
