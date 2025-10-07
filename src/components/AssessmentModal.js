import React, { useState, useEffect } from 'react';

const AssessmentModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState('registration'); // registration, assessment, results
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    icNumber: ''
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);

  // Sample assessment questions
  const questions = [
    {
      id: 1,
      question: "What is the standard court size for pickleball?",
      options: [
        "20' x 44'",
        "20' x 40'",
        "24' x 44'",
        "20' x 48'"
      ],
      correct: 0
    },
    {
      id: 2,
      question: "What is the height of the net at the center?",
      options: [
        "34 inches",
        "36 inches",
        "32 inches",
        "38 inches"
      ],
      correct: 0
    },
    {
      id: 3,
      question: "What is the non-volley zone also called?",
      options: [
        "The service area",
        "The kitchen",
        "The baseline",
        "The sideline"
      ],
      correct: 1
    },
    {
      id: 4,
      question: "In doubles play, which player serves first?",
      options: [
        "The player on the left",
        "The player on the right",
        "Either player can serve",
        "The team captain decides"
      ],
      correct: 1
    },
    {
      id: 5,
      question: "What happens when the ball hits the net and goes over during a serve?",
      options: [
        "It's a fault",
        "It's a let, replay the serve",
        "It's a valid serve",
        "The receiving team gets a point"
      ],
      correct: 0
    }
  ];

  // Timer effect
  useEffect(() => {
    let timer;
    if (isAssessmentActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAssessmentActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRegistration = (e) => {
    e.preventDefault();
    if (userInfo.fullName && userInfo.icNumber) {
      setCurrentStep('assessment');
      setIsAssessmentActive(true);
    }
  };

  const handleAnswer = (answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishAssessment();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const finishAssessment = async () => {
    setIsAssessmentActive(false);
    const results = calculateResults();
    setCurrentStep('results');

    // Save to database
    await saveAssessmentToDatabase(results);
  };

  const handleTimeUp = async () => {
    setIsAssessmentActive(false);
    const results = calculateResults();
    setCurrentStep('results');

    // Save to database
    await saveAssessmentToDatabase(results);
  };

  const calculateResults = () => {
    const score = questions.reduce((total, question, index) => {
      return total + (answers[index] === question.correct ? 1 : 0);
    }, 0);

    const results = {
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100)
    };

    setUserInfo(prev => ({
      ...prev,
      ...results
    }));

    return results;
  };

  const saveAssessmentToDatabase = async (results) => {
    try {
      const response = await fetch('/api/assessment/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formCode: 'GNRAL',
          participantName: userInfo.fullName,
          participantIcNumber: userInfo.icNumber,
          answers: answers,
          score: results.score,
          correctAnswers: results.score,
          totalQuestions: results.totalQuestions,
          timeSpent: 1800 - timeLeft,
          batchId: `GNRAL-${new Date().toISOString().split('T')[0]}`,
          batchDate: new Date().toISOString().split('T')[0]
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Assessment saved successfully:', data.data.submissionId);
      } else {
        console.error('Failed to save assessment:', data.message);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  const resetAssessment = () => {
    setCurrentStep('registration');
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(1800);
    setIsAssessmentActive(false);
    setUserInfo({
      fullName: '',
      icNumber: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="assessment-modal-overlay">
      <div className="assessment-modal">
        <div className="assessment-header">
          <h2>Tournament Readiness Assessment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="assessment-content">
          {currentStep === 'registration' && (
            <div className="registration-step">
              <h3>Registration</h3>
              <p>Please provide your details to begin the assessment</p>
              <form onSubmit={handleRegistration}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={userInfo.fullName}
                    onChange={(e) => setUserInfo(prev => ({...prev, fullName: e.target.value}))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>IC Number *</label>
                  <input
                    type="text"
                    value={userInfo.icNumber}
                    onChange={(e) => setUserInfo(prev => ({...prev, icNumber: e.target.value}))}
                    required
                  />
                </div>
                <button type="submit" className="assessment-btn-primary">
                  Start Assessment
                </button>
              </form>
            </div>
          )}

          {currentStep === 'assessment' && (
            <div className="assessment-step">
              <div className="assessment-progress">
                <div className="timer">Time Left: {formatTime(timeLeft)}</div>
                <div className="progress">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
              </div>

              <div className="question-container">
                <h3>
                  {questions[currentQuestion].question}
                  {questions[currentQuestion].questionMalay && (
                    <div style={{
                      fontStyle: 'italic',
                      fontSize: '16px',
                      fontWeight: 'normal',
                      color: '#666',
                      marginTop: '8px'
                    }}>
                      {questions[currentQuestion].questionMalay}
                    </div>
                  )}
                </h3>
                <div className="options">
                  {questions[currentQuestion].options.map((option, index) => {
                    const optionText = typeof option === 'string' ? option : option.text;
                    const optionMalay = typeof option === 'object' ? option.malay : null;

                    return (
                      <label key={index} className="option">
                        <input
                          type="radio"
                          name={`question-${currentQuestion}`}
                          checked={answers[currentQuestion] === index}
                          onChange={() => handleAnswer(index)}
                        />
                        <span>
                          {optionText}
                          {optionMalay && (
                            <div style={{
                              fontStyle: 'italic',
                              fontSize: '14px',
                              color: '#666',
                              marginTop: '4px'
                            }}>
                              {optionMalay}
                            </div>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="assessment-navigation">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                  className="assessment-btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={answers[currentQuestion] === undefined}
                  className="assessment-btn-primary"
                >
                  {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'results' && (
            <div className="results-step">
              <h3>Assessment Complete!</h3>
              <div className="results-summary">
                <div className="score-display">
                  <div className="score-circle">
                    <span className="percentage">{userInfo.percentage}%</span>
                  </div>
                  <p>{userInfo.score} out of {userInfo.totalQuestions} correct</p>
                </div>

                <div className="results-details">
                  <h4>Assessment Summary</h4>
                  <p><strong>Name:</strong> {userInfo.fullName}</p>
                  <p><strong>IC Number:</strong> {userInfo.icNumber}</p>
                  <p><strong>Score:</strong> {userInfo.score}/{userInfo.totalQuestions} ({userInfo.percentage}%)</p>
                  <p><strong>Status:</strong> COMPLETED</p>
                </div>

                <div className="recommendations">
                  {userInfo.percentage >= 70 ? (
                    <div className="success-message">
                      <p>Congratulations! You have demonstrated good knowledge of tournament regulations.</p>
                    </div>
                  ) : (
                    <div className="improvement-message">
                      <p>Please review the tournament guidelines and regulations before organizing your tournament.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="results-actions">
                <button onClick={resetAssessment} className="assessment-btn-secondary">
                  Take Again
                </button>
                <button onClick={onClose} className="assessment-btn-primary">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;