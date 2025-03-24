// src/api/api.js
const API_BASE_URL = 'http://localhost:8000';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Add these headers to prevent CORS issues
      mode: 'cors',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload document: ${errorText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const generateQuestions = async (documentContent, numQuestions, difficulty) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_content: documentContent,
        num_questions: parseInt(numQuestions),
        difficulty: difficulty,
      }),
      mode: 'cors',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate questions: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

export const evaluateAnswer = async (question, userAnswer, modelAnswer, difficulty) => {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluate-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        user_answer: userAnswer,
        model_answer: modelAnswer,
        difficulty,
      }),
      mode: 'cors',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to evaluate answer: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw error;
  }
};