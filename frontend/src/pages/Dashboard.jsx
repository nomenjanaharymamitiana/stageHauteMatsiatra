import React, { useState, useEffect } from "react";
import logoGed from "../assets/WhatsApp Image 2026-09-21 at 11.01.52.jpeg";
import "../styles/theme.css";
import DocumentUploadModal from "../components/DocumentUploadModal";
import DocumentEditModal from "../components/DocumentEditModal";
import Parametres from "./Parametres";
import translations from "../locales/translations.json";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

const CATEGORIES = [
  { id: "Nomination", icon: "bi-person-badge-fill", color: "#0b2535", bg: "#e2edf2" },
  { id: "Finance", icon: "bi-cash-coin", color: "#007791", bg: "#d2e8ee" },
  { id: "Autre", icon: "bi-folder2-open", color: "#204051", bg: "#eaf2f5" }
];

export default function Dashboard({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [lang, setLang] = useState("fr");
  const t = translations[lang] || translations["fr"];

  const [activeTab, setActiveTab] = useState("tableau");
  
  // État d'ouverture du menu déroulant Paramètres dans la sidebar
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Sous-onglet actif pour les paramètres : "compte", "password", "affichage"
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState("compte");

  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // État pour la corbeille
  const [trashDocuments, setTrashDocuments] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [docToHardDelete, setDocToHardDelete] = useState(null);

  // État d'affichage du panneau de filtres multi-critères
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtres pour l'onglet de Recherche
  const [searchFilters, setSearchFilters] = useState({
    num_ref: "",
    cat: "",
    annee_redac: "",
    file_format: "",
    title: ""
  });
  const [searchLoading, setSearchLoading] = useState(false);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState(null);

  // Visionneuse
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Suppression temporaire (mise en corbeille)
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || user?.im || user?.im_dag_rh || "";
    return {
      "Authorization": `Bearer ${token}`,
      "X-User-IM": token
    };
  };

  const fetchAllDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setAllDocuments(list);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération globale :", error);
    }
  };

  const fetchDocuments = async (category = selectedCategory) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/`;
      if (category) {
        url = `${API_BASE_URL}/search?cat=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setDocuments(list);
      }
    } catch (error) {
      console.error("Erreur de connexion à l'API :", error);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les documents de la Corbeille
  const fetchTrashDocuments = async () => {
    setTrashLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/trash`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setTrashDocuments(list);
      } else {
        console.error("Erreur chargement corbeille");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la corbeille :", error);
    } finally {
      setTrashLoading(false);
    }
  };

  // Restaurer un document depuis la corbeille
  const handleRestore = async (num_ref) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(num_ref)}/restore`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setTrashDocuments((prev) => prev.filter((doc) => doc.num_ref !== num_ref));
        fetchAllDocuments();
        fetchDocuments(selectedCategory);
      } else {
        alert("Erreur lors de la restauration du document.");
      }
    } catch (error) {
      console.error("Erreur restauration :", error);
    }
  };

  // Suppression definitiva du document
  const confirmHardDelete = async () => {
    if (!docToHardDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(docToHardDelete.num_ref)}/hard`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setTrashDocuments((prev) => prev.filter((doc) => doc.num_ref !== docToHardDelete.num_ref));
        setDocToHardDelete(null);
      } else {
        alert("Erreur lors de la suppression définitive.");
      }
    } catch (error) {
      console.error("Erreur suppression définitive :", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecuteSearch = async (overrideFilters = null) => {
    setSearchLoading(true);
    try {
      const activeFilters = overrideFilters || searchFilters;
      const queryParams = new URLSearchParams();

      if (activeFilters.title.trim()) queryParams.append("title", activeFilters.title.trim());
      if (activeFilters.num_ref.trim()) queryParams.append("num_ref", activeFilters.num_ref.trim());
      if (activeFilters.cat.trim()) queryParams.append("cat", activeFilters.cat.trim());
      if (activeFilters.annee_redac.trim()) queryParams.append("annee_redac", activeFilters.annee_redac.trim());
      if (activeFilters.file_format.trim()) queryParams.append("file_format", activeFilters.file_format.trim());

      const url = `${API_BASE_URL}/search?${queryParams.toString()}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setDocuments(list);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResetSearch = () => {
    const resetState = {
      num_ref: "",
      cat: "",
      annee_redac: "",
      file_format: "",
      title: ""
    };
    setSearchFilters(resetState);
    handleExecuteSearch(resetState);
  };

  useEffect(() => {
    fetchAllDocuments();
    fetchDocuments(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleOpenPreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/preview`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } else {
        alert("Erreur lors du chargement de la prévisualisation.");
        setPreviewDoc(null);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du fichier :", err);
      alert("Erreur lors du chargement de la prévisualisation.");
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCategoryClick = (catId) => {
    const newCategory = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCategory);
    fetchDocuments(newCategory);
  };

  const getCategoryCount = (catId) => {
    return allDocuments.filter(
      (doc) => doc.cat && doc.cat.trim().toLowerCase() === catId.toLowerCase()
    ).length;
  };

  // Déplacement vers la corbeille
  const confirmDelete = async () => {
    if (!docToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(docToDelete.num_ref)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.num_ref !== docToDelete.num_ref));
        setAllDocuments((prev) => prev.filter((doc) => doc.num_ref !== docToDelete.num_ref));
        setDocToDelete(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || "Erreur lors de la suppression du document.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="layout-container" style={{ backgroundColor: "#f4f8fa", color: "#204051", fontFamily: "Segoe UI, sans-serif", display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside className="sidebar" style={{ backgroundColor: "#ffffff", borderRight: "1px solid #c4d7e0", width: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div className="brand-header" style={{ padding: "16px", borderBottom: "1px solid #e2edf2", display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoGed} alt="Logo GED" className="brand-logo-img" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
            <div>
              <h1 className="brand-title" style={{ fontSize: "16px", fontWeight: "700", color: "#0b2535", margin: 0 }}>
                {t.brand?.title || "GED District"}
              </h1>
              <p className="brand-subtitle" style={{ fontSize: "12px", color: "#007791", margin: 0 }}>
                {t.brand?.subtitle || "Haute Matsiatra"}
              </p>
            </div>
          </div>

          <nav className="nav-menu" style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Tableau de bord */}
            <button
              className={`nav-item ${activeTab === "tableau" ? "active" : ""}`}
              onClick={() => { setActiveTab("tableau"); fetchDocuments(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "tableau" ? "#0b2535" : "transparent",
                color: activeTab === "tableau" ? "#ffffff" : "#204051",
                fontWeight: activeTab === "tableau" ? "700" : "600",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
            >
              <i className="bi bi-grid-1x2-fill"></i> {t.nav?.dashboard || "Tableau de bord"}
            </button>

            {/* Recherche */}
            <button
              className={`nav-item ${activeTab === "recherche" ? "active" : ""}`}
              onClick={() => { setActiveTab("recherche"); handleExecuteSearch(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "recherche" ? "#0b2535" : "transparent",
                color: activeTab === "recherche" ? "#ffffff" : "#204051",
                fontWeight: activeTab === "recherche" ? "700" : "600",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
            >
              <i className="bi bi-search"></i> {t.nav?.search || "Recherche"}
            </button>

            {/* Tous les Documents */}
            <button
              className={`nav-item ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => { setActiveTab("documents"); fetchDocuments(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "documents" ? "#0b2535" : "transparent",
                color: activeTab === "documents" ? "#ffffff" : "#204051",
                fontWeight: activeTab === "documents" ? "700" : "600",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
            >
              <i className="bi bi-folder-fill"></i> {t.nav?.documents || "Tous les Documents"}
            </button>

            {/* Corbeille */}
            <button
              className={`nav-item ${activeTab === "corbeille" ? "active" : ""}`}
              onClick={() => { setActiveTab("corbeille"); fetchTrashDocuments(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "corbeille" ? "#0b2535" : "transparent",
                color: activeTab === "corbeille" ? "#ffffff" : "#204051",
                fontWeight: activeTab === "corbeille" ? "700" : "600",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
            >
              <i className="bi bi-trash3-fill"></i> {t.nav?.trash || "Corbeille"}
            </button>

            {/* MENU PARAMÈTRES DÉROULANT */}
            <div>
              <button
                className={`nav-item ${activeTab === "parametres" ? "active" : ""}`}
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  setActiveTab("parametres");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeTab === "parametres" ? "#0b2535" : "transparent",
                  color: activeTab === "parametres" ? "#ffffff" : "#204051",
                  fontWeight: activeTab === "parametres" ? "700" : "600",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="bi bi-gear-fill"></i> {t.nav?.settings || "Paramètres"}
                </span>
                <i className={`bi bi-chevron-${isSettingsOpen ? "up" : "down"}`} style={{ fontSize: "12px" }}></i>
              </button>

              {isSettingsOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px", paddingLeft: "28px" }}>
                  {[
                    { id: "compte", label: "Paramètres du compte", icon: "bi-person" },
                    { id: "password", label: "Mise à jour du compte", icon: "bi-shield-lock" },
                    { id: "affichage", label: "Paramètres d'affichage", icon: "bi-sliders" }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveTab("parametres");
                        setActiveSettingsSubTab(sub.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: activeTab === "parametres" && activeSettingsSubTab === sub.id ? "#e2edf2" : "transparent",
                        color: activeTab === "parametres" && activeSettingsSubTab === sub.id ? "#0b2535" : "#007791",
                        fontWeight: activeSettingsSubTab === sub.id ? "700" : "500",
                        fontSize: "12px",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <i className={`bi ${sub.icon}`}></i> {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton Ajouter */}
            <button
              className="nav-item"
              onClick={() => setIsModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #007791",
                backgroundColor: "rgba(0, 119, 145, 0.08)",
                color: "#007791",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left",
                marginTop: "12px"
              }}
            >
              <i className="bi bi-file-earmark-plus-fill"></i> {t.nav?.new_folder || "Nouveau Document"}
            </button>
          </nav>
        </div>

        <div className="sidebar-footer" style={{ padding: "16px", borderTop: "1px solid #e2edf2", fontSize: "12px", color: "#204051" }}>
          <p style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="bi bi-circle-fill" style={{ color: "#10B981", fontSize: "8px" }}></i>
            <span>{t.brand?.status || "Connecté"}</span>
          </p>
          <span>{t.brand?.version || "v1.0.0"}</span>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="main-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOPBAR */}
        <header className="topbar" style={{ backgroundColor: "#ffffff", padding: "12px 24px", borderBottom: "1px solid #c4d7e0", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#e2edf2", borderRadius: "20px", padding: "3px", border: "1px solid #c4d7e0" }}>
              {["fr", "mg"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    background: lang === l ? "#0b2535" : "transparent",
                    color: lang === l ? "#ffffff" : "#204051",
                    border: "none",
                    borderRadius: "16px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "12px"
                  }}
                >
                  {l === "fr" ? "🇫🇷 FR" : "🇲🇬 MG"}
                </button>
              ))}
            </div>

            <div className="user-profile" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="user-avatar-circle" style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#0b2535", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : "M"}
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ display: "block", color: "#0b2535", lineHeight: "1.2" }}>
                  {user?.prenom || "Jean"} {user?.nom || ""}
                </strong>
                <span style={{ color: "#007791", fontSize: "11px", fontWeight: "600" }}>
                  {user?.type_user || "dag_rh"}
                </span>
              </div>
            </div>

            <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#0b2535" }} title="Déconnexion">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>

        {/* BODY DE LA PAGE */}
        <main className="content-body" style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          
          {/* TAB 1 : TABLEAU DE BORD */}
          {activeTab === "tableau" && (
            <>
              <div className="greeting-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 className="greeting-title" style={{ fontSize: "20px", fontWeight: "700", color: "#0b2535", margin: "0 0 4px 0" }}>
                    {t.greeting?.hello || "Bonjour"} {user?.prenom || "Jean"} !
                  </h2>
                  <p className="greeting-sub" style={{ fontSize: "13px", color: "#204051", margin: 0 }}>
                    {t.greeting?.sub_filter || "Aperçu global de votre système de gestion de documents"}
                  </p>
                </div>
                <div className="date-box" style={{ backgroundColor: "#ffffff", padding: "8px 14px", borderRadius: "8px", border: "1px solid #c4d7e0", fontSize: "13px", color: "#0b2535", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-calendar3" style={{ color: "#007791" }}></i> 
                  {new Date().toLocaleDateString(lang === "mg" ? "mg-MG" : "fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              {/* Cartes Catégories */}
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                {CATEGORIES.map((cat) => {
                  const count = getCategoryCount(cat.id);
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="stat-card"
                      onClick={() => handleCategoryClick(cat.id)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: "#ffffff",
                        padding: "20px",
                        borderRadius: "10px",
                        border: isSelected ? "2px solid #007791" : "1px solid #c4d7e0",
                        boxShadow: "0 2px 6px rgba(11, 37, 53, 0.05)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div className="stat-icon" style={{ backgroundColor: cat.bg, color: cat.color, width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", fontSize: "20px" }}>
                        <i className={`bi ${cat.icon}`}></i>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#0b2535" }}>
                          {t.categories?.[cat.id] || cat.id}
                        </h3>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#007791" }}>
                          {count} {count > 1 ? (t.categories?.docs || "documents") : (t.categories?.doc || "document")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tableau documents */}
              <div className="card-box" style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #c4d7e0", padding: "20px", boxShadow: "0 2px 6px rgba(11, 37, 53, 0.05)" }}>
                <div className="card-box-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 className="card-box-title" style={{ fontSize: "16px", fontWeight: "700", color: "#0b2535", margin: 0 }}>
                    {selectedCategory 
                      ? `${t.table?.title_category || "Documents de catégorie"} ${t.categories?.[selectedCategory] || selectedCategory}` 
                      : (t.table?.title_all || "Récemment numérisés")}
                  </h3>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setIsModalOpen(true)} style={{ backgroundColor: "#0b2535", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="bi bi-plus-lg"></i> {t.table?.btn_add || "Ajouter"}
                    </button>
                    <button onClick={() => { fetchAllDocuments(); fetchDocuments(selectedCategory); }} style={{ backgroundColor: "#e2edf2", color: "#0b2535", border: "1px solid #c4d7e0", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="bi bi-arrow-clockwise"></i> {t.table?.btn_refresh || "Actualiser"}
                    </button>
                  </div>
                </div>

                {loading ? (
                  <p style={{ color: "#204051", fontSize: "13px", textAlign: "center", padding: "20px" }}>{t.table?.loading || "Chargement..."}</p>
                ) : documents.length === 0 ? (
                  <p style={{ color: "#204051", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
                    {t.table?.empty_all || "Aucun document disponible."}
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#e2edf2", borderBottom: "1px solid #c4d7e0", color: "#0b2535" }}>
                          <th style={{ padding: "12px 14px" }}>Référence</th>
                          <th style={{ padding: "12px 14px" }}>Titre</th>
                          <th style={{ padding: "12px 14px" }}>Catégorie</th>
                          <th style={{ padding: "12px 14px" }}>Format</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.num_ref} style={{ borderBottom: "1px solid #e2edf2" }}>
                            <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0b2535" }}>{doc.num_ref}</td>
                            <td style={{ padding: "12px 14px", color: "#204051" }}>{doc.title}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: "#e2edf2", color: "#0b2535", border: "1px solid #c4d7e0" }}>
                                {doc.cat}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", textTransform: "uppercase", fontWeight: "600", color: "#007791" }}>
                              {doc.format || "PDF"}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button onClick={() => handleOpenPreview(doc)} style={{ backgroundColor: "#e2edf2", border: "1px solid #c4d7e0", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#0b2535" }} title="Aperçu">
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button onClick={() => setDocToEdit(doc)} style={{ backgroundColor: "#e2edf2", border: "1px solid #c4d7e0", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#0b2535" }} title="Modifier">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button onClick={() => setDocToDelete(doc)} style={{ backgroundColor: "#fde8e8", border: "1px solid #f8b4b4", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#9b1c1c" }} title="Supprimer (Mettre en corbeille)">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2 & 3 : RECHERCHE ET DOCUMENTS */}
          {(activeTab === "recherche" || activeTab === "documents") && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0b2535", margin: "0 0 4px 0" }}>
                  {activeTab === "recherche" ? "Recherche de Documents" : "Tous les Documents"}
                </h2>
                <p style={{ fontSize: "13px", color: "#007791", margin: 0 }}>
                  Explorez, filtrez et consultez tous les documents du District
                </p>
              </div>

              {/* Barre de filtre */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", backgroundColor: "#ffffff", border: "1px solid #007791", borderRadius: "8px", padding: "4px 14px", boxShadow: "0 2px 4px rgba(11, 37, 53, 0.04)" }}>
                    <i className="bi bi-search" style={{ color: "#007791", fontSize: "16px", marginRight: "10px" }}></i>
                    <input
                      type="text"
                      placeholder="Rechercher par titre ou mot-clé..."
                      value={searchFilters.title}
                      onChange={(e) => setSearchFilters({ ...searchFilters, title: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleExecuteSearch()}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", color: "#0f172a", fontWeight: "600", backgroundColor: "transparent", padding: "8px 0" }}
                    />
                    {searchFilters.title && (
                      <button onClick={() => { setSearchFilters(prev => ({ ...prev, title: "" })); handleExecuteSearch({ ...searchFilters, title: "" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#204051" }}>
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      backgroundColor: showAdvancedFilters ? "#0b2535" : "#ffffff",
                      color: showAdvancedFilters ? "#ffffff" : "#0b2535",
                      border: "1px solid #c4d7e0",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    <i className="bi bi-funnel-fill"></i> Filtres
                  </button>
                </div>

                {/* Filtres avancés */}
                {showAdvancedFilters && (
                  <div style={{ marginTop: "12px", padding: "16px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #c4d7e0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px", color: "#0b2535" }}>Référence</label>
                      <input
                        type="text"
                        placeholder="Ex: REF-2026-001"
                        value={searchFilters.num_ref}
                        onChange={(e) => setSearchFilters({ ...searchFilters, num_ref: e.target.value })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #c4d7e0", fontSize: "13px" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px", color: "#0b2535" }}>Catégorie</label>
                      <select
                        value={searchFilters.cat}
                        onChange={(e) => setSearchFilters({ ...searchFilters, cat: e.target.value })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #c4d7e0", fontSize: "13px", backgroundColor: "#fff" }}
                      >
                        <option value="">Toutes les catégories</option>
                        <option value="Nomination">Nomination</option>
                        <option value="Finance">Finance</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px", color: "#0b2535" }}>Année de rédaction</label>
                      <input
                        type="number"
                        placeholder="Ex: 2026"
                        value={searchFilters.annee_redac}
                        onChange={(e) => setSearchFilters({ ...searchFilters, annee_redac: e.target.value })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #c4d7e0", fontSize: "13px" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px", color: "#0b2535" }}>Format de fichier</label>
                      <select
                        value={searchFilters.file_format}
                        onChange={(e) => setSearchFilters({ ...searchFilters, file_format: e.target.value })}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #c4d7e0", fontSize: "13px", backgroundColor: "#fff" }}
                      >
                        <option value="">Tous les formats</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">Word (.docx)</option>
                        <option value="png">Image (.png, .jpg)</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                      <button
                        onClick={handleResetSearch}
                        style={{ backgroundColor: "#e2edf2", color: "#0b2535", border: "1px solid #c4d7e0", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Réinitialiser
                      </button>
                      <button
                        onClick={() => handleExecuteSearch()}
                        style={{ backgroundColor: "#0b2535", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Appliquer les filtres
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Résultats des documents */}
              <div className="card-box" style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #c4d7e0", padding: "20px", boxShadow: "0 2px 6px rgba(11, 37, 53, 0.05)" }}>
                {searchLoading ? (
                  <p style={{ color: "#204051", fontSize: "13px", textAlign: "center", padding: "20px" }}>Recherche en cours...</p>
                ) : documents.length === 0 ? (
                  <p style={{ color: "#204051", fontSize: "13px", textAlign: "center", padding: "20px" }}>Aucun document ne correspond à votre recherche.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#e2edf2", borderBottom: "1px solid #c4d7e0", color: "#0b2535" }}>
                          <th style={{ padding: "12px 14px" }}>Référence</th>
                          <th style={{ padding: "12px 14px" }}>Titre</th>
                          <th style={{ padding: "12px 14px" }}>Catégorie</th>
                          <th style={{ padding: "12px 14px" }}>Année</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.num_ref} style={{ borderBottom: "1px solid #e2edf2" }}>
                            <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0b2535" }}>{doc.num_ref}</td>
                            <td style={{ padding: "12px 14px", color: "#204051" }}>{doc.title}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: "#e2edf2", color: "#0b2535", border: "1px solid #c4d7e0" }}>
                                {doc.cat}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", color: "#007791", fontWeight: "600" }}>{doc.annee_redac || "-"}</td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button onClick={() => handleOpenPreview(doc)} style={{ backgroundColor: "#e2edf2", border: "1px solid #c4d7e0", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#0b2535" }} title="Aperçu">
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button onClick={() => setDocToEdit(doc)} style={{ backgroundColor: "#e2edf2", border: "1px solid #c4d7e0", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#0b2535" }} title="Modifier">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button onClick={() => setDocToDelete(doc)} style={{ backgroundColor: "#fde8e8", border: "1px solid #f8b4b4", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#9b1c1c" }} title="Supprimer (Mettre en corbeille)">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB : CORBEILLE */}
          {activeTab === "corbeille" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0b2535", margin: "0 0 4px 0" }}>
                    Corbeille des Documents
                  </h2>
                  <p style={{ fontSize: "13px", color: "#007791", margin: 0 }}>
                    Restaurer ou supprimer définitivement les documents mis en corbeille
                  </p>
                </div>
                <button
                  onClick={fetchTrashDocuments}
                  style={{ backgroundColor: "#e2edf2", color: "#0b2535", border: "1px solid #c4d7e0", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="bi bi-arrow-clockwise"></i> Actualiser
                </button>
              </div>

              <div className="card-box" style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #c4d7e0", padding: "20px", boxShadow: "0 2px 6px rgba(11, 37, 53, 0.05)" }}>
                {trashLoading ? (
                  <p style={{ color: "#204051", fontSize: "13px", textAlign: "center", padding: "20px" }}>Chargement de la corbeille...</p>
                ) : trashDocuments.length === 0 ? (
                  <p style={{ color: "#204051", fontSize: "13px", textAlign: "center", padding: "20px" }}>La corbeille est vide.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#e2edf2", borderBottom: "1px solid #c4d7e0", color: "#0b2535" }}>
                          <th style={{ padding: "12px 14px" }}>Référence</th>
                          <th style={{ padding: "12px 14px" }}>Titre</th>
                          <th style={{ padding: "12px 14px" }}>Catégorie</th>
                          <th style={{ padding: "12px 14px" }}>Format</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trashDocuments.map((doc) => (
                          <tr key={doc.num_ref} style={{ borderBottom: "1px solid #e2edf2" }}>
                            <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0b2535" }}>{doc.num_ref}</td>
                            <td style={{ padding: "12px 14px", color: "#204051" }}>{doc.title}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: "#e2edf2", color: "#0b2535", border: "1px solid #c4d7e0" }}>
                                {doc.cat}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", textTransform: "uppercase", fontWeight: "600", color: "#007791" }}>
                              {doc.format || "PDF"}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "8px" }}>
                                <button
                                  onClick={() => handleRestore(doc.num_ref)}
                                  style={{ backgroundColor: "#d1fae5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                  title="Restaurer"
                                >
                                  <i className="bi bi-arrow-counterclockwise"></i> Restaurer
                                </button>
                                <button
                                  onClick={() => setDocToHardDelete(doc)}
                                  style={{ backgroundColor: "#fde8e8", border: "1px solid #f8b4b4", color: "#9b1c1c", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                  title="Supprimer définitivement"
                                >
                                  <i className="bi bi-trash-fill"></i> Supprimer définitivement
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4 : PARAMÈTRES */}
          {activeTab === "parametres" && (
            <Parametres
              user={user}
              onUpdateUser={handleUpdateUser}
              activeSubTab={activeSettingsSubTab}
              setActiveSubTab={setActiveSettingsSubTab}
              getAuthHeaders={getAuthHeaders}
            />
          )}

        </main>
      </div>

      {/* --- MODALES & OVERLAYS --- */}

      {/* 1. MODALE PRÉVISUALISATION / VISIONNEUSE */}
      {previewDoc && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11, 37, 53, 0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", width: "90%", height: "85%", maxWidth: "900px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "16px", backgroundColor: "#0b2535", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                Aperçu : {previewDoc.title} ({previewDoc.num_ref})
              </h3>
              <button
                onClick={() => { setPreviewDoc(null); setPreviewUrl(null); }}
                style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "20px" }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ flex: 1, backgroundColor: "#f4f8fa", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {previewLoading ? (
                <p style={{ color: "#0b2535", fontWeight: "600" }}>Chargement du document...</p>
              ) : previewUrl ? (
                <iframe src={previewUrl} title="Aperçu Document" style={{ width: "100%", height: "100%", border: "none" }} />
              ) : (
                <p style={{ color: "#9b1c1c" }}>Impossible d'afficher le document.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MODALE CONFIRMATION MISE EN CORBEILLE */}
      {docToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11, 37, 53, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1050 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "24px", maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#9b1c1c", fontSize: "16px" }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: "8px" }}></i>
              Mettre en corbeille
            </h3>
            <p style={{ fontSize: "13px", color: "#204051", marginBottom: "20px" }}>
              Voulez-vous déplacer le document <strong>{docToDelete.title}</strong> ({docToDelete.num_ref}) vers la corbeille ? Vous pourrez le restaurer ultérieurement.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDocToDelete(null)}
                style={{ backgroundColor: "#e2edf2", border: "1px solid #c4d7e0", color: "#0b2535", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{ backgroundColor: "#9b1c1c", border: "none", color: "#ffffff", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
              >
                {isDeleting ? "Déplacement..." : "Déplacer en corbeille"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODALE CONFIRMATION SUPPRESSION DÉFINITIVE */}
      {docToHardDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11, 37, 53, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1050 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", padding: "24px", maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#9b1c1c", fontSize: "16px" }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: "8px" }}></i>
              Suppression définitive
            </h3>
            <p style={{ fontSize: "13px", color: "#204051", marginBottom: "20px" }}>
              Êtes-vous sûr de vouloir supprimer définitivement le document <strong>{docToHardDelete.title}</strong> ({docToHardDelete.num_ref}) ? <strong>Cette action est irréversible.</strong>
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDocToHardDelete(null)}
                style={{ backgroundColor: "#e2edf2", border: "1px solid #c4d7e0", color: "#0b2535", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
              >
                Annuler
              </button>
              <button
                onClick={confirmHardDelete}
                disabled={isDeleting}
                style={{ backgroundColor: "#9b1c1c", border: "none", color: "#ffffff", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
              >
                {isDeleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODALE D'AJOUT DE DOCUMENT */}
      {isModalOpen && (
        <DocumentUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAllDocuments();
            fetchDocuments(selectedCategory);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {/* 5. MODALE DE MODIFICATION DE DOCUMENT */}
      {docToEdit && (
        <DocumentEditModal
          doc={docToEdit}
          onClose={() => setDocToEdit(null)}
          onSuccess={() => {
            setDocToEdit(null);
            fetchAllDocuments();
            fetchDocuments(selectedCategory);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}