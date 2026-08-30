const ExamResult = require('../models/ExamResult');
const examResultService = require('../services/examResultService');
const User = require('../models/User');

// Helper to determine Grade from marks
const getGrade = (marks) => {
  const m = Number(marks);
  if (m >= 90) return 'O';
  if (m >= 80) return 'A+';
  if (m >= 70) return 'A';
  if (m >= 60) return 'B+';
  if (m >= 55) return 'B';
  if (m >= 50) return 'C';
  return 'F';
};

// Helper for Grade Points
const getGradePoints = (grade) => {
  switch (grade) {
    case 'O': return 10;
    case 'A+': return 9;
    case 'A': return 8;
    case 'B+': return 7;
    case 'B': return 6;
    case 'C': return 5;
    default: return 0;
  }
};

// Parse CSV text into normalized ExamResult objects
const parseCsvMarksSheet = (csvText) => {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row');
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim().replace(/["']/g, ''));

  const rollIdx = headers.findIndex((h) => h.includes('roll'));
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('student'));
  const semIdx = headers.findIndex((h) => h.includes('sem'));
  const deptIdx = headers.findIndex((h) => h.includes('dept') || h.includes('department') || h.includes('branch'));
  const codeIdx = headers.findIndex((h) => h.includes('code') || h.includes('subject code') || h.includes('course code'));
  const courseNameIdx = headers.findIndex((h) => h.includes('course name') || h.includes('subject name') || h.includes('subject') || h.includes('title'));
  const creditsIdx = headers.findIndex((h) => h.includes('credit'));
  const marksIdx = headers.findIndex((h) => h.includes('mark') || h.includes('score'));

  if (rollIdx === -1 || semIdx === -1 || codeIdx === -1 || marksIdx === -1) {
    throw new Error('CSV must have columns for RollNumber, Semester, CourseCode, and Marks');
  }

  // Group by rollNumber + semester
  const studentMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // CSV split handling quoted commas
    const cols = [];
    let insideQuote = false;
    let current = '';
    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        cols.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 4) continue;

    const rollNumber = (cols[rollIdx] || '').toUpperCase();
    const studentName = nameIdx !== -1 ? cols[nameIdx] : `Student ${rollNumber}`;
    const semester = parseInt(cols[semIdx], 10) || 1;
    const department = deptIdx !== -1 ? cols[deptIdx] : 'Computer Science & Engineering';
    const courseCode = (cols[codeIdx] || '').toUpperCase();
    const courseName = courseNameIdx !== -1 && cols[courseNameIdx] ? cols[courseNameIdx] : courseCode;
    const credits = creditsIdx !== -1 ? parseInt(cols[creditsIdx], 10) || 3 : 3;
    const marks = parseFloat(cols[marksIdx]) || 0;

    const grade = getGrade(marks);
    const gradePoints = getGradePoints(grade);
    const status = grade !== 'F' ? 'Pass' : 'Fail';

    const key = `${rollNumber}_${semester}`;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        rollNumber,
        studentName,
        semester,
        department,
        academicYear: '2025-2026',
        examinationType: 'Regular End-Semester',
        subjects: [],
        declarationDate: new Date(),
      });
    }

    const record = studentMap.get(key);
    record.subjects.push({
      courseCode,
      courseName,
      credits,
      marks,
      grade,
      gradePoints,
      status,
    });
  }

  // Calculate SGPA, CGPA, total credits for each grouped student
  const results = [];
  for (const record of studentMap.values()) {
    let totalCredits = 0;
    let earnedCredits = 0;
    let totalPoints = 0;
    let hasFail = false;

    for (const sub of record.subjects) {
      totalCredits += sub.credits;
      if (sub.status === 'Pass') {
        earnedCredits += sub.credits;
        totalPoints += sub.credits * sub.gradePoints;
      } else {
        hasFail = true;
      }
    }

    const sgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
    record.totalCredits = totalCredits;
    record.earnedCredits = earnedCredits;
    record.sgpa = sgpa;
    record.cgpa = sgpa; // initialized to sgpa
    record.resultStatus = hasFail ? 'Fail' : 'Pass';

    results.push(record);
  }

  return results;
};

// Admin: Get all student exam records with search & filter
exports.getAllResults = async (req, res, next) => {
  try {
    const { semester, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (semester && semester !== 'All') {
      filter.semester = parseInt(semester, 10);
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ rollNumber: searchRegex }, { studentName: searchRegex }, { department: searchRegex }];
    }

    const totalCount = await ExamResult.countDocuments(filter);
    const results = await ExamResult.find(filter)
      .sort({ semester: -1, rollNumber: 1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10))
      .lean();

    return res.status(200).json({
      success: true,
      count: results.length,
      total: totalCount,
      page: parseInt(page, 10),
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyResults = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const results = await examResultService.getStudentResults({
      studentId: user?._id,
      rollNumber: user?.rollNumber || (user?.email === 'student@campus.edu' ? '23CS101' : null),
      semester: req.query.semester,
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

exports.lookupByRoll = async (req, res, next) => {
  try {
    const { rollNumber } = req.params;
    const { semester } = req.query;

    const results = await examResultService.getStudentResults({
      rollNumber,
      semester,
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Add or Update a single exam result
exports.createResult = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.rollNumber || !data.semester || !data.subjects) {
      return res.status(400).json({
        success: false,
        error: 'rollNumber, semester, and subjects array are required',
      });
    }

    // Auto calculate grades and SGPA if not present
    let totalCredits = 0;
    let earnedCredits = 0;
    let totalPoints = 0;
    let hasFail = false;

    data.subjects = data.subjects.map((s) => {
      const marks = parseFloat(s.marks) || 0;
      const grade = s.grade || getGrade(marks);
      const gradePoints = s.gradePoints !== undefined ? s.gradePoints : getGradePoints(grade);
      const credits = parseInt(s.credits, 10) || 3;
      const status = grade !== 'F' ? 'Pass' : 'Fail';

      totalCredits += credits;
      if (status === 'Pass') {
        earnedCredits += credits;
        totalPoints += credits * gradePoints;
      } else {
        hasFail = true;
      }

      return {
        courseCode: s.courseCode.toUpperCase(),
        courseName: s.courseName,
        credits,
        marks,
        grade,
        gradePoints,
        status,
      };
    });

    data.totalCredits = totalCredits;
    data.earnedCredits = earnedCredits;
    data.sgpa = data.sgpa || (totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0);
    data.cgpa = data.cgpa || data.sgpa;
    data.resultStatus = hasFail ? 'Fail' : 'Pass';

    const result = await ExamResult.findOneAndUpdate(
      { rollNumber: data.rollNumber.toUpperCase(), semester: parseInt(data.semester, 10) },
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Exam result saved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Upload and parse CSV marks sheet
exports.uploadSheet = async (req, res, next) => {
  try {
    let csvText = '';

    if (req.file) {
      csvText = req.file.buffer.toString('utf-8');
    } else if (req.body.csvText) {
      csvText = req.body.csvText;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please upload a CSV marks sheet file or provide csvText',
      });
    }

    const parsedResults = parseCsvMarksSheet(csvText);

    const ops = parsedResults.map((item) => ({
      updateOne: {
        filter: { rollNumber: item.rollNumber.toUpperCase(), semester: item.semester },
        update: { $set: item },
        upsert: true,
      },
    }));

    await ExamResult.bulkWrite(ops);

    return res.status(200).json({
      success: true,
      message: `Parsed and indexed ${parsedResults.length} student semester records from the marks sheet!`,
      count: parsedResults.length,
      data: parsedResults,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: `Failed to process marks sheet: ${error.message}`,
    });
  }
};

// Admin: Batch upload multiple student results (JSON array)
exports.batchUploadResults = async (req, res, next) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a non-empty array of results in the request body',
      });
    }

    const ops = results.map((item) => ({
      updateOne: {
        filter: { rollNumber: item.rollNumber.toUpperCase(), semester: item.semester },
        update: { $set: item },
        upsert: true,
      },
    }));

    const bulkRes = await ExamResult.bulkWrite(ops);

    return res.status(200).json({
      success: true,
      message: `Processed ${results.length} exam records successfully`,
      data: bulkRes,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete a result
exports.deleteResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ExamResult.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Exam result deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Download Sample CSV Template
exports.getSampleTemplate = (req, res) => {
  const sampleCsv = `RollNumber,StudentName,Semester,Department,CourseCode,CourseName,Credits,Marks
23CS105,Rahul Verma,5,Computer Science & Engineering,CS501,Computer Networks,4,88
23CS105,Rahul Verma,5,Computer Science & Engineering,CS502,Artificial Intelligence,4,95
23CS105,Rahul Verma,5,Computer Science & Engineering,CS503,Software Engineering,3,82
23CS105,Rahul Verma,5,Computer Science & Engineering,CS504,Web Technologies,3,90
23CS105,Rahul Verma,5,Computer Science & Engineering,CS505,Machine Learning Lab,2,96
23CS106,Ananya Roy,5,Computer Science & Engineering,CS501,Computer Networks,4,92
23CS106,Ananya Roy,5,Computer Science & Engineering,CS502,Artificial Intelligence,4,89
23CS106,Ananya Roy,5,Computer Science & Engineering,CS503,Software Engineering,3,86
23CS106,Ananya Roy,5,Computer Science & Engineering,CS504,Web Technologies,3,94
23CS106,Ananya Roy,5,Computer Science & Engineering,CS505,Machine Learning Lab,2,98`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="campus_marks_sheet_template.csv"');
  return res.status(200).send(sampleCsv);
};
