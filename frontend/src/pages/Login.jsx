import React, { useState } from 'react';
import { loginUser } from '../services/api';

export default function Login({ onLoginSuccess }) {
  // Langue active ('fr' par défaut, ou 'mg')
  const [lang, setLang] = useState('fr');
  
  // État du modal de connexion
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Formulaire de connexion
  const [im, setIm] = useState('');
  const [mdp, setMdp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dictionnaire de traductions FR / MG
  const t = {
    fr: {
      appName: "GED Haute Matsiatra",
      appTagline: "Gestion Électronique des Documents & Archives Administratives",
      districtName: "Région Haute Matsiatra - District de Fianarantsoa",
      loginBtn: "Espace Agent",
      heroTitle: "Souveraineté Numérique & Traçabilité des Documents Officiels",
      heroDesc: "Plateforme centralisée de dématérialisation, classification et archivage des pièces administratives et courriers pour le District de la Haute Matsiatra.",
      exploreBtn: "Découvrir le fonctionnement",
      accessBtn: "Connexion Agent (IM)",
      
      // Section Fonctionnement
      workflowTitle: "Fonctionnement du Système GED",
      workflowSubtitle: "Une chaîne de traitement sécurisée pour accélérer les démarches et sécuriser les archives.",
      
      step1Title: "1. Numérisation & Collecte",
      step1Desc: "Capture centralisée des courriers arrivants, actes administratifs et registres civils sous format haute définition.",
      
      step2Title: "2. Indexation & Méta-données",
      step2Desc: "Association automatique de matricules (IM), répertoires, types de documents et mots-clés d'archivage.",
      
      step3Title: "3. Traçabilité & Suivi",
      step3Desc: "Journalisation rigoureuse des consultations, modifications et suppressions effectuées par les agents habilités.",
      
      step4Title: "4. Archivage Sécurisé",
      step4Desc: "Stockage chiffré et sauvegardé garantissant la pérennité et la confidentialité des dossiers publics.",

      // Modal Connexion
      modalTitle: "Authentification Agent",
      modalSubtitle: "Veuillez entrer vos identifiants professionnels",
      labelIm: "Matricule (IM) :",
      labelMdp: "Mot de passe :",
      placeholderIm: "Ex: DAG001",
      btnSubmit: "Se connecter au Tableau de Bord",
      btnLoading: "Vérification en cours...",
      footerRights: "© 2026 Region Haute Matsiatra. Tous droits réservés."
    },
    mg: {
      appName: "GED Haute Matsiatra",
      appTagline: "Fitantanana ny Taratasy sy Tahirin-kevitra Ara-panjakana",
      districtName: "Faritra Haute Matsiatra - Distrikan'i Fianarantsoa",
      loginBtn: "Mpiditra / Mpandraharaha",
      heroTitle: "Fitantanana sy Fiarovana ny Taratasy Ara-panjakana",
      heroDesc: "Sehatra iraisana amin'ny fanaovana numérisation sy fitahirizana ireo boky, kope, ary taratasy rehetra ho an'ny Faritra Haute Matsiatra.",
      exploreBtn: "Hijery ny fomba fiasa",
      accessBtn: "Hiditra (Laharana IM)",
      
      // Section Fonctionnement
      workflowTitle: "Fomba Fiasan'ny Rafitra GED",
      workflowSubtitle: "Dingana maivana sy antoka ho an'ny fanafainganam-pandehan'ny raharaham-panjakana.",
      
      step1Title: "1. Fampidirana ny Taratasy",
      step1Desc: "Fandraisana sy fanaovana skana ireo taratasy miditra sy mivoaka rehetra amin'ny kalitao avo.",
      
      step2Title: "2. Fanalana Méta-données",
      step2Desc: "Fampitambatra ny laharana famantarana (IM), ny sokajy ary ny daty mba hahamora ny fikarohana.",
      
      step3Title: "3. Fanaraha-maso (Traçabilité)",
      step3Desc: "Tsiaro an-tsoratra rehetra momba ny fitaovana novakiana, nosoloina na nafana tamin'ny rafitra.",
      
      step4Title: "4. Fitahirizana Azo Antoka",
      step4Desc: "Fiarovana amin'ny fahasafotana sy ny fahaverezana mba hahafahan'ny taranaka rehetra mampiasa izany.",

      // Modal Connexion
      modalTitle: "Fidirana Mpandraharaha",
      modalSubtitle: "Ampidiro ny laharana IM sy ny teny miafinao",
      labelIm: "Laharana Famantarana (IM) :",
      labelMdp: "Teny miafina :",
      placeholderIm: "Ohatra: DAG001",
      btnSubmit: "Hiditra amin'ny Sehatra",
      btnLoading: "Ametrahana ny fidirana...",
      footerRights: "© 2026 Faritra Haute Matsiatra. Zo rehetra voatana."
    }
  };

  const currText = t[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser(im, mdp);
      
      const userData = response.user || response;
      const token = response.access_token || response.token || response.im;

      localStorage.setItem('user', JSON.stringify(userData));
      if (token) {
        localStorage.setItem('token', token);
      }

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || (lang === 'fr' 
          ? 'Identifiants invalides ou serveur indisponible.' 
          : 'Laharana IM na teny miafina tsy mety, na ny wif/sehatra tsy mandeha.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.landingContainer}>
      {/* BARRE DE NAVIGATION HEADER */}
      <header style={styles.header}>
        <div style={styles.brandContainer}>
          <div style={styles.logoBadge}>G</div>
          <div>
            <h1 style={styles.brandTitle}>{currText.appName}</h1>
            <p style={styles.brandSubtitle}>{currText.districtName}</p>
          </div>
        </div>

        <div style={styles.navRight}>
          {/* BOUTON SELECTION LANGUE DYNAMIQUE */}
          <div style={styles.langSelector}>
            <button
              onClick={() => setLang('fr')}
              style={{
                ...styles.langBtn,
                ...(lang === 'fr' ? styles.langBtnActive : {})
              }}
            >
              🇫🇷 FR
            </button>
            <button
              onClick={() => setLang('mg')}
              style={{
                ...styles.langBtn,
                ...(lang === 'mg' ? styles.langBtnActive : {})
              }}
            >
              🇲🇬 MG
            </button>
          </div>

          <button
            onClick={() => setShowLoginModal(true)}
            style={styles.loginModalTriggerBtn}
          >
            🔒 {currText.loginBtn}
          </button>
        </div>
      </header>

      {/* BANNIÈRE HERO */}
      <section style={styles.heroSection}>
        <div style={styles.heroContent}>
          <span style={styles.badgeTag}>{currText.appTagline}</span>
          <h2 style={styles.heroTitle}>{currText.heroTitle}</h2>
          <p style={styles.heroDesc}>{currText.heroDesc}</p>
          
          <div style={styles.heroActions}>
            <button 
              onClick={() => setShowLoginModal(true)} 
              style={styles.primaryHeroBtn}
            >
              {currText.accessBtn} &rarr;
            </button>
            <a href="#workflow" style={styles.secondaryHeroBtn}>
              {currText.exploreBtn}
            </a>
          </div>
        </div>
      </section>

      {/* SECTION EXPLICATION DU FONCTIONNEMENT */}
      <section id="workflow" style={styles.workflowSection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>{currText.workflowTitle}</h3>
          <p style={styles.sectionSubtitle}>{currText.workflowSubtitle}</p>
        </div>

        <div style={styles.gridContainer}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📄</div>
            <h4 style={styles.featureTitle}>{currText.step1Title}</h4>
            <p style={styles.featureDesc}>{currText.step1Desc}</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🏷️</div>
            <h4 style={styles.featureTitle}>{currText.step2Title}</h4>
            <p style={styles.featureDesc}>{currText.step2Desc}</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🛡️</div>
            <h4 style={styles.featureTitle}>{currText.step3Title}</h4>
            <p style={styles.featureDesc}>{currText.step3Desc}</p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💾</div>
            <h4 style={styles.featureTitle}>{currText.step4Title}</h4>
            <p style={styles.featureDesc}>{currText.step4Desc}</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>{currText.footerRights}</p>
      </footer>

      {/* MODAL DE CONNEXION DYNAMIQUE */}
      {showLoginModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.card}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{currText.modalTitle}</h3>
              <button 
                onClick={() => setShowLoginModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>
            
            <p style={styles.subtitle}>{currText.modalSubtitle}</p>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label style={styles.label}>{currText.labelIm}</label>
                <input
                  type="text"
                  value={im}
                  onChange={(e) => setIm(e.target.value)}
                  placeholder={currText.placeholderIm}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>{currText.labelMdp}</label>
                <input
                  type="password"
                  value={mdp}
                  onChange={(e) => setMdp(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? currText.btnLoading : currText.btnSubmit}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// FEUILLE DE STYLE MODERNISÉE
const styles = {
  landingContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 48px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '20px',
  },
  brandTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  brandSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  langSelector: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '20px',
    padding: '3px',
    border: '1px solid #cbd5e1',
  },
  langBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  langBtnActive: {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  loginModalTriggerBtn: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  heroSection: {
    padding: '80px 24px 60px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  badgeTag: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block',
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: '36px',
    lineHeight: '1.25',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 16px',
  },
  heroDesc: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#475569',
    marginBottom: '32px',
  },
  heroActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
  },
  primaryHeroBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
  },
  secondaryHeroBtn: {
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  workflowSection: {
    maxWidth: '1100px',
    margin: '60px auto',
    padding: '0 24px 80px',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px',
  },
  sectionSubtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  featureIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px',
  },
  featureDesc: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: 0,
  },
  footer: {
    borderTop: '1px solid #e2e8f0',
    padding: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    backgroundColor: '#ffffff',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  modalTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: '20px',
    fontWeight: '700',
  },
  closeBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '13px',
    marginTop: '2px',
    marginBottom: '20px',
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    marginTop: '8px',
  },
  error: {
    padding: '10px 12px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
  },
};