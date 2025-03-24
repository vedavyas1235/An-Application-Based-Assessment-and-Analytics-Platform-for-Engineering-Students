Our application is designed as an advanced AI-based document question-answering system. It allows users to upload documents, and based on the uploaded content, the app generates intelligent questions. Users can answer these questions, save their responses, and submit them for evaluation. The app provides real-time feedback on the submitted answers, encouraging users to enhance their responses and gain deeper insights. It features a user-friendly interface with easy navigation through stages like Upload, Setup, Questions, Feedback, and Completion.

The application leverages machine learning algorithms to analyze text, generate relevant questions, and offer meaningful feedback. This automation reduces manual efforts and improves engagement, particularly useful for educational or learning purposes. By combining AI-generated content with user inputs, the app aims to enhance critical thinking, comprehension, and active learning. Its structured flow—from document upload to feedback delivery—streamlines the entire process, making it an innovative and efficient solution for educational assessments.

Application Description with Running Process
Our application is an AI-powered document-based question-answering platform that automates the process of content analysis, question generation, and feedback delivery. It is designed to improve learning and assessment by interacting with user-uploaded documents. Below is a step-by-step overview of the application’s running process:

Document Upload:
Users begin by uploading a document in formats such as PDF, which contains the material for analysis. This document is stored and processed by the backend system to extract meaningful textual content.

Question Generation (Setup Phase):
Once the document is uploaded, the application’s AI model analyzes the content and automatically generates a set of questions based on key information, concepts, or themes found in the document. This phase sets up the question-answering environment.

Question Answering:
Users move to the “Questions” section, where the AI-generated questions are displayed. For each question, users input their answers in the provided text boxes and can choose to save their responses.

Answer Submission:
After answering all the questions, users submit their responses by clicking the “Submit All Answers” button. This triggers the backend evaluation process.

Feedback Delivery:
The system evaluates the submitted answers and provides feedback based on content accuracy, relevance, and completeness. Users receive suggestions like expanding key points or including examples to improve their answers.

Completion Phase:
After reviewing the feedback, users can finalize the process, and a “Thank You” screen confirms the successful completion of the test or assessment.

Key Features and Benefits:
Automated Question Generation: Reduces manual efforts by creating questions directly from document content.

Interactive Learning: Users actively engage with the material through question-answer interactions.

Personalized Feedback: Provides specific feedback to improve learning outcomes and critical thinking.

Streamlined User Flow: Simplifies the entire process with clearly defined steps—Upload, Setup, Questions, Feedback, and Completion.


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


to run this porgram
install all requirements 

step 0 - pip install -r requirements.txt

step 1 - open terminal and run backend using "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

step 2 - open new treminal and run "npm run dev"
