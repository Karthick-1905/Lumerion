import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
	useModuleQuizzes,
	useSubmitQuiz,
} from '../../hooks/useLearningPath';
import type {
	ModuleQuiz,
	ModuleQuizQuestion,
	QuizSubmissionPayload,
	QuizSubmissionResponse,
	ApiError,
} from '../../api/types';

type QuizModalProps = {
	open: boolean;
	pathId: number;
	moduleId: number;
	moduleTitle?: string;
	onClose: () => void;
	onCompleted?: (result: QuizSubmissionResponse) => void;
};

const QuizModal = ({
	open,
	pathId,
	moduleId,
	moduleTitle,
	onClose,
	onCompleted,
}: QuizModalProps) => {
	const {
		data,
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
	} = useModuleQuizzes(open ? pathId : undefined, open ? moduleId : undefined);
	const submitQuiz = useSubmitQuiz(pathId);
	const quizzes = data?.quizzes ?? [];

	const [activeQuizIndex, setActiveQuizIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResponse | null>(null);

	const activeQuiz: ModuleQuiz | null = quizzes[activeQuizIndex] ?? null;

	useEffect(() => {
		if (!open) {
			setActiveQuizIndex(0);
			setAnswers({});
			setSubmissionResult(null);
		}
	}, [open]);

	useEffect(() => {
		if (!activeQuiz) {
			setAnswers({});
			setSubmissionResult(null);
			return;
		}

		const initialAnswers: Record<number, string> = {};
		activeQuiz.questions.forEach((question) => {
			initialAnswers[question.questionId] = '';
		});
		setAnswers(initialAnswers);
		setSubmissionResult(null);
	}, [activeQuiz?.quizId]);

	const resultLookup = useMemo(() => {
		if (!submissionResult) return null;
		return new Map(
			submissionResult.results.map((result) => [result.questionId, result])
		);
	}, [submissionResult]);

	if (!open) {
		return null;
	}

	const handleClose = () => {
		if (submitQuiz.isPending) {
			toast.info('Please wait for the submission to finish.');
			return;
		}

		setAnswers({});
		setSubmissionResult(null);
		setActiveQuizIndex(0);
		onClose();
	};

	const handleAnswerChange = (questionId: number, value: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: value,
		}));
	};

	const handleSubmit = async () => {
		if (!activeQuiz) {
			toast.error('No quiz available.');
			return;
		}

		const unanswered = activeQuiz.questions.filter((question) => {
			const provided = answers[question.questionId];
			return !provided || provided.trim().length === 0;
		});

		if (unanswered.length > 0) {
			toast.warn('Please answer every question before submitting.');
			return;
		}

		const payload: QuizSubmissionPayload = {
			answers: activeQuiz.questions.map((question) => ({
				questionId: question.questionId,
				answer: answers[question.questionId] ?? '',
			})),
		};

		try {
			const response = await submitQuiz.mutateAsync({
				moduleId: activeQuiz.moduleId,
				quizId: activeQuiz.quizId,
				payload,
			});

			setSubmissionResult(response);
			toast.success(
				response.passed
					? 'Great job! You passed this quiz.'
					: 'Quiz submitted. Review the feedback to improve.'
			);
			onCompleted?.(response);
		} catch (err) {
			const apiError = err as ApiError;
			const message = apiError?.response?.message || apiError?.message || 'Failed to submit quiz.';
			toast.error(message);
		}
	};

	const handleRetry = () => {
		if (!activeQuiz) return;
		const resetAnswers: Record<number, string> = {};
		activeQuiz.questions.forEach((question) => {
			resetAnswers[question.questionId] = '';
		});
		setAnswers(resetAnswers);
		setSubmissionResult(null);
	};

	const renderQuestion = (question: ModuleQuizQuestion, index: number) => {
		const value = answers[question.questionId] ?? '';
		const result = resultLookup?.get(question.questionId) ?? null;
		const hasChoices = Array.isArray(question.choices) && question.choices.length > 0;
		const isCorrect = result?.isCorrect;

		return (
			<div
				key={question.questionId}
				className="rounded-2xl border border-gray-800/80 p-5 shadow-lg shadow-black/10 transition-all duration-200 hover:border-[#7FDBCA]/40"
			>
				<div className="flex items-start justify-between gap-4 mb-3">
					<div>
						<span className="text-xs uppercase tracking-[0.2em] text-[#7FDBCA]/70">Question {index + 1}</span>
						<h3 className="mt-2 text-lg font-semibold text-white leading-relaxed">{question.prompt}</h3>
					</div>
					{submissionResult && (
						<span
							className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
								isCorrect
									? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
									: 'bg-rose-500/10 text-rose-300 border border-rose-400/30'
							}`}
						>
							{isCorrect ? 'Correct' : 'Review'}
						</span>
					)}
				</div>

				{hasChoices ? (
					<div className="space-y-2">
						{question.choices.map((choice) => (
							<label
								key={choice}
								className={`flex items-center gap-3 rounded-xl border border-gray-800/70 bg-[#0f1814] px-4 py-3 text-sm text-gray-200 transition-all duration-200 hover:border-[#7FDBCA]/30 hover:bg-[#13231d] ${
									value === choice ? 'border-[#7FDBCA]/50 bg-[#13231d]' : ''
								}`}
							>
								<input
									type="radio"
									name={`question-${question.questionId}`}
									value={choice}
									checked={value === choice}
									onChange={() => handleAnswerChange(question.questionId, choice)}
									disabled={!!submissionResult}
									className="h-4 w-4 accent-[#7FDBCA]"
								/>
								<span className="flex-1">{choice}</span>
							</label>
						))}
					</div>
				) : (
					<textarea
						value={value}
						onChange={(event) => handleAnswerChange(question.questionId, event.target.value)}
						disabled={!!submissionResult}
						rows={3}
						placeholder="Type your answer here..."
						className="w-full rounded-xl border border-gray-800/70 bg-[#0f1814] px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-[#7FDBCA]/50 focus:outline-none focus:ring-2 focus:ring-[#7FDBCA]/20"
					/>
				)}

				{submissionResult && result && (
					<div className="mt-3 rounded-xl border border-gray-800/70 bg-[#111b16] p-3 text-sm text-gray-300">
						<p>
							<span className="font-semibold text-gray-200">Your answer:</span>{' '}
							{result.answerGiven ?? '—'}
						</p>
						{!isCorrect && (
							<p className="mt-1 text-gray-400">
								<span className="font-semibold text-gray-200">Correct answer:</span>{' '}
								{result.correctAnswer ?? 'Not provided'}
							</p>
						)}
						{question.explanation && (
							<p className="mt-2 text-gray-400">
								<span className="font-semibold text-gray-200">Explanation:</span>{' '}
								{question.explanation}
							</p>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
			<div
				className="absolute inset-0 bg-black/70 backdrop-blur-sm"
				onClick={handleClose}
			/>

			<div className="relative z-10 bg-[#10141a] p-3 flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-800 shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-gray-800/60 px-6 py-5">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-[#7FDBCA]/70">Module Assessment</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">
							{moduleTitle ?? 'Module Quiz'}
						</h2>
						{activeQuiz && (
							<p className="mt-1 text-sm text-gray-400">
								Passing score: {Math.round(activeQuiz.passingPercentage)}%
							</p>
						)}
					</div>

					<button
						type="button"
						onClick={handleClose}
						className="rounded-full border border-gray-700/70 p-2 text-gray-400 transition-colors hover:border-[#7FDBCA]/40 hover:text-[#7FDBCA]"
						aria-label="Close quiz modal"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							className="h-5 w-5"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</header>

				<div className="flex flex-col gap-5 overflow-y-auto px-6 py-5 sm:max-h-[70vh]">
					{isLoading || isRefetching ? (
						<div className="flex flex-col items-center justify-center py-16 text-secondary">
							<div className="h-12 w-12 animate-spin rounded-full border-4 border-[#7FDBCA] border-t-transparent" />
							<p className="mt-4 text-sm">Loading quiz questions...</p>
						</div>
					) : isError ? (
						<div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-200">
							<p className="text-sm font-semibold">
								{error?.response?.message || error?.message || 'Failed to load quizzes for this module.'}
							</p>
							<button
								type="button"
								onClick={() => refetch()}
								className="mt-4 rounded-xl bg-[#7FDBCA] px-4 py-2 text-sm font-semibold text-[#0b1f1a] shadow hover:bg-[#6ecab8]"
							>
								Try again
							</button>
						</div>
					) : quizzes.length === 0 ? (
						<div className="rounded-2xl border border-gray-800/70 bg-[#111b16] p-8 text-center text-gray-400">
							<p className="text-sm">No quizzes are available for this module yet.</p>
						</div>
					) : (
						<>
							{quizzes.length > 1 && (
								<div className="flex flex-wrap gap-2">
									{quizzes.map((quiz, index) => (
										<button
											key={quiz.quizId}
											type="button"
											onClick={() => setActiveQuizIndex(index)}
											className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
												index === activeQuizIndex
													? 'border-[#7FDBCA]/60 bg-[#13231d] text-[#7FDBCA] shadow-inner shadow-[#7FDBCA]/20'
													: 'border-gray-800 bg-[#0f1814] text-gray-400 hover:border-[#7FDBCA]/30 hover:text-[#7FDBCA]'
											}`}
										>
											Quiz {index + 1}
										</button>
									))}
								</div>
							)}

							{submissionResult && (
								<div className="rounded-2xl border border-gray-800/70 bg-[#111b16] p-5 text-gray-200">
									<div className="flex flex-wrap items-center justify-between gap-4">
										<div>
											<p className="text-xs uppercase tracking-[0.3em] text-[#7FDBCA]/70">Assessment Summary</p>
											<h3 className="mt-1 text-lg font-semibold">
												Score: {submissionResult.score}% ({submissionResult.correctCount}/{submissionResult.totalQuestions} correct)
											</h3>
										</div>
										<span
											className={`rounded-full px-4 py-1 text-sm font-semibold ${
												submissionResult.passed
													? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
													: 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
											}`}
										>
											{submissionResult.passed ? 'Passed' : 'Keep practicing'}
										</span>
									</div>
									<p className="mt-2 text-sm text-gray-400">
										Passing score: {Math.round(submissionResult.passingPercentage)}%
									</p>
								</div>
							)}

							{activeQuiz?.questions.map((question, index) => renderQuestion(question, index))}
						</>
					)}
				</div>

				<footer className="mt-auto flex flex-col gap-3 border-t border-gray-800/60 bg-[#10141a] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
					<button
						type="button"
						onClick={handleClose}
						className="inline-flex items-center justify-center rounded-xl border border-gray-700/70 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-[#7FDBCA]/40 hover:text-[#7FDBCA]"
					>
						Close
					</button>

					{quizzes.length > 0 && (
						<div className="flex flex-wrap items-center justify-end gap-2">
							{submissionResult ? (
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="inline-flex items-center justify-center rounded-xl border border-gray-600/80 bg-transparent px-4 py-2 text-sm font-semibold text-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-900/70 hover:text-white"
                                >
                                    Try again
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitQuiz.isPending}
                                    className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                                        submitQuiz.isPending
                                            ? 'cursor-wait border border-gray-700 bg-gray-800 text-gray-500'
                                            : 'border border-gray-300 bg-gray-50 text-gray-900 shadow-sm shadow-black/15 hover:-translate-y-0.5 hover:border-gray-100 hover:bg-white hover:shadow-lg'
                                    }`}
                                >
                                    {submitQuiz.isPending ? 'Submitting...' : 'Submit answers'}
                                </button>
                            )}
						</div>
					)}
				</footer>
			</div>
		</div>
	);
};

export default QuizModal;
