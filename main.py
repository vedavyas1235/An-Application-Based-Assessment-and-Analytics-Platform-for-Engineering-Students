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
from docx import Document
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models and device
device = torch.device('cpu')
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
    score: int
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
    question = question_generator(prompt, max_length=100, min_length=30, temperature=0.7)[0]['generated_text']
    return question if question.endswith('?') else question + '?'

def analyze_answer_content(user_answer: str, model_answer: str) -> List[str]:
    user_words = set(user_answer.lower().split())
    model_words = set(model_answer.lower().split())
    common_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
    
    user_concepts = user_words - common_words
    model_concepts = model_words - common_words
    
    return list(model_concepts - user_concepts)

def generate_specific_feedback(user_answer: str, model_answer: str, question: str, difficulty: str) -> str:
    feedback = []
    
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
    
    return "\n".join(feedback)

def evaluate_answer(user_answer: str, model_answer: str, difficulty: str) -> int:
    if len(user_answer.split()) < 10:
        return 20
    
    similarity = util.pytorch_cos_sim(
        similarity_model.encode(user_answer, convert_to_tensor=True),
        similarity_model.encode(model_answer, convert_to_tensor=True)
    ).item()
    
    multipliers = {'EASY': 1.0, 'MEDIUM': 1.2, 'HARD': 1.4}
    base_score = int(similarity * 100 * multipliers[difficulty])
    length_bonus = min(20, len(user_answer.split()) / 10)
    
    return min(100, base_score + length_bonus)

@app.post("/upload", response_model=str)
async def upload_document(file: UploadFile = File(...)):
    try:
        content = read_document(file)
        return content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
    try:
        chunks = [request.document_content[i:i+1000] for i in range(0, len(request.document_content), 1000)]
        questions = []
        
        for i in range(min(request.num_questions, 10)):
            chunk = chunks[i % len(chunks)]
            question = generate_question_by_difficulty(chunk, request.difficulty)
            
            answer_prompt = f"Provide a detailed {request.difficulty.lower()}-level explanation for: {question}\nContext: {chunk}"
            model_answer = question_generator(answer_prompt, max_length=200, min_length=50)[0]['generated_text']
            
            questions.append(Question(question=question, model_answer=model_answer))
        
        return QuestionResponse(questions=questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@app.post("/evaluate-answer", response_model=AnswerResponse)
async def evaluate_answer_endpoint(request: AnswerRequest):
    try:
        score = evaluate_answer(request.user_answer, request.model_answer, request.difficulty)
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
    uvicorn.run(app, host="0.0.0.0", port=8000)