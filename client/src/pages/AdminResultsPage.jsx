import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell/AppShell';
import api from '../lib/api';
import {
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Award,
  GraduationCap,
  Users,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'manual' | 'records'
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  // Sheet Upload States
  const [csvText, setCsvText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Manual Entry States
  const [manualForm, setManualForm] = useState({
    rollNumber: '',
    studentName: '',
    semester: 5,
    department: 'Computer Science & Engineering',
    academicYear: '2025-2026',
    subjects: [
      { courseCode: 'CS501', courseName: 'Computer Networks', credits: 4, marks: 88 },
      { courseCode: 'CS502', courseName: 'Artificial Intelligence', credits: 4, marks: 92 },
      { courseCode: 'CS503', courseName: 'Software Engineering', credits: 3, marks: 85 },
    ],
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualStatus, setManualStatus] = useState(null);

  // Test Query State
  const [testQuery, setTestQuery] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSemester !== 'All') params.semester = selectedSemester;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/results', { params });
      setResults(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch exam results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedSemester, searchQuery]);

  // Statistics calculation
  const totalRecords = results.length;
  const uniqueStudents = new Set(results.map((r) => r.rollNumber)).size;
  const avgSgpa =
    totalRecords > 0
      ? (results.reduce((acc, r) => acc + (r.sgpa || 0), 0) / totalRecords).toFixed(2)
      : '0.00';
  const passCount = results.filter((r) => r.resultStatus === 'Pass').length;
  const passRate = totalRecords > 0 ? Math.round((passCount / totalRecords) * 100) : 0;

  // Handle Sheet File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result || '');
    };
    reader.readAsText(file);
  };

  const submitCsvSheet = async () => {
    if (!csvText.trim()) {
      setUploadStatus({ type: 'error', message: 'Please upload a CSV file or paste CSV text below.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    try {
      const res = await api.post('/results/upload-sheet', { csvText });
      setUploadStatus({
        type: 'success',
        message: res.data.message || 'Marks sheet parsed and indexed successfully!',
      });
      setCsvText('');
      setSelectedFile(null);
      fetchResults();
    } catch (err) {
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to parse and upload marks sheet.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Manual Form Subjects
  const addSubjectRow = () => {
    setManualForm({
      ...manualForm,
      subjects: [
        ...manualForm.subjects,
        { courseCode: '', courseName: '', credits: 3, marks: 75 },
      ],
    });
  };

  const removeSubjectRow = (index) => {
    const updated = manualForm.subjects.filter((_, i) => i !== index);
    setManualForm({ ...manualForm, subjects: updated });
  };

  const updateSubjectRow = (index, field, value) => {
    const updated = [...manualForm.subjects];
    updated[index][field] = field === 'credits' || field === 'marks' ? parseFloat(value) || 0 : value;
    setManualForm({ ...manualForm, subjects: updated });
  };

  const submitManualResult = async (e) => {
    e.preventDefault();
    if (!manualForm.rollNumber || !manualForm.studentName || manualForm.subjects.length === 0) {
      setManualStatus({ type: 'error', message: 'Please fill out roll number, student name, and at least 1 subject.' });
      return;
    }

    setIsSubmittingManual(true);
    setManualStatus(null);
    try {
      const res = await api.post('/results', manualForm);
      setManualStatus({
        type: 'success',
        message: `Saved record for ${manualForm.studentName} (${manualForm.rollNumber.toUpperCase()})!`,
      });
      fetchResults();
    } catch (err) {
      setManualStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to save student record.',
      });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Delete Record
  const deleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student academic record?')) return;
    try {
      await api.delete(`/results/${id}`);
      fetchResults();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete record.');
    }
  };

  // Download Sample CSV
  const downloadSampleTemplate = () => {
    window.open(`${api.defaults.baseURL}/results/template/csv`, '_blank');
  };

  // Live Test Query
  const runLiveTest = async () => {
    if (!testQuery.trim()) return;
    setIsTesting(true);
    setTestResponse(null);
    try {
      const res = await api.post('/chat/query', { question: testQuery });
      setTestResponse(res.data.data);
    } catch (err) {
      setTestResponse({ answer: 'Error executing test query: ' + (err.response?.data?.error || err.message) });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AppShell currentPath="/admin/results">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Student Marks Sheets & Exam Results
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Upload official university tabulation sheets (CSV) or enter student grades directly. Uploaded records are instantly indexed in MongoDB and accessible by the AI assistant in student chat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadSampleTemplate}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-amber-300 text-amber-950 hover:bg-amber-50/80 shadow-2xs transition-all"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>Sample CSV Template</span>
            </button>
            <button
              onClick={fetchResults}
              className="p-2 rounded-xl bg-white border border-amber-200 text-slate-600 hover:text-orange-950 hover:bg-amber-50/60 shadow-2xs transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100/80 border border-amber-300 flex items-center justify-center text-amber-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Exam Records</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalRecords}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-100/80 border border-orange-300 flex items-center justify-center text-orange-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unique Students</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{uniqueStudents}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100/80 border border-amber-300 flex items-center justify-center text-amber-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average SGPA</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{avgSgpa}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100/80 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{passRate}%</h3>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-amber-200">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'sheet'
                ? 'border-orange-600 text-orange-950 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Marks Sheet (CSV)</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-orange-600 text-orange-950 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Manual Result Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'records'
                ? 'border-orange-600 text-orange-950 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Live Records Table ({totalRecords})</span>
          </button>
        </div>

        {/* TAB 1: UPLOAD MARKS SHEET */}
        {activeTab === 'sheet' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-amber-200/90 shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Upload University Marks Sheet (CSV)</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Drag and drop your spreadsheet or paste comma-separated values. The parser automatically groups subjects by roll number, computes letter grades, grade points, SGPA, and pass/fail status.
                  </p>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-300 text-orange-800 hover:bg-amber-100 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              {/* Upload Drag & Drop Box */}
              <div className="border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center bg-amber-50/30 hover:bg-amber-50/60 transition-all flex flex-col items-center justify-center">
                <FileSpreadsheet className="w-10 h-10 text-orange-600 mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Select or drop a CSV marks sheet'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Supports standard CSV files (.csv)</p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="sheetFileInput"
                />
                <label
                  htmlFor="sheetFileInput"
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-amber-300 text-orange-950 hover:bg-amber-50 cursor-pointer shadow-2xs"
                >
                  Choose CSV File
                </label>
              </div>

              {/* Paste CSV text area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Or Paste CSV / Tabulation Text:</span>
                  <span className="text-[11px] font-normal text-slate-500">Header format: RollNumber, StudentName, Semester, Department, CourseCode, CourseName, Credits, Marks</span>
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`RollNumber,StudentName,Semester,Department,CourseCode,CourseName,Credits,Marks\n23CS105,Rahul Verma,5,Computer Science & Engineering,CS501,Computer Networks,4,88\n23CS105,Rahul Verma,5,Computer Science & Engineering,CS502,Artificial Intelligence,4,95\n23CS105,Rahul Verma,5,Computer Science & Engineering,CS503,Software Engineering,3,82\n23CS105,Rahul Verma,5,Computer Science & Engineering,CS504,Web Technologies,3,90\n23CS105,Rahul Verma,5,Computer Science & Engineering,CS505,Machine Learning Lab,2,96`}
                  className="w-full p-3.5 rounded-xl border border-amber-200 bg-[#FDFBF7] font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Upload Status Banner */}
              {uploadStatus && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
                    uploadStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-300 text-red-950'
                  }`}
                >
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <span className="font-medium">{uploadStatus.message}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCsvText('');
                    setSelectedFile(null);
                    setUploadStatus(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={submitCsvSheet}
                  disabled={isUploading || !csvText.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-md transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Parsing & Indexing...' : 'Parse & Commit Sheet to Database'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL RESULT ENTRY */}
        {activeTab === 'manual' && (
          <form onSubmit={submitManualResult} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-amber-200/90 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900">Add or Edit Student Exam Result</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Roll / Hall Ticket Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 23CS105"
                    value={manualForm.rollNumber}
                    onChange={(e) => setManualForm({ ...manualForm, rollNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={manualForm.studentName}
                    onChange={(e) => setManualForm({ ...manualForm, studentName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-medium focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Semester *</label>
                  <select
                    value={manualForm.semester}
                    onChange={(e) => setManualForm({ ...manualForm, semester: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-semibold focus:ring-2 focus:ring-orange-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department & Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={manualForm.department}
                    onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Academic Year</label>
                  <input
                    type="text"
                    value={manualForm.academicYear}
                    onChange={(e) => setManualForm({ ...manualForm, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Subject Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Subject Marks ({manualForm.subjects.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 border border-amber-300 text-orange-800 hover:bg-amber-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {manualForm.subjects.map((sub, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                    >
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="CS501"
                          value={sub.courseCode}
                          onChange={(e) => updateSubjectRow(idx, 'courseCode', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs font-mono font-bold uppercase"
                        />
                      </div>
                      <div className="md:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Course Title"
                          value={sub.courseName}
                          onChange={(e) => updateSubjectRow(idx, 'courseName', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs font-medium"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          min={1}
                          max={6}
                          placeholder="Credits"
                          value={sub.credits}
                          onChange={(e) => updateSubjectRow(idx, 'credits', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs font-bold"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Marks"
                          value={sub.marks}
                          onChange={(e) => updateSubjectRow(idx, 'marks', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs font-bold"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeSubjectRow(idx)}
                          disabled={manualForm.subjects.length <= 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {manualStatus && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
                    manualStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-300 text-red-950'
                  }`}
                >
                  {manualStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <span className="font-medium">{manualStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-md transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmittingManual ? 'Saving Record...' : 'Save & Index Academic Record'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: LIVE DATABASE RECORDS TABLE */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Semester Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {['All', '1', '2', '3', '4', '5', '6', '7', '8'].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedSemester === sem
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-amber-50/70 text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    {sem === 'All' ? 'All Semesters' : `Sem ${sem}`}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search roll number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-amber-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl border border-amber-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-100/80 to-amber-50 border-b border-amber-200 text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Roll Number</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Semester</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">SGPA</th>
                      <th className="py-3.5 px-4">CGPA</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/80 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-orange-600 mb-2" />
                          <span>Loading academic records...</span>
                        </td>
                      </tr>
                    ) : results.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No student exam records match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      results.map((rec) => {
                        const isExpanded = expandedRecordId === rec._id;
                        return (
                          <React.Fragment key={rec._id}>
                            <tr className="hover:bg-amber-50/40 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-orange-950">
                                {rec.rollNumber}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">
                                {rec.studentName}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-amber-900">
                                Semester {rec.semester}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                                {rec.department}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                                {rec.sgpa?.toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                {rec.cgpa?.toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    rec.resultStatus === 'Pass'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-red-100 text-red-800 border border-red-300'
                                  }`}
                                >
                                  {rec.resultStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setExpandedRecordId(isExpanded ? null : rec._id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 inline-flex items-center gap-1"
                                >
                                  <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                                <button
                                  onClick={() => deleteRecord(rec._id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 inline-flex"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Subject Breakdown */}
                            {isExpanded && (
                              <tr className="bg-amber-50/60">
                                <td colSpan={8} className="p-4">
                                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                                      <h4 className="text-xs font-bold text-slate-900">
                                        Subject Performance Breakdown ({rec.subjects?.length || 0} Registered)
                                      </h4>
                                      <span className="text-[11px] text-slate-500 font-mono">
                                        Credits: {rec.earnedCredits} / {rec.totalCredits}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                      {rec.subjects?.map((sub, sIdx) => (
                                        <div
                                          key={sIdx}
                                          className="p-3 rounded-lg border border-amber-100 bg-[#FDFBF7] flex items-center justify-between"
                                        >
                                          <div>
                                            <p className="text-xs font-bold text-slate-800 font-mono">
                                              {sub.courseCode}
                                            </p>
                                            <p className="text-[11px] text-slate-600 truncate max-w-[160px]">
                                              {sub.courseName}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs font-bold text-orange-950 font-mono">
                                              {sub.marks} / 100
                                            </p>
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded">
                                              Grade {sub.grade}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Live Chat Test & Verification Console */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Live Chat Retrieval Verification Box
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            Test how the AI assistant queries and reasons over the live marks sheets in real-time.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. In which subject did roll number 23CS105 top in semester 5?"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runLiveTest()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-amber-200 text-xs font-medium bg-white focus:ring-2 focus:ring-orange-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={runLiveTest}
              disabled={isTesting || !testQuery.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs"
            >
              {isTesting ? 'Querying...' : 'Test AI Query'}
            </button>
          </div>

          {testResponse && (
            <div className="p-4 rounded-xl bg-white border border-amber-200 text-xs text-slate-800 space-y-2 animate-fade-in shadow-2xs">
              <div className="font-bold text-orange-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>AI Grounded Answer:</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-700">
                {testResponse.answer}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
