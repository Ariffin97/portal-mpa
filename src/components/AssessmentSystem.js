import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import mpaLogo from '../assets/images/mpa.png';

const AssessmentSystem = ({ isOpen, onClose, onSubmissionSave }) => {
  const [currentView, setCurrentView] = useState('registration'); // registration, assessment, results
  const [questions, setQuestions] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [timeLimit, setTimeLimit] = useState(30);
  const [results, setResults] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [savedForms, setSavedForms] = useState([]);

  // Sample questions for demo
  const sampleQuestions = [
    {
      id: 1,
      question: "What is the standard size of a pickleball court?",
      section: "Court Specifications",
      options: ["20' x 44'", "20' x 40'", "24' x 44'", "20' x 48'"],
      correctAnswer: "20' x 44'"
    },
    {
      id: 2,
      question: "What is the height of the net at the center?",
      section: "Equipment",
      options: ["34 inches", "36 inches", "32 inches", "38 inches"],
      correctAnswer: "34 inches"
    },
    {
      id: 3,
      question: "What is the non-volley zone also called?",
      section: "Rules",
      options: ["The service area", "The kitchen", "The baseline", "The sideline"],
      correctAnswer: "The kitchen"
    },
    {
      id: 4,
      question: "How many points do you need to win a game?",
      section: "Scoring",
      options: ["11 points with a 2-point lead", "15 points", "21 points", "First to 11"],
      correctAnswer: "11 points with a 2-point lead"
    },
    {
      id: 5,
      question: "In doubles, who serves first at the start of the game?",
      section: "Serving",
      options: ["Left side player", "Right side player", "Either player", "Team captain"],
      correctAnswer: "Right side player"
    }
  ];

  useEffect(() => {
    if (questions.length === 0) {
      setQuestions(sampleQuestions);
    }
  }, []);

  const generateFormCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (savedForms.some(form => form.code === code));
    return code;
  };

  const saveForm = () => {
    if (questions.length === 0) {
      alert('Please add at least one question before saving the form.');
      return null;
    }

    const formCode = generateFormCode();
    const savedForm = {
      code: formCode,
      questions: [...questions],
      timeLimit,
      createdAt: new Date(),
      title: `Assessment Form ${formCode}`
    };

    setSavedForms(prev => [...prev, savedForm]);
    return formCode;
  };

  const loadForm = async (code) => {
    try {
      // First check local savedForms
      const localForm = savedForms.find(f => f.code === code.toUpperCase());
      if (localForm) {
        setQuestions(localForm.questions);
        setTimeLimit(localForm.timeLimit);
        return true;
      }

      // If not found locally, check the database via API
      const form = await apiService.getAssessmentFormByCode(code.toUpperCase());
      if (form) {
        console.log('Loaded form from API:', form);
        console.log('Form includeAnswers value:', form.includeAnswers);
        setQuestions(form.questions);
        setTimeLimit(form.timeLimit);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error loading form:', error);
      return false;
    }
  };

  const handleAssessmentComplete = async (assessmentResults) => {
    const submissionDate = new Date();
    const dateStr = submissionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const batchId = `${userInfo.formCode}-${dateStr}`; // e.g., "YA374-2025-09-19"

    // Use assessment results as-is (automatic scoring only)
    let finalResults = assessmentResults;

    const submission = {
      id: Date.now(),
      userInfo,
      results: finalResults,
      submittedAt: submissionDate,
      batchId: batchId,
      batchDate: dateStr
    };

    // Save to database
    try {
      const submissionData = {
        formCode: userInfo.formCode,
        participantName: userInfo.fullName,
        answers: assessmentResults.answers ? Object.entries(assessmentResults.answers).map(([questionId, selectedAnswer]) => ({
          questionId: parseInt(questionId),
          selectedAnswer: selectedAnswer,
          isCorrect: questions.find(q => q.id == questionId)?.correctAnswer === selectedAnswer
        })) : [],
        score: assessmentResults.percentage,
        correctAnswers: assessmentResults.score,
        totalQuestions: assessmentResults.totalQuestions,
        timeSpent: assessmentResults.timeSpent || 0,
        batchId: batchId,
        batchDate: dateStr
      };

      await apiService.saveAssessmentSubmission(submissionData);
      console.log('Assessment submission saved to database successfully');
    } catch (error) {
      console.error('Error saving assessment submission:', error);
      // Continue with local saving even if database save fails
    }

    setAllSubmissions(prev => [...prev, submission]);
    setResults(finalResults);
    setCurrentView('results');

    // Save to global state if callback provided
    if (onSubmissionSave) {
      onSubmissionSave(submission);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#fff',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '16px 24px',
        borderBottom: '2px solid #000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Assessment</h2>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            color: '#fff',
            border: '1px solid #fff',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '16px',
            borderRadius: '4px'
          }}
        >
          × Close
        </button>
      </div>

      <div style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: currentView === 'results' ? 'flex-start' : 'center',
        backgroundColor: '#fff',
        overflow: 'auto'
      }}>
        {currentView === 'registration' && (
          <UserRegistration
            onRegister={(info) => {
              setUserInfo(info);
              setCurrentView('assessment');
            }}
            loadForm={loadForm}
            savedForms={savedForms}
          />
        )}

        {currentView === 'assessment' && (
          <Assessment
            questions={questions}
            userInfo={userInfo}
            timeLimit={timeLimit}
            onComplete={handleAssessmentComplete}
            onBackToRegistration={() => {
              setCurrentView('registration');
              setUserInfo(null);
            }}
          />
        )}

        {currentView === 'results' && (
          <Results
            results={results}
            userInfo={userInfo}
            questions={questions}
            onBackToHome={() => {
              setCurrentView('registration');
              setUserInfo(null);
              setResults(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// User Registration Component
const UserRegistration = ({ onRegister, loadForm, savedForms = [] }) => {
  const [fullName, setFullName] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [formCode, setFormCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const formatIcNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 6) {
      return digits;
    } else if (digits.length <= 8) {
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 12)}`;
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!icNumber.trim()) {
      newErrors.icNumber = 'IC number is required';
    } else {
      const icDigits = icNumber.replace(/[-]/g, '');
      if (!/^\d{12}$/.test(icDigits)) {
        newErrors.icNumber = 'IC number must be 12 digits';
      }
    }

    if (!formCode.trim()) {
      newErrors.formCode = 'Assessment code is required';
    } else {
      const isValidCode = await loadForm(formCode);
      if (!isValidCode) {
        newErrors.formCode = 'Invalid assessment code';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      const userInfo = {
        fullName: fullName.trim(),
        icNumber: icNumber.trim(),
        formCode: formCode.trim(),
        startTime: new Date()
      };
      onRegister(userInfo);
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '2px solid #000',
      borderRadius: '8px',
      padding: '40px',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <img
          src={mpaLogo}
          alt="MPA Logo"
          style={{
            height: '120px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
        Assessment Registration
      </h3>
      <p style={{ margin: '0 0 32px 0', color: '#666', fontSize: '16px' }}>
        Please enter your details to begin
      </p>

      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#000',
            fontSize: '14px'
          }}>
            Assessment Code *
          </label>
          <input
            type="text"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
            placeholder="Enter 5-character code"
            maxLength="5"
            style={{
              width: '100%',
              padding: '12px',
              border: errors.formCode ? '2px solid #000' : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              backgroundColor: errors.formCode ? '#ffe6e6' : '#fff'
            }}
          />
          {errors.formCode && (
            <span style={{ color: '#000', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.formCode}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#000',
            fontSize: '14px'
          }}>
            Full Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            style={{
              width: '100%',
              padding: '12px',
              border: errors.fullName ? '2px solid #000' : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              backgroundColor: errors.fullName ? '#ffe6e6' : '#fff'
            }}
          />
          {errors.fullName && (
            <span style={{ color: '#000', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.fullName}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#000',
            fontSize: '14px'
          }}>
            IC Number *
          </label>
          <input
            type="text"
            value={icNumber}
            onChange={(e) => setIcNumber(formatIcNumber(e.target.value))}
            placeholder="XXXXXX-XX-XXXX"
            maxLength="14"
            style={{
              width: '100%',
              padding: '12px',
              border: errors.icNumber ? '2px solid #000' : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              backgroundColor: errors.icNumber ? '#ffe6e6' : '#fff'
            }}
          />
          {errors.icNumber && (
            <span style={{ color: '#000', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {errors.icNumber}
            </span>
          )}
        </div>

        <button type="submit" className="assessment-btn-primary" style={{
          backgroundColor: '#000',
          color: '#fff',
          border: '2px solid #000',
          padding: '12px 24px',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '16px',
          width: '100%'
        }}>
          Start Assessment
        </button>
      </form>

    </div>
  );
};

// Assessment Component (3-column layout from original)
const Assessment = ({ questions, userInfo, timeLimit, onComplete, onBackToRegistration }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const calculateScore = useCallback(() => {
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const timeSpent = (timeLimit * 60) - timeRemaining; // Time spent in seconds

    return {
      score: correctAnswers,
      totalQuestions: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
      answers,
      timeSpent: timeSpent,
      completedAt: new Date()
    };
  }, [answers, questions, timeLimit, timeRemaining]);

  const handleSubmit = useCallback(() => {
    if (!isSubmitted) {
      setIsSubmitted(true);
      const results = calculateScore();
      onComplete(results);
    }
  }, [isSubmitted, calculateScore, onComplete]);

  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isSubmitted, handleSubmit]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      }
    }, 500); // 500ms delay for better UX
  };

  // Check if all questions are answered
  const allQuestionsAnswered = questions.length > 0 && questions.every(question => answers[question.id]);

  if (questions.length === 0) {
    return (
      <div className="assessment-error">
        <h3>No Questions Available</h3>
        <p>Please contact the administrator.</p>
        <button onClick={onBackToRegistration} className="assessment-btn-secondary">
          Back to Registration
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#fff'
    }}>
      {/* Header with user info and timer */}
      <div style={{
        backgroundColor: '#f8f8f8',
        border: '1px solid #000',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#000' }}>{userInfo.fullName}</h4>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>IC: {userInfo.icNumber}</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Time Remaining</div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: timeRemaining < 300 ? '#000' : '#333',
            backgroundColor: timeRemaining < 300 ? '#ffe6e6' : 'transparent',
            padding: '4px 8px',
            borderRadius: '4px',
            border: timeRemaining < 300 ? '1px solid #000' : 'none'
          }}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Progress</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
            {currentQuestion + 1} / {questions.length}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            {Object.keys(answers).length} answered
          </div>
          <div style={{
            width: '60px',
            height: '4px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #000',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '4px'
          }}>
            <div style={{
              width: `${(Object.keys(answers).length / questions.length) * 100}%`,
              height: '100%',
              backgroundColor: allQuestionsAnswered ? '#000' : '#666',
              transition: 'all 0.3s ease'
            }}></div>
          </div>
        </div>
      </div>

      {/* Main Question Display */}
      <div style={{
        border: '2px solid #000',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '20px',
        backgroundColor: '#fff'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            Question {currentQuestion + 1} of {questions.length}
            {currentQ.section && ` • ${currentQ.section}`}
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000',
            margin: '0',
            lineHeight: '1.4'
          }}>
            {currentQ.question}
          </h3>
        </div>

        <div style={{ marginBottom: '30px' }}>
          {currentQ.options.map((option, index) => (
            <label key={index} style={{
              display: 'block',
              marginBottom: '12px',
              cursor: 'pointer'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                border: answers[currentQ.id] === option ? '2px solid #000' : '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: answers[currentQ.id] === option ? '#f0f0f0' : '#fff',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  style={{ display: 'none' }}
                />
                <div style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginRight: '16px',
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span style={{
                  color: '#000',
                  fontSize: '16px',
                  lineHeight: '1.4'
                }}>
                  {option}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation and Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            style={{
              backgroundColor: currentQuestion === 0 ? '#f0f0f0' : '#fff',
              color: currentQuestion === 0 ? '#888' : '#000',
              border: '1px solid #000',
              padding: '12px 20px',
              borderRadius: '4px',
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestion === questions.length - 1}
            style={{
              backgroundColor: currentQuestion === questions.length - 1 ? '#f0f0f0' : '#fff',
              color: currentQuestion === questions.length - 1 ? '#888' : '#000',
              border: '1px solid #000',
              padding: '12px 20px',
              borderRadius: '4px',
              cursor: currentQuestion === questions.length - 1 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Next →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {!allQuestionsAnswered && (
            <div style={{
              fontSize: '12px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              Please answer all questions to submit ({questions.length - Object.keys(answers).length} remaining)
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onBackToRegistration}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                border: '2px solid #000',
                padding: '12px 20px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Back to Registration
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered}
              style={{
                backgroundColor: allQuestionsAnswered ? '#000' : '#f0f0f0',
                color: allQuestionsAnswered ? '#fff' : '#888',
                border: allQuestionsAnswered ? '2px solid #000' : '2px solid #ccc',
                padding: '12px 24px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed'
              }}
            >
              Submit Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Results Component
const Results = ({ results, userInfo, questions, onBackToHome }) => {
  const [showReview, setShowReview] = useState(false);

  const getScoreClass = (percentage) => {
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 60) return 'score-good';
    return 'score-needs-improvement';
  };

  const getAnswerStatus = (question, userAnswer) => {
    return userAnswer === question.correctAnswer;
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: showReview ? '800px' : '500px',
      margin: '0 auto',
      backgroundColor: '#fff',
      textAlign: 'center',
      minHeight: 'auto',
      padding: '20px 0'
    }}>
      <h3 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#000',
        margin: '0 0 40px 0'
      }}>
        Assessment Complete!
      </h3>

      <div style={{
        border: '2px solid #000',
        borderRadius: '8px',
        padding: '40px',
        marginBottom: '30px',
        backgroundColor: '#fff'
      }}>
        <div style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          backgroundColor: results.percentage >= 70 ? '#000' : '#fff',
          color: results.percentage >= 70 ? '#fff' : '#000',
          border: '4px solid #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          margin: '0 auto 30px auto'
        }}>
          {results.percentage}%
        </div>

        <div style={{ textAlign: 'left', fontSize: '16px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>Name:</strong> {userInfo.fullName}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>IC Number:</strong> {userInfo.icNumber}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Score:</strong> {results.score} / {results.totalQuestions}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Percentage:</strong> {results.percentage}%
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <strong>Status:</strong>
            <span style={{
              backgroundColor: results.percentage >= 70 ? '#000' : '#fff',
              color: results.percentage >= 70 ? '#fff' : '#000',
              border: '2px solid #000',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {results.percentage >= 70 ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f8f8f8',
        border: '1px solid #000',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        fontSize: '16px',
        lineHeight: '1.5'
      }}>
        {results.percentage >= 70 ? (
          <p style={{ margin: 0, color: '#000' }}>
            <strong>Congratulations!</strong> You have successfully passed the assessment.
          </p>
        ) : (
          <p style={{ margin: 0, color: '#000' }}>
            Please review the material and try again to improve your score.
          </p>
        )}
      </div>

      {/* Review Section Toggle */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setShowReview(!showReview)}
          style={{
            backgroundColor: '#fff',
            color: '#000',
            border: '2px solid #000',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '20px'
          }}
        >
          {showReview ? 'Hide Review' : 'Review Questions & Answers'}
        </button>
      </div>

      {/* Questions Review Section */}
      {showReview && (
        <div style={{
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          backgroundColor: '#fff',
          textAlign: 'left',
          maxHeight: '70vh',
          overflow: 'auto'
        }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000',
            margin: '0 0 20px 0',
            textAlign: 'center'
          }}>
            Question Review
          </h4>

          {questions.map((question, index) => {
            const userAnswer = results.answers[question.id];
            const isCorrect = getAnswerStatus(question, userAnswer);

            return (
              <div key={question.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '16px',
                backgroundColor: isCorrect ? '#f0f8f0' : '#fff8f0',
                wordWrap: 'break-word',
                overflow: 'visible'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '4px'
                    }}>
                      Question {index + 1}
                      {question.section && ` • ${question.section}`}
                    </div>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#000',
                      margin: '0 0 12px 0',
                      lineHeight: '1.4'
                    }}>
                      {question.question}
                    </h5>
                  </div>
                  <div style={{
                    backgroundColor: isCorrect ? '#000' : '#fff',
                    color: isCorrect ? '#fff' : '#000',
                    border: '2px solid #000',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginLeft: '16px'
                  }}>
                    {isCorrect ? 'CORRECT' : 'INCORRECT'}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#000',
                    marginBottom: '8px'
                  }}>
                    Your Answer:
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: isCorrect ? '#e8f5e8' : '#ffe8e8',
                    border: `1px solid ${isCorrect ? '#4caf50' : '#f44336'}`,
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {userAnswer || 'No answer selected'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#000',
                    marginBottom: '8px'
                  }}>
                    Correct Answer:
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4caf50',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {question.correctAnswer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onBackToHome}
        style={{
          backgroundColor: '#000',
          color: '#fff',
          border: '2px solid #000',
          padding: '16px 32px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default AssessmentSystem;