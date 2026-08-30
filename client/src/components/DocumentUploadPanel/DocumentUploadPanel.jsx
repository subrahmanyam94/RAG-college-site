import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import api from '../../lib/api';
import { formatBytes } from '../../lib/utils';

const CATEGORIES = [
  'Admissions',
  'Departments',
  'Courses',
  'Fees',
  'Exams',
  'Academic Calendar',
  'Hostel',
  'Library',
  'Clubs',
  'Placements',
  'Scholarships',
  'Policies',
  'Events',
  'General',
];

export default function DocumentUploadPanel({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [department, setDepartment] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName);
      setUploadStatus(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024, // 15MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setUploadStatus(null);
    setStatusMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim() || file.name);
    formData.append('category', category);
    formData.append('department', department);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsUploading(false);
      setUploadStatus('success');
      setStatusMessage(
        `"${res.data.data.title}" uploaded! Document text extraction and vector indexing initiated.`
      );
      setFile(null);
      setTitle('');

      if (onUploadSuccess) {
        onUploadSuccess(res.data.data);
      }
    } catch (err) {
      setIsUploading(false);
      setUploadStatus('error');
      setStatusMessage(
        err.response?.data?.error || 'Failed to upload document. Please check file format and size.'
      );
    }
  };

  return (
    <div className="bg-white border border-amber-200/90 rounded-2xl p-6 shadow-md space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-amber-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-orange-600" />
            Upload Institutional Knowledge Document
          </h3>
          <p className="text-xs text-amber-900/70 mt-0.5">
            Supported formats: PDF, DOCX, TXT (Max 15MB). Automatically chunked and embedded into the vector index.
          </p>
        </div>
      </div>

      {/* Drag & Drop Box */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-orange-500 bg-orange-50/60'
              : 'border-amber-300 hover:border-orange-500 bg-amber-50/30'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-orange-600 mb-3 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">
            {isDragActive ? 'Drop the file here to upload' : 'Click to select or drag and drop document'}
          </p>
          <p className="text-xs text-amber-900/60 font-medium">
            PDF, DOCX, DOC, or TXT up to 15MB
          </p>

          {fileRejections.length > 0 && (
            <p className="text-xs text-red-600 mt-3 font-medium">
              Invalid file. Please provide a PDF, DOCX, or TXT file under 15MB.
            </p>
          )}
        </div>
      ) : (
        /* Selected File Card */
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/60 border border-amber-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
              <p className="text-xs text-amber-900/70">{formatBytes(file.size)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFile(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition-colors"
            title="Remove selected file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metadata Form */}
      {file && (
        <form onSubmit={handleUpload} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Academic Calendar 2026-2027"
                required
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Knowledge Category Tag
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department / Authority
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Dean of Students, Controller of Examinations, Admissions Desk"
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Text & Generating Embeddings...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Index Document</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Upload Feedback */}
      {uploadStatus === 'success' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
