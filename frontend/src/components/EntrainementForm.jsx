import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const EntrainementForm = ({ onEntrainementAdded }) => {
  const [nouvelEntrainement, setNouvelEntrainement] = useState({
    exercice: '',
    series: '',
    reps: '',
    charge: '',
    rpe: '',
    date: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!nouvelEntrainement.exercice) {
      newErrors.exercice = 'L\'exercice est requis';
    }
    if (!nouvelEntrainement.date) {
      newErrors.date = 'La date est requise';
    }
    if (nouvelEntrainement.series && isNaN(nouvelEntrainement.series)) {
      newErrors.series = 'Les séries doivent être un nombre';
    }
    if (nouvelEntrainement.reps && isNaN(nouvelEntrainement.reps)) {
      newErrors.reps = 'Les reps doivent être un nombre';
    }
    if (nouvelEntrainement.charge && isNaN(nouvelEntrainement.charge)) {
      newErrors.charge = 'La charge doit être un nombre';
    }
    if (nouvelEntrainement.rpe && (isNaN(nouvelEntrainement.rpe) || nouvelEntrainement.rpe < 1 || nouvelEntrainement.rpe > 10)) {
      newErrors.rpe = 'Le RPE doit être un nombre entre 1 et 10';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ajouterEntrainement = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const formattedData = {
        exercice: nouvelEntrainement.exercice,
        series: nouvelEntrainement.series ? parseInt(nouvelEntrainement.series) : null,
        reps: nouvelEntrainement.reps ? parseInt(nouvelEntrainement.reps) : null,
        charge: nouvelEntrainement.charge ? parseFloat(nouvelEntrainement.charge) : null,
        rpe: nouvelEntrainement.rpe ? parseInt(nouvelEntrainement.rpe) : null,
        date: nouvelEntrainement.date
      };
      
      await axios.post(`${API_BASE_URL}/entrainements/`, formattedData);
      setNouvelEntrainement({
        exercice: '',
        series: '',
        reps: '',
        charge: '',
        rpe: '',
        date: ''
      });
      setErrors({});
      if (onEntrainementAdded) {
        onEntrainementAdded();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'entraînement :", error.response?.data || error.message);
      // Afficher un message d'erreur à l'utilisateur
      setErrors({ general: "Impossible d'ajouter l'entraînement. Veuillez vérifier votre connexion ou réessayer plus tard." });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNouvelEntrainement({ ...nouvelEntrainement, [name]: value });
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Ajouter une séance d'entraînement</h3>
      <div className="mensuration-grid-full" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div>
          <label>Exercice:</label>
          <input
            type="text"
            name="exercice"
            placeholder="Nom de l'exercice"
            value={nouvelEntrainement.exercice}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.exercice && <span style={{ color: 'red', fontSize: '12px' }}>{errors.exercice}</span>}
        </div>
        <div>
          <label>Séries:</label>
          <input
            type="number"
            name="series"
            placeholder="Nombre de séries"
            value={nouvelEntrainement.series}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.series && <span style={{ color: 'red', fontSize: '12px' }}>{errors.series}</span>}
        </div>
        <div>
          <label>Reps:</label>
          <input
            type="number"
            name="reps"
            placeholder="Nombre de répétitions"
            value={nouvelEntrainement.reps}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.reps && <span style={{ color: 'red', fontSize: '12px' }}>{errors.reps}</span>}
        </div>
        <div>
          <label>Charge (kg):</label>
          <input
            type="number"
            name="charge"
            placeholder="Charge utilisée"
            value={nouvelEntrainement.charge}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.charge && <span style={{ color: 'red', fontSize: '12px' }}>{errors.charge}</span>}
        </div>
        <div>
          <label>RPE (1-10):</label>
          <input
            type="number"
            name="rpe"
            placeholder="Niveau de difficulté"
            value={nouvelEntrainement.rpe}
            onChange={handleInputChange}
            min="1"
            max="10"
            className="form-input"
          />
          {errors.rpe && <span style={{ color: 'red', fontSize: '12px' }}>{errors.rpe}</span>}
        </div>
        <div>
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={nouvelEntrainement.date}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.date && <span style={{ color: 'red', fontSize: '12px' }}>{errors.date}</span>}
        </div>
      </div>
      {errors.general && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{errors.general}</div>}
      <button onClick={ajouterEntrainement} style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Ajouter l'entraînement
      </button>
    </div>
  );
};

export default EntrainementForm;