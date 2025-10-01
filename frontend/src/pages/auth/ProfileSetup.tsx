import { useState, useEffect } from 'react';

const userTypes = [
  'Student',
  'Professional',
  'Teacher',
  'Parent',
  'Other',
];

const lmsUses = [
  'Personal Learning',
  'School/College',
  'Work/Job',
  'Teaching',
  'Skill Development',
  'Other',
];

const studyStyles = [
  'Books',
  'Videos',
  'Hybrid (Books + Videos)',
];

const interestFields = [
  'Programming',
  'Mathematics',
  'Science',
  'Arts',
  'Business',
  'Languages',
  'Design',
  'Health',
  'Other',
];

export default function ProfileSetup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    userType: '',
    lmsUse: '',
    studyStyle: '',
    interests: [] as string[],
    otherInterest: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Auto-transition for single-select steps
  const handleAutoTransition = (field: string, value: any) => {
    handleChange(field, value);
    
    // Only auto-transition for steps 1-3 (single select)
    if (step < 3) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 800); // Slight delay for visual feedback
    }
  };

  const handleInterestChange = (interest: string) => {
    setForm(prev => {
      if (prev.interests.includes(interest)) {
        return { ...prev, interests: prev.interests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // Add your API call here
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // Redirect or show success
    alert('Profile setup complete!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] p-4">
      <div className="w-full max-w-4xl bg-[#1E1E1E] rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm">
        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h2>
            <p className="text-gray-300">Help us recommend the best learning path for you!</p>
          </div>

          {/* Progress Stepper */}
          <div className="flex items-center justify-start mb-6 gap-2">
            {[1,2,3,4].map(s => (
              <div key={s} className={`w-16 h-2 rounded-full transition-all duration-300 ${
                step === s ? 'bg-[#FF5757]' : step > s ? 'bg-green-500' : 'bg-gray-700'
              }`}></div>
            ))}
          </div>

          {/* Form Content with transition effect */}
          <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            {/* Step 1: LMS Use */}
            {step === 1 && (
              <div className="mb-8">
                <label className="block text-white font-medium mb-6 text-xl text-center">What do you use the LMS for?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lmsUses.map(use => (
                    <button
                      key={use}
                      type="button"
                      onClick={() => handleAutoTransition('lmsUse', use)}
                      className={`group relative w-full py-4 px-6 rounded-xl border-2 transition-all duration-300 font-medium text-left overflow-hidden ${
                        form.lmsUse === use 
                          ? 'bg-[#FF5757] text-white border-[#FF5757] shadow-lg shadow-[#FF5757]/30 scale-105' 
                          : 'bg-[#242424] text-gray-300 border-gray-600 hover:border-[#FF5757] hover:bg-[#2A2A2A] hover:scale-102'
                      }`}
                    >
                      <div className="relative z-10">
                        {use}
                      </div>
                      {form.lmsUse === use && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF5757] to-[#FF6B6B] opacity-20"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: User Type */}
            {step === 2 && (
              <div className="mb-8">
                <label className="block text-white font-medium mb-6 text-xl text-center">What best describes you?</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {userTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAutoTransition('userType', type)}
                      className={`group relative w-full py-4 px-6 rounded-xl border-2 transition-all duration-300 font-medium text-center overflow-hidden ${
                        form.userType === type 
                          ? 'bg-[#FF5757] text-white border-[#FF5757] shadow-lg shadow-[#FF5757]/30 scale-105' 
                          : 'bg-[#242424] text-gray-300 border-gray-600 hover:border-[#FF5757] hover:bg-[#2A2A2A] hover:scale-102'
                      }`}
                    >
                      <div className="relative z-10">
                        {type}
                      </div>
                      {form.userType === type && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF5757] to-[#FF6B6B] opacity-20"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Study Style */}
            {step === 3 && (
              <div className="mb-8">
                <label className="block text-white font-medium mb-6 text-xl text-center">Preferred study style?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {studyStyles.map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => handleAutoTransition('studyStyle', style)}
                      className={`group relative w-full py-6 px-6 rounded-xl border-2 transition-all duration-300 font-medium text-center overflow-hidden ${
                        form.studyStyle === style 
                          ? 'bg-[#FF5757] text-white border-[#FF5757] shadow-lg shadow-[#FF5757]/30 scale-105' 
                          : 'bg-[#242424] text-gray-300 border-gray-600 hover:border-[#FF5757] hover:bg-[#2A2A2A] hover:scale-102'
                      }`}
                    >
                      <div className="relative z-10">
                        {style}
                      </div>
                      {form.studyStyle === style && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF5757] to-[#FF6B6B] opacity-20"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Interests */}
            {step === 4 && (
              <div className="mb-8">
                <label className="block text-white font-medium mb-6 text-xl text-center">Your interest fields</label>
                <p className="text-gray-400 text-center mb-6">Select all that apply</p>
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {interestFields.map(field => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => handleInterestChange(field)}
                      className={`px-6 py-3 rounded-full border-2 transition-all duration-300 font-medium text-sm hover:scale-105 ${
                        form.interests.includes(field) 
                          ? 'bg-[#FF5757] text-white border-[#FF5757] shadow-lg shadow-[#FF5757]/30' 
                          : 'bg-[#242424] text-gray-300 border-gray-600 hover:border-[#FF5757] hover:bg-[#2A2A2A]'
                      }`}
                    >
                      {field}
                    </button>
                  ))}
                </div>
                {form.interests.includes('Other') && (
                  <input
                    type="text"
                    placeholder="Please specify your other interest..."
                    value={form.otherInterest}
                    onChange={e => handleChange('otherInterest', e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-600 bg-[#242424] px-6 py-3 text-white placeholder-gray-400 focus:border-[#FF5757] focus:outline-none hover:border-gray-500 transition-all duration-300 shadow-inner"
                  />
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              className="px-8 py-3 rounded-xl bg-gray-700 text-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <div className="text-gray-400 text-sm">
              Step {step} of 4
            </div>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(prev => Math.min(4, prev + 1))}
                disabled={
                  (step === 1 && !form.lmsUse) ||
                  (step === 2 && !form.userType) ||
                  (step === 3 && !form.studyStyle)
                }
                className="px-8 py-3 rounded-xl bg-[#FF5757] text-white font-medium disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-[#FF6B6B] transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#FF5757]/30"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={form.interests.length === 0 || isLoading}
                className="px-8 py-3 rounded-xl bg-green-600 text-white font-medium disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-700 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-green-600/30"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    Finish Setup
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
