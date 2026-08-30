const ExamResult = require('../models/ExamResult');
const User = require('../models/User');

class ExamResultService {
  /**
   * Look up exam results for a specific student or roll number
   */
  async getStudentResults({ studentId, rollNumber, semester }) {
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (rollNumber) filter.rollNumber = rollNumber.toUpperCase();
    if (semester) filter.semester = parseInt(semester, 10);

    return await ExamResult.find(filter)
      .sort({ semester: 1 })
      .lean();
  }

  /**
   * Intelligently detect exam query intent and fetch structured MongoDB records
   */
  async retrieveExamContext(query, user, history = []) {
    const cleanQuery = query.toLowerCase();
    const historyText = Array.isArray(history)
      ? history.map((m) => m.message || '').join(' ')
      : '';
    const combinedText = `${historyText} ${query}`.toLowerCase();

    // Strict word-boundary intent detection for student academic / exam records
    const hasDirectExamTerms = /\b(result|results|grade|grades|marks|mark|cgpa|sgpa|gpa|transcript|score card|marksheet|hall ticket|topped|top|highest|lowest|best|worst|maximum|minimum|rank|score|scores|passed|failed|backlog|backlogs|arrear|arrears|credit|credits)\b/i.test(cleanQuery);
    const hasSubjectOrPerformanceQuery =
      /\b(subject|subjects|course|courses|paper|papers|topped|top|highest|lowest|best|worst|score|marks|mark|passed|failed|performance|study|exam|rank|how much|what did i get|got in|score in|grade in)\b/i.test(cleanQuery) &&
      (historyText.length > 0 || /\b(semester|sem|cs[0-9]{3}|exam|results|grade|marks|23cs|22cs)\b/i.test(combinedText));
    const hasSubjectNameInContext =
      /\b(artificial intelligence|computer networks|software engineering|web technologies|machine learning|dbms|operating systems|data structures|algorithms|theory of computation|lab|cs[0-9]{3})\b/i.test(cleanQuery) &&
      (historyText.includes('result') || historyText.includes('sem') || historyText.includes('exam') || historyText.includes('23cs') || cleanQuery.includes('get') || cleanQuery.includes('score'));
    const hasRollLookup = /\b([0-9]{2}[A-Z]{2,4}[0-9]{3,4})\b/i.test(cleanQuery);

    const isExamQuery = hasDirectExamTerms || hasSubjectOrPerformanceQuery || hasSubjectNameInContext || hasRollLookup;

    if (!isExamQuery) {
      return { hasDbRecords: false, records: [], contextText: '', sources: [] };
    }

    // 1. Extract any mentioned Roll Number (e.g., 23CS101, 22CS104, 21EC204) from query or recent history
    let rollMatch = query.match(/\b([0-9]{2}[A-Z]{2,4}[0-9]{3,4})\b/i);
    if (!rollMatch && history.length > 0) {
      // Check previous turns from newest to oldest
      for (let i = history.length - 1; i >= 0; i--) {
        const turnMatch = (history[i].message || '').match(/\b([0-9]{2}[A-Z]{2,4}[0-9]{3,4})\b/i);
        if (turnMatch) {
          rollMatch = turnMatch;
          break;
        }
      }
    }
    const mentionedRoll = rollMatch ? rollMatch[1].toUpperCase() : null;

    // 2. Extract semester if specified (e.g., semester 5, sem 4, 3rd sem) from query or history
    let semMatch = query.match(/(?:semester|sem|s)[\s-]*([1-8])\b/i) || query.match(/\b([1-8])(?:st|nd|rd|th)?[\s-]*(?:sem|semester)\b/i);
    if (!semMatch && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const turnSemMatch = (history[i].message || '').match(/(?:semester|sem|s)[\s-]*([1-8])\b/i) || (history[i].message || '').match(/\b([1-8])(?:st|nd|rd|th)?[\s-]*(?:sem|semester)\b/i);
        if (turnSemMatch) {
          semMatch = turnSemMatch;
          break;
        }
      }
    }
    const mentionedSem = semMatch ? parseInt(semMatch[1], 10) : null;

    let records = [];

    // Lookup by mentioned roll number
    if (mentionedRoll) {
      const filter = { rollNumber: mentionedRoll };
      if (mentionedSem) filter.semester = mentionedSem;
      records = await ExamResult.find(filter).sort({ semester: 1 }).lean();
    }

    // If no explicit roll mentioned, and user is logged in, lookup user's results
    if (records.length === 0 && user) {
      const userDoc = await User.findById(user.id || user._id).lean();
      const userRoll = userDoc?.rollNumber;

      if (userRoll) {
        const filter = { rollNumber: userRoll };
        if (mentionedSem) filter.semester = mentionedSem;
        records = await ExamResult.find(filter).sort({ semester: 1 }).lean();
      } else if (userDoc?._id) {
        const filter = { studentId: userDoc._id };
        if (mentionedSem) filter.semester = mentionedSem;
        records = await ExamResult.find(filter).sort({ semester: 1 }).lean();
      }

      // Fallback: If logged in as student and no records found by user ID, check demo student records
      if (records.length === 0 && (userDoc?.role === 'student' || userDoc?.email === 'student@campus.edu')) {
        const filter = { rollNumber: '23CS101' };
        if (mentionedSem) filter.semester = mentionedSem;
        records = await ExamResult.find(filter).sort({ semester: 1 }).lean();
      }
    }

    if (records.length === 0) {
      return { hasDbRecords: false, records: [], contextText: '', sources: [] };
    }

    // 3. Format structured text for LLM Grounding
    const contextText = this.formatRecordsForPrompt(records);
    const sources = this.formatRecordsAsSources(records);

    return {
      hasDbRecords: true,
      records,
      contextText,
      sources,
    };
  }

  /**
   * Format records into authoritative Markdown and structured prompts
   */
  formatRecordsForPrompt(records) {
    let output = '';

    for (const r of records) {
      output += `### 🎓 Academic Performance Report – Semester ${r.semester}\n\n`;
      output += `| Student Name | Roll / Hall Ticket No | Department | Academic Year | Semester | Result |\n`;
      output += `|---|---|---|---|---|---|\n`;
      output += `| **${r.studentName}** | \`${r.rollNumber}\` | ${r.department} | ${r.academicYear} | **Semester ${r.semester}** | **${r.resultStatus}** |\n\n`;

      output += `#### 📊 Subject-Wise Marks & Grade Breakdown:\n\n`;
      output += `| S.No | Course Code | Course Name | Credits | Marks (/100) | Grade | Grade Points | Status |\n`;
      output += `|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|\n`;

      r.subjects.forEach((s, idx) => {
        const gradeBadge = s.grade === 'O' || s.grade === 'A+' ? `**${s.grade}**` : s.grade;
        const statusBadge = s.status === 'Pass' ? '✅ Pass' : '❌ Fail';
        output += `| ${idx + 1} | \`${s.courseCode}\` | ${s.courseName} | ${s.credits} | **${s.marks}** | ${gradeBadge} | ${s.gradePoints} | ${statusBadge} |\n`;
      });

      output += `\n**📈 Semester Academic Summary:**\n`;
      output += `- **Total Registered Credits**: \`${r.totalCredits}\` | **Earned Credits**: \`${r.earnedCredits}\`\n`;
      output += `- **Semester GPA (SGPA)**: **\`${r.sgpa.toFixed(2)}\`**\n`;
      output += `- **Cumulative GPA (CGPA)**: **\`${r.cgpa.toFixed(2)}\`**\n`;
      output += `- **Status**: **\`${r.resultStatus}\`** (${r.examinationType})\n`;
    }

    return output;
  }

  /**
   * Format database citations for the frontend SourceReferenceCard
   */
  formatRecordsAsSources(records) {
    return records.map((r, idx) => ({
      type: 'database_record',
      chunkId: `db_exam_${r._id || idx}`,
      documentTitle: `Official Academic Record - Sem ${r.semester}`,
      originalName: `MongoDB Collection: ExamResults (${r.rollNumber})`,
      category: 'Exam Results (DB)',
      pageNumber: r.semester,
      rollNumber: r.rollNumber,
      studentName: r.studentName,
      sgpa: r.sgpa,
      cgpa: r.cgpa,
      resultStatus: r.resultStatus,
      excerpt: `Roll No: ${r.rollNumber} | Student: ${r.studentName} | Sem ${r.semester} | SGPA: ${r.sgpa.toFixed(2)} | CGPA: ${r.cgpa.toFixed(2)} | Result: ${r.resultStatus} (${r.subjects.length} subjects registered)`,
      similarityScore: 1.0, // 100% database exact match
    }));
  }
}

module.exports = new ExamResultService();
