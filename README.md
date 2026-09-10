# IDX Exchange — AI Agentic Engineer Internship 2026

A production multi-agent AI assistant built on OpenClaw that enables natural language 
search over 667,000+ California MLS records, market analytics, semantic recommendations, 
RAG knowledge retrieval, and WhatsApp + email communication.

## Tech Stack
- **Runtime**: OpenClaw (multi-agent orchestration)
- **Languages**: TypeScript, Python
- **Database**: MySQL (rets_property + california_sold)
- **AI**: Google Gemini (embeddings + generation)
- **Communication**: WhatsApp, Email (Nodemailer)

## Databases
| Table | Records | Description |
|-------|---------|-------------|
| rets_property | 53,000+ | Active MLS listings |
| california_sold | 87,000+ | Sold transactions 2021-2025 |
| rets_openhouse | 4,282 | Open house schedules |

## Weekly Modules

| Week | Module | File |
|------|--------|------|
| 0 | Environment Setup | — |
| 1 | OpenClaw Architecture | week1/index.ts |
| 2 | NLP Property Search | week2/parser.ts |
| 3 | Database Integration | week3/database.ts |
| 4 | Conversational Agent | week4/conversation.ts |
| 5 | Market Analytics | week5/market.ts |
| 6 | Embeddings & Vector Search | week6/embeddings.py |
| 7 | Recommendation Engine | week7/recommendations.py |
| 8 | RAG Pipeline | week8/rag.py |
| 9 | Multi-Agent Orchestration | week9/orchestrator.ts |
| 10 | WhatsApp Layer | week10/whatsapp.ts |
| 11 | Email + Safety Guardrails | week11/email.ts |

## Features
- Natural language property search over rets_property
- Conversational multi-turn memory with session state
- Market analytics and price trends from california_sold
- Comp-validated price assessments
- Semantic similarity search using Gemini embeddings
- Hybrid recommendation engine (structured + semantic scoring)
- RAG knowledge assistant grounded in MLS documents
- Multi-agent orchestration with intent classification
- WhatsApp communication layer via OpenClaw
- Email drafting with human-approval safety guardrails

## How to Run

### Setup
```bash
# Install Node dependencies
npm install

# Install Python dependencies
pip3 install google-genai mysql-connector-python numpy scikit-learn python-dotenv pandas

# Configure environment
cp .env.example .env
# Add your GEMINI_API_KEY and MySQL credentials
```

### Run each week
```bash
# Week 1 - Basic routing
npx ts-node week1/index.ts

# Week 2 - NLP parser
npx ts-node week2/parser.ts

# Week 3 - Database search
npx ts-node week3/database.ts

# Week 4 - Conversational agent
npx ts-node week4/conversation.ts

# Week 5 - Market analytics
npx ts-node week5/market.ts

# Week 6 - Semantic search
python3 week6/embeddings.py

# Week 7 - Recommendations
python3 week7/recommendations.py

# Week 8 - RAG
python3 week8/rag.py

# Week 9 - Orchestrator
npx ts-node week9/orchestrator.ts

# Week 10 - WhatsApp simulation
npx ts-node week10/whatsapp.ts

# Week 11 - Email agent
npx ts-node week11/email.ts
```

## Architecture
User → WhatsApp → OpenClaw → Orchestrator → [propertySearchAgent | marketStatsAgent | 
recommendationAgent | ragAgent | emailAgent] → rets_property / california_sold → Response → User

## Safety Guardrails
- All emails require explicit human approval before sending
- Maximum 50 rows returned per database query
- No bulk MLS data exports
- Every destructive action requires confirmation

## Intern
Sameeksha Vashishtha — UCI Computer Science
IDX Exchange AI Agentic Engineer Intern — Summer 2026
