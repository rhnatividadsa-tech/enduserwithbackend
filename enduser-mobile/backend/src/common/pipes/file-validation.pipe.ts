import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validates uploaded files for:
 * 1. Presence (file is required)
 * 2. MIME type (only JPG, PNG, PDF)
 * 3. File size (max 10 MB)
 *
 * Also performs a magic-byte check to prevent MIME spoofing
 * (e.g. renaming a .exe to .jpg).
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Verification document is required.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed: JPG, PNG, PDF.`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
      );
    }

    // Magic-byte verification to prevent MIME spoofing
    if (!this.verifyMagicBytes(file)) {
      throw new BadRequestException(
        'File content does not match its declared type. Upload rejected.',
      );
    }

    return file;
  }

  /**
   * Checks the first few bytes of the file buffer against known
   * magic numbers.  This prevents an attacker from renaming a
   * malicious file to .jpg/.png/.pdf.
   */
  private verifyMagicBytes(file: Express.Multer.File): boolean {
    const buf = file.buffer;
    if (!buf || buf.length < 4) return false;

    // JPEG: starts with FF D8 FF
    if (file.mimetype === 'image/jpeg') {
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    }

    // PNG: starts with 89 50 4E 47
    if (file.mimetype === 'image/png') {
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
      );
    }

    // PDF: starts with %PDF (25 50 44 46)
    if (file.mimetype === 'application/pdf') {
      return (
        buf[0] === 0x25 &&
        buf[1] === 0x50 &&
        buf[2] === 0x44 &&
        buf[3] === 0x46
      );
    }

    return false;
  }
}
