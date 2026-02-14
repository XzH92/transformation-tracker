const MensurationsList = ({ mensurations }) => {
  return (
    <div style={{ marginTop: '30px' }}>
      <h2>Historique des mensurations</h2>
      <ul>
        {mensurations.map((m) => (
          <li key={m.id}>
            {m.date} : Taille={m.taille} cm, Biceps G={m.biceps_gauche} cm, Biceps D={m.biceps_droit} cm, Cuisse G={m.cuisse_gauche} cm, Cuisse D={m.cuisse_droite} cm
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MensurationsList;