import { uploadDocument, generateQuestions, evaluateAnswer } from './api/api';
import React, { useState, useRef, useCallback } from 'react';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/Card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './components/ui/HoverCard';
import { Input } from './components/ui/Input';
import { Progress } from './components/ui/Progress';
import   Alert from './components/ui/Alert';
import { AlertDescription } from './components/ui/Alert'; 
import   Textarea  from './components/ui/Textarea';
import { FileUp, AlertCircle, Upload, Book, Settings, ChevronLeft, FileText, Lock, Save } from 'lucide-react';

export default function DocumentQAPreview() {
  // Initialize all required states
  const [stage, setStage] = useState('landing');
  const [fileName, setFileName] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [answers, setAnswers] = useState({});
  const [savedAnswers, setSavedAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const fileInputRef = useRef(null);
  

  // Create questions array based on numberOfQuestions
  const questions = Array.from({ length: parseInt(numberOfQuestions) || 0 }, (_, idx) => ({
    id: idx + 1,
    text: `Question ${idx + 1}: This is an AI-generated question about the uploaded document content.`
  }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleGenerateQuestions = () => {
    if (selectedModel === 'OPENAI' || selectedModel === 'ANTHROPIC') {
      setStage('subscription');
    } else {
      setStage('qa');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const handleSaveAnswer = useCallback((questionId) => {
    setSavedAnswers(prev => ({
      ...prev,
      [questionId]: answers[questionId]
    }));
  }, [answers]);

  const handleSubmitAllAnswers = () => {
    setStage('feedback');
    const simulatedFeedback = Object.keys(savedAnswers).reduce((acc, questionId) => ({
      ...acc,
      [questionId]: "Good analysis. Consider expanding on key points and providing more specific examples from the document."
    }), {});
    setFeedback(simulatedFeedback);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEndTest = () => {
    setIsCompleted(true);
    setStage('completed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 p-4">
      {stage !== 'landing' && stage !== 'completed' && (
        <Button
          onClick={() => {
            setStage(prev => {
              const stages = ['landing', 'upload', 'questionSetup', 'qa', 'feedback', 'completed'];
              const currentIndex = stages.indexOf(prev);
              return stages[currentIndex - 1];
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          variant="outline"
          className="fixed top-4 left-4 p-2 flex items-center z-20"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      )}

      {stage !== 'landing' && stage !== 'completed' && (
        <div className="w-full max-w-md mx-auto mb-8 sticky top-0 bg-gradient-to-br from-blue-100 to-blue-300 pt-4 pb-2 z-10">
          <Progress 
            value={stage === 'landing' ? 0 : 
                   stage === 'upload' ? 20 : 
                   stage === 'questionSetup' ? 40 : 
                   stage === 'qa' ? 60 :
                   stage === 'feedback' ? 80 : 100} 
            className="h-2"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Upload</span>
            <span>Setup</span>
            <span>Questions</span>
            <span>Feedback</span>
            <span>Complete</span>
          </div>
        </div>
      )}

      {stage === 'landing' && (
        <Card className="max-w-2xl mx-auto mt-32">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-gray-800">
              Document Analysis & Assessment Platform
            </CardTitle>
            <CardDescription className="text-xl text-gray-600">
              Transform your documents into interactive learning experiences
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => setStage('upload')}
              size="lg"
              className="px-8 py-4 text-xl"
            >
              <Book className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'upload' && (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Upload Your Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p>Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">PDF, DOCX, or TXT (max 20MB)</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.pdf,.docx"
            />
            {fileName && (
              <Alert className="mt-4">
                <FileText className="w-4 h-4" />
                <AlertDescription>{fileName}</AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={() => setStage('questionSetup')}
              disabled={!fileName}
              className="w-full mt-6"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'questionSetup' && (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Configure Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Number of Questions:</label>
              <Input 
                type="number" 
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                placeholder="Enter number (1-10)"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Difficulty Level:</label>
              <div className="grid grid-cols-3 gap-2">
                {['EASY', 'MEDIUM', 'HARD'].map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? "default" : "outline"}
                    onClick={() => setDifficulty(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium">Select Model:</label>
              {[
                { name: 'OPENAI', paid: true },
                { name: 'TRANSFORMERS', paid: false },
                { name: 'ANTHROPIC', paid: true }
              ].map((model) => (
                <HoverCard key={model.name}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant={selectedModel === model.name ? "default" : "outline"}
                      onClick={() => setSelectedModel(model.name)}
                      className="w-full mb-2 justify-between"
                    >
                      <span>{model.name}</span>
                      <span className={model.paid ? "text-yellow-500" : "text-green-500"}>
                        ({model.paid ? 'Paid' : 'Free'})
                      </span>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    {model.paid ? 
                      "This is a premium model requiring a subscription" : 
                      "This is a free model available to all users"
                    }
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>

            <Button 
              onClick={handleGenerateQuestions}
              disabled={!numberOfQuestions || !difficulty || !selectedModel}
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Generate Questions
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'subscription' && (
        <Card className="max-w-md mx-auto mt-8">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle className="text-2xl font-bold mb-4">Subscription Required</CardTitle>
            <CardDescription className="mb-6">
              You are not currently a paid member. To access this feature, please upgrade to a paid subscription.
            </CardDescription>
            <Button 
              onClick={() => setStage('questionSetup')}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'qa' && (
        <div className="max-w-3xl mx-auto mt-8 space-y-6">
          {questions.map((question) => (
            <Card key={question.id} id={`question-${question.id}`} className="scroll-mt-32">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Question {question.id}</h3>
                <p className="text-lg mb-4">{question.text}</p>
                <div className="space-y-4">
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-32"
                  />
                  <Button
                    onClick={() => handleSaveAnswer(question.id)}
                    disabled={!answers[question.id] || answers[question.id] === savedAnswers[question.id]}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Answer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="p-6">
              <Button
                onClick={handleSubmitAllAnswers}
                disabled={questions.length === 0 || Object.keys(savedAnswers).length !== questions.length}
                variant="success"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Submit All Answers
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === 'feedback' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Question {question.id}</h3>
                <p className="text-lg mb-4">{question.text}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">Your Answer:</label>
                    <div className="w-full p-3 border rounded-lg min-h-32 bg-gray-50">
                      {savedAnswers[question.id]}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block mb-2 font-medium">Feedback:</label>
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{feedback[question.id]}</AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="p-6">
              <Button
                onClick={handleEndTest}
                variant="destructive"
                className="w-full"
              >
                End Test
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === 'completed' && (
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <CardTitle className="text-4xl font-bold mb-4">THANK YOU</CardTitle>
            <CardDescription>Your test has been completed successfully.</CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}