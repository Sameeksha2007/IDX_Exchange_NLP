# Written Reflection
## IDX Exchange AI Agentic Engineer Internship — Summer 2026
### Sameeksha Vashishtha

---

## What I Built

Over 12 weeks I built a production multi-agent AI assistant for IDX Exchange that enables
natural language search over 667,000+ California MLS records. The system handles property
search, market analytics, semantic recommendations, RAG knowledge retrieval, and
communicates through WhatsApp and email.

---

## What Worked Well

**The pipeline approach** — building each week as a standalone module that feeds into the
next made debugging easy. When something broke in Week 9, I could isolate it to the
orchestrator without touching the other agents.

**Gemini embeddings** — the semantic search in Weeks 6 and 7 was the most impressive
result. Being able to search "charming home with natural light" and get relevant listings
without exact keyword matches felt like real AI, not just SQL filters.

**Real data** — working with actual MLS records made everything feel meaningful. The market
reports, comp validations, and listing results were all real California properties.

**The RAG pipeline** — building a system that answers questions from indexed documents
instead of hallucinating was a key learning. The grounded answers were noticeably more
accurate than prompting the model directly.

**The orchestrator** — seeing all agents connect into one system that routes intelligently
made the whole architecture click.

---

## What I Would Change

**Pre-compute embeddings** — Weeks 6 and 7 call the Gemini API once per listing which is
slow. In production I would pre-generate all embeddings and store them in a vector database.

**Better intent classification** — the orchestrator uses keyword matching which sometimes
misclassifies. I would replace this with a Gemini call to classify intent more accurately.

**Full dataset** — working with partial datasets meant some cities returned fewer results.
The full 228K and 439K datasets would make the system significantly more useful.

**TypeScript and Python unified** — switching between the two created friction. I would
unify to one language or build a cleaner bridge layer.

---

## Key Skills Learned

- Multi-agent AI architecture with OpenClaw
- Natural language processing and intent classification
- Vector embeddings and semantic similarity search
- RAG pipeline design and implementation
- MySQL query optimization for large datasets
- TypeScript and Python for AI engineering
- Human-in-the-loop safety design for agentic systems
- Working with production-scale real estate data

---

## Most Valuable Experience

Building the orchestrator in Week 9 was the most valuable week. Seeing all the individual
agents connect into one system that routes intelligently made the whole architecture click.
It showed me how production AI systems are built as collections of specialized components,
not one monolithic model.

---

## Next Steps

1. Fix the OpenClaw + Gemini model configuration for live WhatsApp messaging
2. Pre-compute embeddings for all 228K active listings
3. Add a vector database for faster semantic search
4. Replace keyword-based intent classification with AI classification
5. Deploy to a cloud server so the agent runs 24/7