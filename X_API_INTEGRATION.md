# X (Twitter) API Integration Guide

This guide explains how to integrate the X API with the AI Launch Feed feature to fetch live AI product launches and trends.

## Overview

The AI Launch Feed (`AITrendsMonitor` component) fetches real-time AI product announcements from X/Twitter using the X API v2. When properly configured, it displays live trends from educational tech, programming tools, and AI frameworks.

## Setup Instructions

### 1. Get X API Credentials

1. Visit the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new Project and App (if you haven't already)
3. Navigate to: **Projects & Apps** → **Your App** → **Keys and tokens**
4. Generate or copy your **Bearer Token**

### 2. Configure Environment Variables

Add your Bearer Token to the `.env` file:

```bash
# Required for live X API integration
X_BEARER_TOKEN=your_actual_bearer_token_here

# Other required keys
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

**Important:** The environment variable must be named `X_BEARER_TOKEN` (not `X_API_KEY`)

### 3. Start the Backend Server

```bash
cd ui/GitHub-Summarizer-QuestionGenerator
python3 api.py
```

The server will start on `http://localhost:8000`

### 4. Start the React Frontend

```bash
cd ui
npm start
```

The app will open on `http://localhost:3000`

## How It Works

### API Endpoint

**GET** `/ai-trends`

Returns a list of AI product launches parsed from recent X/Twitter posts.

**Response Format:**
```json
{
  "products": [
    {
      "id": 1,
      "product_name": "Product Name",
      "description": "Product description",
      "category": "Frontend (Client-Side)",
      "launch_date": "2025-11-09",
      "website": "https://example.com",
      "company_or_creator": "Company Name",
      "twitter_handle": "username",
      "trend_tags": ["AI", "React"],
      "source_tweet_url": "https://twitter.com/...",
      "relevance_score": 8,
      "avatar": "https://...",
      "engagement": {
        "likes": 100,
        "retweets": 50,
        "comments": 25
      },
      "timestamp": "2025-11-09T12:00:00"
    }
  ],
  "total_count": 10,
  "last_updated": "2025-11-09T12:00:00"
}
```

### Caching

- API responses are cached for **2 hours** to minimize API usage
- The cache automatically refreshes after the duration expires
- Frontend also refreshes every 2 hours automatically

### Fallback Behavior

If the X Bearer Token is not configured or the API is unavailable:
- The system automatically falls back to **sample data**
- Sample data includes example AI products (Vercel AI SDK, LangGraph Cloud)
- No errors are thrown; the app continues to function

## Search Query

The system searches for tweets matching:
```
(learn OR tutorial OR course OR framework OR library OR tool)
(programming OR python OR javascript OR react OR AI OR ML OR web development OR data science)
(new OR trending OR popular OR latest)
-is:retweet lang:en
```

This targets educational technology and AI tool announcements in English.

## Categories

Products are automatically classified into these categories:
- Frontend (Client-Side)
- Backend (Server-Side)
- Database Layer
- DevOps / Deployment
- API & Integration Layer
- Security & Compliance
- Testing & Quality Assurance
- Analytics & Observability
- Automation / Tooling
- Architecture & Design Systems

## Troubleshooting

### Bearer Token Not Working

1. Verify the token is correct in your `.env` file
2. Ensure the variable is named `X_BEARER_TOKEN`
3. Check your X API app has the correct permissions
4. Restart the backend server after updating `.env`

### No Data Showing

1. Check if the backend is running (`http://localhost:8000`)
2. Test the endpoint: `curl http://localhost:8000/ai-trends`
3. Check browser console for errors
4. Verify CORS is properly configured

### API Rate Limits

- X API Free tier has rate limits
- The 2-hour cache helps minimize API calls
- If you hit limits, the system will use cached or sample data

## API Code Reference

The X API integration is implemented in:
- Backend: [`ui/GitHub-Summarizer-QuestionGenerator/api.py`](ui/GitHub-Summarizer-QuestionGenerator/api.py) (lines 501-581)
- Frontend: [`ui/src/AITrendsMonitor.jsx`](ui/src/AITrendsMonitor.jsx) (lines 30-59)

## Security Notes

- Never commit your `.env` file with real credentials
- Use `.env.example` for documentation
- Keep your Bearer Token secure
- Rotate tokens regularly for security

## Additional Resources

- [X API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [X API v2 Search](https://developer.twitter.com/en/docs/twitter-api/tweets/search/introduction)
- [Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)