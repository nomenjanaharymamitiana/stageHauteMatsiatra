import React, { useState, useEffect } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

export default function DocumentEditModal({ doc, onClose, onSuccess, getAuthHeaders }) {
  const [formData, setFormData] = useState({
    title: "",
    cat: "Nomination",
    annee_redac: new Date().getFullYear().toString()
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Remplir le formulaire avec les valeurs actuelles lors de l'ouverture
  useEffect(() => {
    if (doc) {
      setFormData({
        title: doc.title || "",
        cat: doc.cat || "Nomination",
        annee_redac: doc.annee_redac ? String(doc.annee_redac) : new Date().getFullYear().toString()
      });
    }
  }, [doc]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value // Garder en String pour concorder avec Pydantic
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {};
      
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({
          title: formData.title,
          cat: formData.cat,
          annee_redac: String(formData.annee_redac) // Envoyé impérativement sous forme de STRING
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Gestion propre de l'affichage des erreurs 422 de Pydantic
        if (Array.isArray(errorData.detail)) {
          const formattedErr = errorData.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(", ");
          setErrorMsg(formattedErr);
        } else {
          setErrorMsg(errorData.detail || "Échec de la modification du document.");
        }
      }
    } catch (err) {
      console.error("Erreur de modification :", err);
      setErrorMsg("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (!doc) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(11, 37, 53, 0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        width: "90%",
        maxWidth: "480px",
        padding: "24px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
      }}>
        {/* En-tête de la modale */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2edf2", paddingBottom: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0b2535" }}>
            Modifier le document
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#204051" }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: "#fde8e8", border: "1px solid #f8b4b4", color: "#9b1c1c", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "14px" }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* N° Référence */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0b2535", marginBottom: "4px" }}>
              N° Référence (Non modifiable)
            </label>
            <input
              type="text"
              value={doc.num_ref}
              disabled
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c4d7e0", backgroundColor: "#e2edf2", color: "#204051", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>

          {/* Titre */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0b2535", marginBottom: "4px" }}>
              Titre du document *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c4d7e0", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>

          {/* Catégorie */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0b2535", marginBottom: "4px" }}>
              Catégorie *
            </label>
            <select
              name="cat"
              value={formData.cat}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c4d7e0", fontSize: "13px", boxSizing: "border-box" }}
            >
              <option value="Nomination">Nomination</option>
              <option value="Finance">Finance</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Année de rédaction */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#0b2535", marginBottom: "4px" }}>
              Année de rédaction *
            </label>
            <input
              type="number"
              name="annee_redac"
              required
              value={formData.annee_redac}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c4d7e0", fontSize: "13px", boxSizing: "border-box" }}
            />
          </div>

          {/* Boutons d'action */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: "#e2edf2", border: "1px solid #c4d7e0", color: "#0b2535", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#0b2535", border: "none", color: "#ffffff", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}