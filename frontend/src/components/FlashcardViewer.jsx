import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { CreditCard, ArrowLeft, ArrowRight } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const FlashcardViewer = ({ documents, setSnackbar, handleUnauthorized }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || "");
  const [flashcardCount, setFlashcardCount] = useState(5);

  // Update selectedDocId when documents change
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const generateFlashcards = async () => {
    if (!selectedDocId) {
      setSnackbar({
        open: true,
        message: "No document selected. Please select a document.",
        severity: "warning",
      });
      return;
    }

    if (flashcardCount < 1 || flashcardCount > 20) {
      setSnackbar({
        open: true,
        message: "Number of flashcards must be between 1 and 20.",
        severity: "warning",
      });
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token)
        throw new Error("No authentication token found. Please login first.");

      // Fixed: Use the correct endpoint format with document ID in URL path
      const response = await fetch(
        `${API_BASE_URL}/flashcards/${selectedDocId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // Fixed: Send the correct request body format
          body: JSON.stringify({ num_flashcards: flashcardCount }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Invalid or expired token");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate flashcards");
      }

      const result = await response.json();
      setFlashcards(result.flashcards);
      setCurrentCard(0);
      setFlipped(false);
      setSnackbar({
        open: true,
        message: result.message || "Flashcards generated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      if (error.message.includes("Unauthorized")) {
        if (typeof handleUnauthorized === "function") {
          handleUnauthorized();
        }
      } else {
        setSnackbar({
          open: true,
          message: `Failed to generate flashcards: ${error.message}`,
          severity: "error",
        });
      }
    }
    setGenerating(false);
  };

  // Add function to load existing flashcards
  const loadExistingFlashcards = async () => {
    if (!selectedDocId) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/flashcards/${selectedDocId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const existingFlashcards = await response.json();
        if (existingFlashcards.length > 0) {
          setFlashcards(existingFlashcards);
          setCurrentCard(0);
          setFlipped(false);
        }
      }
    } catch (error) {
      console.error("Failed to load existing flashcards:", error);
    }
  };

  // Load existing flashcards when document is selected
  useEffect(() => {
    if (selectedDocId) {
      loadExistingFlashcards();
    }
  }, [selectedDocId]);

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
    setFlipped(false);
  };

  const prevCard = () => {
    setCurrentCard(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    );
    setFlipped(false);
  };

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="h4"
        sx={{ color: "#38bdf8", mb: 3, fontWeight: 700, fontSize: "20px" }}
      >
        Memory Cards
      </Typography>

      {documents.length > 0 && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: "text.primary" }}>
              Select Document
            </InputLabel>
            <Select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              label="Select Document"
              sx={{
                backgroundColor: "rgba(55, 65, 81, 0.5)",
                borderRadius: "8px",
                "& .MuiSelect-select": { color: "text.primary" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(56, 189, 248, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(56, 189, 248, 0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#38bdf8",
                },
              }}
            >
              {documents.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  {doc.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="number"
            value={flashcardCount}
            onChange={(e) =>
              setFlashcardCount(
                Math.min(Math.max(1, parseInt(e.target.value) || 1), 20)
              )
            }
            label="Number of Flashcards"
            variant="outlined"
            sx={{
              width: 150,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(55, 65, 81, 0.5)",
                borderRadius: "8px",
                "& fieldset": { borderColor: "rgba(56, 189, 248, 0.3)" },
                "&:hover fieldset": { borderColor: "rgba(56, 189, 248, 0.5)" },
                "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
                "& input": { color: "text.primary" },
              },
            }}
          />
          <Button
            onClick={generateFlashcards}
            disabled={generating || !selectedDocId}
            sx={{
              background: "linear-gradient(45deg, #0ea5e9 30%, #38bdf8 90%)",
              border: "none",
              color: "#ffffff",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(56, 189, 248, 0.3)",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "linear-gradient(45deg, #0284c7 30%, #0ea5e9 90%)",
                boxShadow: "0 6px 25px rgba(56, 189, 248, 0.4)",
                transform: "translateY(-2px)",
              },
            }}
          >
            {generating ? "Generating..." : "Generate Flashcards"}
          </Button>
        </Box>
      )}

      {flashcards.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)",
            },
          }}
        >
          <CreditCard size={35} color="#38bdf8" style={{ marginBottom: 16 }} />
          <Typography
            variant="h6"
            sx={{ color: "white", mb: 2, fontSize: "15px" }}
          >
            Generate Flashcards
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.6)", mb: 3, fontSize: "12px" }}
          >
            Select a document and specify the number of flashcards to create
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
            Card {currentCard + 1} of {flashcards.length}
          </Typography>
          <Paper
            sx={{
              p: 4,
              minHeight: "300px",
              cursor: "pointer",
              perspective: "1000px", // Add perspective for 3D effect
              background:
                "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent)",
              },
            }}
            onClick={() => setFlipped(!flipped)}
          >
            {/* Front Face (Question) */}
            <Box
              sx={{
                backfaceVisibility: "hidden",
                position: "absolute",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transition: "transform 0.6s",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#38bdf8", mb: 2, textAlign: "center" }}
              >
                QUESTION
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "white", textAlign: "center", lineHeight: 1.6 }}
              >
                {flashcards[currentCard]?.question}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  textAlign: "center",
                  mt: 3,
                }}
              >
                Click to reveal answer
              </Typography>
            </Box>

            {/* Back Face (Answer) */}
            <Box
              sx={{
                backfaceVisibility: "hidden",
                position: "absolute",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                transform: flipped ? "rotateY(0deg)" : "rotateY(-180deg)",
                transition: "transform 0.6s",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#38bdf8", mb: 2, textAlign: "center" }}
              >
                ANSWER
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: "white", textAlign: "center", lineHeight: 1.6 }}
              >
                {flashcards[currentCard]?.answer}
              </Typography>
            </Box>
          </Paper>

          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={prevCard}
              disabled={flashcards.length <= 1}
              sx={{
                background: "transparent",
                border: "1px solid #38bdf8",
                color: "#ffffff",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(56, 189, 248, 0.1)",
                  boxShadow: "0 0 10px rgba(56, 189, 248, 0.3)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <ArrowLeft size={20} />
              Previous
            </Button>
            <Button
              variant="outlined"
              onClick={() => setFlipped(!flipped)}
              sx={{
                background: "transparent",
                border: "1px solid #38bdf8",
                color: "#ffffff",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(56, 189, 248, 0.1)",
                  boxShadow: "0 0 10px rgba(56, 189, 248, 0.3)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              {flipped ? "Show Question" : "Show Answer"}
            </Button>
            <Button
              variant="outlined"
              onClick={nextCard}
              disabled={flashcards.length <= 1}
              sx={{
                background: "transparent",
                border: "1px solid #38bdf8",
                color: "#ffffff",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(56, 189, 248, 0.1)",
                  boxShadow: "0 0 10px rgba(56, 189, 248, 0.3)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Next
              <ArrowRight size={20} />
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FlashcardViewer;
