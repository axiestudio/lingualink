"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Eye, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  ExternalLink,
  X
} from 'lucide-react';

interface FileMetadata {
  originalName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadPath: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface FileMessageProps {
  fileMetadata: FileMetadata;
  message: string;
  showPreview?: boolean;
  className?: string;
}

export default function FileMessage({ fileMetadata, message, showPreview = true, className = '' }: FileMessageProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get file type category
  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'document': return <FileText className="w-6 h-6" />;
      case 'archive': return <Archive className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileMetadata.uploadPath;
    link.download = fileMetadata.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileType = getFileType(fileMetadata.fileType);
  const isImage = fileType === 'image';
  const isVideo = fileType === 'video';
  const isAudio = fileType === 'audio';

  return (
    <div className={`file-message ${className}`}>
      {/* Message Text (if any) */}
      {message && !message.startsWith('📎 Shared a file:') && (
        <p className="text-sm text-slate-700 mb-2">{message}</p>
      )}

      {/* File Attachment */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-w-sm">
        {/* Image Preview */}
        {isImage && showPreview && !imageError && (
          <div className="mb-3">
            <img
              src={fileMetadata.uploadPath}
              alt={fileMetadata.originalName}
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsPreviewOpen(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Video Preview */}
        {isVideo && showPreview && (
          <div className="mb-3">
            <video
              src={fileMetadata.uploadPath}
              className="w-full h-48 object-cover rounded-lg"
              controls
              preload="metadata"
            />
          </div>
        )}

        {/* Audio Preview */}
        {isAudio && showPreview && (
          <div className="mb-3">
            <audio
              src={fileMetadata.uploadPath}
              className="w-full"
              controls
              preload="metadata"
            />
          </div>
        )}

        {/* File Info */}
        <div className="flex items-center gap-3">
          {/* File Icon */}
          <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-slate-200">
            <div className="text-slate-500">
              {getFileIcon(fileType)}
            </div>
          </div>

          {/* File Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate" title={fileMetadata.originalName}>
              {fileMetadata.originalName}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{formatFileSize(fileMetadata.fileSize)}</span>
              <span>•</span>
              <span>{getFileExtension(fileMetadata.originalName)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Preview Button (for images) */}
            {isImage && (
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Open in New Tab Button */}
            <button
              onClick={() => window.open(fileMetadata.uploadPath, '_blank')}
              className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && isImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={fileMetadata.uploadPath}
              alt={fileMetadata.originalName}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
              <p className="font-medium truncate">{fileMetadata.originalName}</p>
              <p className="text-sm text-gray-300">{formatFileSize(fileMetadata.fileSize)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
