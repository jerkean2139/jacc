import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { 
  learningPaths, 
  learningModules, 
  learningAchievements,
  pathModules
} from './shared/schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function setupLearningData() {
  console.log('Setting up learning system data...');

  try {
    // Create learning paths
    const pathsData = [
      {
        name: "Sales Fundamentals",
        description: "Master the core principles of payment processing sales",
        category: "Foundation",
        estimatedDuration: 8,
        difficulty: "beginner",
      },
      {
        name: "Advanced Merchant Services",
        description: "Deep dive into complex merchant service solutions",
        category: "Advanced",
        estimatedDuration: 12,
        difficulty: "advanced",
      },
      {
        name: "Competitive Analysis",
        description: "Learn to analyze and position against competitors",
        category: "Strategy",
        estimatedDuration: 6,
        difficulty: "intermediate",
      }
    ];

    console.log('Creating learning paths...');
    const createdPaths = await db.insert(learningPaths).values(pathsData).returning();

    // Create learning modules
    const modulesData = [
      {
        title: "Introduction to Payment Processing",
        description: "Understanding the basics of credit card processing",
        content: "Learn about authorization, settlement, and interchange fees",
        category: "Foundation",
        difficulty: "beginner",
        estimatedTime: 30,
        xpReward: 100,
        prerequisites: [],
        skills: ["Payment Processing Basics", "Industry Knowledge"]
      },
      {
        title: "Merchant Account Setup",
        description: "Step-by-step guide to setting up merchant accounts",
        content: "Complete workflow from application to activation",
        category: "Foundation", 
        difficulty: "beginner",
        estimatedTime: 45,
        xpReward: 150,
        prerequisites: [],
        skills: ["Account Management", "Documentation"]
      },
      {
        title: "PCI Compliance Fundamentals",
        description: "Understanding PCI DSS requirements and implementation",
        content: "Security standards and compliance requirements",
        category: "Security",
        difficulty: "intermediate",
        estimatedTime: 60,
        xpReward: 200,
        prerequisites: [],
        skills: ["Security Knowledge", "Compliance"]
      },
      {
        title: "Interchange Rate Analysis",
        description: "Deep dive into interchange rate structures",
        content: "Understanding different card types and rate structures",
        category: "Advanced",
        difficulty: "advanced",
        estimatedTime: 90,
        xpReward: 300,
        prerequisites: [],
        skills: ["Rate Analysis", "Cost Structure"]
      },
      {
        title: "Competitive Positioning",
        description: "How to position against major competitors",
        content: "Analysis of key players and positioning strategies",
        category: "Strategy",
        difficulty: "intermediate",
        estimatedTime: 75,
        xpReward: 250,
        prerequisites: [],
        skills: ["Competitive Analysis", "Sales Strategy"]
      },
      {
        title: "Objection Handling",
        description: "Common objections and effective responses",
        content: "Proven techniques for handling merchant objections",
        category: "Sales Skills",
        difficulty: "intermediate",
        estimatedTime: 50,
        xpReward: 180,
        prerequisites: [],
        skills: ["Communication", "Persuasion"]
      }
    ];

    console.log('Creating learning modules...');
    const createdModules = await db.insert(learningModules).values(modulesData).returning();

    // Create achievements
    const achievementsData = [
      {
        title: "First Steps",
        description: "Complete your first learning module",
        icon: "🎯",
        xpReward: 50,
        rarity: "common",
        criteria: { modulesCompleted: 1 }
      },
      {
        title: "Knowledge Seeker",
        description: "Complete 5 learning modules",
        icon: "📚",
        xpReward: 150,
        rarity: "uncommon",
        criteria: { modulesCompleted: 5 }
      },
      {
        title: "Expert Level",
        description: "Complete 10 learning modules",
        icon: "🏆",
        xpReward: 300,
        rarity: "rare",
        criteria: { modulesCompleted: 10 }
      },
      {
        title: "Perfect Score",
        description: "Achieve 100% score on any module",
        icon: "⭐",
        xpReward: 200,
        rarity: "uncommon",
        criteria: { perfectScore: true }
      },
      {
        title: "Learning Streak",
        description: "Complete modules for 7 consecutive days",
        icon: "🔥",
        xpReward: 250,
        rarity: "rare",
        criteria: { streak: 7 }
      },
      {
        title: "Master Learner",
        description: "Complete an entire learning path",
        icon: "👑",
        xpReward: 500,
        rarity: "epic",
        criteria: { pathCompleted: true }
      }
    ];

    console.log('Creating achievements...');
    await db.insert(learningAchievements).values(achievementsData);

    // Link modules to paths
    const pathModulesData = [
      // Sales Fundamentals path
      { pathId: createdPaths[0].id, moduleId: createdModules[0].id, orderIndex: 1 },
      { pathId: createdPaths[0].id, moduleId: createdModules[1].id, orderIndex: 2 },
      { pathId: createdPaths[0].id, moduleId: createdModules[5].id, orderIndex: 3 },
      
      // Advanced Merchant Services path  
      { pathId: createdPaths[1].id, moduleId: createdModules[2].id, orderIndex: 1 },
      { pathId: createdPaths[1].id, moduleId: createdModules[3].id, orderIndex: 2 },
      
      // Competitive Analysis path
      { pathId: createdPaths[2].id, moduleId: createdModules[4].id, orderIndex: 1 },
      { pathId: createdPaths[2].id, moduleId: createdModules[5].id, orderIndex: 2 },
    ];

    console.log('Linking modules to paths...');
    await db.insert(pathModules).values(pathModulesData);

    console.log('✅ Learning system data setup complete!');
    console.log(`Created ${createdPaths.length} learning paths`);
    console.log(`Created ${createdModules.length} learning modules`);
    console.log(`Created ${achievementsData.length} achievements`);

  } catch (error) {
    console.error('Error setting up learning data:', error);
  } finally {
    await pool.end();
  }
}

setupLearningData();