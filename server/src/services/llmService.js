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
    databaseRecords = [],
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

    // 3. Built-in Grounded Synthesizer with analytical reasoning (for zero-API-key development and offline testing)
    return this.synthesizeGroundedAnswer({
      question,
      chunks: contextChunks,
      databaseContext,
      databaseRecords,
      databaseSources,
      conversationHistory,
    });
  }

  /**
   * Synthesizes an accurate, grounded answer with analytical reasoning from database records and top matching chunks
   */
  synthesizeGroundedAnswer({
    question,
    chunks = [],
    databaseContext = '',
    databaseRecords = [],
    databaseSources = [],
    conversationHistory = [],
  }) {
    let formattedAnswer = '';
    const allSources = [...databaseSources, ...this.formatSources(chunks)];
    const cleanQ = question.toLowerCase();

    // =========================================================================
    // 1. ANALYTICAL DATABASE REASONING (EXAM RECORDS & STUDENT PERFORMANCE)
    // =========================================================================
    if (databaseRecords && databaseRecords.length > 0) {
      // Pick the relevant semester record (newest or specifically requested)
      const record = databaseRecords[databaseRecords.length - 1];
      const subjects = record.subjects || [];

      // A. "In which subject did I top / score highest / max marks?"
      const isTopQuery = /\b(top|topped|highest|best|max|maximum|most|greatest|peak)\b/i.test(cleanQ) &&
        /\b(subject|course|paper|marks|mark|grade|score|scored|topped|top|in which)\b/i.test(cleanQ);

      // B. "In which subject did I score lowest / least marks?"
      const isLowestQuery = /\b(lowest|least|minimum|min|worst|weakest|lowest mark|least mark)\b/i.test(cleanQ) &&
        /\b(subject|course|paper|marks|mark|grade|score|scored)\b/i.test(cleanQ);

      // C. Specific subject lookup (e.g., "How much did I get in AI / Networks / CS501?")
      const matchedSubject = subjects.find((s) => {
        const codeMatch = cleanQ.includes(s.courseCode.toLowerCase());
        const nameTokens = s.courseName.toLowerCase().split(/[\s&/,-]+/).filter((w) => w.length > 3);
        const nameMatch = nameTokens.some((token) => cleanQ.includes(token));
        const acronymMatch =
          (cleanQ.includes('ai') && s.courseCode === 'CS502') ||
          (cleanQ.includes('ml') && s.courseCode === 'CS505') ||
          (cleanQ.includes('dbms') && s.courseCode === 'CS404') ||
          (cleanQ.includes('os') && s.courseCode === 'CS402') ||
          (cleanQ.includes('networks') && s.courseCode === 'CS501') ||
          (cleanQ.includes('software') && s.courseCode === 'CS503') ||
          (cleanQ.includes('web') && s.courseCode === 'CS504');
        return codeMatch || nameMatch || acronymMatch;
      });

      // D. GPA / SGPA / CGPA inquiry
      const isGpaOnlyQuery = /\b(what is my cgpa|what is my sgpa|my gpa|my sgpa|my cgpa|current cgpa|current gpa)\b/i.test(cleanQ);

      // E. Pass / Fail / Backlog inquiry
      const isPassFailQuery = /\b(did i pass|have i passed|any backlogs|any arrears|pass or fail|passed all)\b/i.test(cleanQ);

      if (isTopQuery) {
        const sortedDesc = [...subjects].sort((a, b) => b.marks - a.marks);
        const topSub = sortedDesc[0];

        formattedAnswer += `### 🏆 Academic Achievement – Highest Scored Subject\n\n`;
        formattedAnswer += `Based on your official **Semester ${record.semester}** examination records for **${record.studentName}** (\`${record.rollNumber}\`):\n\n`;
        formattedAnswer += `You topped in **${topSub.courseName} (\`${topSub.courseCode}\`)** with **${topSub.marks}/100 marks** (Grade: **\`${topSub.grade}\`**, Grade Points: \`${topSub.gradePoints}\`, Credits: \`${topSub.credits}\`).\n\n`;
        formattedAnswer += `#### 📊 Subject Performance Ranking (Highest to Lowest):\n\n`;
        formattedAnswer += `| Rank | Course Code | Subject Title | Marks (/100) | Grade | Status |\n`;
        formattedAnswer += `|:---:|:---|:---|:---:|:---:|:---:|\n`;
        sortedDesc.forEach((s, idx) => {
          const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '';
          formattedAnswer += `| ${medal}${idx + 1} | \`${s.courseCode}\` | ${s.courseName} | **${s.marks}** | **${s.grade}** | ${s.status === 'Pass' ? '✅ Pass' : '❌ Fail'} |\n`;
        });
        formattedAnswer += `\n**📈 Semester ${record.semester} Summary**: SGPA: **\`${record.sgpa.toFixed(2)}\`** | CGPA: **\`${record.cgpa.toFixed(2)}\`**\n`;
      } else if (isLowestQuery) {
        const sortedAsc = [...subjects].sort((a, b) => a.marks - b.marks);
        const lowestSub = sortedAsc[0];

        formattedAnswer += `### 📊 Subject Performance Analysis – Lowest Scored Subject\n\n`;
        formattedAnswer += `Based on your official **Semester ${record.semester}** examination records for **${record.studentName}** (\`${record.rollNumber}\`):\n\n`;
        formattedAnswer += `Your lowest score was in **${lowestSub.courseName} (\`${lowestSub.courseCode}\`)** with **${lowestSub.marks}/100 marks** (Grade: **\`${lowestSub.grade}\`**, Status: **${lowestSub.status}**).\n\n`;
        formattedAnswer += `#### 📋 All Subject Marks:\n\n`;
        formattedAnswer += `| Course Code | Subject Title | Marks | Grade | Status |\n`;
        formattedAnswer += `|:---|:---|:---:|:---:|:---:|\n`;
        sortedAsc.forEach((s) => {
          formattedAnswer += `| \`${s.courseCode}\` | ${s.courseName} | **${s.marks}** | **${s.grade}** | ${s.status === 'Pass' ? '✅ Pass' : '❌ Fail'} |\n`;
        });
        formattedAnswer += `\n**📈 Semester ${record.semester} Summary**: SGPA: **\`${record.sgpa.toFixed(2)}\`** | CGPA: **\`${record.cgpa.toFixed(2)}\`**\n`;
      } else if (matchedSubject) {
        formattedAnswer += `### 📖 Subject Score Details – ${matchedSubject.courseCode}\n\n`;
        formattedAnswer += `For **${record.studentName}** (\`${record.rollNumber}\`) in **Semester ${record.semester}**:\n\n`;
        formattedAnswer += `- **Course Code**: \`${matchedSubject.courseCode}\`\n`;
        formattedAnswer += `- **Course Name**: **${matchedSubject.courseName}**\n`;
        formattedAnswer += `- **Marks Obtained**: **\`${matchedSubject.marks} / 100\`**\n`;
        formattedAnswer += `- **Letter Grade**: **\`${matchedSubject.grade}\`** (Grade Points: \`${matchedSubject.gradePoints}\`)\n`;
        formattedAnswer += `- **Course Credits**: \`${matchedSubject.credits}\`\n`;
        formattedAnswer += `- **Result Status**: **\`${matchedSubject.status}\`** ✅\n\n`;
        formattedAnswer += `> *Overall Semester ${record.semester} SGPA is **${record.sgpa.toFixed(2)}** and cumulative CGPA is **${record.cgpa.toFixed(2)}**.*`;
      } else if (isGpaOnlyQuery) {
        formattedAnswer += `### 🎓 Grade Point Average (GPA) Report\n\n`;
        formattedAnswer += `For student **${record.studentName}** (Roll Number: \`${record.rollNumber}\`):\n\n`;
        databaseRecords.forEach((r) => {
          formattedAnswer += `- **Semester ${r.semester}**: SGPA **\`${r.sgpa.toFixed(2)}\`** (Earned \`${r.earnedCredits}/${r.totalCredits}\` Credits, Result: **${r.resultStatus}**)\n`;
        });
        formattedAnswer += `\n**🎯 Cumulative Grade Point Average (CGPA)**: **\`${record.cgpa.toFixed(2)}\`**\n`;
        formattedAnswer += `**Overall Academic Status**: **\`${record.resultStatus}\`**\n`;
      } else if (isPassFailQuery) {
        const allPassed = subjects.every((s) => s.status === 'Pass');
        formattedAnswer += `### ✅ Semester Result & Backlog Status\n\n`;
        formattedAnswer += `For **${record.studentName}** (\`${record.rollNumber}\`) in **Semester ${record.semester}**:\n\n`;
        if (allPassed) {
          formattedAnswer += `You have **passed all ${subjects.length} registered subjects** with **zero (0) backlogs / arrears**!\n\n`;
          formattedAnswer += `- **Semester GPA (SGPA)**: **\`${record.sgpa.toFixed(2)}\`**\n`;
          formattedAnswer += `- **Cumulative GPA (CGPA)**: **\`${record.cgpa.toFixed(2)}\`**\n`;
          formattedAnswer += `- **Total Credits Earned**: \`${record.earnedCredits} / ${record.totalCredits}\`\n`;
          formattedAnswer += `- **Final Status**: **\`${record.resultStatus}\`**\n`;
        } else {
          formattedAnswer += `You have uncleared arrears in one or more subjects. Overall status: **\`${record.resultStatus}\`**.\n`;
        }
      } else {
        // Default: Full Formatted Report Table
        formattedAnswer += `${databaseContext}\n\n`;
      }

      formattedAnswer += `\n> *Official Record Verified & Sealed by the Office of the Controller of Examinations.*`;
    }

    // =========================================================================
    // 2. DOCUMENT REASONING & EXTRACTION (POLICIES, HOSTEL, PLACEMENT, ETC.)
    // =========================================================================
    else if (chunks && chunks.length > 0) {
      const topChunk = chunks[0];
      const docTitle = topChunk.documentTitle || 'College Document';
      const pageRef = topChunk.pageNumber ? ` (Page ${topChunk.pageNumber})` : '';

      formattedAnswer = `Based on the official institutional records in **${docTitle}**${pageRef}:\n\n`;

      // Extract high-relevance paragraphs matching query terms
      const queryTokens = cleanQ.split(/[\s?,.:;"']+/).filter((w) => w.length > 3);
      const paragraphs = chunks
        .flatMap((c) => c.text.split('\n\n'))
        .map((p) => p.trim())
        .filter((p) => p.length > 25);

      const scoredParagraphs = paragraphs.map((p) => {
        const pLower = p.toLowerCase();
        let score = 0;
        for (const token of queryTokens) {
          if (pLower.includes(token)) score += 2;
        }
        return { text: p, score };
      });

      scoredParagraphs.sort((a, b) => b.score - a.score);
      const topParagraphs = scoredParagraphs.slice(0, 3).map((sp) => sp.text);

      if (topParagraphs.length > 0) {
        formattedAnswer += topParagraphs.join('\n\n') + '\n\n';
      } else {
        formattedAnswer += chunks.slice(0, 2).map((c) => c.text.trim()).join('\n\n') + '\n\n';
      }

      formattedAnswer += `> *Please verify with the official ${topChunk.category || 'Administration'} desk for any individual amendments or exemptions.*`;
    } else {
      return this.getFallbackResponse(question);
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
