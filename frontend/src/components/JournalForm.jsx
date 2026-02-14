import { useState } from 'react';
import axios from 'axios';

const JournalForm = ({ onJournalAdded }) => {
  const [nouvelleEntree, setNouvelleEntree] = useState({
    texte: '',
    date: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!nouvelleEntree.texte) {
      newErrors.texte = 'Le texte est requis';
    }
    if (!nouvelleEntree.date) {
      newErrors.date = 'La date est requise';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const ajouterEntree = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const formattedData = {
        texte: nouvelleEntree.texte,
        date: nouvelleEntree.date
      };
      
      await axios.post('http://127.0.0.1:8000/journal/', formattedData);
      setNouvelleEntree({
        texte: '',
        date: ''
      });
      setErrors({});
      if (onJournalAdded) {
        onJournalAdded();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'entrée de journal :", error.response?.data || error.message);
      setErrors({ general: "Impossible d'ajouter l'entrée de journal. Veuillez vérifier votre connexion ou réessayer plus tard." });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNouvelleEntree({ ...nouvelleEntree, [name]: value });
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Ajouter une entrée de journal</h3>
      <div style={{ marginBottom: '10px' }}>
        <label>Date:</label>
        <input
          type="date"
          name="date"
          value={nouvelleEntree.date}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        {errors.date && <span style={{ color: 'red', fontSize: '12px' }}>{errors.date}</span>}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Texte libre:</label>
        <textarea
          name="texte"
          placeholder="Comment vous sentez-vous aujourd'hui ? Quels sont vos observations ?"
          value={nouvelleEntree.texte}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px', minHeight: '100px', resize: 'vertical' }}
        />
        {errors.texte && <span style={{ color: 'red', fontSize: '12px' }}>{errors.texte}</span>}
      </div>
      {errors.general && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{errors.general}</div>}
      <button onClick={ajouterEntree} style={{ padding: '10px 20px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Ajouter l'entrée de journal
      </button>
    </div>
  );
};

export default JournalForm;