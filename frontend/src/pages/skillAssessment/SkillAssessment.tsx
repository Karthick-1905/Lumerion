import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import { userApi } from '../../api/user';

const SkillAssessment = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['skillAssessment', assessmentId],
    queryFn: () => userApi.getSkillAssessment(Number(assessmentId)),
    enabled: !!assessmentId,
  });

  const submitMutation = useMutation({
    mutationFn: (answers: { questionId: number; answer: string }[]) =>
      userApi.submitSkillAssessment(Number(assessmentId), answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillAssessments'] });
      queryClient.invalidateQueries({ queryKey: ['skillAssessment', assessmentId] });
      navigate('/skill-assessments');
    },
  });

  const assessment = data?.assessment;
  const questions = assessment?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId: Number(questionId),
      answer,
    }));
    submitMutation.mutate(answersArray);
  };

  const isAnswered = (questionId: number) => !!answers[questionId];
  const allAnswered = questions.length > 0 && questions.every(q => isAnswered(q.questionId));

  if (assessment?.isCompleted) {
    return (
      <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#242424] border border-gray-800 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white/80">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Assessment Completed</h2>
                <p className="text-gray-400 mb-6">You have already completed this skill assessment.</p>
                <div className="bg-[#1E1E1E] border border-gray-700 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Score</p>
                      <p className="text-2xl font-bold text-white">{assessment.result?.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Skill Level</p>
                      <p className="text-xl font-semibold text-white/80">{assessment.result?.skillLevel}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/skill-assessments')}
                  className="bg-linear-to-r from-[#7FDBCA] to-[#4CB0A3] text-white font-semibold py-3 px-6 rounded-xl hover:from-[#6BC9B8] hover:to-[#459D93] transition-all duration-200"
                >
                  Back to Assessments
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400">Loading assessment...</p>
                </div>
              </div>
            )}

            {isError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-500/20 border border-red-400/30 rounded-full flex items-center justify-center text-red-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Unable to load assessment</p>
                    <p className="text-gray-400 text-sm">{error?.message || 'Please try again later.'}</p>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !isError && assessment && (
              <>
                {/* Header */}
                <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-2">{assessment.title}</h1>
                      <p className="text-gray-400">{assessment.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Question</div>
                      <div className="text-2xl font-bold text-white/80">
                        {currentQuestionIndex + 1} / {questions.length}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                    <div
                      className="bg-linear-to-r from-[#7FDBCA] to-[#4CB0A3] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Topic: {assessment.topic}</span>
                    <span>Difficulty: {assessment.difficultyLevel}</span>
                  </div>
                </div>

                {/* Question */}
                {currentQuestion && (
                  <div className="bg-[#242424] border border-gray-800 rounded-2xl p-8 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-6">{currentQuestion.prompt}</h2>

                    {currentQuestion.type === 'multiple_choice' && currentQuestion.choices && (
                      <div className="space-y-3">
                        {Array.isArray(currentQuestion.choices) && currentQuestion.choices.map((choice: string, index: number) => (
                          <label
                            key={index}
                            className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                              answers[currentQuestion.questionId] === choice
                                ? 'border-white/50 bg-white/10'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.questionId}`}
                              value={choice}
                              checked={answers[currentQuestion.questionId] === choice}
                              onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                              className="mr-3 text-white/80 focus:ring-white/30"
                            />
                            <span className="text-white">{choice}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {(!currentQuestion.type || currentQuestion.type === 'text') && (
                      <textarea
                        value={answers[currentQuestion.questionId] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.questionId, e.target.value)}
                        placeholder="Enter your answer..."
                        className="w-full p-4 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-white/30 focus:ring-1 focus:ring-white/20 resize-none"
                        rows={4}
                      />
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-all duration-200"
                  >
                    Previous
                  </button>

                  <div className="flex gap-2">
                    {questions.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                          index === currentQuestionIndex
                            ? 'bg-white'
                            : isAnswered(questions[index].questionId)
                            ? 'bg-white/50'
                            : 'bg-white/15'
                        }`}
                      />
                    ))}
                  </div>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={!allAnswered || submitMutation.isPending}
                      className="px-6 py-3 bg-linear-to-r from-[#7FDBCA] to-[#4CB0A3] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#6BC9B8] hover:to-[#459D93] transition-all duration-200"
                    >
                      {submitMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!isAnswered(currentQuestion?.questionId)}
                      className="px-6 py-3 bg-linear-to-r from-[#7FDBCA] to-[#4CB0A3] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#6BC9B8] hover:to-[#459D93] transition-all duration-200"
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SkillAssessment;