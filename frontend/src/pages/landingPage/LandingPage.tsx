import { useNavigate } from 'react-router-dom';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { TextRotate } from '@/components/ui/text-rotate';

const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-white">LMS</span>
              </div>
            </motion.div>

            <div className="hidden md:flex items-center gap-8">
              {[
                { name: 'Features', href: '#features' },
                { name: 'How It Works', href: '#how-it-works' },
                { name: 'Start Learning', href: '#cta' }
              ].map((link) => (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => setHoveredLink(link.name)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <a
                    href={link.href}
                    className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                  >
                    {link.name}
                  </a>
                  {hoveredLink === link.name && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#4CAF50]"
                      layoutId="navbar-indicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                onClick={() => navigate('/login')}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-lg bg-[#4CAF50] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#45a049] hover:shadow-lg hover:shadow-[#4CAF50]/30"
              >
                Get Started
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="mx-auto max-w-7xl w-full">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div 
              className="mb-6 inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                AI-POWERED LEARNING
              </span>
              <div className="mx-auto mt-1 h-0.5 w-16 bg-[#4CAF50]"></div>
            </motion.div>

            <LayoutGroup>
              <motion.h1 
                className="mb-6 text-5xl font-bold leading-tight lg:text-6xl xl:text-7xl flex flex-col items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                layout
              >
                <motion.span layout className="whitespace-nowrap">
                  Learn Smarter with
                </motion.span>
                <motion.span 
                  className="flex items-center gap-3 mt-2"
                  layout
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                >
                  <TextRotate
                    texts={[
                      "Personalized Roadmaps",
                      "Collaborative Study Groups",
                      "Customized Study Notes",
                      "Smart Learning",
                    ]}
                    mainClassName="text-white px-4 bg-[#4CAF50] overflow-hidden py-2 justify-center rounded-xl"
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={2500}
                  />
                </motion.span>
              </motion.h1>
            </LayoutGroup>

            <motion.p 
              className="mb-8 text-lg text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              AI-powered learning platform that creates custom learning paths, tracks your progress, and helps you achieve your goals.
            </motion.p>

            <motion.div 
              className="flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.button
                onClick={() => navigate('/register')}
                className="group rounded-lg bg-[#4CAF50] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#45a049] hover:shadow-xl hover:shadow-[#4CAF50]/40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-2">
                  Get Started
                  <motion.svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-xs uppercase tracking-wider">Scroll</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 bg-[#141414]">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                FEATURES
              </span>
              <div className="mx-auto mt-1 h-0.5 w-16 bg-[#4CAF50]"></div>
            </div>
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">Everything You Need to Learn</h2>
            <p className="text-lg text-gray-400">
              Powerful tools to help you master any skill
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                ),
                title: 'AI Roadmaps',
                description: 'Get personalized learning paths generated by AI based on your goals.'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                title: 'Smart Assessments',
                description: 'Take quizzes and tests to validate your knowledge and track progress.'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
                title: 'Study Groups',
                description: 'Collaborate with peers, share notes, and learn together.'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ),
                title: 'Progress Tracking',
                description: 'Monitor your learning journey with detailed analytics and insights.'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group rounded-2xl border border-gray-800 bg-gray-900/30 p-6 transition-all hover:border-[#4CAF50]/50 hover:bg-gray-900/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-[#4CAF50]/10 p-3 text-[#4CAF50] transition-colors group-hover:bg-[#4CAF50] group-hover:text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                HOW IT WORKS
              </span>
              <div className="mx-auto mt-1 h-0.5 w-16 bg-[#4CAF50]"></div>
            </div>
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">Start Learning in 3 Simple Steps</h2>
            <p className="text-lg text-gray-400">
              Get started in minutes
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                ),
                number: '01',
                title: 'Set Your Goals',
                description: 'Tell us what you want to learn and your current skill level.'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                ),
                number: '02',
                title: 'Get Your Roadmap',
                description: 'AI generates a personalized learning path with structured modules.'
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ),
                number: '03',
                title: 'Learn & Track',
                description: 'Follow your roadmap, take assessments, and monitor your progress.'
              }
            ].map((step, index) => (
              <motion.div
                key={step.number}
                className="group rounded-2xl border border-gray-800 bg-gray-900/30 p-8 transition-all hover:border-[#4CAF50]/50 hover:bg-gray-900/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-[#4CAF50]/10 p-4 text-[#4CAF50] transition-colors group-hover:bg-[#4CAF50] group-hover:text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {step.icon}
                  </svg>
                </div>
                <div className="mb-4 text-5xl font-bold text-gray-800">{step.number}</div>
                <h3 className="mb-3 text-2xl font-bold">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="px-6 py-24 bg-[#141414]">
        <motion.div 
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 text-4xl font-bold lg:text-5xl">
            Ready to Start Learning?
          </h2>
          <p className="mb-8 text-lg text-gray-400">
            Join and start your personalized learning journey today
          </p>
          <motion.button
            onClick={() => navigate('/register')}
            className="rounded-lg bg-[#4CAF50] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#45a049] hover:shadow-xl hover:shadow-[#4CAF50]/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Free
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-12 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 text-2xl font-bold">LMS</div>
              <p className="text-sm text-gray-400">
                AI-powered learning management system for personalized education.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="transition-colors hover:text-[#4CAF50]">Features</a></li>
                <li><a href="#how-it-works" className="transition-colors hover:text-[#4CAF50]">How It Works</a></li>
                <li><button onClick={() => navigate('/login')} className="transition-colors hover:text-[#4CAF50]">Sign In</button></li>
                <li><button onClick={() => navigate('/register')} className="transition-colors hover:text-[#4CAF50]">Get Started</button></li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="mb-4 font-semibold text-white">Contact</h3>
              <p className="text-sm text-gray-400">
                Have questions? Reach out to us and we'll help you get started.
              </p>
            </motion.div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">&copy; 2025 ADL LMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
