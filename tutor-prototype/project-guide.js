// Project-Guided Learning Module
// Helps users learn by building real projects

class ProjectGuide {
    constructor() {
        this.projects = new Map();
        this.techStacks = {
            'web-frontend': {
                name: 'Frontend Web Development',
                technologies: ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular'],
                difficulty: 'beginner',
                timeframe: '2-4 weeks',
                description: 'Build responsive, interactive web interfaces'
            },
            'web-backend': {
                name: 'Backend Web Development', 
                technologies: ['Node.js', 'Express', 'Python', 'Django', 'Flask', 'PostgreSQL'],
                difficulty: 'intermediate',
                timeframe: '3-6 weeks',
                description: 'Create server-side applications and APIs'
            },
            'mobile': {
                name: 'Mobile Development',
                technologies: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
                difficulty: 'intermediate',
                timeframe: '4-8 weeks', 
                description: 'Build native mobile applications'
            },
            'data-science': {
                name: 'Data Science & ML',
                technologies: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow'],
                difficulty: 'advanced',
                timeframe: '6-12 weeks',
                description: 'Analyze data and build ML models'
            },
            'game-dev': {
                name: 'Game Development',
                technologies: ['Unity', 'C#', 'Godot', 'JavaScript', 'Phaser'],
                difficulty: 'intermediate',
                timeframe: '4-10 weeks',
                description: 'Create interactive games and simulations'
            }
        };
        
        this.projectTemplates = {
            'social-planner': {
                name: 'Social Outing Planner App',
                description: 'Help people plan affordable social outings with friends',
                suggestedStack: 'web-frontend',
                requirements: [
                    'User authentication and profiles',
                    'Event creation and management', 
                    'Budget tracking and splitting',
                    'Location suggestions and maps',
                    'Group chat functionality',
                    'Calendar integration'
                ],
                learningPath: [
                    'HTML/CSS fundamentals',
                    'JavaScript ES6+ features',
                    'React component architecture',
                    'State management patterns',
                    'API integration',
                    'User authentication',
                    'Database design',
                    'Deployment strategies'
                ]
            },
            'portfolio-site': {
                name: 'Developer Portfolio Website',
                description: 'Showcase your projects and skills professionally',
                suggestedStack: 'web-frontend',
                requirements: [
                    'Responsive design across devices',
                    'Project showcase with filtering',
                    'Contact form with email integration',
                    'Blog section with CMS',
                    'Performance optimization',
                    'SEO optimization'
                ],
                learningPath: [
                    'Modern CSS (Grid, Flexbox)',
                    'Performance optimization',
                    'SEO best practices',
                    'Static site generation',
                    'Content management',
                    'Form handling and validation'
                ]
            },
            'task-manager': {
                name: 'Project Task Manager',
                description: 'Organize and track project tasks with team collaboration',
                suggestedStack: 'web-backend',
                requirements: [
                    'Task creation and assignment',
                    'Project boards (Kanban style)',
                    'User roles and permissions', 
                    'Real-time updates',
                    'File attachments and comments',
                    'Time tracking and reporting'
                ],
                learningPath: [
                    'Database design and relationships',
                    'RESTful API development',
                    'Authentication and authorization',
                    'Real-time communication (WebSockets)', 
                    'File upload handling',
                    'Testing strategies'
                ]
            },
            'expense-tracker': {
                name: 'Personal Expense Tracker',
                description: 'Track spending habits and budget management',
                suggestedStack: 'mobile',
                requirements: [
                    'Expense categorization',
                    'Budget setting and alerts',
                    'Receipt photo capture',
                    'Spending analytics and charts',
                    'Bank account integration',
                    'Export and backup features'
                ],
                learningPath: [
                    'Mobile UI/UX principles',
                    'Device camera integration',
                    'Local storage and sync',
                    'Chart libraries and data visualization',
                    'Third-party API integration',
                    'App store deployment'
                ]
            }
        };
    }

    // Start a new project-guided learning journey
    async startProject(userId, projectIdea) {
        const project = {
            id: this.generateProjectId(),
            userId,
            idea: projectIdea,
            status: 'requirements-gathering',
            createdAt: new Date(),
            currentStep: 0,
            totalSteps: 0,
            requirements: [],
            techStack: null,
            learningPath: [],
            completedChallenges: [],
            nextChallenge: null
        };

        // AI-powered requirements gathering
        const requirements = await this.elicitRequirements(projectIdea);
        project.requirements = requirements;
        
        // Suggest technology stack
        const suggestedStack = await this.suggestTechStack(requirements);
        project.techStack = suggestedStack;
        
        // Generate learning path
        const learningPath = await this.generateLearningPath(requirements, suggestedStack);
        project.learningPath = learningPath;
        project.totalSteps = learningPath.length;
        
        // Create first challenge
        project.nextChallenge = await this.generateChallenge(project, 0);
        project.status = 'learning';
        
        this.projects.set(project.id, project);
        return project;
    }

    // AI-powered requirements elicitation
    async elicitRequirements(projectIdea) {
        // In a real implementation, this would use OpenAI API
        // For prototype, we'll use pattern matching and templates
        
        const lowerIdea = projectIdea.toLowerCase();
        
        // Find matching template
        for (const [key, template] of Object.entries(this.projectTemplates)) {
            if (this.matchesTemplate(lowerIdea, template)) {
                return template.requirements;
            }
        }
        
        // Generate generic requirements
        const genericRequirements = [
            'User interface design and layout',
            'Core functionality implementation',
            'Data storage and management',
            'User interaction and feedback',
            'Error handling and validation',
            'Testing and quality assurance',
            'Deployment and maintenance'
        ];
        
        // Customize based on project type
        if (lowerIdea.includes('app') || lowerIdea.includes('mobile')) {
            genericRequirements.push('Mobile responsiveness', 'Offline functionality');
        }
        
        if (lowerIdea.includes('social') || lowerIdea.includes('chat')) {
            genericRequirements.push('User authentication', 'Real-time communication');
        }
        
        if (lowerIdea.includes('data') || lowerIdea.includes('analytics')) {
            genericRequirements.push('Data visualization', 'Analytics and reporting');
        }
        
        return genericRequirements;
    }

    // Suggest appropriate technology stack
    async suggestTechStack(requirements) {
        const scores = {};
        
        // Score each tech stack based on requirements
        for (const [stackId, stack] of Object.entries(this.techStacks)) {
            scores[stackId] = 0;
            
            const reqText = requirements.join(' ').toLowerCase();
            
            // Frontend-heavy indicators
            if (reqText.includes('interface') || reqText.includes('responsive')) {
                scores['web-frontend'] += 3;
            }
            
            // Backend-heavy indicators  
            if (reqText.includes('api') || reqText.includes('authentication') || reqText.includes('database')) {
                scores['web-backend'] += 3;
            }
            
            // Mobile indicators
            if (reqText.includes('mobile') || reqText.includes('camera') || reqText.includes('offline')) {
                scores['mobile'] += 3;
            }
            
            // Data science indicators
            if (reqText.includes('analytics') || reqText.includes('data') || reqText.includes('prediction')) {
                scores['data-science'] += 3;
            }
            
            // Game dev indicators
            if (reqText.includes('game') || reqText.includes('interactive') || reqText.includes('animation')) {
                scores['game-dev'] += 3;
            }
        }
        
        // Return highest scoring stack
        const bestStack = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
        return this.techStacks[bestStack[0]];
    }

    // Generate personalized learning path
    async generateLearningPath(requirements, techStack) {
        const basePath = [];
        
        // Add fundamental concepts
        basePath.push({
            step: 1,
            title: 'Project Setup and Planning',
            description: 'Set up development environment and plan project structure',
            skills: ['Project planning', 'Development environment', 'Version control'],
            estimatedHours: 2,
            challenges: [
                'Set up Git repository',
                'Create project folder structure', 
                'Initialize development tools'
            ]
        });
        
        // Add technology-specific steps
        const techPath = this.getTechSpecificPath(techStack);
        basePath.push(...techPath);
        
        // Add requirements-specific steps
        const reqPath = this.getRequirementSpecificPath(requirements);
        basePath.push(...reqPath);
        
        // Add final deployment step
        basePath.push({
            step: basePath.length + 1,
            title: 'Deployment and Launch',
            description: 'Deploy your project and make it accessible to users',
            skills: ['Deployment', 'DevOps', 'Production optimization'],
            estimatedHours: 4,
            challenges: [
                'Choose hosting platform',
                'Set up CI/CD pipeline',
                'Monitor application in production'
            ]
        });
        
        return basePath;
    }

    // Generate contextual learning challenges
    async generateChallenge(project, stepIndex) {
        const step = project.learningPath[stepIndex];
        if (!step) return null;
        
        const challengeTypes = [
            'coding-exercise',
            'debugging-task', 
            'design-challenge',
            'research-task',
            'review-exercise'
        ];
        
        const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
        
        return {
            id: this.generateChallengeId(),
            type: challengeType,
            step: stepIndex + 1,
            title: `${step.title} - ${this.getChallengeTitle(challengeType)}`,
            description: this.generateChallengeDescription(challengeType, step),
            skills: step.skills,
            difficulty: this.calculateDifficulty(stepIndex, project.learningPath.length),
            estimatedTime: `${15 + stepIndex * 5} minutes`,
            hints: this.generateHints(challengeType, step),
            successCriteria: this.generateSuccessCriteria(challengeType, step)
        };
    }

    // Helper methods
    matchesTemplate(projectIdea, template) {
        const keywords = template.name.toLowerCase().split(' ');
        return keywords.some(keyword => projectIdea.includes(keyword));
    }

    getTechSpecificPath(techStack) {
        const paths = {
            'web-frontend': [
                {
                    title: 'HTML Structure and Semantics',
                    description: 'Create semantic HTML structure for your application',
                    skills: ['HTML5', 'Semantic markup', 'Accessibility'],
                    estimatedHours: 3,
                    challenges: ['Create responsive layout', 'Implement semantic navigation']
                },
                {
                    title: 'CSS Styling and Layout',
                    description: 'Style your application with modern CSS techniques',
                    skills: ['CSS3', 'Flexbox', 'Grid', 'Responsive design'],
                    estimatedHours: 4,
                    challenges: ['Create component styles', 'Implement responsive breakpoints']
                },
                {
                    title: 'JavaScript Interactivity',
                    description: 'Add interactive features with JavaScript',
                    skills: ['ES6+', 'DOM manipulation', 'Event handling'],
                    estimatedHours: 5,
                    challenges: ['Form validation', 'Dynamic content updates']
                }
            ],
            'web-backend': [
                {
                    title: 'Server Setup and Routing',
                    description: 'Set up server and define API routes',
                    skills: ['Node.js', 'Express', 'HTTP protocols'],
                    estimatedHours: 4,
                    challenges: ['Create REST API endpoints', 'Handle HTTP methods']
                },
                {
                    title: 'Database Integration',
                    description: 'Connect and interact with database',
                    skills: ['Database design', 'SQL/NoSQL', 'ORM'],
                    estimatedHours: 5,
                    challenges: ['Design database schema', 'Implement CRUD operations']
                }
            ]
        };
        
        return paths[techStack.name.toLowerCase().replace(/\s+/g, '-')] || [];
    }

    getRequirementSpecificPath(requirements) {
        const path = [];
        
        if (requirements.some(req => req.toLowerCase().includes('authentication'))) {
            path.push({
                title: 'User Authentication',
                description: 'Implement secure user authentication system',
                skills: ['Authentication', 'Security', 'JWT'],
                estimatedHours: 6,
                challenges: ['User registration', 'Login/logout flow', 'Password security']
            });
        }
        
        if (requirements.some(req => req.toLowerCase().includes('chat') || req.toLowerCase().includes('real-time'))) {
            path.push({
                title: 'Real-time Features',
                description: 'Add real-time communication capabilities',
                skills: ['WebSockets', 'Real-time protocols', 'State synchronization'],
                estimatedHours: 7,
                challenges: ['Set up WebSocket connection', 'Handle real-time events']
            });
        }
        
        return path;
    }

    getChallengeTitle(type) {
        const titles = {
            'coding-exercise': 'Hands-on Coding',
            'debugging-task': 'Debug Challenge',
            'design-challenge': 'System Design', 
            'research-task': 'Research & Learn',
            'review-exercise': 'Code Review'
        };
        return titles[type] || 'Learning Challenge';
    }

    generateChallengeDescription(type, step) {
        const descriptions = {
            'coding-exercise': `Write code to implement ${step.title.toLowerCase()}. Focus on clean, readable code that follows best practices.`,
            'debugging-task': `Find and fix bugs in the provided code for ${step.title.toLowerCase()}. Explain what was wrong and how you fixed it.`,
            'design-challenge': `Design the architecture for ${step.title.toLowerCase()}. Consider scalability, maintainability, and performance.`,
            'research-task': `Research best practices and tools for ${step.title.toLowerCase()}. Summarize your findings and make recommendations.`,
            'review-exercise': `Review sample code for ${step.title.toLowerCase()}. Identify areas for improvement and suggest better approaches.`
        };
        return descriptions[type] || `Complete a learning exercise for ${step.title.toLowerCase()}.`;
    }

    generateHints(type, step) {
        return [
            `Start by understanding the ${step.skills[0]} concepts involved`,
            `Break down the problem into smaller, manageable pieces`,
            `Look for examples and documentation online`,
            `Test your solution incrementally as you build`
        ];
    }

    generateSuccessCriteria(type, step) {
        return [
            'Code compiles/runs without errors',
            `Demonstrates understanding of ${step.skills.join(', ')}`,
            'Follows coding best practices',
            'Includes appropriate comments and documentation'
        ];
    }

    calculateDifficulty(stepIndex, totalSteps) {
        const progress = stepIndex / totalSteps;
        if (progress < 0.3) return 'beginner';
        if (progress < 0.7) return 'intermediate';
        return 'advanced';
    }

    generateProjectId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateChallengeId() {
        return 'chal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Complete a challenge and move to next step
    async completeChallenge(projectId, challengeId, userSolution) {
        const project = this.projects.get(projectId);
        if (!project) throw new Error('Project not found');

        // Record completion
        project.completedChallenges.push({
            challengeId,
            completedAt: new Date(),
            solution: userSolution
        });

        // Move to next step
        project.currentStep++;
        
        if (project.currentStep < project.totalSteps) {
            project.nextChallenge = await this.generateChallenge(project, project.currentStep);
        } else {
            project.status = 'completed';
            project.nextChallenge = null;
            project.completedAt = new Date();
        }

        return project;
    }

    // Get project progress
    getProjectProgress(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return null;

        return {
            id: project.id,
            idea: project.idea,
            status: project.status,
            progress: (project.currentStep / project.totalSteps * 100).toFixed(1),
            currentStep: project.currentStep + 1,
            totalSteps: project.totalSteps,
            techStack: project.techStack,
            nextChallenge: project.nextChallenge,
            estimatedTimeRemaining: this.calculateTimeRemaining(project)
        };
    }

    calculateTimeRemaining(project) {
        const remainingSteps = project.learningPath.slice(project.currentStep);
        const totalHours = remainingSteps.reduce((sum, step) => sum + (step.estimatedHours || 2), 0);
        return `${totalHours} hours`;
    }
}

module.exports = ProjectGuide;