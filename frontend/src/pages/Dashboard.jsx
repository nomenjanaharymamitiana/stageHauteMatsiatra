import React, { useState, useEffect } from "react";
import logoGed from "../assets/WhatsApp Image 2026-09-21 at 11.01.52.jpeg";
import "../styles/theme.css";
import DocumentUploadModal from "../components/DocumentUploadModal";
import DocumentEditModal from "../components/DocumentEditModal";
import translations from "../locales/translations.json";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

const CATEGORIES = [
  { id: "Nomination", icon: "bi-person-badge-fill", color: "#2563eb", bg: "#eff6ff" },
  { id: "Finance", icon: "bi-cash-coin", color: "#10b981", bg: "#ecfdf5" },
  { id: "Autre", icon: "bi-folder2-open", color: "#7c3aed", bg: "#f5f3ff" }
];

export default function Dashboard({ user, onLogout }) {
  const [lang, setLang] = useState("fr"); // "fr" ou "mg"
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState("tableau");
  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modale de création
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modale de modification
  const [docToEdit, setDocToEdit] = useState(null);

  // Visionneuse flottante (Modal Flottant)
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modale de confirmation de suppression
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        alert(t.preview.error);
        setPreviewDoc(null);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du fichier :", err);
      alert(t.preview.error);
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewDoc(null);
    setIsFullscreen(false);
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

  const handleEdit = (doc) => {
    setDocToEdit(doc);
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR SOMBRE */}
      <aside className="sidebar">
        <div>
          <div className="brand-header">
            <img src={logoGed} alt="Logo GED" className="brand-logo-img" />
            <div>
              <h1 className="brand-title">{t.brand.title}</h1>
              <p className="brand-subtitle">{t.brand.subtitle}</p>
            </div>
          </div>

          <nav className="nav-menu">
            <button
              className={`nav-item ${activeTab === "tableau" ? "active" : ""}`}
              onClick={() => setActiveTab("tableau")}
            >
              <i className="bi bi-grid-1x2-fill"></i> {t.nav.dashboard}
            </button>
            <button
              className="nav-item"
              onClick={() => setIsModalOpen(true)}
            >
              <i className="bi bi-file-earmark-plus-fill"></i> {t.nav.new_folder}
            </button>
            <button
              className={`nav-item ${activeTab === "recherche" ? "active" : ""}`}
              onClick={() => setActiveTab("recherche")}
            >
              <i className="bi bi-search"></i> {t.nav.search}
            </button>
            <button
              className={`nav-item ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              <i className="bi bi-folder-fill"></i> {t.nav.documents}
            </button>
            <button
              className={`nav-item ${activeTab === "parametres" ? "active" : ""}`}
              onClick={() => setActiveTab("parametres")}
            >
              <i className="bi bi-gear-fill"></i> {t.nav.settings}
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <p style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="bi bi-circle-fill" style={{ color: "#10b981", fontSize: "8px" }}></i>
            <span>{t.brand.status}</span>
          </p>
          <span>{t.brand.version}</span>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="search-bar">
            <i className="bi bi-search" style={{ color: "#94a3b8" }}></i>
            <input type="text" placeholder={t.search_placeholder} />
          </div>

          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* SÉLECTEUR DE LANGUE AVEC DRAPEAUX */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#f1f5f9",
                borderRadius: "20px",
                padding: "3px",
                border: "1px solid #cbd5e1"
              }}
            >
              <button
                onClick={() => setLang("fr")}
                title="Français"
                style={{
                  background: lang === "fr" ? "#ffffff" : "transparent",
                  border: "none",
                  borderRadius: "16px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: lang === "fr" ? "700" : "500",
                  fontSize: "12px",
                  color: "#0f172a",
                  boxShadow: lang === "fr" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontSize: "14px" }}>🇫🇷</span> FR
              </button>
              <button
                onClick={() => setLang("mg")}
                title="Malagasy"
                style={{
                  background: lang === "mg" ? "#ffffff" : "transparent",
                  border: "none",
                  borderRadius: "16px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: lang === "mg" ? "700" : "500",
                  fontSize: "12px",
                  color: "#0f172a",
                  boxShadow: lang === "mg" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontSize: "14px" }}>🇲🇬</span> MG
              </button>
            </div>

            <div style={{ position: "relative", cursor: "pointer" }}>
              <i className="bi bi-bell-fill" style={{ fontSize: "18px", color: "#64748b" }}></i>
            </div>
            
            <div className="user-profile">
              <div className="user-avatar-circle">
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : "M"}
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ display: "block", color: "#0f172a", lineHeight: "1.2" }}>
                  {user?.prenom || "Jean"}
                </strong>
                <span style={{ color: "#64748b", fontSize: "11px" }}>
                  {user?.type_user || "dag_rh"}
                </span>
              </div>
            </div>

            <button 
              onClick={onLogout} 
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
              title="Déconnexion"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>

        <main className="content-body">
          <div className="greeting-row">
            <div>
              <h2 className="greeting-title">{t.greeting.hello} {user?.prenom || "Jean"} !</h2>
              <p className="greeting-sub">{t.greeting.sub_filter}</p>
            </div>
            <div className="date-box">
              <i className="bi bi-calendar3" style={{ color: "#2563eb" }}></i> 
              {new Date().toLocaleDateString(lang === "mg" ? "mg-MG" : "fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* CARTES DES CATÉGORIES INTERACTIVES */}
          <div className="stats-grid">
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
                    border: isSelected ? `2px solid ${cat.color}` : "1px solid #e2e8f0",
                    boxShadow: isSelected ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none",
                    transition: "all 0.2s ease",
                    transform: isSelected ? "translateY(-2px)" : "none"
                  }}
                >
                  <div className="stat-icon" style={{ backgroundColor: cat.bg, color: cat.color }}>
                    <i className={`bi ${cat.icon}`}></i>
                  </div>
                  <div>
                    <span className="stat-title">{t.categories[cat.id] || cat.id}</span>
                    <div className="stat-val">
                      {count} {count > 1 ? t.categories.docs : t.categories.doc}
                    </div>
                    <span className="stat-trend" style={{ color: isSelected ? cat.color : "#64748b" }}>
                      {isSelected ? t.categories.selected : t.categories.click_to_filter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLEAU DES DOCUMENTS */}
          <div className="card-box">
            <div className="card-box-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 className="card-box-title">
                  {selectedCategory 
                    ? `${t.table.title_category} ${t.categories[selectedCategory] || selectedCategory}` 
                    : t.table.title_all}
                </h3>
                {selectedCategory && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      fetchDocuments(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: 0,
                      marginTop: "4px",
                      textDecoration: "underline"
                    }}
                  >
                    {t.table.back_to_all} ({allDocuments.length})
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn-primary-action"
                  onClick={() => setIsModalOpen(true)}
                >
                  <i className="bi bi-plus-lg"></i> {t.table.btn_add}
                </button>
                <button 
                  className="btn-secondary-action"
                  onClick={() => {
                    fetchAllDocuments();
                    fetchDocuments(selectedCategory);
                  }}
                >
                  <i className="bi bi-arrow-clockwise"></i> {t.table.btn_refresh}
                </button>
              </div>
            </div>

            {loading ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>{t.table.loading}</p>
            ) : documents.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px", padding: "16px 0" }}>
                {selectedCategory
                  ? `${t.table.empty_cat} "${t.categories[selectedCategory] || selectedCategory}".`
                  : t.table.empty_all}
              </p>
            ) : (
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>{t.table.cols.ref}</th>
                    <th>{t.table.cols.title}</th>
                    <th>{t.table.cols.category}</th>
                    <th>{t.table.cols.format}</th>
                    <th>{t.table.cols.date_num}</th>
                    <th>{t.table.cols.date_redac}</th>
                    <th>{t.table.cols.agent}</th>
                    <th style={{ textAlign: "right" }}>{t.table.cols.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.num_ref}>
                      <td style={{ fontWeight: "600", color: "#0f172a" }}>{doc.num_ref}</td>
                      <td>{doc.title}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor:
                              doc.cat === "Nomination" ? "#eff6ff" : doc.cat === "Finance" ? "#ecfdf5" : "#f5f3ff",
                            color:
                              doc.cat === "Nomination" ? "#2563eb" : doc.cat === "Finance" ? "#10b981" : "#7c3aed"
                          }}
                        >
                          {t.categories[doc.cat] || doc.cat}
                        </span>
                      </td>
                      <td>
                        <span className="badge-format">
                          {doc.format ? doc.format.toUpperCase() : "PDF"}
                        </span>
                      </td>
                      <td>{doc.date_num}</td>
                      <td>{doc.annee_redac}</td>
                      <td>{doc.im_dag_rh || "-"}</td>

                      {/* ICÔNES D'ACTION DIRECTES */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* VISUALISER */}
                          <button
                            onClick={() => handleOpenPreview(doc)}
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: "600"
                            }}
                            title={t.actions.preview}
                          >
                            <i className="bi bi-eye"></i>
                            <span>{t.actions.preview}</span>
                          </button>

                          {/* TÉLÉCHARGER */}
                          <a
                            href={`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/download`}
                            download
                            style={{
                              backgroundColor: "#f0fdf4",
                              color: "#16a34a",
                              border: "1px solid #bbf7d0",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "13px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textDecoration: "none"
                            }}
                            title={t.actions.download}
                          >
                            <i className="bi bi-download"></i>
                          </a>

                          {/* MODIFIER */}
                          <button
                            onClick={() => handleEdit(doc)}
                            style={{
                              backgroundColor: "#fefce8",
                              color: "#ca8a04",
                              border: "1px solid #fef08a",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "13px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title={t.actions.edit}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          {/* SUPPRIMER */}
                          <button
                            onClick={() => setDocToDelete(doc)}
                            style={{
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "13px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title={t.actions.delete}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* VISIONNEUSE / MODAL FLOTTANT DE PRÉVISUALISATION DU DOCUMENT */}
      {previewDoc && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: isFullscreen ? "0" : "24px",
            transition: "all 0.3s ease"
          }}
          onClick={handleClosePreview}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: isFullscreen ? "0" : "16px",
              width: isFullscreen ? "100vw" : "90%",
              maxWidth: isFullscreen ? "100vw" : "1000px",
              height: isFullscreen ? "100vh" : "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: isFullscreen ? "none" : "1px solid #334155"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* EN-TÊTE DE LA VISIONNEUSE */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                borderBottom: "1px solid #1e293b"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i
                  className={`bi ${
                    previewDoc.format?.toLowerCase() === "pdf" ? "bi-file-earmark-pdf-fill" : "bi-file-earmark-image-fill"
                  }`}
                  style={{ fontSize: "20px", color: "#38bdf8" }}
                ></i>
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#f8fafc" }}>
                    {previewDoc.title}
                  </h4>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {t.preview.ref}: {previewDoc.num_ref} • {t.preview.category}: {t.categories[previewDoc.cat] || previewDoc.cat}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <a
                  href={`${API_BASE_URL}/${encodeURIComponent(previewDoc.num_ref)}/download`}
                  download
                  style={{
                    backgroundColor: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="bi bi-download"></i> {t.actions.download}
                </a>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{
                    backgroundColor: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                  title={isFullscreen ? t.preview.exit_fullscreen : t.preview.fullscreen}
                >
                  <i className={`bi ${isFullscreen ? "bi-fullscreen-exit" : "bi-arrows-angle-expand"}`}></i>
                </button>

                <button
                  onClick={handleClosePreview}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    marginLeft: "6px"
                  }}
                  title={t.preview.close}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* CORPS DE LA VISIONNEUSE */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#020617",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "auto"
              }}
            >
              {previewLoading ? (
                <div style={{ color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      border: "3px solid #334155",
                      borderTop: "3px solid #38bdf8",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}
                  ></div>
                  <span>{t.preview.loading}</span>
                </div>
              ) : previewUrl ? (
                previewDoc.format?.toLowerCase() === "pdf" || previewDoc.title?.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewUrl}
                    title={previewDoc.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      backgroundColor: "#ffffff"
                    }}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={previewDoc.title}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain"
                    }}
                  />
                )
              ) : (
                <span style={{ color: "#ef4444" }}>{t.preview.error}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION AVEC LOGO */}
      {docToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setDocToDelete(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
              border: "1px solid #e2e8f0"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: "16px" }}>
              <img
                src={logoGed}
                alt="Logo GED"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #3b82f6"
                }}
              />
            </div>

            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>
              {t.delete_modal.title}
            </h3>

            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              {t.delete_modal.body_text} <strong style={{ color: "#0f172a" }}>{docToDelete.num_ref}</strong> ({docToDelete.title}) ?
              <br />
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", display: "inline-block" }}>
                {t.delete_modal.warning}
              </span>
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {t.delete_modal.cancel}
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  fontWeight: "600",
                  cursor: isDeleting ? "not-allowed" : "pointer"
                }}
              >
                {isDeleting ? t.delete_modal.deleting : t.delete_modal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE NOUVEAU DOCUMENT */}
      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchAllDocuments();
          fetchDocuments(selectedCategory);
        }}
        user={user}
      />

      {/* MODALE DE MODIFICATION DE DOCUMENT */}
      <DocumentEditModal
        isOpen={!!docToEdit}
        doc={docToEdit}
        lang={lang}
        onClose={() => setDocToEdit(null)}
        onSuccess={() => {
          fetchAllDocuments();
          fetchDocuments(selectedCategory);
        }}
      />
    </div>
  );
}