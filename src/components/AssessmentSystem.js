import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import mpaLogo from '../assets/images/mpa.png';
import jsPDF from 'jspdf';

const AssessmentSystem = ({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState('registration'); // registration, assessment, results
  const [questions, setQuestions] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [timeLimit, setTimeLimit] = useState(30);
  const [results, setResults] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [savedForms, setSavedForms] = useState([]);
  const [assessmentFormData, setAssessmentFormData] = useState(null);

  // Sample questions for demo
  const sampleQuestions = [
    {
      id: 1,
      question: "What is the standard size of a pickleball court?",
      questionMalay: "Apakah saiz standard sebuah gelanggang pickleball?",
      section: "Court Specifications",
      options: [
        { text: "20' x 44'", malay: "20' x 44'" },
        { text: "20' x 40'", malay: "20' x 40'" },
        { text: "24' x 44'", malay: "24' x 44'" },
        { text: "20' x 48'", malay: "20' x 48'" }
      ],
      correctAnswer: "20' x 44'"
    },
    {
      id: 2,
      question: "What is the height of the net at the center?",
      questionMalay: "Apakah ketinggian net di bahagian tengah?",
      section: "Equipment",
      options: [
        { text: "34 inches", malay: "34 inci" },
        { text: "36 inches", malay: "36 inci" },
        { text: "32 inches", malay: "32 inci" },
        { text: "38 inches", malay: "38 inci" }
      ],
      correctAnswer: "34 inches"
    },
    {
      id: 3,
      question: "What is the non-volley zone also called?",
      questionMalay: "Apakah nama lain untuk non-volley zone?",
      section: "Rules",
      options: [
        { text: "The service area", malay: "Kawasan servis" },
        { text: "The kitchen", malay: "Dapur" },
        { text: "The baseline", malay: "Garisan asas" },
        { text: "The sideline", malay: "Garisan sisi" }
      ],
      correctAnswer: "The kitchen"
    },
    {
      id: 4,
      question: "How many points do you need to win a game?",
      questionMalay: "Berapa mata diperlukan untuk memenangi satu permainan?",
      section: "Scoring",
      options: [
        { text: "11 points with a 2-point lead", malay: "11 mata dengan pendahuluan 2 mata" },
        { text: "15 points", malay: "15 mata" },
        { text: "21 points", malay: "21 mata" },
        { text: "First to 11", malay: "Pertama sampai 11" }
      ],
      correctAnswer: "11 points with a 2-point lead"
    },
    {
      id: 5,
      question: "In doubles, who serves first at the start of the game?",
      questionMalay: "Dalam permainan beregu, siapa yang melakukan servis pertama pada permulaan permainan?",
      section: "Serving",
      options: [
        { text: "Left side player", malay: "Pemain sebelah kiri" },
        { text: "Right side player", malay: "Pemain sebelah kanan" },
        { text: "Either player", malay: "Mana-mana pemain" },
        { text: "Team captain", malay: "Kapten pasukan" }
      ],
      correctAnswer: "Right side player"
    }
  ];

  // Function to enhance questions with Malay translations
  const enhanceQuestionsWithMalay = (questions) => {
    return questions.map(question => {
      // If question already has Malay translation, keep it
      if (question.questionMalay && Array.isArray(question.options) &&
          typeof question.options[0] === 'object') {
        return question;
      }

      // Find matching sample question for translation
      const sampleMatch = sampleQuestions.find(sample =>
        sample.question === question.question ||
        sample.id === question.id
      );

      if (sampleMatch) {
        return {
          ...question,
          questionMalay: sampleMatch.questionMalay,
          options: question.options.map((option, index) => {
            if (typeof option === 'string') {
              const sampleOption = sampleMatch.options[index];
              return sampleOption && typeof sampleOption === 'object' ?
                { text: sampleOption.text, malay: sampleOption.malay || '' } : { text: option, malay: option };
            }
            return typeof option === 'object' ? { text: option.text, malay: option.malay || '' } : option;
          })
        };
      }

      // If no match found, convert string options to object format without Malay
      return {
        ...question,
        options: question.options.map(option =>
          typeof option === 'string' ? { text: option, malay: option } : { text: option.text, malay: option.malay || '' }
        )
      };
    });
  };

  useEffect(() => {
    if (questions.length === 0) {
      setQuestions(sampleQuestions);
    }
  }, []);

  // Helper function to compare answers (moved to parent scope)
  const getAnswerStatus = (question, userAnswer) => {
    if (!userAnswer || !question.correctAnswer) return false;
    // Normalize strings by trimming whitespace and comparing case-insensitively
    const normalizedUserAnswer = userAnswer.toString().trim().toLowerCase();
    const normalizedCorrectAnswer = question.correctAnswer.toString().trim().toLowerCase();
    return normalizedUserAnswer === normalizedCorrectAnswer;
  };

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
        const enhancedQuestions = enhanceQuestionsWithMalay(localForm.questions);
        setQuestions(enhancedQuestions);
        setTimeLimit(localForm.timeLimit);
        return true;
      }

      // If not found locally, check the database via API
      const form = await apiService.getAssessmentFormByCode(code.toUpperCase());
      if (form) {
        console.log('Loaded form from API:', form);
        console.log('Form includeAnswers value:', form.includeAnswers);

        // Check if it's a temporary form and show expiry information
        if (form.isTemporary && form.expiresAt) {
          const expiryDate = new Date(form.expiresAt);
          const timeRemaining = expiryDate.getTime() - Date.now();

          if (timeRemaining > 0) {
            const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

            console.log(`⏰ Temporary Assessment Code - Expires in ${hoursRemaining}h ${minutesRemaining}m`);

            // Show warning if less than 2 hours remaining
            if (timeRemaining < 2 * 60 * 60 * 1000) {
              alert(`⚠️ Warning: This temporary assessment code will expire in ${hoursRemaining}h ${minutesRemaining}m!\n\nPlease complete your assessment soon.`);
            }
          }
        }

        const enhancedQuestions = enhanceQuestionsWithMalay(form.questions);
        setQuestions(enhancedQuestions);
        setTimeLimit(form.timeLimit);
        setAssessmentFormData(form);
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
        participantIcNumber: userInfo.icNumber,
        participantEmail: null,
        answers: assessmentResults.answers ? Object.entries(assessmentResults.answers).map(([questionId, selectedAnswer]) => ({
          questionId: parseInt(questionId),
          selectedAnswer: selectedAnswer,
          isCorrect: getAnswerStatus(questions.find(q => q.id == questionId), selectedAnswer)
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
  };

  if (!isOpen) return null;

  return (
    <div className="assessment-system-modal" style={{
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

      <div className="assessment-system-content" style={{
        flex: 1,
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        overflow: 'auto',
        minHeight: '100vh'
      }}>
        {currentView === 'registration' && (
          <UserRegistration
            onRegister={(info) => {
              setUserInfo(info);
              setCurrentView('assessment');
            }}
            loadForm={loadForm}
            savedForms={savedForms}
            onClose={onClose}
          />
        )}

        {currentView === 'assessment' && (
          <Assessment
            questions={questions}
            userInfo={userInfo}
            timeLimit={timeLimit}
            assessmentFormData={assessmentFormData}
            onComplete={handleAssessmentComplete}
            getAnswerStatus={getAnswerStatus}
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
            assessmentFormData={assessmentFormData}
            getAnswerStatus={getAnswerStatus}
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
const UserRegistration = ({ onRegister, loadForm, savedForms = [], onClose }) => {
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
        newErrors.formCode = 'Invalid or expired assessment code. Please check the code or request a new one.';
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
    <div className="assessment-registration-container" style={{
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
          <label htmlFor="assessment-code" style={{
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
            id="assessment-code"
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
          <label htmlFor="assessment-fullname" style={{
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
            id="assessment-fullname"
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
          <label htmlFor="assessment-icnumber" style={{
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
            id="assessment-icnumber"
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

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ccc',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✕ Close
        </button>
      </div>

    </div>
  );
};

// Assessment Component (3-column layout from original)
const Assessment = ({ questions, userInfo, timeLimit, onComplete, getAnswerStatus, onBackToRegistration, assessmentFormData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const calculateScore = useCallback(() => {
    let correctAnswers = 0;
    questions.forEach(question => {
      if (getAnswerStatus(question, answers[question.id])) {
        correctAnswers++;
      }
    });

    const timeSpent = (timeLimit * 60) - timeRemaining; // Time spent in seconds

    const scoreData = {
      score: correctAnswers,
      totalQuestions: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
      answers,
      timeSpent: timeSpent,
      completedAt: new Date()
    };

    // Store assessment data locally as backup
    try {
      const backupData = {
        userInfo: {
          name: userInfo?.name || 'Unknown',
          email: userInfo?.email || 'Unknown',
          icNumber: userInfo?.icNumber || 'Unknown'
        },
        questions,
        scoreData,
        assessmentFormData: {
          code: assessmentFormData?.code || 'Unknown',
          title: assessmentFormData?.title || 'Unknown'
        },
        submissionTime: new Date().toISOString(),
        backupVersion: '1.0'
      };

      const backupKey = `assessment_backup_${userInfo?.name || 'unknown'}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.log('Assessment data backed up to localStorage with key:', backupKey);
    } catch (error) {
      console.warn('Failed to backup assessment data:', error);
    }

    return scoreData;
  }, [answers, questions, timeLimit, timeRemaining, userInfo, assessmentFormData]);

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
      backgroundColor: '#fff',
      paddingTop: '20px'
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
        backgroundColor: '#fff',
        maxHeight: '70vh',
        overflow: 'auto'
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
            {currentQ.questionMalay && (
              <div style={{
                fontStyle: 'italic',
                fontWeight: 'normal',
                fontSize: '16px',
                color: '#666',
                marginTop: '8px'
              }}>
                {currentQ.questionMalay}
              </div>
            )}
          </h3>
        </div>

        <div style={{ marginBottom: '30px' }}>
          {currentQ.options.map((option, index) => {
            const optionText = typeof option === 'string' ? option : option.text;
            const optionMalay = typeof option === 'object' ? option.malay : null;
            const radioId = `question-${currentQ.id}-option-${index}`;

            return (
              <label key={index} htmlFor={radioId} style={{
                display: 'block',
                marginBottom: '12px',
                cursor: 'pointer'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  border: answers[currentQ.id] === optionText ? '2px solid #000' : '1px solid #ccc',
                  borderRadius: '8px',
                  backgroundColor: answers[currentQ.id] === optionText ? '#f0f0f0' : '#fff',
                  transition: 'all 0.2s ease',
                  minHeight: '60px',
                  boxSizing: 'border-box'
                }}>
                  <input
                    type="radio"
                    id={radioId}
                    name={`question-${currentQ.id}`}
                    value={optionText}
                    checked={answers[currentQ.id] === optionText}
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
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div style={{
                    color: '#000',
                    fontSize: '16px',
                    lineHeight: '1.4',
                    flex: 1,
                    wordWrap: 'break-word',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {optionText}
                    </div>
                    {optionMalay && (
                      <div style={{
                        fontStyle: 'italic',
                        fontSize: '14px',
                        color: '#666',
                        marginTop: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {optionMalay}
                      </div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
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
const Results = ({ results, userInfo, questions, assessmentFormData, getAnswerStatus, onBackToHome }) => {
  const [showReview, setShowReview] = useState(false);

  const downloadResultPDF = () => {
    try {
      const doc = new jsPDF();

      // Add logo to PDF
      const addLogoToPDF = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
          canvas.width = this.width;
          canvas.height = this.height;
          ctx.drawImage(this, 0, 0);
          const dataURL = canvas.toDataURL('image/png');

          // Add logo to PDF (top right corner)
          const imgWidth = 25;
          const imgHeight = (this.height / this.width) * imgWidth;
          doc.addImage(dataURL, 'PNG', 170, 10, imgWidth, imgHeight);

          generatePDFContent();
        };

        img.onerror = function() {
          generatePDFContent();
        };

        img.src = mpaLogo;
      };

      const generatePDFContent = () => {
        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessment Result Report', 20, 25);

        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Malaysia Pickleball Association', 20, 35);

        let yPosition = 60;

        // Participant Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Participant Information:', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Full Name: ${userInfo.fullName}`, 25, yPosition);
        yPosition += 10;
        doc.text(`Identity Card Number: ${userInfo.icNumber}`, 25, yPosition);
        yPosition += 10;
        doc.text(`Assessment Code: ${userInfo.formCode}`, 25, yPosition);
        yPosition += 20;

        // Assessment Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessment Information:', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Title: ${assessmentFormData?.title || 'Assessment'}`, 25, yPosition);
        yPosition += 10;
        if (assessmentFormData?.subtitle) {
          doc.text(`Sub-title: ${assessmentFormData.subtitle}`, 25, yPosition);
          yPosition += 10;
        }
        yPosition += 10;

        // Results Summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Results Summary:', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Questions: ${results.totalQuestions}`, 25, yPosition);
        yPosition += 10;
        doc.text(`Correct Answers: ${results.score}`, 25, yPosition);
        yPosition += 10;
        doc.text(`Wrong Answers: ${results.totalQuestions - results.score}`, 25, yPosition);
        yPosition += 10;
        doc.text(`Percentage Score: ${results.percentage}%`, 25, yPosition);
        yPosition += 20;

        // Date and time
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);

        // Save the PDF
        doc.save(`Assessment_Result_${userInfo.fullName.replace(/\s+/g, '_')}_${userInfo.formCode}.pdf`);
      };

      addLogoToPDF();

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const getScoreClass = (percentage) => {
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 60) return 'score-good';
    return 'score-needs-improvement';
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
              backgroundColor: '#000',
              color: '#fff',
              border: '2px solid #000',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              COMPLETED
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
        <p style={{ margin: 0, color: '#000' }}>
          <strong>Assessment completed successfully.</strong> Thank you for your participation.
        </p>
      </div>

      {/* Review Section Toggle */}
      <div style={{ marginBottom: '15px' }}>
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
            fontSize: '16px'
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

            // Helper function to get Malay translation for an answer
            const getMalayTranslation = (answerText) => {
              if (!answerText) return null;
              const option = question.options.find(opt =>
                (typeof opt === 'string' ? opt : opt.text) === answerText
              );
              return option && typeof option === 'object' ? option.malay : null;
            };

            const userAnswerMalay = getMalayTranslation(userAnswer);
            const correctAnswerMalay = getMalayTranslation(question.correctAnswer);

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
                      {question.questionMalay && (
                        <div style={{
                          fontStyle: 'italic',
                          fontWeight: 'normal',
                          fontSize: '13px',
                          color: '#666',
                          marginTop: '6px'
                        }}>
                          {question.questionMalay}
                        </div>
                      )}
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
                    <div>{userAnswer || 'No answer selected'}</div>
                    {userAnswerMalay && (
                      <div style={{
                        fontStyle: 'italic',
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px'
                      }}>
                        {userAnswerMalay}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
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
                    <div>{question.correctAnswer}</div>
                    {correctAnswerMalay && (
                      <div style={{
                        fontStyle: 'italic',
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px'
                      }}>
                        {correctAnswerMalay}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        fontSize: '14px',
        color: '#d32f2f',
        fontStyle: 'italic'
      }}>
        Please download the PDF report for reference.
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button
          onClick={downloadResultPDF}
          style={{
            backgroundColor: '#fff',
            color: '#000',
            border: '2px solid #000',
            padding: '16px 32px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Download PDF
        </button>
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
    </div>
  );
};

export default AssessmentSystem;