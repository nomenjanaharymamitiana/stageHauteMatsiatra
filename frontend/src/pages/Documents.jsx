import React, { useState, useEffect } from "react";
import translations from "../locales/translations.json";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

export default function Documents({ user, lang = "fr", onOpenPreview }) {
  const t = translations[lang] || translations["fr"];
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || user?.im || user?.im_dag_rh || "";
    return {
      "Authorization": `Bearer ${token}`,
      "X-User-IM": token
    };
  };

  const fetchAllDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setDocuments(list);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des documents :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
            {t.nav?.documents || "Gestion Globale des Documents"}
          </h2>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
            Total : {documents.length} document(s) enregistré(s)
          </p>
        </div>
        <button
          onClick={fetchAllDocuments}
          style={{ backgroundColor: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <i className="bi bi-arrow-clockwise"></i> {t.table?.btn_refresh || "Actualiser"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#6B7280", fontSize: "13px", textAlign: "center", padding: "20px" }}>Chargement des documents...</p>
      ) : documents.length === 0 ? (
        <p style={{ color: "#6B7280", fontSize: "13px", textAlign: "center", padding: "20px" }}>Aucun document disponible.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563" }}>
                <th style={{ padding: "12px 14px" }}>Référence</th>
                <th style={{ padding: "12px 14px" }}>Titre</th>
                <th style={{ padding: "12px 14px" }}>Catégorie</th>
                <th style={{ padding: "12px 14px" }}>Agent (IM)</th>
                <th style={{ padding: "12px 14px" }}>Date Num.</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.num_ref} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: "#111827" }}>{doc.num_ref}</td>
                  <td style={{ padding: "12px 14px", color: "#374151" }}>{doc.title}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: "#F3F4F6", color: "#1F2937", border: "1px solid #E5E7EB" }}>
                      {doc.cat}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#6B7280" }}>{doc.im_dag_rh || "-"}</td>
                  <td style={{ padding: "12px 14px", color: "#6B7280" }}>{doc.date_num}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      {onOpenPreview && (
                        <button
                          onClick={() => onOpenPreview(doc)}
                          style={{ backgroundColor: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#374151" }}
                          title="Aperçu"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      )}
                      <a
                        href={`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/download`}
                        download
                        style={{ backgroundColor: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#374151", textDecoration: "none", display: "inline-flex" }}
                        title="Télécharger"
                      >
                        <i className="bi bi-download"></i>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}