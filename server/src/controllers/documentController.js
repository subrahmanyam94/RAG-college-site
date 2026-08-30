const documentService = require('../services/documentService');

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file uploaded. Please select a PDF, DOCX, or TXT file.',
      });
    }

    const { title, category, department } = req.body;
    const document = await documentService.processDocumentUpload({
      file: req.file,
      title,
      category,
      department,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and queuing for embedding & indexing',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const listDocuments = async (req, res, next) => {
  try {
    const { page, limit, category, status, search } = req.query;
    const result = await documentService.listDocuments({
      page,
      limit,
      category,
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.documents,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await documentService.getDocumentById(id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const reindexDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedDoc = await documentService.reindexDocument(id);

    return res.status(200).json({
      success: true,
      message: 'Document re-indexed successfully',
      data: updatedDoc,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await documentService.deleteDocument(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getMetrics = async (req, res, next) => {
  try {
    const metrics = await documentService.getDashboardMetrics();
    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  getDocument,
  reindexDocument,
  deleteDocument,
  getMetrics,
};
