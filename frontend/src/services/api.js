import axios from 'axios';

// Utilise la racine VITE_API_URL dynamique du .env
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`,
});

// Authentification
export const loginUser = async (im, mdp) => {
  const response = await API.post('/auth/login', { im, mdp });
  return response.data;
};

// Upload de document
export const uploadDocument = async (formData) => {
  const response = await API.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Recherche de documents
export const searchDocuments = async (params) => {
  const response = await API.get('/documents/search', { params });
  return response.data;
};

// Aperçu inline (retourne l'URL complète vers le serveur backend)
export const getPreviewUrl = (numRef) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${baseUrl}/api/v1/documents/${numRef}/preview`;
};

// Téléchargement (retourne l'URL complète vers le serveur backend)
export const getDownloadUrl = (numRef) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${baseUrl}/api/v1/documents/${numRef}/download`;
};

export default API;