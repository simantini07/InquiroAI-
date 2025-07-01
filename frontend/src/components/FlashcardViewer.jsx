import React, { useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { CreditCard } from 'lucide-react';

const API_BASE_URL = "http://127.0.0.1:8000";

const FlashcardViewer = ({ documents, setSnackbar }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateFlashcards = async (count = 5) => {
    if (!documents.length) {
      setSnackbar({ open: true, message: 'No documents available to generate flashcards', severity: 'error' });
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found. Please login first.');

      const response = await fetch(`${API_BASE_URL}/flashcards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doc_id: documents[0].id, count }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate flashcards');
      }

      const result = await response.json();
      setFlashcards(result.flashcards);
      setCurrentCard(0);
      setFlipped(false);
      setSnackbar({ open: true, message: 'Flashcards generated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      setSnackbar({ open: true, message: `Failed to generate flashcards: ${error.message}`, severity: 'error' });
    }
    setGenerating(false);
  };

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
    setFlipped(false);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setFlipped(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ color: '#38bdf8', mb: 3, fontWeight: 700, fontSize: "20px" }}>
        Memory Cards
      </Typography>

      {flashcards.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
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
          <CreditCard size={35} color="#38bdf8" style={{ marginBottom: 16 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: "15px" }}>
            Generate Flashcards
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, fontSize: "12px" }}>
            Create study cards from your uploaded documents
          </Typography>
          <Button
            onClick={() => generateFlashcards()}
            disabled={generating || !documents.length}
            sx={{
              background: 'linear-gradient(45deg, #0ea5e9 30%, #38bdf8 90%)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
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
            {generating ? 'Generating...' : 'Create Flashcards'}
          </Button>
        </Paper>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Card {currentCard + 1} of {flashcards.length}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => generateFlashcards()}
                sx={{
                  background: 'transparent',
                  border: '1px solid #38bdf8',
                  color: '#ffffff',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(56, 189, 248, 0.1)',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Generate New Set
              </Button>
            </Box>
          </Box>

          <Paper
            sx={{
              p: 4,
              minHeight: '300px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.02)' },
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
            onClick={() => setFlipped(!flipped)}
          >
            <Typography variant="body2" sx={{ color: '#38bdf8', mb: 2, textAlign: 'center' }}>
              {flipped ? 'ANSWER' : 'QUESTION'}
            </Typography>
            <Typography variant="h6" sx={{ color: 'white', textAlign: 'center', lineHeight: 1.6 }}>
              {flipped ? flashcards[currentCard]?.answer : flashcards[currentCard]?.question}
            </Typography>
            {!flipped && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', mt: 3 }}>
                Click to reveal answer
              </Typography>
            )}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={prevCard}
              sx={{
                background: 'transparent',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(56, 189, 248, 0.1)',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              onClick={() => setFlipped(!flipped)}
              sx={{
                background: 'transparent',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(56, 189, 248, 0.1)',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              {flipped ? 'Show Question' : 'Show Answer'}
            </Button>
            <Button
              variant="outlined"
              onClick={nextCard}
              sx={{
                background: 'transparent',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(56, 189, 248, 0.1)',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FlashcardViewer;