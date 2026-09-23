import React, { useState, useEffect } from "react";
import logoGed from "../assets/WhatsApp Image 2026-09-21 at 11.01.52.jpeg";

export default function DocumentEditModal({ isOpen, onClose, doc, onSuccess, lang = "fr" }) {
  const [formData, setFormData] = useState({
    title: "",
    cat: "Nomination",
    annee_redac: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (doc) {
      // Formatage de la date pour le champ <input type="date" />
      let formattedDate = "";
      if (doc.annee_redac) {
        formattedDate = new Date(doc.annee_redac).toISOString().split("T")[0];
      }

      setFormData({
        title: doc.title || "",
        cat: doc.cat || "Nomination",
        annee_redac: formattedDate
      });
      setError("");
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token") || "";
    const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-User-IM": token
        },
        body: JSON.stringify({
          title: formData.title,
          cat: formData.cat,
          annee_redac: formData.annee_redac
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.detail || "Erreur lors de la modification du document.");
      }
    } catch (err) {
      console.error("Erreur réseau :", err);
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    fr: {
      title: "Modifier le document",
      num_ref: "N° Référence",
      doc_title: "Titre du document",
      category: "Catégorie",
      date_redac: "Date / Année de rédaction",
      btn_save: "Enregistrer les modifications",
      btn_saving: "Enregistrement...",
      btn_cancel: "Annuler"
    },
    mg: {
      title: "Hanova ny tahirin-kevitra",
      num_ref: "Laharana",
      doc_title: "Lohatenin'ny tahirin-kevitra",
      category: "Sokajy",
      date_redac: "Daty nanoratana",
      btn_save: "Rakitina ny fanovana",
      btn_saving: "Mampiditra...",
      btn_cancel: "Avelao"
    }
  };

  const t = labels[lang] || labels.fr;

  return (
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
        zIndex: 1100
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <img
            src={logoGed}
            alt="Logo GED"
            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>
              {t.title}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t.num_ref} : <strong style={{ color: "#2563eb" }}>{doc.num_ref}</strong>
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              border: "1px solid #fecaca"
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              {t.doc_title}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              {t.category}
            </label>
            <select
              name="cat"
              value={formData.cat}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            >
              <option value="Nomination">Nomination</option>
              <option value="Finance">Finance</option>
              <option value="Autre">Autre / Administratif</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
              {t.date_redac}
            </label>
            <input
              type="date"
              name="annee_redac"
              value={formData.annee_redac}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
              {t.btn_cancel}
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? t.btn_saving : t.btn_save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}