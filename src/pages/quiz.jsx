import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  getQuizCategories, 
  getRandomQuiz, 
  saveQuizResult, 
  calculateQuizScore,
  getUserQuizProgress 
} from "../services/quizService";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  BookOpen,
  Trophy,
  BarChart3,
  Play,
  Eye
} from "lucide-react";

export default function Quiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState("categories"); // categories, quiz, results
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExplanations, setShowExplanations] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const categories = getQuizCategories();

  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    try {
      const progress = await getUserQuizProgress(user.uid);
      setUserProgress(progress);
    } catch (error) {
      console.error("Error loading user progress:", error);
    }
  };

  const startQuiz = (category) => {
    setSelectedCategory(category);
    const quizQuestions = getRandomQuiz(category.id);
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeLeft(600); // 10 minutes
    setCurrentView("quiz");
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: questions[currentQuestionIndex].id,
      selectedAnswer: answerIndex,
      timestamp: Date.now()
    };
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = async () => {
    console.log("finishQuiz called");
    console.log("Current answers:", answers);
    console.log("Current questions:", questions);
    
    setLoading(true);
    try {
      // Ensure we have answers for all questions
      const completedAnswers = questions.map((_, index) => 
        answers[index] || { questionId: questions[index].id, selectedAnswer: null, timestamp: Date.now() }
      );
      
      console.log("Completed answers:", completedAnswers);
      
      const results = calculateQuizScore(completedAnswers, questions);
      console.log("Quiz results:", results);
      
      setQuizResults(results);
      
             if (user && !user.isAnonymous) {
         console.log("Saving quiz result for user:", user.uid);
         console.log("Quiz data to save:", { ...results, category: selectedCategory.id });
         
         try {
           const saveResult = await saveQuizResult(user.uid, {
             ...results,
             category: selectedCategory.id
           });
           console.log("Save result:", saveResult);
           
           await loadUserProgress(); // Refresh progress
           setShowSuccessMessage(true);
           // Hide success message after 3 seconds
           setTimeout(() => setShowSuccessMessage(false), 3000);
           
           // Set a flag to indicate quiz completion
           localStorage.setItem('quizCompleted', 'true');
         } catch (saveError) {
           console.error("Error saving quiz result:", saveError);
         }
       }
      
      console.log("Setting view to results");
      setCurrentView("results");
    } catch (error) {
      console.error("Error finishing quiz:", error);
      // Still show results even if saving fails
      const results = calculateQuizScore(answers, questions);
      setQuizResults(results);
      setCurrentView("results");
    } finally {
      setLoading(false);
    }
  };

  const restartQuiz = () => {
    setCurrentView("categories");
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizResults(null);
    setTimeLeft(0);
    setShowExplanations(false);
  };

  // Timer effect
  useEffect(() => {
    if (currentView === "quiz" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentAnswer = () => {
    return answers[currentQuestionIndex]?.selectedAnswer;
  };

  const isQuestionAnswered = (index) => {
    return answers[index] !== undefined;
  };

  const CategoryCard = ({ category }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center space-x-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${category.color} text-white`}>
          {category.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
          <p className="text-sm text-gray-600">{category.description}</p>
        </div>
      </div>
      <button
        onClick={() => startQuiz(category)}
        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
      >
        <Play className="w-4 h-4" />
        <span>Start Quiz</span>
      </button>
    </div>
  );

  const QuizQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = getCurrentAnswer();

    return (
      <div className="max-w-4xl mx-auto">
        {/* Progress and Timer */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="text-sm text-gray-500">
              ({answers.filter(a => a !== undefined).length} answered)
            </div>
            <div className="flex space-x-1">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    isQuestionAnswered(index) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2 text-red-500 font-semibold">
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>
          
          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={nextQuestion}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </button>
            
            {currentQuestionIndex < questions.length - 1 && (
              <button
                onClick={finishQuiz}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Finish Quiz Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuizResults = () => {
    if (!quizResults) return null;

    const { score, correctAnswers, totalQuestions, answers: detailedAnswers } = quizResults;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Results Summary */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-6">
          {showSuccessMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Quiz result saved! Your dashboard has been updated.</span>
              </div>
            </div>
          )}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600">You scored {score}%</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{showExplanations ? 'Hide' : 'Show'} Explanations</span>
            </button>
            <button
              onClick={restartQuiz}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Take Another Quiz
            </button>
            <button
              onClick={() => {
                console.log("Going back to dashboard with refresh");
                navigate("/dashboard", { state: { refresh: true } });
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Detailed Results with Explanations */}
        {showExplanations && (
          <div className="space-y-4">
            {detailedAnswers.map((answer, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start space-x-4 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                    answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {answer.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Question {index + 1}: {answer.question.question}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      {answer.question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border-2 ${
                            optionIndex === answer.question.correctAnswer
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : optionIndex === answer.selectedAnswer && !answer.isCorrect
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200'
                          }`}
                        >
                          <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                          {optionIndex === answer.question.correctAnswer && (
                            <span className="ml-2 text-green-600 font-semibold">✓ Correct Answer</span>
                          )}
                          {optionIndex === answer.selectedAnswer && !answer.isCorrect && (
                            <span className="ml-2 text-red-600 font-semibold">✗ Your Answer</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
                      <p className="text-blue-700">{answer.question.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log("Navigating back to dashboard with refresh state");
                navigate("/dashboard", { state: { refresh: true } });
              }}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Quizzes</h1>
              <p className="text-gray-600">Test your knowledge and learn with explanations</p>
            </div>
          </div>
          
          {userProgress && (
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{userProgress.averageScore}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{userProgress.completedQuizzes}</div>
                <div className="text-sm text-gray-600">Quizzes Taken</div>
              </div>
            </div>
          )}
        </div>

        {/* Quiz Session Info */}
        {currentView === "quiz" && selectedCategory && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${selectedCategory.color}`}>
                  {selectedCategory.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{selectedCategory.name}</h2>
                  <p className="text-sm text-gray-600">{selectedCategory.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Questions: {questions.length}</div>
                <div className="text-sm text-gray-600">Time: 10 minutes</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {/* Categories View */}
        {currentView === "categories" && !loading && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        )}

        {/* Quiz View */}
        {currentView === "quiz" && !loading && (
          <QuizQuestion />
        )}

        {/* Results View */}
        {currentView === "results" && !loading && (
          <QuizResults />
        )}
      </div>
    </div>
  );
}
