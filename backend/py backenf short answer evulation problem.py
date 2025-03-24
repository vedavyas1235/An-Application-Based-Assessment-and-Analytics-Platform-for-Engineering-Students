from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import torch
import nltk
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import PyPDF2
import io
import random
import re
from docx import Document
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173"],  # Include both possible frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models and device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print("Loading models...")
question_generator = pipeline("text2text-generation", model="google/flan-t5-large", device=device)
similarity_model = SentenceTransformer('all-MiniLM-L6-v2').to(device)
print("Models loaded successfully!")

# Download NLTK data
for data in ['punkt', 'averaged_perceptron_tagger', 'maxent_ne_chunker', 'words']:
    nltk.download(data, quiet=True)

class QuestionRequest(BaseModel):
    document_content: str
    num_questions: int
    difficulty: str

class AnswerRequest(BaseModel):
    question: str
    user_answer: str
    model_answer: str
    difficulty: str

class Question(BaseModel):
    question: str
    model_answer: str

class QuestionResponse(BaseModel):
    questions: List[Question]

class AnswerResponse(BaseModel):
    score: int  # Keeping as integer, we'll convert float results to int
    feedback: str

def read_document(file: UploadFile) -> str:
    content = file.file.read()
    
    if file.filename.endswith('.pdf'):
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        return ' '.join(page.extract_text() for page in pdf_reader.pages)
    
    elif file.filename.endswith('.docx'):
        doc = Document(io.BytesIO(content))
        return ' '.join(paragraph.text for paragraph in doc.paragraphs)
    
    else:  # Assume txt file
        return content.decode('utf-8')

def clean_text(text: str) -> str:
    """Clean text by removing excessive punctuation and unwanted patterns."""
    # Remove excessive question marks, dots, etc.
    cleaned = re.sub(r'([.!?])\1+', r'\1', text)
    # Remove other potentially repeated characters
    cleaned = re.sub(r'([a-zA-Z])\1{3,}', r'\1', cleaned)
    # Ensure proper space after punctuation
    cleaned = re.sub(r'([.!?])([a-zA-Z])', r'\1 \2', cleaned)
    # Remove random special characters
    cleaned = re.sub(r'[^\w\s.,?!;:\-\'"]', '', cleaned)
    return cleaned.strip()

def extract_paragraphs(text: str, num_paragraphs: int = 5) -> List[str]:
    """Extract meaningful paragraphs from text."""
    # Split text into paragraphs
    paragraphs = re.split(r'\n\n+', text)
    
    # Filter out short paragraphs and headers
    meaningful_paragraphs = [p for p in paragraphs if len(p.split()) > 20]
    
    # Return a random subset or all if fewer than requested
    if len(meaningful_paragraphs) <= num_paragraphs:
        return meaningful_paragraphs
    else:
        return random.sample(meaningful_paragraphs, num_paragraphs)

def generate_questions(document_content: str, num_questions: int, difficulty: str) -> List[Question]:
    """Generate questions based on document content and difficulty."""
    # Extract paragraphs for question generation
    paragraphs = extract_paragraphs(document_content)
    
    # If fewer paragraphs than questions, use paragraphs multiple times
    if len(paragraphs) < num_questions:
        paragraphs = paragraphs * (num_questions // len(paragraphs) + 1)
    
    # Generate questions
    questions = []
    for i in range(min(num_questions, len(paragraphs))):
        paragraph = paragraphs[i]
        
        # Generate question
        question_text = generate_question_by_difficulty(paragraph, difficulty)
        
        # Generate model answer
        model_answer = generate_model_answer(paragraph, question_text)
        
        questions.append(Question(question=question_text, model_answer=model_answer))
    
    return questions

def generate_question_by_difficulty(chunk: str, difficulty: str) -> str:
    prompts = {
        'EASY': [
            "Generate a question that tests basic understanding of:",
            "Create a straightforward question about:",
            "Ask a fundamental question regarding:"
        ],
        'MEDIUM': [
            "Generate an analytical question requiring explanation about:",
            "Create a question that explores relationships between concepts in:",
            "Ask a question requiring detailed analysis of:"
        ],
        'HARD': [
            "Generate a complex question requiring critical evaluation of:",
            "Create a question that challenges deep understanding of:",
            "Ask a question requiring synthesis of multiple concepts in:"
        ]
    }

    prompt = f"{random.choice(prompts[difficulty])} {chunk}"
    
    # Generate the raw question 
    raw_question = question_generator(prompt, max_length=100, min_length=30, temperature=0.7)[0]['generated_text']
    
    # Clean the question text
    cleaned_question = clean_text(raw_question)
    
    # Ensure the question ends with a question mark
    if not cleaned_question.endswith('?'):
        cleaned_question += '?'
    
    return cleaned_question

def generate_model_answer(paragraph: str, question: str) -> str:
    """Generate a model answer for a given question."""
    prompt = f"Context: {paragraph}\n\nQuestion: {question}\n\nAnswer:"
    model_answer = question_generator(prompt, max_length=200, min_length=50, temperature=0.3)[0]['generated_text']
    return clean_text(model_answer)

def analyze_answer_content(user_answer: str, model_answer: str) -> List[str]:
    # Handle empty or very short answers
    if not user_answer or len(user_answer.split()) < 5:
        return ["Your answer is too short"]
    
    user_words = set(user_answer.lower().split())
    model_words = set(model_answer.lower().split())
    common_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
    
    user_concepts = user_words - common_words
    model_concepts = model_words - common_words
    
    return list(model_concepts - user_concepts)

def generate_specific_feedback(user_answer: str, model_answer: str, question: str, difficulty: str) -> str:
    feedback = []
    
    # Handle empty answers
    if not user_answer:
        return "No answer provided. Please provide an answer to receive feedback."
    
    # Length analysis
    answer_length = len(user_answer.split())
    model_length = len(model_answer.split())
    
    if answer_length < model_length * 0.6:
        feedback.append("Your answer could benefit from more detail and explanation.")
    
    # Concept analysis
    missing_concepts = analyze_answer_content(user_answer, model_answer)
    if missing_concepts:
        important_concepts = [c for c in missing_concepts if len(c) > 4][:3]
        if important_concepts:
            feedback.append(f"Consider discussing these key concepts: {', '.join(important_concepts)}")
    
    # Explanation patterns
    if not any(marker in user_answer.lower() for marker in ['because', 'therefore', 'since', 'as a result']):
        feedback.append("Include clear explanations showing cause-and-effect relationships")
    
    # Examples
    if not any(marker in user_answer.lower() for marker in ['for example', 'such as', 'instance']):
        feedback.append("Support your answer with specific examples")
    
    if not feedback:
        feedback.append("Good job! Your answer covers the main points.")
        
    return "\n".join(feedback)

def evaluate_answer(user_answer: str, model_answer: str, difficulty: str) -> tuple:
    """Evaluate user answer against model answer and return score and feedback."""
    # Handle empty answers
    if not user_answer:
        return 0, "No answer provided."
    
    # Handle very short answers
    if len(user_answer.split()) < 10:
        return 20, "Your answer is too brief. Please provide more detailed explanations."
    
    try:
        # Calculate similarity score
        similarity = util.pytorch_cos_sim(
            similarity_model.encode(user_answer, convert_to_tensor=True),
            similarity_model.encode(model_answer, convert_to_tensor=True)
        ).item()
        
        # Apply difficulty multiplier
        multipliers = {'EASY': 1.0, 'MEDIUM': 1.2, 'HARD': 1.4}
        base_score = similarity * 100 * multipliers[difficulty]
        
        # Add length bonus (up to 20 points)
        length_bonus = min(20, len(user_answer.split()) / 10)
        
        # Calculate final score (ensure it's an integer)
        final_score = int(min(100, max(0, base_score + length_bonus)))
        
        return final_score, None
    except Exception as e:
        print(f"Error in evaluate_answer: {str(e)}")
        return 0, f"Error evaluating answer: {str(e)}"

@app.post("/upload-document")
async def upload_document_endpoint(file: UploadFile = File(...)):
    try:
        document_content = read_document(file)
        return {"content": document_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions_endpoint(request: QuestionRequest):
    try:
        questions = generate_questions(request.document_content, request.num_questions, request.difficulty)
        return QuestionResponse(questions=questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@app.post("/evaluate-answer", response_model=AnswerResponse)
async def evaluate_answer_endpoint(request: AnswerRequest):
    try:
        score, error = evaluate_answer(request.user_answer, request.model_answer, request.difficulty)
        
        if error:
            raise HTTPException(status_code=500, detail=f"Error evaluating answer: {error}")
        
        feedback = generate_specific_feedback(
            request.user_answer, 
            request.model_answer, 
            request.question, 
            request.difficulty
        )
        
        return AnswerResponse(score=score, feedback=feedback)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating answer: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)