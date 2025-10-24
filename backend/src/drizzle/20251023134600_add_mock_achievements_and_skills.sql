-- Create activity table and insert mock data for achievements and skills
CREATE TYPE "public"."activity_type" AS ENUM('skill_assessment_completed', 'learning_path_created', 'study_group_joined', 'study_group_created', 'friend_added', 'badge_earned', 'streak_achieved', 'learning_path_shared', 'study_group_posted');

CREATE TABLE "activity" (
	"activity_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"target_id" integer,
	"target_type" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;

-- Insert mock skill assessments
INSERT INTO "skill_assessment" ("title", "description", "topic", "difficulty_level", "estimated_duration", "is_active", "metadata", "created_at", "updated_at") VALUES
('JavaScript Fundamentals', 'Test your knowledge of JavaScript basics including variables, functions, and control structures', 'JavaScript', 'easy', 30, true, '{"tags": ["javascript", "basics", "programming"], "prerequisites": [], "objectives": ["Understand variables and data types", "Work with functions and scope", "Use control structures"]}', NOW(), NOW()),
('React Components Mastery', 'Advanced React component patterns and best practices', 'React', 'medium', 45, true, '{"tags": ["react", "components", "frontend"], "prerequisites": ["JavaScript Fundamentals"], "objectives": ["Master component lifecycle", "Implement advanced patterns", "Optimize component performance"]}', NOW(), NOW()),
('Node.js Backend Development', 'Server-side JavaScript with Node.js and Express', 'Node.js', 'medium', 60, true, '{"tags": ["nodejs", "backend", "express"], "prerequisites": ["JavaScript Fundamentals"], "objectives": ["Build REST APIs", "Handle authentication", "Implement middleware"]}', NOW(), NOW()),
('Database Design Principles', 'Learn to design efficient and scalable database schemas', 'Database', 'hard', 90, true, '{"tags": ["database", "design", "sql"], "prerequisites": [], "objectives": ["Understand normalization", "Design relationships", "Optimize queries"]}', NOW(), NOW()),
('Python Data Science', 'Data analysis and visualization with Python', 'Python', 'medium', 75, true, '{"tags": ["python", "data-science", "pandas"], "prerequisites": [], "objectives": ["Use pandas for data manipulation", "Create visualizations", "Perform statistical analysis"]}', NOW(), NOW()),
('DevOps Fundamentals', 'Introduction to DevOps practices and tools', 'DevOps', 'medium', 60, true, '{"tags": ["devops", "ci-cd", "docker"], "prerequisites": [], "objectives": ["Understand CI/CD pipelines", "Use containerization", "Implement monitoring"]}', NOW(), NOW()),
('TypeScript Advanced', 'Advanced TypeScript features and patterns', 'TypeScript', 'hard', 45, true, '{"tags": ["typescript", "advanced", "types"], "prerequisites": ["JavaScript Fundamentals"], "objectives": ["Master advanced types", "Use decorators", "Implement generic patterns"]}', NOW(), NOW()),
('UI/UX Design Principles', 'Learn user interface and experience design fundamentals', 'Design', 'easy', 40, true, '{"tags": ["ui", "ux", "design"], "prerequisites": [], "objectives": ["Understand design principles", "Create user flows", "Apply accessibility standards"]}', NOW(), NOW()),
('Machine Learning Basics', 'Introduction to machine learning concepts and algorithms', 'Machine Learning', 'hard', 120, true, '{"tags": ["ml", "ai", "algorithms"], "prerequisites": ["Python Data Science"], "objectives": ["Understand ML concepts", "Implement basic algorithms", "Evaluate model performance"]}', NOW(), NOW()),
('Cybersecurity Essentials', 'Fundamental concepts of information security', 'Security', 'medium', 50, true, '{"tags": ["security", "cybersecurity", "encryption"], "prerequisites": [], "objectives": ["Understand security threats", "Learn encryption methods", "Implement secure practices"]}', NOW(), NOW());

-- Insert mock user skill assessment results (assuming we have some users with IDs 1-5)
INSERT INTO "user_skill_assessment" ("user_id", "assessment_id", "score", "max_score", "percentage", "skill_level", "completed_at", "metadata") VALUES
(1, 1, 85.00, 100.00, 85.00, 'intermediate', NOW() - INTERVAL '30 days', '{"attempts": 1, "time_taken": 1800}'),
(1, 2, 92.00, 100.00, 92.00, 'advanced', NOW() - INTERVAL '20 days', '{"attempts": 1, "time_taken": 2400}'),
(1, 3, 78.00, 100.00, 78.00, 'intermediate', NOW() - INTERVAL '15 days', '{"attempts": 2, "time_taken": 2100}'),
(2, 1, 95.00, 100.00, 95.00, 'advanced', NOW() - INTERVAL '25 days', '{"attempts": 1, "time_taken": 1500}'),
(2, 5, 88.00, 100.00, 88.00, 'intermediate', NOW() - INTERVAL '10 days', '{"attempts": 1, "time_taken": 2700}'),
(3, 1, 72.00, 100.00, 72.00, 'beginner', NOW() - INTERVAL '35 days', '{"attempts": 3, "time_taken": 2200}'),
(3, 8, 90.00, 100.00, 90.00, 'intermediate', NOW() - INTERVAL '5 days', '{"attempts": 1, "time_taken": 1800}'),
(4, 2, 87.00, 100.00, 87.00, 'intermediate', NOW() - INTERVAL '12 days', '{"attempts": 2, "time_taken": 1950}'),
(4, 6, 93.00, 100.00, 93.00, 'advanced', NOW() - INTERVAL '8 days', '{"attempts": 1, "time_taken": 2400}'),
(5, 1, 96.00, 100.00, 96.00, 'expert', NOW() - INTERVAL '40 days', '{"attempts": 1, "time_taken": 1200}'),
(5, 7, 89.00, 100.00, 89.00, 'intermediate', NOW() - INTERVAL '18 days', '{"attempts": 1, "time_taken": 2100}'),
(5, 9, 76.00, 100.00, 76.00, 'beginner', NOW() - INTERVAL '3 days', '{"attempts": 2, "time_taken": 3600}');

-- Insert mock achievement activities (badges earned)
INSERT INTO "activity" ("user_id", "activity_type", "target_id", "target_type", "metadata", "created_at") VALUES
(1, 'badge_earned', NULL, 'badge', '{"badge_name": "First Steps", "badge_description": "Completed your first learning module", "badge_icon": "trophy", "points": 10}', NOW() - INTERVAL '30 days'),
(1, 'badge_earned', NULL, 'badge', '{"badge_name": "Quick Learner", "badge_description": "Completed 5 modules in one week", "badge_icon": "zap", "points": 25}', NOW() - INTERVAL '25 days'),
(1, 'badge_earned', NULL, 'badge', '{"badge_name": "Consistent Learner", "badge_description": "Maintained a 7-day learning streak", "badge_icon": "flame", "points": 20}', NOW() - INTERVAL '20 days'),
(1, 'badge_earned', NULL, 'badge', '{"badge_name": "Skill Master", "badge_description": "Achieved 90%+ on a skill assessment", "badge_icon": "star", "points": 30}', NOW() - INTERVAL '15 days'),
(2, 'badge_earned', NULL, 'badge', '{"badge_name": "First Steps", "badge_description": "Completed your first learning module", "badge_icon": "trophy", "points": 10}', NOW() - INTERVAL '25 days'),
(2, 'badge_earned', NULL, 'badge', '{"badge_name": "Social Butterfly", "badge_description": "Joined 3 study groups", "badge_icon": "users", "points": 15}', NOW() - INTERVAL '20 days'),
(2, 'badge_earned', NULL, 'badge', '{"badge_name": "Knowledge Sharer", "badge_description": "Shared 10 study notes", "badge_icon": "book-open", "points": 20}', NOW() - INTERVAL '10 days'),
(3, 'badge_earned', NULL, 'badge', '{"badge_name": "First Steps", "badge_description": "Completed your first learning module", "badge_icon": "trophy", "points": 10}', NOW() - INTERVAL '35 days'),
(3, 'badge_earned', NULL, 'badge', '{"badge_name": "Creative Mind", "badge_description": "Created your first study note", "badge_icon": "lightbulb", "points": 10}', NOW() - INTERVAL '30 days'),
(3, 'badge_earned', NULL, 'badge', '{"badge_name": "UI Enthusiast", "badge_description": "Completed UI/UX Design assessment with 90%+", "badge_icon": "palette", "points": 25}', NOW() - INTERVAL '5 days'),
(4, 'badge_earned', NULL, 'badge', '{"badge_name": "First Steps", "badge_description": "Completed your first learning module", "badge_icon": "trophy", "points": 10}', NOW() - INTERVAL '12 days'),
(4, 'badge_earned', NULL, 'badge', '{"badge_name": "DevOps Explorer", "badge_description": "Completed DevOps Fundamentals assessment", "badge_icon": "settings", "points": 20}', NOW() - INTERVAL '8 days'),
(4, 'badge_earned', NULL, 'badge', '{"badge_name": "Team Player", "badge_description": "Helped 5 fellow learners", "badge_icon": "heart", "points": 15}', NOW() - INTERVAL '6 days'),
(5, 'badge_earned', NULL, 'badge', '{"badge_name": "First Steps", "badge_description": "Completed your first learning module", "badge_icon": "trophy", "points": 10}', NOW() - INTERVAL '40 days'),
(5, 'badge_earned', NULL, 'badge', '{"badge_name": "Code Expert", "badge_description": "Achieved expert level in JavaScript", "badge_icon": "code", "points": 50}', NOW() - INTERVAL '35 days'),
(5, 'badge_earned', NULL, 'badge', '{"badge_name": "Mentor", "badge_description": "Helped 20 learners in study groups", "badge_icon": "graduation-cap", "points": 40}', NOW() - INTERVAL '25 days'),
(5, 'badge_earned', NULL, 'badge', '{"badge_name": "Streak Master", "badge_description": "Maintained a 30-day learning streak", "badge_icon": "flame", "points": 35}', NOW() - INTERVAL '20 days'),
(5, 'badge_earned', NULL, 'badge', '{"badge_name": "TypeScript Wizard", "badge_description": "Mastered advanced TypeScript concepts", "badge_icon": "diamond", "points": 45}', NOW() - INTERVAL '18 days'),
(5, 'badge_earned', NULL, 'badge', '{"badge_name": "AI Pioneer", "badge_description": "Explored machine learning fundamentals", "badge_icon": "brain", "points": 30}', NOW() - INTERVAL '3 days');

-- Insert mock skill assessment completion activities
INSERT INTO "activity" ("user_id", "activity_type", "target_id", "target_type", "metadata", "created_at") VALUES
(1, 'skill_assessment_completed', 1, 'skill_assessment', '{"assessment_title": "JavaScript Fundamentals", "score": 85, "skill_level": "intermediate", "time_taken": 1800}', NOW() - INTERVAL '30 days'),
(1, 'skill_assessment_completed', 2, 'skill_assessment', '{"assessment_title": "React Components Mastery", "score": 92, "skill_level": "advanced", "time_taken": 2400}', NOW() - INTERVAL '20 days'),
(1, 'skill_assessment_completed', 3, 'skill_assessment', '{"assessment_title": "Node.js Backend Development", "score": 78, "skill_level": "intermediate", "time_taken": 2100}', NOW() - INTERVAL '15 days'),
(2, 'skill_assessment_completed', 1, 'skill_assessment', '{"assessment_title": "JavaScript Fundamentals", "score": 95, "skill_level": "advanced", "time_taken": 1500}', NOW() - INTERVAL '25 days'),
(2, 'skill_assessment_completed', 5, 'skill_assessment', '{"assessment_title": "Python Data Science", "score": 88, "skill_level": "intermediate", "time_taken": 2700}', NOW() - INTERVAL '10 days'),
(3, 'skill_assessment_completed', 1, 'skill_assessment', '{"assessment_title": "JavaScript Fundamentals", "score": 72, "skill_level": "beginner", "time_taken": 2200}', NOW() - INTERVAL '35 days'),
(3, 'skill_assessment_completed', 8, 'skill_assessment', '{"assessment_title": "UI/UX Design Principles", "score": 90, "skill_level": "intermediate", "time_taken": 1800}', NOW() - INTERVAL '5 days'),
(4, 'skill_assessment_completed', 2, 'skill_assessment', '{"assessment_title": "React Components Mastery", "score": 87, "skill_level": "intermediate", "time_taken": 1950}', NOW() - INTERVAL '12 days'),
(4, 'skill_assessment_completed', 6, 'skill_assessment', '{"assessment_title": "DevOps Fundamentals", "score": 93, "skill_level": "advanced", "time_taken": 2400}', NOW() - INTERVAL '8 days'),
(5, 'skill_assessment_completed', 1, 'skill_assessment', '{"assessment_title": "JavaScript Fundamentals", "score": 96, "skill_level": "expert", "time_taken": 1200}', NOW() - INTERVAL '40 days'),
(5, 'skill_assessment_completed', 7, 'skill_assessment', '{"assessment_title": "TypeScript Advanced", "score": 89, "skill_level": "intermediate", "time_taken": 2100}', NOW() - INTERVAL '18 days'),
(5, 'skill_assessment_completed', 9, 'skill_assessment', '{"assessment_title": "Machine Learning Basics", "score": 76, "skill_level": "beginner", "time_taken": 3600}', NOW() - INTERVAL '3 days');

-- Insert mock learning and social activities
INSERT INTO "activity" ("user_id", "activity_type", "target_id", "target_type", "metadata", "created_at") VALUES
(1, 'learning_path_created', 1, 'learning_path', '{"path_title": "Full Stack Web Development", "module_count": 12, "difficulty": "intermediate"}', NOW() - INTERVAL '28 days'),
(1, 'study_group_created', 1, 'study_group', '{"group_name": "React Developers", "member_count": 15}', NOW() - INTERVAL '20 days'),
(2, 'learning_path_created', 2, 'learning_path', '{"path_title": "Data Science with Python", "module_count": 8, "difficulty": "medium"}', NOW() - INTERVAL '22 days'),
(2, 'study_group_joined', 1, 'study_group', '{"group_name": "React Developers", "joined_by": "invitation"}', NOW() - INTERVAL '19 days'),
(3, 'learning_path_created', 3, 'learning_path', '{"path_title": "UI/UX Design Fundamentals", "module_count": 6, "difficulty": "easy"}', NOW() - INTERVAL '32 days'),
(3, 'study_group_created', 2, 'study_group', '{"group_name": "Design Thinkers", "member_count": 8}', NOW() - INTERVAL '25 days'),
(4, 'learning_path_created', 4, 'learning_path', '{"path_title": "DevOps Engineering", "module_count": 10, "difficulty": "hard"}', NOW() - INTERVAL '10 days'),
(4, 'study_group_joined', 2, 'study_group', '{"group_name": "Design Thinkers", "joined_by": "request"}', NOW() - INTERVAL '8 days'),
(5, 'learning_path_created', 5, 'learning_path', '{"path_title": "Advanced TypeScript & Node.js", "module_count": 15, "difficulty": "hard"}', NOW() - INTERVAL '38 days'),
(5, 'study_group_created', 3, 'study_group', '{"group_name": "TypeScript Masters", "member_count": 25}', NOW() - INTERVAL '30 days'),
(1, 'friend_added', 2, 'user', '{"friend_name": "Jane Smith", "mutual_friend": false}', NOW() - INTERVAL '26 days'),
(2, 'friend_added', 1, 'user', '{"friend_name": "John Doe", "mutual_friend": false}', NOW() - INTERVAL '26 days'),
(3, 'friend_added', 4, 'user', '{"friend_name": "Bob Wilson", "mutual_friend": false}', NOW() - INTERVAL '15 days'),
(4, 'friend_added', 3, 'user', '{"friend_name": "Alice Brown", "mutual_friend": false}', NOW() - INTERVAL '15 days'),
(5, 'friend_added', 1, 'user', '{"friend_name": "John Doe", "mutual_friend": false}', NOW() - INTERVAL '35 days'),
(1, 'streak_achieved', NULL, 'streak', '{"streak_days": 7, "streak_type": "learning"}', NOW() - INTERVAL '20 days'),
(5, 'streak_achieved', NULL, 'streak', '{"streak_days": 30, "streak_type": "learning"}', NOW() - INTERVAL '20 days'),
(2, 'learning_path_shared', 2, 'learning_path', '{"path_title": "Data Science with Python", "shared_with": "public"}', NOW() - INTERVAL '18 days'),
(5, 'learning_path_shared', 5, 'learning_path', '{"path_title": "Advanced TypeScript & Node.js", "shared_with": "study_group"}', NOW() - INTERVAL '25 days');