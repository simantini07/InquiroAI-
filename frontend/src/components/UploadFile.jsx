import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { Upload } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000";

const UploadFile = ({ onFileUpload, onDocumentsFetched, setSnackbar, handleUnauthorized }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  const fetchUploadedDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }

      console.log('Fetching documents with token:', token);
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('GET /documents response status:', response.status);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        const errorData = await response.json();
        console.log('GET /documents error data:', errorData);
        throw new Error(errorData.detail || 'Failed to fetch documents');
      }

      const result = await response.json();
      console.log('GET /documents response:', result);
      setDocuments(result.documents || []);
      if (typeof onDocumentsFetched === 'function') {
        onDocumentsFetched(result.documents || []);
      } else {
        console.warn('onDocumentsFetched is not a function, skipping');
      }
    } catch (error) {
      console.error('Fetch documents failed:', error.message);
      if (error.message.includes('Unauthorized')) {
        if (typeof handleUnauthorized === 'function') {
          handleUnauthorized();
        } else {
          console.warn('handleUnauthorized is not a function, using fallback navigation');
          localStorage.removeItem('access_token');
          navigate('/login', { replace: true });
        }
      } else {
        setSnackbar({ open: true, message: `Failed to fetch documents: ${error.message}`, severity: 'error' });
      }
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setSnackbar({ open: true, message: 'Please select a file to upload', severity: 'error' });
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found. Please login first.');

      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        const errorData = await response.json();
        console.log('POST /upload error data:', errorData);
        throw new Error(errorData.detail || 'File upload failed');
      }

      const result = await response.json();
      console.log('POST /upload response:', result);
      const newDoc = { id: result.id, title: file.name };
      setDocuments(prev => [...prev, newDoc]);
      if (typeof onFileUpload === 'function') {
        onFileUpload(newDoc);
      } else {
        console.warn('onFileUpload is not a function, skipping');
      }
      setFile(null);
    } catch (error) {
      console.error('Upload failed:', error.message);
      if (error.message.includes('Unauthorized')) {
        if (typeof handleUnauthorized === 'function') {
          handleUnauthorized();
        } else {
          console.warn('handleUnauthorized is not a function, using fallback navigation');
          localStorage.removeItem('access_token');
          navigate('/login', { replace: true });
        }
      } else {
        setSnackbar({ open: true, message: `Upload failed: ${error.message}`, severity: 'error' });
      }
    }
    setUploading(false);
  };

  useEffect(() => {
    fetchUploadedDocuments();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ color: 'primary.main', mb: 3, fontWeight: 700, fontSize: "20px" }}>
        Upload Documents
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Upload size={35} color="primary.main" style={{ marginBottom: 16 }} />
        <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontSize: "15px" }}>
          Upload Your Study Materials
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontSize: "12px" }}>
          Supported formats: PDF, DOCX, TXT
        </Typography>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          <Button
            component="span"
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <Upload size={16} />}
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
        </label>
        {file && (
          <Typography variant="body2" sx={{ color: 'text.primary', mt: 2 }}>
            Selected: {file.name}
          </Typography>
        )}
        {file && (
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={uploading || !file}
          sx={{ mt: 2 }}
        >
          Upload
        </Button>
        )}
      </Paper>
    </Box>
  );
};

export default UploadFile;