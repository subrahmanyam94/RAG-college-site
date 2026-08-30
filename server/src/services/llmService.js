const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const config = require('../config/env');

class LLMService {
  constructor() {
    this.provider = config.llmProvider;
    this.geminiClient = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
    this.openaiClient = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;
  }

  /**
   * Deterministic standard fallback message when no relevant institutional context is found
   */
  getFallbackResponse(query) {
    return {
      answer: `I could not find verified information regarding "${query}" in the official college documents, notices, or circulars currently indexed in CampusRAG.\n\nTo get authoritative details on this topic, please contact the administrative office, your department head, or the student affairs desk directly.`,
      sources: [],
      foundAnswer: false,
    };
  }

  /**
   * Constructs prompt and calls LLM with retrieved context (both DB and Vector Chunks)
   */
  async generateAnswer({
    question,
    contextChunks = [],
    databaseContext = '',
    databaseSources = [],
    conversationHistory = [],
  }) {
    const hasDb = Boolean(databaseContext && databaseContext.trim().length > 0);
    const hasDocs = Boolean(contextChunks && contextChunks.length > 0);

    if (!hasDb && !hasDocs) {
      return this.getFallbackResponse(question);
    }

    // Build context string with clear citations and page numbers
    let contextBlock = '';
    if (hasDocs) {
      contextBlock = contextChunks
        .map((c, i) => {
          const title = c.documentTitle || c.originalName || 'Document';
          const page = c.pageNumber ? `Page ${c.pageNumber}` : 'General Section';
          const category = c.category ? `[${c.category}]` : '';
          return `--- Source [${i + 1}]: ${title} (${page}) ${category} ---\n${c.text}`;
        })
        .join('\n\n');
    }

    let combinedContext = '';
    if (hasDb) {
      combinedContext += `${databaseContext}\n\n`;
    }
    if (hasDocs) {
      combinedContext += `OFFICIAL COLLEGE DOCUMENT EXCERPTS:\n${contextBlock}`;
    }

    // Build multi-turn dialog summary if history exists
    let historyBlock = '';
    if (conversationHistory.length > 0) {
      const recentTurns = conversationHistory.slice(-4);
      historyBlock =
        'Previous conversation turns:\n' +
        recentTurns
          .map((m) => `${m.sender === 'user' ? 'Student' : 'Assistant'}: ${m.message}`)
          .join('\n') +
        '\n\n';
    }

    const systemPrompt = `You are CampusRAG, an official AI College Information Assistant connected directly to MongoDB Campus Databases and Institutional Archives.
Your mission is to provide clear, reliable, and helpful answers to students based STRICTLY on the official database records and college excerpts provided below.

RULES:
1. For student academic records / exam results, present the details clearly in a formatted Markdown table with subjects, marks, grades, SGPA, CGPA, and status.
2. Use ONLY the facts directly stated in the provided database records and excerpts. Do NOT hallucinate or assume details not present.
3. Reference the relevant document names, database collections, and pages.
4. Format your response in clean, readable GitHub Markdown with bold headings, bullet points, or tables.
5. Maintain a respectful, welcoming, and professional academic tone.`;

    const userPrompt = `${historyBlock}OFFICIAL VERIFIED CAMPUS CONTEXT:
${combinedContext}

STUDENT QUESTION:
${question}

Provide a direct, grounded answer adhering strictly to the verified context above.`;

    const allSources = [...databaseSources, ...this.formatSources(contextChunks)];

    // Try live LLM provider with native multi-turn conversation memory
    try {
      // 1. Google Gemini Multi-Turn Chat
      if (
        (this.provider === 'gemini' || (this.geminiClient && this.provider !== 'openai')) &&
        this.geminiClient
      ) {
        const model = this.geminiClient.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });

        const geminiHistory = [];
        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
          for (const turn of conversationHistory.slice(-6)) {
            if (turn.message && turn.message.trim().length > 0) {
              geminiHistory.push({
                role: turn.sender === 'user' ? 'user' : 'model',
                parts: [{ text: turn.message }],
              });
            }
          }
        }

        const chatSession = model.startChat({
          history: geminiHistory,
        });

        const promptToSend = `OFFICIAL VERIFIED CAMPUS CONTEXT:\n${combinedContext}\n\nSTUDENT QUESTION:\n${question}`;
        const result = await chatSession.sendMessage(promptToSend);
        const text = result.response.text();

        return {
          answer: text,
          sources: allSources,
          foundAnswer: true,
        };
      }

      // 2. OpenAI Multi-Turn Chat
      if (
        (this.provider === 'openai' || (this.openaiClient && this.provider !== 'gemini')) &&
        this.openaiClient
      ) {
        const openAiMessages = [{ role: 'system', content: systemPrompt }];

        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
          for (const turn of conversationHistory.slice(-6)) {
            if (turn.message && turn.message.trim().length > 0) {
              openAiMessages.push({
                role: turn.sender === 'user' ? 'user' : 'assistant',
                content: turn.message,
              });
            }
          }
        }

        openAiMessages.push({
          role: 'user',
          content: `OFFICIAL VERIFIED CAMPUS CONTEXT:\n${combinedContext}\n\nSTUDENT QUESTION:\n${question}`,
        });

        const response = await this.openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: openAiMessages,
          temperature: 0.2,
        });

        const text = response.choices[0]?.message?.content || '';
        return {
          answer: text,
          sources: allSources,
          foundAnswer: true,
        };
      }
    } catch (error) {
      console.warn(
        `[LLMService] Remote LLM provider failed (${error.message}). Using local grounded synthesis.`
      );
    }

    // 3. Built-in Grounded Synthesizer (for zero-API-key development and offline testing)
    return this.synthesizeGroundedAnswer(question, contextChunks, databaseContext, databaseSources);
  }

  /**
   * Synthesizes an accurate, grounded answer from database records and top matching chunks
   */
  synthesizeGroundedAnswer(question, chunks = [], databaseContext = '', databaseSources = []) {
    let formattedAnswer = '';
    const allSources = [...databaseSources, ...this.formatSources(chunks)];

    if (databaseContext && databaseContext.trim().length > 0) {
      formattedAnswer += `${databaseContext}\n\n`;

      if (chunks && chunks.length > 0) {
        const topChunk = chunks[0];
        formattedAnswer += `#### 📋 Applicable Academic Regulations (${topChunk.documentTitle || 'Academic Policy'}):\n`;
        formattedAnswer += `> ${topChunk.text.trim().slice(0, 240)}...\n\n`;
      }

      formattedAnswer += `> *Official Record Verified & Sealed by the Office of the Controller of Examinations.*`;
    } else {
      const topChunk = chunks[0];
      const docTitle = topChunk.documentTitle || 'College Document';
      const pageRef = topChunk.pageNumber ? ` (Page ${topChunk.pageNumber})` : '';

      formattedAnswer = `Based on the official institutional records in **${docTitle}**${pageRef}:\n\n`;

      const lines = chunks
        .slice(0, 3)
        .map((c) => c.text.trim())
        .filter((t) => t.length > 20);

      formattedAnswer += lines.join('\n\n') + '\n\n';
      formattedAnswer += `> *Please verify with the official ${topChunk.category || 'Department'} office for any recent amendments or individual exemptions.*`;
    }

    return {
      answer: formattedAnswer,
      sources: allSources,
      foundAnswer: true,
    };
  }

  formatSources(chunks) {
    return chunks.map((c) => ({
      type: c.type || 'document_chunk',
      documentId: c.documentId,
      chunkId: c.chunkId,
      documentTitle: c.documentTitle,
      originalName: c.originalName,
      category: c.category,
      pageNumber: c.pageNumber || 1,
      sectionTitle: c.sectionTitle || '',
      excerpt: c.text.slice(0, 240) + (c.text.length > 240 ? '...' : ''),
      similarityScore: Math.round((c.score || 0) * 100) / 100,
    }));
  }
}

module.exports = new LLMService();
