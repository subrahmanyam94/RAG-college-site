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
   * Constructs prompt and calls LLM with retrieved context
   */
  async generateAnswer({ question, contextChunks, conversationHistory = [] }) {
    if (!contextChunks || contextChunks.length === 0) {
      return this.getFallbackResponse(question);
    }

    // Build context string with clear citations and page numbers
    const contextBlock = contextChunks
      .map((c, i) => {
        const title = c.documentTitle || c.originalName || 'Document';
        const page = c.pageNumber ? `Page ${c.pageNumber}` : 'General Section';
        const category = c.category ? `[${c.category}]` : '';
        return `--- Source [${i + 1}]: ${title} (${page}) ${category} ---\n${c.text}`;
      })
      .join('\n\n');

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

    const systemPrompt = `You are CampusRAG, an official AI College Information Assistant.
Your mission is to provide clear, reliable, and helpful answers to students based STRICTLY on the official college excerpts provided below.

RULES:
1. Use ONLY the facts directly stated in the provided institutional excerpts. Do NOT hallucinate, infer, or assume details not present.
2. If the excerpts do not contain the answer, explicitly state that the documents do not specify this information.
3. Reference the relevant document names and pages whenever mentioning specific policies, dates, fees, or requirements.
4. Format your response in clean, readable GitHub Markdown with bold headings, bullet points, or numbered lists where appropriate.
5. Maintain a respectful, welcoming, and professional academic tone.`;

    const userPrompt = `${historyBlock}OFFICIAL COLLEGE EXCERPTS:
${contextBlock}

STUDENT QUESTION:
${question}

Provide a direct, grounded answer adhering strictly to the excerpts above.`;

    // Try live LLM provider
    try {
      // 1. Google Gemini
      if (
        (this.provider === 'gemini' || (this.geminiClient && this.provider !== 'openai')) &&
        this.geminiClient
      ) {
        const model = this.geminiClient.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();

        return {
          answer: text,
          sources: this.formatSources(contextChunks),
          foundAnswer: true,
        };
      }

      // 2. OpenAI
      if (
        (this.provider === 'openai' || (this.openaiClient && this.provider !== 'gemini')) &&
        this.openaiClient
      ) {
        const response = await this.openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
        });

        const text = response.choices[0]?.message?.content || '';
        return {
          answer: text,
          sources: this.formatSources(contextChunks),
          foundAnswer: true,
        };
      }
    } catch (error) {
      console.warn(
        `[LLMService] Remote LLM provider failed (${error.message}). Using local grounded synthesis.`
      );
    }

    // 3. Built-in Grounded Synthesizer (for zero-API-key development and offline testing)
    return this.synthesizeGroundedAnswer(question, contextChunks);
  }

  /**
   * Synthesizes an accurate, grounded answer from the top matching chunks
   */
  synthesizeGroundedAnswer(question, chunks) {
    const topChunk = chunks[0];
    const topSources = this.formatSources(chunks);

    // Extract key sentences from top chunks that directly answer the query
    const docTitle = topChunk.documentTitle || 'College Document';
    const pageRef = topChunk.pageNumber ? ` (Page ${topChunk.pageNumber})` : '';

    let formattedAnswer = `Based on the official institutional records in **${docTitle}**${pageRef}:\n\n`;

    // Group text by paragraphs or clean bullet points
    const lines = chunks
      .slice(0, 3)
      .map((c) => c.text.trim())
      .filter((t) => t.length > 20);

    formattedAnswer += lines.join('\n\n') + '\n\n';
    formattedAnswer += `> *Please verify with the official ${topChunk.category || 'Department'} office for any recent amendments or individual exemptions.*`;

    return {
      answer: formattedAnswer,
      sources: topSources,
      foundAnswer: true,
    };
  }

  formatSources(chunks) {
    return chunks.map((c) => ({
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
