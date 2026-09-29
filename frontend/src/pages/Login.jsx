import React, { useState } from 'react';
import { loginUser } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [lang, setLang] = useState('fr');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Formulaire
  const [im, setIm] = useState('');
  const [mdp, setMdp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Traductions FR / MG
  const t = {
    fr: {
      appName: "GED Haute Matsiatra",
      appTagline: "Gestion Électronique des Documents & Archives Administratives",
      districtName: "Région Haute Matsiatra — District de Fianarantsoa",
      loginBtn: "Espace Agent",
      heroTitle: "Souveraineté Numérique & Traçabilité des Documents Officiels",
      heroDesc: "Plateforme centralisée de dématérialisation, classification et archivage des pièces administratives et courriers pour la Région Haute Matsiatra.",
      exploreBtn: "Découvrir le système",
      accessBtn: "Connexion Agent (IM)",
      
      // Carte
      mapTitle: "Couverture Territoriale — Région Haute Matsiatra",
      mapSubtitle: "Le système GED interconnecte les services administratifs régionaux à Fianarantsoa.",
      
      // Workflow
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
      footerRights: "© 2026 Région Haute Matsiatra. Tous droits réservés."
    },
    mg: {
      appName: "GED Haute Matsiatra",
      appTagline: "Fitantanana ny Taratasy sy Tahirin-kevitra Ara-panjakana",
      districtName: "Faritra Haute Matsiatra — Distrikan'i Fianarantsoa",
      loginBtn: "Mpiditra / Mpandraharaha",
      heroTitle: "Fitantanana sy Fiarovana ny Taratasy Ara-panjakana",
      heroDesc: "Sehatra iraisana amin'ny fanaovana numérisation sy fitahirizana ireo boky, kope, ary taratasy rehetra ho an'ny Faritra Haute Matsiatra.",
      exploreBtn: "Hijery ny fomba fiasa",
      accessBtn: "Hiditra (Laharana IM)",
      
      // Carte
      mapTitle: "Saritanin'ny Faritra Haute Matsiatra",
      mapSubtitle: "Mampifandray ireo sampan-draharaha ara-panjakana rehetra ao Fianarantsoa ny rafitra GED.",

      // Workflow
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
      if (token) localStorage.setItem('token', token);

      if (onLoginSuccess) onLoginSuccess(userData);
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
      {/* HEADER BAR */}
      <header style={styles.header}>
        <div style={styles.brandContainer}>
          <div style={styles.logoBadge}>G</div>
          <div>
            <h1 style={styles.brandTitle}>{currText.appName}</h1>
            <p style={styles.brandSubtitle}>{currText.districtName}</p>
          </div>
        </div>

        <div style={styles.navRight}>
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

      {/* HERO SECTION */}
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
            <a href="#mapSection" style={styles.secondaryHeroBtn}>
              {currText.exploreBtn}
            </a>
          </div>
        </div>
      </section>

      {/* CARTE OPENSTREETMAP - HAUTE MATSIATRA / FIANARANTSOA */}
      <section id="mapSection" style={styles.mapSection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>{currText.mapTitle}</h3>
          <p style={styles.sectionSubtitle}>{currText.mapSubtitle}</p>
        </div>
        <div style={styles.mapContainer}>
          <iframe
            title="Carte Haute Matsiatra - Fianarantsoa"
            width="100%"
            height="380"
            style={{ border: 0, borderRadius: '16px' }}
            loading="lazy"
            allowFullScreen
            src="https://www.openstreetmap.org/export/embed.html?bbox=46.9000%2C-21.6000%2C47.3000%2C-21.3000&amp;layer=mapnik&amp;marker=-21.4536%2C47.0858"
          ></iframe>
        </div>
      </section>

      {/* SECTION WORKFLOW */}
      <section style={styles.workflowSection}>
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

      {/* MODAL DE CONNEXION */}
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

// PALETTE : BLEU PÉTROLE (#085f63 / #0e3b43) + GRIS (#f4f6f8 / #e2e8f0) + BLANC (#ffffff)
const styles = {
  landingContainer: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
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
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoBadge: {
    width: '42px',
    height: '42px',
    backgroundColor: '#085f63',
    color: '#ffffff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '22px',
    boxShadow: '0 4px 10px rgba(8, 95, 99, 0.25)',
  },
  brandTitle: {
    margin: 0,
    fontSize: '19px',
    fontWeight: '700',
    color: '#0e3b43',
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
    backgroundColor: '#e2e8f0',
    borderRadius: '20px',
    padding: '3px',
  },
  langBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.2s ease',
  },
  langBtnActive: {
    backgroundColor: '#ffffff',
    color: '#085f63',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  loginModalTriggerBtn: {
    backgroundColor: '#085f63',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  heroSection: {
    padding: '70px 24px 50px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f4f6f8 100%)',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '820px',
    margin: '0 auto',
  },
  badgeTag: {
    backgroundColor: '#e0f2f1',
    color: '#085f63',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-block',
    marginBottom: '18px',
  },
  heroTitle: {
    fontSize: '36px',
    lineHeight: '1.25',
    fontWeight: '800',
    color: '#0e3b43',
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
    backgroundColor: '#085f63',
    color: '#ffffff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(8, 95, 99, 0.3)',
  },
  secondaryHeroBtn: {
    backgroundColor: '#ffffff',
    color: '#0e3b43',
    border: '1px solid #cbd5e1',
    padding: '14px 28px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  mapSection: {
    maxWidth: '1100px',
    margin: '40px auto 0',
    padding: '0 24px',
  },
  mapContainer: {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  workflowSection: {
    maxWidth: '1100px',
    margin: '60px auto',
    padding: '0 24px 60px',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0e3b43',
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
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  featureIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0e3b43',
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
    color: '#64748b',
    backgroundColor: '#ffffff',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 59, 67, 0.65)',
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
    color: '#0e3b43',
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
    backgroundColor: '#085f63',
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