import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from '../../components/ui/Sidebar';
import { useGenerateRoadmap, useSaveRoadmap } from '../../hooks/useRoadmaps';
import type { GenerateRoadmapResponse } from '../../api/types';

const difficultyOptions = [
  { label: 'Beginner Friendly', value: 'easy' },
  { label: 'Intermediate', value: 'medium' },
  { label: 'Advanced', value: 'hard' },
];

const CreateLearningPath = () => {
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generatedRoadmap, setGeneratedRoadmap] = useState<GenerateRoadmapResponse | null>(null);

  const generateRoadmap = useGenerateRoadmap();
  const saveRoadmap = useSaveRoadmap();
  const navigate = useNavigate();

  useEffect(() => {
    if (generateRoadmap.isError) {
      const message = generateRoadmap.error?.response?.message || generateRoadmap.error?.message || 'Failed to generate roadmap.';
      toast.error(message);
    }
  }, [generateRoadmap.isError, generateRoadmap.error]);

  useEffect(() => {
    if (saveRoadmap.isError) {
      const message = saveRoadmap.error?.response?.message || saveRoadmap.error?.message || 'Failed to save learning path.';
      toast.error(message);
    }
  }, [saveRoadmap.isError, saveRoadmap.error]);

  useEffect(() => {
    if (generateRoadmap.isSuccess && generateRoadmap.data) {
      setGeneratedRoadmap(generateRoadmap.data);
      toast.success('Roadmap generated successfully. Review prerequisites and modules.');
    }
  }, [generateRoadmap.isSuccess, generateRoadmap.data]);

  useEffect(() => {
    if (saveRoadmap.isSuccess && saveRoadmap.data) {
      toast.success('Learning path saved successfully!');
      const newPathId = saveRoadmap.data.pathId;
      navigate(`/learning-path/${newPathId}`);
    }
  }, [saveRoadmap.isSuccess, saveRoadmap.data, navigate]);

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.info('Enter a topic to generate a learning path.');
      return;
    }
    setGeneratedRoadmap(null);
    generateRoadmap.mutate({ topic: topic.trim() });
  };

  const handleSave = () => {
    if (!generatedRoadmap) {
      return;
    }
    if (!goal.trim()) {
      toast.info('Please provide a learning goal before saving.');
      return;
    }

    saveRoadmap.mutate({
      threadId: generatedRoadmap.threadId,
      topic: topic.trim(),
      goal: goal.trim(),
      difficulty,
    });
  };

  const isGenerating = generateRoadmap.isPending;
  const isSaving = saveRoadmap.isPending;

  const prerequisiteSteps = useMemo(() => generatedRoadmap?.prerequisitePlan?.steps ?? [], [generatedRoadmap]);
  const modules = useMemo(() => generatedRoadmap?.modules ?? [], [generatedRoadmap]);
  const missingFoundations = useMemo(
    () => generatedRoadmap?.prerequisitePlan?.missingFoundations ?? [],
    [generatedRoadmap]
  );
  const integrationGuidance = useMemo(
    () => generatedRoadmap?.prerequisitePlan?.integrationGuidance ?? [],
    [generatedRoadmap]
  );

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 pt-6 pb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-1">Create a Learning Path</h1>
              <p className="text-secondary text-sm max-w-2xl">
                Generate a personalized roadmap based on your topic. Review the prerequisites and modules, then save to add it to your dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!generatedRoadmap || isSaving}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !generatedRoadmap || isSaving
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-[#0B1F1A] shadow-lg shadow-[#7FDBCA]/20 hover:shadow-xl'
              }`}
            >
              {isSaving ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12a8 8 0 018-8" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              )}
              Save Learning Path
            </button>
          </div>

          <section className="bg-[#242424] border border-gray-800 rounded-2xl p-6 mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Topic</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder="e.g. Web3, Blockchain and NFTs"
                      className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:border-[#7FDBCA] focus:ring-2 focus:ring-[#7FDBCA]/40 transition-all"
                    />
                    {isGenerating && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7FDBCA] text-xs">Generating...</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Goal</label>
                  <textarea
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    placeholder="Describe what you want to achieve with this learning path"
                    rows={3}
                    className="w-full bg-[#1E1E1E] border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:border-[#7FDBCA] focus:ring-2 focus:ring-[#7FDBCA]/40 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Difficulty</label>
                  <div className="grid grid-cols-1 gap-2">
                    {difficultyOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDifficulty(option.value as 'easy' | 'medium' | 'hard')}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                          difficulty === option.value
                            ? 'border-[#7FDBCA] bg-[#7FDBCA]/10 text-white'
                            : 'border-gray-800 text-gray-400 hover:border-[#7FDBCA]/40 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-medium">{option.label}</span>
                        {difficulty === option.value && (
                          <svg className="w-5 h-5 text-[#7FDBCA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isGenerating
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-[#2F2F2F] border border-gray-800 text-gray-200 hover:border-[#7FDBCA]/40 hover:text-white'
                  }`}
                >
                  {isGenerating ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12a8 8 0 018-8" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4h2a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2h2" />
                    </svg>
                  )}
                  Generate Roadmap
                </button>
              </div>
            </div>
          </section>

          {generatedRoadmap && (
            <div className="space-y-10">
              <section className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Prerequisites Overview</h2>
                    <p className="text-gray-400 text-sm">Work through these foundational topics before diving into the modules.</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#7FDBCA]/40 text-[#7FDBCA]">
                    {prerequisiteSteps.length} steps
                  </span>
                </div>

                <div className="space-y-4">
                  {prerequisiteSteps.map(step => (
                    <div
                      key={step.sequence}
                      className="border border-gray-800 rounded-xl p-5 hover:border-[#7FDBCA]/40 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-[#7FDBCA] mb-1">Step {step.sequence}</div>
                          <h3 className="text-lg font-semibold text-white">{step.conceptName}</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[#7FDBCA]/30 text-[#7FDBCA] capitalize">
                          {step.categorisation}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{step.justification}</p>
                      <div className="text-xs text-gray-400">
                        <span className="font-semibold text-gray-300">Mastery Check:</span> {step.masteryCheck}
                      </div>
                      {step.recommendedResources?.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-gray-400 mb-2">Recommended Resources</div>
                          <div className="flex flex-wrap gap-2">
                            {step.recommendedResources.map((resource, index) => (
                              <span
                                key={`${step.sequence}-${index}`}
                                className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700"
                              >
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {(missingFoundations.length > 0 || integrationGuidance.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {missingFoundations.length > 0 && (
                      <div className="bg-[#1E1E1E] border border-gray-800 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-white mb-2">Missing Foundations</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                          {missingFoundations.map((item, index) => (
                            <li key={`foundation-${index}`} className="flex items-start gap-2">
                              <span className="text-[#7FDBCA] mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {integrationGuidance.length > 0 && (
                      <div className="bg-[#1E1E1E] border border-gray-800 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-white mb-2">Integration Guidance</h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                          {integrationGuidance.map((item, index) => (
                            <li key={`guidance-${index}`} className="flex items-start gap-2">
                              <span className="text-[#7FDBCA] mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Generated Modules</h2>
                    <p className="text-gray-400 text-sm">Explore the curated lessons that make up this learning journey.</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full border border-[#7FDBCA]/40 text-[#7FDBCA]">
                    {modules.length} modules
                  </span>
                </div>

                <div className="space-y-6">
                  {modules.map((module, moduleIndex) => (
                    <div
                      key={`${module.title}-${moduleIndex}`}
                      className="border border-gray-800 rounded-xl p-5 hover:border-[#7FDBCA]/40 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-[#7FDBCA] mb-1">Module {moduleIndex + 1}</div>
                          <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                          <p className="text-gray-300 text-sm mt-2">{module.description}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={`${moduleIndex}-lesson-${lessonIndex}`}
                            className="bg-[#1E1E1E] border border-gray-800 rounded-xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#7FDBCA]/10 text-[#7FDBCA] flex items-center justify-center font-semibold">
                                {lessonIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white mb-1">{lesson.title}</h4>
                                <p className="text-gray-400 text-sm mb-2">{lesson.description}</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  {lesson.estimatedTimeHours !== null && (
                                    <span className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700">
                                      {lesson.estimatedTimeHours}h estimate
                                    </span>
                                  )}
                                  {lesson.masteryCheck && (
                                    <span className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                                      Mastery: {lesson.masteryCheck}
                                    </span>
                                  )}
                                </div>
                                {lesson.recommendedResources && lesson.recommendedResources.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-xs font-semibold text-gray-400 mb-2">Suggested Resources</div>
                                    <div className="flex flex-wrap gap-2">
                                      {lesson.recommendedResources.map((resource, resourceIndex) => (
                                        <span
                                          key={`${moduleIndex}-lesson-${lessonIndex}-resource-${resourceIndex}`}
                                          className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700"
                                        >
                                          {resource}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateLearningPath;
