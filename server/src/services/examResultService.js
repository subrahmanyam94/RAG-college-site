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
  async retrieveExamContext(query, user) {
    const cleanQuery = query.toLowerCase();
    const isExamQuery =
      cleanQuery.includes('result') ||
      cleanQuery.includes('grade') ||
      cleanQuery.includes('marks') ||
      cleanQuery.includes('cgpa') ||
      cleanQuery.includes('sgpa') ||
      cleanQuery.includes('gpa') ||
      cleanQuery.includes('pass') ||
      cleanQuery.includes('fail') ||
      cleanQuery.includes('transcript') ||
      cleanQuery.includes('score card') ||
      cleanQuery.includes('roll') ||
      cleanQuery.includes('semester');

    if (!isExamQuery) {
      return { hasDbRecords: false, records: [], contextText: '', sources: [] };
    }

    // 1. Extract any mentioned Roll Number (e.g., 23CS101, 22CS104, 21EC204)
    const rollMatch = query.match(/\b([0-9]{2}[A-Z]{2,4}[0-9]{3,4})\b/i);
    const mentionedRoll = rollMatch ? rollMatch[1].toUpperCase() : null;

    // 2. Extract semester if specified (e.g., semester 5, sem 4, 3rd sem)
    const semMatch = query.match(/(?:semester|sem|s)[\s-]*([1-8])\b/i) || query.match(/\b([1-8])(?:st|nd|rd|th)?[\s-]*(?:sem|semester)\b/i);
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
    let output = `[OFFICIAL MONGODB DATABASE RECORDS - EXAM CONTROLLER ARCHIVE]\n`;

    for (const r of records) {
      output += `\n=== STUDENT ACADEMIC RECORD (SEMESTER ${r.semester}) ===\n`;
      output += `- Student Name: ${r.studentName}\n`;
      output += `- Roll / Hall Ticket No: ${r.rollNumber}\n`;
      output += `- Department: ${r.department}\n`;
      output += `- Academic Year: ${r.academicYear} | Examination Type: ${r.examinationType}\n`;
      output += `- Total Credits Registered: ${r.totalCredits} | Earned: ${r.earnedCredits}\n`;
      output += `- Semester Grade Point Average (SGPA): ${r.sgpa.toFixed(2)}\n`;
      output += `- Cumulative Grade Point Average (CGPA): ${r.cgpa.toFixed(2)}\n`;
      output += `- Final Result: ${r.resultStatus}\n`;
      output += `\nSUBJECT-WISE PERFORMANCE BREAKDOWN:\n`;
      output += `| Course Code | Course Name | Credits | Marks (/100) | Grade | Grade Points | Status |\n`;
      output += `|---|---|---|---|---|---|---|\n`;

      for (const s of r.subjects) {
        output += `| ${s.courseCode} | ${s.courseName} | ${s.credits} | ${s.marks} | ${s.grade} | ${s.gradePoints} | ${s.status} |\n`;
      }
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
