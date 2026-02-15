import { useState, useEffect } from 'react';
import api from '../api';
import EntrainementForm from '../components/EntrainementForm';

const EntrainementPage = ({ entrainements, onEntrainementAdded }) => {
  const [routines, setRoutines] = useState([]);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [editExercices, setEditExercices] = useState('');

  const fetchRoutines = async () => {
    try {
      const response = await api.get('/routines/');
      setRoutines(response.data.routines);
    } catch (error) {
      console.error('Erreur routines:', error);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const saveRoutine = async (nom) => {
    try {
      let exercicesJson;
      try {
        exercicesJson = JSON.parse(editExercices);
      } catch {
        exercicesJson = editExercices.split('\n').filter(l => l.trim()).map(line => {
          const parts = line.split(',').map(s => s.trim());
          return {
            exercice: parts[0] || '',
            series: parts[1] || '',
            reps: parts[2] || '',
            charge: parts[3] || '',
            notes: parts[4] || ''
          };
        });
      }

      await api.post('/routines/', {
        nom,
        exercices: JSON.stringify(exercicesJson)
      });
      setEditingRoutine(null);
      setEditExercices('');
      fetchRoutines();
    } catch (error) {
      console.error('Erreur sauvegarde routine:', error);
    }
  };

  const deleteRoutine = async (id) => {
    try {
      await api.delete(`/routines/${id}`);
      fetchRoutines();
    } catch (error) {
      console.error('Erreur suppression routine:', error);
    }
  };

  const getRoutineByNom = (nom) => routines.find(r => r.nom === nom);

  const parseExercices = (exercicesStr) => {
    if (!exercicesStr) return [];
    try {
      const parsed = JSON.parse(exercicesStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const startEditing = (nom) => {
    const routine = getRoutineByNom(nom);
    setEditingRoutine(nom);
    if (routine) {
      const exercices = parseExercices(routine.exercices);
      setEditExercices(exercices.map(e =>
        `${e.exercice}, ${e.series}, ${e.reps}, ${e.charge}, ${e.notes || ''}`
      ).join('\n'));
    } else {
      setEditExercices('');
    }
  };

  const smallBtnStyle = (color) => ({
    padding: '4px 10px',
    fontSize: '12px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  });

  const routineNames = ['A', 'B', 'C'];

  const groupedEntrainements = (entrainements || [])
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .reduce((acc, e) => {
      const key = e.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    }, {});

  return (
    <div>
      {/* Routines A/B/C */}
      <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Routines</h2>
      <div className="routines-grid">
        {routineNames.map(nom => {
          const routine = getRoutineByNom(nom);
          const exercices = routine ? parseExercices(routine.exercices) : [];
          const isEditing = editingRoutine === nom;

          return (
            <div key={nom} className="routine-card">
              <div className="routine-card__header">
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                  Routine {nom}
                </h3>
                <div className="routine-card__actions">
                  {!isEditing ? (
                    <button onClick={() => startEditing(nom)} style={smallBtnStyle('#2196F3')}>
                      Éditer
                    </button>
                  ) : (
                    <>
                      <button onClick={() => saveRoutine(nom)} style={smallBtnStyle('#4CAF50')}>
                        Sauver
                      </button>
                      <button onClick={() => { setEditingRoutine(null); setEditExercices(''); }} style={smallBtnStyle('#999')}>
                        Annuler
                      </button>
                    </>
                  )}
                  {routine && (
                    <button onClick={() => deleteRoutine(routine.id)} style={smallBtnStyle('#f44336')}>
                      X
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div>
                  <p style={{ fontSize: '12px', color: '#777', margin: '0 0 6px 0' }}>
                    Format: exercice, series, reps, charge, notes (une ligne par exercice)
                  </p>
                  <textarea
                    value={editExercices}
                    onChange={(e) => setEditExercices(e.target.value)}
                    className="form-input"
                    style={{ minHeight: '120px', fontFamily: 'monospace' }}
                    placeholder="Squat, 4, 8, 100, RIR 2&#10;Leg press, 3, 12, 150,"
                  />
                </div>
              ) : exercices.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', minWidth: '250px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                        <th style={{ padding: '4px 6px' }}>Exercice</th>
                        <th style={{ padding: '4px 6px' }}>S</th>
                        <th style={{ padding: '4px 6px' }}>R</th>
                        <th style={{ padding: '4px 6px' }}>Charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercices.map((ex, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '4px 6px' }}>{ex.exercice}</td>
                          <td style={{ padding: '4px 6px' }}>{ex.series}</td>
                          <td style={{ padding: '4px 6px' }}>{ex.reps}</td>
                          <td style={{ padding: '4px 6px' }}>{ex.charge ? `${ex.charge} kg` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>Aucun exercice défini</p>
              )}
              {routine && routine.updated_at && (
                <p style={{ fontSize: '11px', color: '#aaa', marginTop: '8px', marginBottom: 0 }}>
                  Mis à jour le {new Date(routine.updated_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Saisie rapide */}
      <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Saisie rapide</h2>

      <EntrainementForm onEntrainementAdded={onEntrainementAdded} />

      {/* Historique */}
      <h2 style={{ margin: '30px 0 16px 0', color: '#333' }}>Historique des séances</h2>
      <div className="entrainement-history">
        {Object.keys(groupedEntrainements).length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>Aucun entraînement enregistré</p>
        ) : (
          Object.entries(groupedEntrainements).slice(0, 10).map(([dateStr, exos]) => (
            <div key={dateStr} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#555', fontSize: '14px' }}>
                {new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      <th style={{ padding: '4px 8px' }}>Exercice</th>
                      <th style={{ padding: '4px 8px' }}>Series</th>
                      <th style={{ padding: '4px 8px' }}>Reps</th>
                      <th style={{ padding: '4px 8px' }}>Charge</th>
                      <th style={{ padding: '4px 8px' }}>RPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exos.map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '4px 8px' }}>{e.exercice}</td>
                        <td style={{ padding: '4px 8px' }}>{e.series}</td>
                        <td style={{ padding: '4px 8px' }}>{e.reps}</td>
                        <td style={{ padding: '4px 8px' }}>{e.charge ? `${e.charge} kg` : '-'}</td>
                        <td style={{ padding: '4px 8px' }}>{e.rpe || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EntrainementPage;
