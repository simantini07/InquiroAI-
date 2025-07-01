import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Paper, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { Send, Brain } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000";

const ChatInterface = ({ documents, setSnackbar, handleUnauthorized }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || '');
  const navigate = useNavigate();

  // Update selectedDocId when documents change
  React.useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!selectedDocId) {
      setSnackbar({ open: true, message: 'No document selected. Please upload or select a document.', severity: 'warning' });
      return;
    }

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found. Please login first.');

      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input, doc_id: selectedDocId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        const errorData = await response.json();
        console.log('POST /query error data:', errorData);
        throw new Error(errorData.detail || 'Query failed');
      }

      const responseData = await response.json();
      console.log('POST /query response:', responseData);
      if (!responseData.answer) {
        throw new Error('Invalid response format: No answer provided');
      }

      const botMessage = {
        id: Date.now() + 1,
        text: responseData.answer,
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
      setSnackbar({ open: true, message: 'Query answered successfully!', severity: 'success' });
    } catch (error) {
      console.error('Query failed:', error.message);
      if (error.message.includes('Unauthorized')) {
        if (typeof handleUnauthorized === 'function') {
          handleUnauthorized();
        } else {
          console.warn('handleUnauthorized is not a function, using fallback navigation');
          localStorage.removeItem('access_token');
          navigate('/login', { replace: true });
        }
      } else {
        setSnackbar({ open: true, message: `Query failed: ${error.message}`, severity: 'error' });
        setMessages(prev => [...prev, { id: Date.now() + 1, text: `Error: ${error.message}`, sender: 'bot' }]);
      }
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ color: 'primary.main', mb: 3, fontWeight: 700, fontSize: "20px" }}>
        AI Assistant
      </Typography>

      {documents.length > 0 && (
        <FormControl sx={{ mb: 2, minWidth: 200 }}>
          <InputLabel sx={{ color: 'text.primary' }}>Select Document</InputLabel>
          <Select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            label="Select Document"
            sx={{
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
              borderRadius: '8px',
              '& .MuiSelect-select': { color: 'text.primary' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(56, 189, 248, 0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(56, 189, 248, 0.5)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
            }}
          >
            {documents.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                {doc.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Paper
        sx={{
          flex: 1,
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)',
          }
        }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Brain size={35} color="primary.main" />
              <Typography variant="h6" sx={{ color: 'text.primary', mt: 2, mb: 1, fontSize: "15px" }}>
                Ready to Assist
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: "12px" }}>
                {documents.length === 0
                  ? 'Upload a document to start asking questions'
                  : 'Select a document and ask me anything'}
              </Typography>
            </Box>
          ) : (
            messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.sender === 'user'
                      ? 'linear-gradient(45deg, #0ea5e9, #38bdf8)'
                      : 'rgba(55, 65, 81, 0.8)',
                    color: 'text.primary',
                    borderRadius: message.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px'
                  }}
                >
                  <Typography variant="body1">{message.text}</Typography>
                </Paper>
              </Box>
            ))
          )}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Paper sx={{ p: 2, backgroundColor: 'rgba(55, 65, 81, 0.8)', borderRadius: '20px 20px 20px 5px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          animation: 'pulse 1.5s infinite',
                          animationDelay: `${i * 0.2}s`,
                          '@keyframes pulse': {
                            '0%, 80%, 100%': { opacity: 0.3 },
                            '40%': { opacity: 1 }
                          }
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" sx={{ ml: 2, color: 'primary.main' }}>
                    Thinking...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={documents.length === 0 ? 'Upload a document to ask questions' : 'Ask me about your documents...'}
            variant="outlined"
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                borderRadius: '25px',
                '& fieldset': { borderColor: 'rgba(56, 189, 248, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(56, 189, 248, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                '& input': { color: 'text.primary', padding: '12px 20px' }
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim() || !selectedDocId}
            sx={{
              background: 'linear-gradient(45deg, #0ea5e9 30%, #38bdf8 90%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '25px',
              minWidth: '60px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(45deg, #0284c7 30%, #0ea5e9 90%)',
                boxShadow: '0 6px 25px rgba(56, 189, 248, 0.4)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <Send size={20} />
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;