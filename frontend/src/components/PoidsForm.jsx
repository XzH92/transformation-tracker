import { useState } from 'react';
import axios from 'axios';

const PoidsForm = ({ onPoidsAdded }) => {
  const [nouveauPoids, setNouveauPoids] = useState({ valeur: '', date_mesure: '' });

  const ajouterPoids = async () => {
    try {
      const formattedData = {
        valeur: parseFloat(nouveauPoids.valeur),
        date_mesure: nouveauPoids.date_mesure,
      };
      await axios.post('http://127.0.0.1:8000/poids/', formattedData);
      setNouveauPoids({ valeur: '', date_mesure: '' });
      if (onPoidsAdded) {
        onPoidsAdded();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du poids :", error.response?.data || error.message);
    }
  };

  return (
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
  );
};

export default PoidsForm;