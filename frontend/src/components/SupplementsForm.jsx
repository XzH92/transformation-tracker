import { useState } from 'react';
import api from '../api';

const SupplementsForm = ({ onSupplementAdded }) => {
  const [nouveauSupplement, setNouveauSupplement] = useState({
    nom: '',
    dose: '',
    frequence: '',
    date_debut: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!nouveauSupplement.nom) {
      newErrors.nom = 'Le nom du supplément est requis';
    }
    if (!nouveauSupplement.date_debut) {
      newErrors.date_debut = 'La date de début est requise';
    }
    if (nouveauSupplement.dose && isNaN(nouveauSupplement.dose)) {
      newErrors.dose = 'La dose doit être un nombre';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ajouterSupplement = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const formattedData = {
        nom: nouveauSupplement.nom,
        dose: nouveauSupplement.dose ? parseFloat(nouveauSupplement.dose) : null,
        frequence: nouveauSupplement.frequence,
        date_debut: nouveauSupplement.date_debut
      };
      
      await api.post('/supplements/', formattedData);
      setNouveauSupplement({
        nom: '',
        dose: '',
        frequence: '',
        date_debut: ''
      });
      setErrors({});
      if (onSupplementAdded) {
        onSupplementAdded();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du supplément :", error.response?.data || error.message);
      setErrors({ general: "Impossible d'ajouter le supplément. Veuillez vérifier votre connexion ou réessayer plus tard." });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNouveauSupplement({ ...nouveauSupplement, [name]: value });
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Ajouter un supplément</h3>
      <div className="mensuration-grid-full" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div>
          <label>Nom du supplément:</label>
          <input
            type="text"
            name="nom"
            placeholder="Nom du supplément"
            value={nouveauSupplement.nom}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.nom && <span style={{ color: 'red', fontSize: '12px' }}>{errors.nom}</span>}
        </div>
        <div>
          <label>Dose:</label>
          <input
            type="text"
            name="dose"
            placeholder="Dose (ex: 5g, 200mg)"
            value={nouveauSupplement.dose}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.dose && <span style={{ color: 'red', fontSize: '12px' }}>{errors.dose}</span>}
        </div>
        <div>
          <label>Fréquence:</label>
          <input
            type="text"
            name="frequence"
            placeholder="Fréquence (ex: 1x/jour, 2x/semaine)"
            value={nouveauSupplement.frequence}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
        <div>
          <label>Date de début:</label>
          <input
            type="date"
            name="date_debut"
            value={nouveauSupplement.date_debut}
            onChange={handleInputChange}
            className="form-input"
          />
          {errors.date_debut && <span style={{ color: 'red', fontSize: '12px' }}>{errors.date_debut}</span>}
        </div>
      </div>
      {errors.general && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{errors.general}</div>}
      <button onClick={ajouterSupplement} style={{ padding: '10px 20px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Ajouter le supplément
      </button>
    </div>
  );
};

export default SupplementsForm;