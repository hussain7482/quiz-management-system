'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchQuizzes, createQuiz, createQuestion, type Quiz, type Question } from '@/lib/api';

export default function AdminPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz creation state
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  
  // Question creation state
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionContext, setQuestionContext] = useState('');
  const [questionType, setQuestionType] = useState<'true_false' | 'mcq' | 'text'>('mcq');
  const [options, setOptions] = useState<{ content: string; correct: boolean }[]>([]);
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await fetchQuizzes();
      setQuizzes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      setError('Quiz title is required');
      return;
    }

    try {
      setCreatingQuiz(true);
      setError(null);
      // For demo purposes, using default admin user ID and role
      await createQuiz(quizTitle.trim(), '1', 'admin');
      setQuizTitle('');
      setShowQuizForm(false);
      await loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, { content: '', correct: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: 'content' | 'correct', value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) {
      setError('Please select a quiz');
      return;
    }
    if (!questionContext.trim()) {
      setError('Question text is required');
      return;
    }

    // Filter out empty options first
    const optionsWithContent = options.filter((opt) => opt.content.trim());
    
    // Validate options based on question type (using filtered options)
    if (questionType === 'true_false' && optionsWithContent.length !== 2) {
      setError('True/False questions must have exactly 2 options with content');
      return;
    }
    if (questionType === 'mcq' && optionsWithContent.length < 2) {
      setError('MCQ questions must have at least 2 options with content');
      return;
    }
    if (questionType === 'mcq' && !optionsWithContent.some((opt) => opt.correct)) {
      setError('MCQ questions must have at least one correct option');
      return;
    }
    if (questionType === 'text' && optionsWithContent.length > 1) {
      setError('Text questions can have at most 1 option (the correct answer)');
      return;
    }

    try {
      setCreatingQuestion(true);
      setError(null);
      
      // For demo purposes, using default admin user ID and role
      await createQuestion(
        selectedQuiz.id,
        questionContext.trim(),
        questionType,
        optionsWithContent,
        '1',
        'admin'
      );
      
      // Reset form
      setQuestionContext('');
      setQuestionType('mcq');
      setOptions([]);
      setSelectedQuiz(null);
      await loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuestionContext('');
    setQuestionType('mcq');
    setOptions([]);
  };

  // Auto-set options for true/false
  useEffect(() => {
    if (questionType === 'true_false' && options.length !== 2) {
      setOptions([
        { content: 'True', correct: false },
        { content: 'False', correct: false },
      ]);
    } else if (questionType === 'mcq' && options.length === 0) {
      setOptions([
        { content: '', correct: false },
        { content: '', correct: false },
      ]);
    } else if (questionType === 'text') {
      setOptions([{ content: '', correct: true }]);
    }
  }, [questionType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-gray-400 hover:text-white mb-4 inline-block transition-colors"
            >
              ← Back to Quizzes
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Create and manage quizzes and questions</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Quiz Management */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Quizzes</h2>
                  <button
                    onClick={() => setShowQuizForm(!showQuizForm)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {showQuizForm ? 'Cancel' : '+ New Quiz'}
                  </button>
                </div>

                {/* Create Quiz Form */}
                {showQuizForm && (
                  <form onSubmit={handleCreateQuiz} className="mb-6">
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Quiz Title"
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 mb-3"
                    />
                    <button
                      type="submit"
                      disabled={creatingQuiz}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
                    >
                      {creatingQuiz ? 'Creating...' : 'Create Quiz'}
                    </button>
                  </form>
                )}

                {/* Quiz List */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          selectedQuiz?.id === quiz.id
                            ? 'bg-purple-600/20 border-purple-500'
                            : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => handleSelectQuiz(quiz)}
                      >
                        <h3 className="text-white font-semibold">{quiz.title}</h3>
                        <p className="text-gray-400 text-sm">
                          {quiz.questions?.length || 0} question{quiz.questions?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Question Creation */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4">Create Question</h2>

              {!selectedQuiz ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Select a quiz to add questions</p>
                </div>
              ) : (
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Selected Quiz</label>
                    <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white">
                      {selectedQuiz.title}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Question Text</label>
                    <textarea
                      value={questionContext}
                      onChange={(e) => setQuestionContext(e.target.value)}
                      placeholder="Enter your question here..."
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Question Type</label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as 'true_false' | 'mcq' | 'text')}
                      className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="mcq">Multiple Choice (MCQ)</option>
                      <option value="true_false">True/False</option>
                      <option value="text">Text Answer</option>
                    </select>
                  </div>

                  {/* Options */}
                  {questionType !== 'text' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-gray-300">Options</label>
                        {questionType === 'mcq' && (
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type={questionType === 'mcq' ? 'radio' : 'checkbox'}
                              checked={option.correct}
                              onChange={(e) =>
                                handleOptionChange(index, 'correct', e.target.checked)
                              }
                              className="w-5 h-5 text-purple-600"
                            />
                            <input
                              type="text"
                              value={option.content}
                              onChange={(e) =>
                                handleOptionChange(index, 'content', e.target.value)
                              }
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 p-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                              required
                            />
                            {questionType === 'mcq' && options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm mt-2">
                        {questionType === 'true_false'
                          ? 'Select which option is correct'
                          : 'Select the correct option(s)'}
                      </p>
                    </div>
                  )}

                  {/* Text Answer Option */}
                  {questionType === 'text' && (
                    <div>
                      <label className="block text-gray-300 mb-2">Correct Answer (Optional)</label>
                      <input
                        type="text"
                        value={options[0]?.content || ''}
                        onChange={(e) =>
                          setOptions([{ content: e.target.value, correct: true }])
                        }
                        placeholder="Enter the correct answer..."
                        className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        Leave blank if you want to manually grade text answers
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creatingQuestion}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-all shadow-lg"
                  >
                    {creatingQuestion ? 'Creating...' : 'Create Question'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

