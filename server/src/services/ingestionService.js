const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class IngestionService {
  /**
   * Extract plain text and metadata from uploaded file based on its extension
   */
  async extractText(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf' || mimeType === 'application/pdf') {
      return this.extractFromPdf(filePath);
    } else if (
      ext === '.docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.extractFromDocx(filePath);
    } else if (ext === '.txt' || mimeType === 'text/plain') {
      return this.extractFromTxt(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  async extractFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const pages = [];
    const totalPages = pdfData.numpages || 1;
    // pdf-parse text contains form-feed \f or page separators
    const rawPages = pdfData.text.split(/\f|\n{4,}/);

    if (rawPages.length > 1) {
      rawPages.forEach((pageText, idx) => {
        const cleaned = this.cleanText(pageText);
        if (cleaned.length > 20) {
          pages.push({
            pageNumber: idx + 1,
            text: cleaned,
          });
        }
      });
    }

    // Fallback if pages couldn't be cleanly split by form feed
    if (pages.length === 0) {
      const cleaned = this.cleanText(pdfData.text);
      pages.push({
        pageNumber: 1,
        text: cleaned,
      });
    }

    return {
      fullText: this.cleanText(pdfData.text),
      pages,
      totalPages,
    };
  }

  async extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    const cleaned = this.cleanText(result.value);

    // Approximate pages by ~2500 characters per page
    const approximatePages = [];
    const chunkSize = 2500;
    for (let i = 0; i < cleaned.length; i += chunkSize) {
      approximatePages.push({
        pageNumber: Math.floor(i / chunkSize) + 1,
        text: cleaned.slice(i, i + chunkSize),
      });
    }

    if (approximatePages.length === 0) {
      approximatePages.push({ pageNumber: 1, text: cleaned });
    }

    return {
      fullText: cleaned,
      pages: approximatePages,
      totalPages: approximatePages.length,
    };
  }

  async extractFromTxt(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const cleaned = this.cleanText(content);
    return {
      fullText: cleaned,
      pages: [{ pageNumber: 1, text: cleaned }],
      totalPages: 1,
    };
  }

  /**
   * Sanitize text by removing null bytes, normalizing line breaks and excessive whitespace
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\0/g, '') // remove null bytes
      .replace(/\r\n/g, '\n') // normalize newlines
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ') // collapse horizontal whitespace
      .replace(/\n{3,}/g, '\n\n') // maximum 2 consecutive newlines
      .trim();
  }

  /**
   * Recursive chunking with overlap preserving sentence and paragraph integrity
   */
  chunkDocument(pagesData, maxChunkSize = 750, overlap = 120) {
    const chunks = [];
    let chunkCounter = 0;

    for (const page of pagesData.pages) {
      const pageText = page.text;
      const pageNumber = page.pageNumber;

      if (!pageText || pageText.length < 30) continue;

      // Split page text into paragraphs
      const paragraphs = pageText.split(/\n\n+/);
      let currentChunk = '';

      for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;

        if (currentChunk.length + trimmedPara.length + 1 <= maxChunkSize) {
          currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
        } else {
          // If currentChunk is populated, push it
          if (currentChunk.length > 0) {
            chunks.push({
              chunkIndex: chunkCounter++,
              text: currentChunk,
              pageNumber,
              tokenCount: Math.ceil(currentChunk.length / 4),
            });

            // Keep overlap from end of currentChunk
            const overlapText = currentChunk.slice(-overlap);
            currentChunk = overlapText + '\n\n' + trimmedPara;
          } else {
            // Paragraph itself exceeds maxChunkSize, split by sentences
            const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmedPara];
            for (const sentence of sentences) {
              if (currentChunk.length + sentence.length <= maxChunkSize) {
                currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
              } else {
                if (currentChunk.length > 0) {
                  chunks.push({
                    chunkIndex: chunkCounter++,
                    text: currentChunk,
                    pageNumber,
                    tokenCount: Math.ceil(currentChunk.length / 4),
                  });
                  const overlapText = currentChunk.slice(-overlap);
                  currentChunk = overlapText + ' ' + sentence.trim();
                } else {
                  // Single sentence larger than maxChunkSize, hard slice
                  let remaining = sentence.trim();
                  while (remaining.length > 0) {
                    const slice = remaining.slice(0, maxChunkSize);
                    chunks.push({
                      chunkIndex: chunkCounter++,
                      text: slice,
                      pageNumber,
                      tokenCount: Math.ceil(slice.length / 4),
                    });
                    remaining = remaining.slice(maxChunkSize - overlap);
                    if (remaining.length <= overlap) break;
                  }
                  currentChunk = '';
                }
              }
            }
          }
        }
      }

      if (currentChunk.trim().length > 30) {
        chunks.push({
          chunkIndex: chunkCounter++,
          text: currentChunk.trim(),
          pageNumber,
          tokenCount: Math.ceil(currentChunk.length / 4),
        });
      }
    }

    return chunks;
  }
}

module.exports = new IngestionService();
