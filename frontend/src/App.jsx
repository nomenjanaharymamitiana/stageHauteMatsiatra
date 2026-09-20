import React, { useState, useEffect } from 'react';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Récupérer la session existante si l'utilisateur rafraîchit la page
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', pb: '10px' }}>
        <h2>Bienvenue, {user.prenom} {user.nom} ({user.type_user})</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Déconnexion
        </button>
      </header>

      <main style={{ marginTop: '20px' }}>
        <h3>Espace de gestion des documents (GED)</h3>
        {/* Ici viendront nos futurs composants d'upload et de recherche */}
      </main>
    </div>
  );
}

export default App;