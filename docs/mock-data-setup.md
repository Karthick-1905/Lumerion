# Mock Data Setup Guide

This guide explains how to populate your ADL LMS database with mock data for achievements and skills.

## 📊 What's Included

The mock data includes:

### 🎯 Skill Assessments (10 assessments)
- **JavaScript Fundamentals** - Basic programming concepts
- **React Components Mastery** - Advanced React patterns
- **Node.js Backend Development** - Server-side JavaScript
- **Database Design Principles** - Database architecture
- **Python Data Science** - Data analysis with Python
- **DevOps Fundamentals** - CI/CD and deployment
- **TypeScript Advanced** - Advanced TypeScript features
- **UI/UX Design Principles** - User interface design
- **Machine Learning Basics** - AI/ML fundamentals
- **Cybersecurity Essentials** - Information security

### 🏆 Achievements & Activities
- **Badge System**: 20 different achievement badges
- **Skill Assessment Results**: 12 user assessment completions
- **Activity Feed**: Social and learning activities
- **Progress Tracking**: User skill levels and scores

## 🚀 Quick Setup

### Option 1: Using npm script (Recommended)

1. **Ensure your database is running and accessible**
2. **Run the seed script:**
   ```bash
   cd backend
   npm run db:seed
   ```

### Option 2: Manual SQL execution

1. **Connect to your PostgreSQL database**
2. **Run the SQL file directly:**
   ```bash
   psql "your-database-url" -f src/utils/seedMockData.sql
   ```

   Or copy and paste the contents of `src/utils/seedMockData.sql` into your database client.

### Option 3: Using the TypeScript seeder

1. **Install postgres client if needed:**
   ```bash
   npm install postgres
   ```

2. **Run the TypeScript seeder:**
   ```bash
   cd backend
   npx tsx src/utils/seedMockData.ts
   ```

## 📈 Sample Data Overview

### User Skill Levels
- **Beginner**: 0-60% scores
- **Intermediate**: 61-85% scores
- **Advanced**: 86-95% scores
- **Expert**: 96-100% scores

### Achievement Categories
- **Learning Milestones**: First steps, completion badges
- **Skill Mastery**: High-score achievements
- **Social Engagement**: Group participation, friendships
- **Consistency**: Streak achievements
- **Specialization**: Domain-specific badges

### Activity Types
- `badge_earned` - Achievement unlocked
- `skill_assessment_completed` - Assessment finished
- `learning_path_created` - New learning path
- `study_group_created/joined` - Social activities
- `friend_added` - Social connections
- `streak_achieved` - Consistency rewards

## 🔧 Customization

### Adjusting User IDs
The mock data assumes users with IDs 1-5 exist. If your users have different IDs:

1. **Update the SQL file** - Replace user IDs in the INSERT statements
2. **Or modify the seeder script** - Change the userId values in the TypeScript file

### Adding More Data
To add more mock data:

1. **Skill Assessments**: Add to the `skill_assessment` INSERT statement
2. **User Results**: Add to the `user_skill_assessment` table
3. **Achievements**: Add to the `activity` table with `badge_earned` type

### Removing Existing Data
To reset and re-seed:

```sql
-- Clear existing data (optional)
DELETE FROM activity WHERE activity_type IN ('badge_earned', 'skill_assessment_completed');
DELETE FROM user_skill_assessment;
DELETE FROM skill_assessment;

-- Then run the seed script again
```

## 🎯 Testing the Data

### Verify Data Insertion
After running the seed script, check that data was inserted:

```sql
-- Check skill assessments
SELECT COUNT(*) FROM skill_assessment;

-- Check user results
SELECT COUNT(*) FROM user_skill_assessment;

-- Check achievements
SELECT COUNT(*) FROM activity WHERE activity_type = 'badge_earned';

-- Check all activities
SELECT activity_type, COUNT(*) FROM activity GROUP BY activity_type;
```

### API Testing
Test the data through your API endpoints:

```bash
# Get skill assessments
curl http://localhost:8000/api/skill-assessments

# Get user achievements
curl http://localhost:8000/api/users/1/achievements

# Get activity feed
curl http://localhost:8000/api/activity-feed
```

## 📊 Expected Results

After successful seeding, you should see:

- ✅ 10 skill assessments created
- ✅ 12 user skill assessment results
- ✅ 20 achievement badges
- ✅ 32 total activity records
- ✅ Various activity types (badges, assessments, social activities)

## 🔍 Troubleshooting

### Database Connection Issues
- Ensure your `DATABASE_URL` environment variable is set correctly
- Check that PostgreSQL is running and accessible
- Verify database credentials and permissions

### Duplicate Key Errors
- The SQL uses `ON CONFLICT DO NOTHING` to handle duplicates
- If you need to update existing data, remove the conflict clauses

### Missing Users Error
- The mock data references users with IDs 1-5
- Ensure these users exist in your `users` table
- Adjust user IDs if your users have different IDs

### Permission Issues
- Ensure your database user has INSERT permissions
- Check that the database and tables exist

## 🎉 Next Steps

With mock data in place, you can:

1. **Test Achievement System** - Verify badges appear correctly
2. **Test Skill Assessments** - Check assessment results display
3. **Test Activity Feed** - Ensure social activities show up
4. **Develop Frontend** - Build UI components for achievements
5. **Add More Features** - Extend the achievement system

## 📝 Notes

- All mock data uses realistic values and relationships
- Timestamps are set to create a chronological activity history
- Data is designed to work with existing ADL LMS features
- Feel free to modify the data to fit your testing needs

For questions or issues, check the main project documentation or create an issue in the repository.