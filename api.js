import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to upload document: ' + error.message);
  }
};

export const generateQuestions = async (documentContent, numQuestions, difficulty) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-questions`, {
      document_content: documentContent,
      num_questions: parseInt(numQuestions),
      difficulty: difficulty
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to generate questions: ' + error.message);
  }
};

export const evaluateAnswer = async (question, userAnswer, modelAnswer, difficulty) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/evaluate-answer`, {
      question: question,
      user_answer: userAnswer,
      model_answer: modelAnswer,
      difficulty: difficulty
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to evaluate answer: ' + error.message);
  }
};