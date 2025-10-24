import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { skillAssessment, userSkillAssessment, activity, users } from '../drizzle/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seedMockData() {
  console.log('🌱 Seeding mock achievements and skills data...');

  try {
    // First, check if we have any users, if not, create some mock users
    console.log('👤 Checking for existing users...');
    const existingUsers = await db.select({ userId: users.userId }).from(users).limit(5);
    
    let userIds: number[] = [];
    if (existingUsers.length === 0) {
      console.log('👤 Creating mock users...');
      const newUsers = await db.insert(users).values([
        {
          userEmail: 'john.doe@example.com',
          password: '$2b$10$dummy.hash.for.mock.user', // This is just a placeholder
          userName: 'John Doe',
          isVerified: true,
        },
        {
          userEmail: 'jane.smith@example.com', 
          password: '$2b$10$dummy.hash.for.mock.user',
          userName: 'Jane Smith',
          isVerified: true,
        },
        {
          userEmail: 'bob.wilson@example.com',
          password: '$2b$10$dummy.hash.for.mock.user', 
          userName: 'Bob Wilson',
          isVerified: true,
        },
        {
          userEmail: 'alice.brown@example.com',
          password: '$2b$10$dummy.hash.for.mock.user',
          userName: 'Alice Brown', 
          isVerified: true,
        },
        {
          userEmail: 'charlie.davis@example.com',
          password: '$2b$10$dummy.hash.for.mock.user',
          userName: 'Charlie Davis',
          isVerified: true,
        },
      ]).returning({ userId: users.userId });
      userIds = newUsers.map(u => u.userId);
      console.log('✅ Mock users created');
    } else {
      userIds = existingUsers.map(u => u.userId);
      console.log(`✅ Found ${userIds.length} existing users, using their IDs: ${userIds.join(', ')}`);
    }
    // Insert mock skill assessments
    console.log('📚 Inserting skill assessments...');
    await db.insert(skillAssessment).values([
      {
        title: 'JavaScript Fundamentals',
        description: 'Test your knowledge of JavaScript basics including variables, functions, and control structures',
        topic: 'JavaScript',
        difficultyLevel: 'easy',
        estimatedDuration: 30,
        isActive: true,
        metadata: {
          tags: ['javascript', 'basics', 'programming'],
          prerequisites: [],
          objectives: ['Understand variables and data types', 'Work with functions and scope', 'Use control structures']
        }
      },
      {
        title: 'React Components Mastery',
        description: 'Advanced React component patterns and best practices',
        topic: 'React',
        difficultyLevel: 'medium',
        estimatedDuration: 45,
        isActive: true,
        metadata: {
          tags: ['react', 'components', 'frontend'],
          prerequisites: ['JavaScript Fundamentals'],
          objectives: ['Master component lifecycle', 'Implement advanced patterns', 'Optimize component performance']
        }
      },
      {
        title: 'Node.js Backend Development',
        description: 'Server-side JavaScript with Node.js and Express',
        topic: 'Node.js',
        difficultyLevel: 'medium',
        estimatedDuration: 60,
        isActive: true,
        metadata: {
          tags: ['nodejs', 'backend', 'express'],
          prerequisites: ['JavaScript Fundamentals'],
          objectives: ['Build REST APIs', 'Handle authentication', 'Implement middleware']
        }
      },
      {
        title: 'Database Design Principles',
        description: 'Learn to design efficient and scalable database schemas',
        topic: 'Database',
        difficultyLevel: 'hard',
        estimatedDuration: 90,
        isActive: true,
        metadata: {
          tags: ['database', 'design', 'sql'],
          prerequisites: [],
          objectives: ['Understand normalization', 'Design relationships', 'Optimize queries']
        }
      },
      {
        title: 'Python Data Science',
        description: 'Data analysis and visualization with Python',
        topic: 'Python',
        difficultyLevel: 'medium',
        estimatedDuration: 75,
        isActive: true,
        metadata: {
          tags: ['python', 'data-science', 'pandas'],
          prerequisites: [],
          objectives: ['Use pandas for data manipulation', 'Create visualizations', 'Perform statistical analysis']
        }
      },
      {
        title: 'DevOps Fundamentals',
        description: 'Introduction to DevOps practices and tools',
        topic: 'DevOps',
        difficultyLevel: 'medium',
        estimatedDuration: 60,
        isActive: true,
        metadata: {
          tags: ['devops', 'ci-cd', 'docker'],
          prerequisites: [],
          objectives: ['Understand CI/CD pipelines', 'Use containerization', 'Implement monitoring']
        }
      },
      {
        title: 'TypeScript Advanced',
        description: 'Advanced TypeScript features and patterns',
        topic: 'TypeScript',
        difficultyLevel: 'hard',
        estimatedDuration: 45,
        isActive: true,
        metadata: {
          tags: ['typescript', 'advanced', 'types'],
          prerequisites: ['JavaScript Fundamentals'],
          objectives: ['Master advanced types', 'Use decorators', 'Implement generic patterns']
        }
      },
      {
        title: 'UI/UX Design Principles',
        description: 'Learn user interface and experience design fundamentals',
        topic: 'Design',
        difficultyLevel: 'easy',
        estimatedDuration: 40,
        isActive: true,
        metadata: {
          tags: ['ui', 'ux', 'design'],
          prerequisites: [],
          objectives: ['Understand design principles', 'Create user flows', 'Apply accessibility standards']
        }
      },
      {
        title: 'Machine Learning Basics',
        description: 'Introduction to machine learning concepts and algorithms',
        topic: 'Machine Learning',
        difficultyLevel: 'hard',
        estimatedDuration: 120,
        isActive: true,
        metadata: {
          tags: ['ml', 'ai', 'algorithms'],
          prerequisites: ['Python Data Science'],
          objectives: ['Understand ML concepts', 'Implement basic algorithms', 'Evaluate model performance']
        }
      },
      {
        title: 'Cybersecurity Essentials',
        description: 'Fundamental concepts of information security',
        topic: 'Security',
        difficultyLevel: 'medium',
        estimatedDuration: 50,
        isActive: true,
        metadata: {
          tags: ['security', 'cybersecurity', 'encryption'],
          prerequisites: [],
          objectives: ['Understand security threats', 'Learn encryption methods', 'Implement secure practices']
        }
      }
    ]);

        // Insert mock user skill assessment results (using actual user IDs)
    console.log('📊 Inserting user skill assessment results...');
    await db.insert(userSkillAssessment).values([
      { userId: userIds[0], assessmentId: 1, score: '85.00', maxScore: '100.00', percentage: '85.00', skillLevel: 'intermediate', completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 1800 } },
      { userId: userIds[0], assessmentId: 2, score: '92.00', maxScore: '100.00', percentage: '92.00', skillLevel: 'advanced', completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 2400 } },
      { userId: userIds[0], assessmentId: 3, score: '78.00', maxScore: '100.00', percentage: '78.00', skillLevel: 'intermediate', completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 2, timeTaken: 2100 } },
      { userId: userIds[1], assessmentId: 1, score: '95.00', maxScore: '100.00', percentage: '95.00', skillLevel: 'advanced', completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 1500 } },
      { userId: userIds[1], assessmentId: 5, score: '88.00', maxScore: '100.00', percentage: '88.00', skillLevel: 'intermediate', completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 2700 } },
      { userId: userIds[2], assessmentId: 1, score: '72.00', maxScore: '100.00', percentage: '72.00', skillLevel: 'beginner', completedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 3, timeTaken: 2200 } },
      { userId: userIds[2], assessmentId: 8, score: '90.00', maxScore: '100.00', percentage: '90.00', skillLevel: 'intermediate', completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 1800 } },
      { userId: userIds[3], assessmentId: 2, score: '87.00', maxScore: '100.00', percentage: '87.00', skillLevel: 'intermediate', completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 2, timeTaken: 1950 } },
      { userId: userIds[3], assessmentId: 6, score: '93.00', maxScore: '100.00', percentage: '93.00', skillLevel: 'advanced', completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 2400 } },
      { userId: userIds[4], assessmentId: 1, score: '96.00', maxScore: '100.00', percentage: '96.00', skillLevel: 'expert', completedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 1200 } },
      { userId: userIds[4], assessmentId: 7, score: '89.00', maxScore: '100.00', percentage: '89.00', skillLevel: 'intermediate', completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 1, timeTaken: 2100 } },
      { userId: userIds[4], assessmentId: 9, score: '76.00', maxScore: '100.00', percentage: '76.00', skillLevel: 'beginner', completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), metadata: { attempts: 2, timeTaken: 3600 } }
    ]);

    // Insert mock achievement activities (badges earned)
    console.log('🏆 Inserting achievement activities...');
    await db.insert(activity).values([
      { userId: userIds[0], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'First Steps', badgeDescription: 'Completed your first learning module', badgeIcon: 'trophy', points: 10 } },
      { userId: userIds[0], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Quick Learner', badgeDescription: 'Completed 5 modules in one week', badgeIcon: 'zap', points: 25 } },
      { userId: userIds[0], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Consistent Learner', badgeDescription: 'Maintained a 7-day learning streak', badgeIcon: 'flame', points: 20 } },
      { userId: userIds[0], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Skill Master', badgeDescription: 'Achieved 90%+ on a skill assessment', badgeIcon: 'star', points: 30 } },
      { userId: userIds[1], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'First Steps', badgeDescription: 'Completed your first learning module', badgeIcon: 'trophy', points: 10 } },
      { userId: userIds[1], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Social Butterfly', badgeDescription: 'Joined 3 study groups', badgeIcon: 'users', points: 15 } },
      { userId: userIds[1], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Knowledge Sharer', badgeDescription: 'Shared 10 study notes', badgeIcon: 'book-open', points: 20 } },
      { userId: userIds[2], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'First Steps', badgeDescription: 'Completed your first learning module', badgeIcon: 'trophy', points: 10 } },
      { userId: userIds[2], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Creative Mind', badgeDescription: 'Created your first study note', badgeIcon: 'lightbulb', points: 10 } },
      { userId: userIds[2], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'UI Enthusiast', badgeDescription: 'Completed UI/UX Design assessment with 90%+', badgeIcon: 'palette', points: 25 } },
      { userId: userIds[3], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'First Steps', badgeDescription: 'Completed your first learning module', badgeIcon: 'trophy', points: 10 } },
      { userId: userIds[3], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'DevOps Explorer', badgeDescription: 'Completed DevOps Fundamentals assessment', badgeIcon: 'settings', points: 20 } },
      { userId: userIds[3], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Team Player', badgeDescription: 'Helped 5 fellow learners', badgeIcon: 'heart', points: 15 } },
      { userId: userIds[4], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'First Steps', badgeDescription: 'Completed your first learning module', badgeIcon: 'trophy', points: 10 } },
      { userId: userIds[4], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Code Expert', badgeDescription: 'Achieved expert level in JavaScript', badgeIcon: 'code', points: 50 } },
      { userId: userIds[4], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Mentor', badgeDescription: 'Helped 20 learners in study groups', badgeIcon: 'graduation-cap', points: 40 } },
      { userId: userIds[4], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'Streak Master', badgeDescription: 'Maintained a 30-day learning streak', badgeIcon: 'flame', points: 35 } },
      { userId: userIds[4], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'TypeScript Wizard', badgeDescription: 'Mastered advanced TypeScript concepts', badgeIcon: 'diamond', points: 45 } },
      { userId: userIds[4], activityType: 'badge_earned', targetType: 'badge', metadata: { badgeName: 'AI Pioneer', badgeDescription: 'Explored machine learning fundamentals', badgeIcon: 'brain', points: 30 } }
    ]);

    // Insert skill assessment completion activities
    console.log('📈 Inserting skill assessment completion activities...');
    await db.insert(activity).values([
      { userId: userIds[0], activityType: 'skill_assessment_completed', targetId: 1, targetType: 'skill_assessment', metadata: { assessmentTitle: 'JavaScript Fundamentals', score: 85, skillLevel: 'intermediate', timeTaken: 1800 } },
      { userId: userIds[0], activityType: 'skill_assessment_completed', targetId: 2, targetType: 'skill_assessment', metadata: { assessmentTitle: 'React Components Mastery', score: 92, skillLevel: 'advanced', timeTaken: 2400 } },
      { userId: userIds[0], activityType: 'skill_assessment_completed', targetId: 3, targetType: 'skill_assessment', metadata: { assessmentTitle: 'Node.js Backend Development', score: 78, skillLevel: 'intermediate', timeTaken: 2100 } },
      { userId: userIds[1], activityType: 'skill_assessment_completed', targetId: 1, targetType: 'skill_assessment', metadata: { assessmentTitle: 'JavaScript Fundamentals', score: 95, skillLevel: 'advanced', timeTaken: 1500 } },
      { userId: userIds[1], activityType: 'skill_assessment_completed', targetId: 5, targetType: 'skill_assessment', metadata: { assessmentTitle: 'Python Data Science', score: 88, skillLevel: 'intermediate', timeTaken: 2700 } },
      { userId: userIds[2], activityType: 'skill_assessment_completed', targetId: 1, targetType: 'skill_assessment', metadata: { assessmentTitle: 'JavaScript Fundamentals', score: 72, skillLevel: 'beginner', timeTaken: 2200 } },
      { userId: userIds[2], activityType: 'skill_assessment_completed', targetId: 8, targetType: 'skill_assessment', metadata: { assessmentTitle: 'UI/UX Design Principles', score: 90, skillLevel: 'intermediate', timeTaken: 1800 } },
      { userId: userIds[3], activityType: 'skill_assessment_completed', targetId: 2, targetType: 'skill_assessment', metadata: { assessmentTitle: 'React Components Mastery', score: 87, skillLevel: 'intermediate', timeTaken: 1950 } },
      { userId: userIds[3], activityType: 'skill_assessment_completed', targetId: 6, targetType: 'skill_assessment', metadata: { assessmentTitle: 'DevOps Fundamentals', score: 93, skillLevel: 'advanced', timeTaken: 2400 } },
      { userId: userIds[4], activityType: 'skill_assessment_completed', targetId: 1, targetType: 'skill_assessment', metadata: { assessmentTitle: 'JavaScript Fundamentals', score: 96, skillLevel: 'expert', timeTaken: 1200 } },
      { userId: userIds[4], activityType: 'skill_assessment_completed', targetId: 7, targetType: 'skill_assessment', metadata: { assessmentTitle: 'TypeScript Advanced', score: 89, skillLevel: 'intermediate', timeTaken: 2100 } },
      { userId: userIds[4], activityType: 'skill_assessment_completed', targetId: 9, targetType: 'skill_assessment', metadata: { assessmentTitle: 'Machine Learning Basics', score: 76, skillLevel: 'beginner', timeTaken: 3600 } }
    ]);

    console.log('✅ Mock data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('  - 10 skill assessments created');
    console.log('  - 12 user skill assessment results');
    console.log('  - 20 badge achievements');
    console.log('  - 12 skill assessment completion activities');

  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed function
seedMockData().catch(console.error);