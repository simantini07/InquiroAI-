import React, { useState, useEffect } from 'react';
import { Box, Fab, Snackbar, Alert } from '@mui/material';
import { Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import UploadFile from './UploadFile';
import ChatInterface from './ChatInterface';
import FlashcardViewer from './FlashcardViewer';
import DocumentList from './DocumentList';

const Dashboard = ({ onLogout, handleUnauthorized }) => {
  const [selectedTab, setSelectedTab] = useState('upload');
  const [documents, setDocuments] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const API_BASE_URL = "http://127.0.0.1:8000";


  // Fetch documents when Dashboard mounts
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        

        if (response.ok) {
          const fetchedDocs = await response.json();
          console.log('Documents fetched on Dashboard mount:', fetchedDocs);
          setDocuments(fetchedDocs);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setSnackbar({ 
          open: true, 
          message: 'Error loading documents', 
          severity: 'error' 
        });
      }
    };

    fetchDocuments();
  }, [handleUnauthorized]);

  const handleFileUpload = (newDoc) => {
    setDocuments(prev => [...prev, newDoc]);
    setSnackbar({ open: true, message: 'Document uploaded successfully!', severity: 'success' });
  };

  const handleDocumentsFetched = (fetchedDocs) => {
    console.log('Documents fetched in Dashboard:', fetchedDocs);
    setDocuments(fetchedDocs);
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'upload':
        return (
          <UploadFile
            onFileUpload={handleFileUpload}
            onDocumentsFetched={handleDocumentsFetched}
            setSnackbar={setSnackbar}
            handleUnauthorized={handleUnauthorized}
          />
        );
      case 'chat':
        return (
          <ChatInterface
            documents={documents}
            setSnackbar={setSnackbar}
            handleUnauthorized={handleUnauthorized}
          />
        );
      case 'flashcards':
        return (
          <FlashcardViewer
            documents={documents}
            setSnackbar={setSnackbar}
            handleUnauthorized={handleUnauthorized}
          />
        );
      case 'documents':
        return <DocumentList documents={documents} onDocumentSelect={(doc) => console.log('Selected:', doc)} />;
      
      default:
        return (
          <UploadFile
            onFileUpload={handleFileUpload}
            onDocumentsFetched={handleDocumentsFetched}
            setSnackbar={setSnackbar}
            handleUnauthorized={handleUnauthorized}
          />
        );
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Box sx={{ width: 280, flexShrink: 0 }}>
        <Sidebar
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          onLogout={onLogout}
        />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </Box>
      <Fab
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #0ea5e9, #38bdf8)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(45deg, #0284c7, #0ea5e9)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
        }}
        onClick={() => setSelectedTab('upload')}
      >
        <Plus size={24} />
      </Fab>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            color: 'white',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            '& .MuiAlert-icon': { color: '#38bdf8' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;