import React, { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

// Liste explicite des 3 catégories
const CATEGORIES = [
  { value: "Nomination", label: "Nomination" },
  { value: "Finance", label: "Finance" },
  { value: "Autre", label: "Autre / Administratif" }
];

export default function DocumentUploadModal({ isOpen, onClose, onSuccess, user }) {
  // Récupération dynamique du matricule / jeton
  const agentMatricule = user?.im || user?.im_dag_rh || user?.matricule || localStorage.getItem("token") || "";

  const [formData, setFormData] = useState({
    num_ref: "",
    date_num: new Date().toISOString().split("T")[0],
    cat: "Nomination",
    annee_redac: new Date().toISOString().split("T")[0],
    title: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!file) {
      setError("Veuillez sélectionner un fichier à importer.");
      setLoading(false);
      return;
    }

    if (!agentMatricule) {
      setError("Erreur : Jeton d'authentification ou matricule introuvable. Veuillez vous re-connecter.");
      setLoading(false);
      return;
    }

    // Préparation des données FormData pour multipart/form-data
    const uploadData = new FormData();
    uploadData.append("num_ref", formData.num_ref);
    uploadData.append("date_num", formData.date_num);
    uploadData.append("cat", formData.cat);
    uploadData.append("annee_redac", formData.annee_redac);
    uploadData.append("title", formData.title);
    uploadData.append("im_dag_rh", agentMatricule);
    uploadData.append("file", file);

    try {
      const token = localStorage.getItem("token") || agentMatricule;

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          // Transmission des tokens et matricules d'authentification
          "Authorization": `Bearer ${token}`,
          "X-User-IM": agentMatricule
        },
        body: uploadData,
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          num_ref: "",
          date_num: new Date().toISOString().split("T")[0],
          cat: "Nomination",
          annee_redac: new Date().toISOString().split("T")[0],
          title: "",
        });
        setFile(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || "Jeton d'authentification ou matricule manquant.");
      }
    } catch (err) {
      console.error("Erreur d'upload :", err);
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Nouveau Document</h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>&times;</button>
        </div>

        {error && <div style={modalStyles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <div style={modalStyles.row}>
            <div style={modalStyles.field}>
              <label style={modalStyles.label}>N° Référence *</label>
              <input
                type="text"
                name="num_ref"
                value={formData.num_ref}
                onChange={handleChange}
                placeholder="Ex: 42"
                required
                style={modalStyles.input}
              />
            </div>

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Date Numérisation *</label>
              <input
                type="date"
                name="date_num"
                value={formData.date_num}
                onChange={handleChange}
                required
                style={modalStyles.input}
              />
            </div>
          </div>

          <div style={modalStyles.row}>
            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Catégorie *</label>
              <select
                name="cat"
                value={formData.cat}
                onChange={handleChange}
                required
                style={modalStyles.select}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Date Rédaction *</label>
              <input
                type="date"
                name="annee_redac"
                value={formData.annee_redac}
                onChange={handleChange}
                required
                style={modalStyles.input}
              />
            </div>
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Titre / Objet *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Arrêté de nomination"
              required
              style={modalStyles.input}
            />
          </div>

          {/* Badge récapitulatif de l'agent connecté */}
          <div style={modalStyles.infoBox}>
            <i className="bi bi-person-badge"></i> Agent connecté : <strong>{user?.nom ? `${user.nom} ${user?.prenom || ""}` : "Agent"}</strong> (IM: <strong>{agentMatricule || "Non défini"}</strong>)
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Fichier Document (PDF/Image) *</label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              style={modalStyles.fileInput}
            />
          </div>

          <div style={modalStyles.footer}>
            <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>
              Annuler
            </button>
            <button type="submit" disabled={loading} style={modalStyles.submitBtn}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "540px",
    padding: "24px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    color: "#64748b",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "12px",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#334155",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "12px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  row: {
    display: "flex",
    gap: "12px",
  },
  field: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
  },
  select: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
  fileInput: {
    fontSize: "13px",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "12px",
  },
  cancelBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#475569",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#0f172a",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};