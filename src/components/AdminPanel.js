import React, { useState } from 'react';

const AdminPanel = ({ questions, setQuestions, timeLimit, setTimeLimit, assessmentTitle, setAssessmentTitle, assessmentSubtitle, setAssessmentSubtitle, submissions = [], savedForms = [], onSaveForm }) => {
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    section: '',
    options: [],
    correctAnswer: ''
  });
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleSaveForm = async () => {
    const formCode = await onSaveForm();
    if (formCode) {
      alert(`Form saved successfully! Form Code: ${formCode}\n\nUsers can use this code to access the assessment.`);
    }
  };

  // Add option to current question
  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  // Remove option from current question
  const removeOption = (indexToRemove) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, index) => index !== indexToRemove),
      // Reset correct answer if it was the removed option
      correctAnswer: prev.correctAnswer === prev.options[indexToRemove] ? '' : prev.correctAnswer
    }));
  };

  // Update specific option
  const updateOption = (index, value) => {
    setNewQuestion(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return {
        ...prev,
        options: newOptions
      };
    });
  };

  const getScoreClass = (percentage) => {
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 60) return 'score-good';
    return 'score-needs-improvement';
  };

  const validateQuestion = () => {
    if (!newQuestion) {
      alert('Question data is missing');
      return false;
    }

    if (!newQuestion.question || typeof newQuestion.question !== 'string' || !newQuestion.question.trim()) {
      alert('Please enter a question');
      return false;
    }

    if (!newQuestion.section || typeof newQuestion.section !== 'string' || !newQuestion.section.trim()) {
      alert('Please select or enter a section');
      return false;
    }

    if (!newQuestion.options || newQuestion.options.length < 2) {
      alert('Please add at least 2 options');
      return false;
    }

    if (newQuestion.options.some(option => !option || typeof option !== 'string' || !option.trim())) {
      alert('Please fill in all options');
      return false;
    }

    // Validate correct answer is required
    if (!newQuestion.correctAnswer || typeof newQuestion.correctAnswer !== 'string' || !newQuestion.correctAnswer.trim()) {
      alert('Please select the correct answer');
      return false;
    }

    return true;
  };

  const addSection = () => {
    if (newSection.trim() && !sections.includes(newSection.trim())) {
      setSections(prev => [...prev, newSection.trim()]);
      setNewQuestion(prev => ({ ...prev, section: newSection.trim() }));
      setNewSection('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateQuestion()) return;

    const question = {
      id: editingId || Date.now(),
      question: newQuestion.question.trim(),
      section: newQuestion.section.trim(),
      options: newQuestion.options.map(opt => opt.trim()),
      correctAnswer: newQuestion.correctAnswer.trim(),
      hasCorrectAnswer: true
    };

    // Add section to sections list if it's new
    if (!sections.includes(question.section)) {
      setSections(prev => [...prev, question.section]);
    }

    if (editingId) {
      setQuestions(prev => prev.map(q => q.id === editingId ? question : q));
      setEditingId(null);
    } else {
      setQuestions(prev => [...prev, question]);
    }

    // Keep the current section for user convenience, but reset other fields
    setNewQuestion({
      question: '',
      section: newQuestion.section, // Maintain the current section
      options: [],
      correctAnswer: ''
    });
  };

  const handleEdit = (question) => {
    setNewQuestion({
      question: question.question,
      section: question.section || '',
      options: [...question.options],
      correctAnswer: question.correctAnswer
    });
    setEditingId(question.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleCancel = () => {
    setNewQuestion({
      question: '',
      section: '',
      options: [],
      correctAnswer: ''
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    handleCancel();
  };


  return (
    <div className="assessment-form-container">
      <form className="tournament-form">
        {/* Assessment Settings Section */}
        <div className="form-section" style={{
          padding: '30px',
          border: '2px solid #000',
          borderRadius: '12px',
          backgroundColor: '#fff',
          marginBottom: '25px'
        }}>
          <h3 style={{
            margin: '0 0 25px 0',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000',
            paddingBottom: '15px',
            borderBottom: '2px solid #000'
          }}>
            Assessment Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                Assessment Title *
              </label>
              <input
                type="text"
                id="assessmentTitle"
                placeholder="e.g., Basic Pickleball Rules, Tournament Organizer Certification"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                required
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                This helps identify what type of assessment participants are taking
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                Time Limit (minutes) *
              </label>
              <input
                type="number"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                min="1"
                max="180"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                required
              />
            </div>
          </div>

          {/* Sub-Title Field */}
          <div className="form-group">
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Sub-Title (Optional)
            </label>
            <input
              type="text"
              id="assessmentSubtitle"
              placeholder="e.g., Level 1 Certification, Beginner Course"
              value={assessmentSubtitle || ''}
              onChange={(e) => setAssessmentSubtitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '8px', display: 'block' }}>
              Optional subtitle to provide additional context or level information
            </small>
          </div>

        </div>

        {/* Add/Edit Question Section */}
        <div className="form-section" style={{
          padding: '30px',
          border: '2px solid #000',
          borderRadius: '12px',
          backgroundColor: '#f9f9f9',
          marginBottom: '25px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            paddingBottom: '15px',
            borderBottom: '2px solid #000'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#000'
            }}>
              {editingId ? 'Edit Question' : 'Add New Question'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>

          {/* Section */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Section *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
              <select
                id="questionSection"
                value={newQuestion.section}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, section: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Select or create section</option>
                {sections.map((section, index) => (
                  <option key={index} value={section}>{section}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  id="newSection"
                  placeholder="New section..."
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSection())}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={addSection}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Question *
            </label>
            <textarea
              id="questionText"
              placeholder="Enter your question here"
              value={newQuestion.question}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
              required
            />
          </div>

          {/* Answer Options */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>
                Answer Options *
              </label>
              <button
                type="button"
                onClick={addOption}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                + Add Option
              </button>
            </div>
            {newQuestion.options.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                border: '2px dashed #ccc',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <p>No options yet. Click "Add Option" to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {newQuestion.options.map((option, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', minWidth: '20px', fontSize: '14px' }}>
                      {String.fromCharCode(65 + index)}:
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Correct Answer */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Correct Answer *
            </label>
            <select
              id="correctAnswer"
              value={newQuestion.correctAnswer}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              required
            >
              <option value="">Select correct answer</option>
              {newQuestion.options.map((option, index) => (
                option.trim() && (
                  <option key={index} value={option}>{String.fromCharCode(65 + index)}: {option}</option>
                )
              ))}
            </select>
          </div>


          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #dee2e6'
          }}>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {editingId ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </div>

        {/* Questions List Section */}
        <div className="form-section" style={{ padding: '15px' }}>
          <h3 style={{ marginBottom: '15px' }}>Questions ({questions.length})</h3>
          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(0, 0, 0, 0.5)' }}>
              <p>No questions yet. Add your first question above.</p>
            </div>
          ) : (
            <div>
              {sections.length === 0 ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {questions.map((question, index) => (
                    <div key={question.id} style={{
                      background: 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: '#000', margin: '0 0 8px 0', fontSize: '16px' }}>Q{index + 1}: {question.question}</h4>
                          <div style={{ display: 'grid', gap: '3px' }}>
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} style={{
                                color: option === question.correctAnswer ? '#28a745' : '#000',
                                fontWeight: option === question.correctAnswer ? 'bold' : 'normal',
                                fontSize: '14px'
                              }}>
                                {option === question.correctAnswer && '✓ '}{option}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(question)}
                            className="view-btn-table"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(question.id)}
                            className="delete-btn-table"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                sections.map(section => {
                  const sectionQuestions = questions.filter(q => q.section === section);
                  if (sectionQuestions.length === 0) return null;

                  return (
                    <div key={section} style={{ marginBottom: '30px' }}>
                      <h4 style={{ color: '#007bff', marginBottom: '15px', fontSize: '18px' }}>
                        {section} ({sectionQuestions.length} questions)
                      </h4>
                      <div style={{ display: 'grid', gap: '15px' }}>
                        {sectionQuestions.map((question, index) => (
                          <div key={question.id} style={{
                            background: 'rgba(0, 0, 0, 0.02)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            padding: '20px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ color: '#000', margin: '0 0 10px 0' }}>
                                  Q{questions.indexOf(question) + 1}: {question.question}
                                </h5>
                                <div style={{ display: 'grid', gap: '5px' }}>
                                  {question.options.map((option, optIndex) => (
                                    <div key={optIndex} style={{
                                      color: option === question.correctAnswer ? '#28a745' : '#000',
                                      fontWeight: option === question.correctAnswer ? 'bold' : 'normal'
                                    }}>
                                      {option === question.correctAnswer && '✓ '}{option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(question)}
                                  className="view-btn-table"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(question.id)}
                                  className="delete-btn-table"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>


        {/* Save Form Section - Bottom of Page */}
        <div className="form-section" style={{ padding: '20px', marginTop: '20px', backgroundColor: 'rgba(0, 123, 255, 0.05)', border: '2px solid #007bff' }}>
          <div style={{ textAlign: 'center' }}>
            <button type="button" onClick={handleSaveForm} className="home-btn" style={{ fontSize: '16px', padding: '12px 24px' }}>
              Save Form & Generate Code
            </button>
            <p style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '14px', margin: '10px 0 0 0' }}>
              Generate a 5-character code for users to access this assessment
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminPanel;