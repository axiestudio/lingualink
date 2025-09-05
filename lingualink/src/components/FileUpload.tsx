"use client";

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, 
  X, 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  Archive,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface FileUploadProps {
  roomId: string;
  onFileUploaded?: (file: any, message: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface FilePreview {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
}

export default function FileUpload({ roomId, onFileUploaded, onError, disabled }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get file type category
  const getFileType = (file: File): FilePreview['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return 'archive';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  // Get file icon
  const getFileIcon = (type: FilePreview['type']) => {
    switch (type) {
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'document': return <FileText className="w-6 h-6" />;
      case 'archive': return <Archive className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList) => {
    const newFiles: FilePreview[] = [];

    Array.from(files).forEach((file) => {
      const fileType = getFileType(file);
      const filePreview: FilePreview = {
        file,
        type: fileType
      };

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          filePreview.preview = e.target?.result as string;
          setSelectedFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(filePreview);
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Upload each file
      for (const filePreview of selectedFiles) {
        const formData = new FormData();
        formData.append('file', filePreview.file);
        formData.append('roomId', roomId);
        formData.append('message', message || `📎 Shared a file: ${filePreview.file.name}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        console.log('✅ File uploaded successfully:', result);

        // Notify parent component
        onFileUploaded?.(result.file, result.message);
      }

      // Clear selection
      setSelectedFiles([]);
      setMessage('');
      
    } catch (error) {
      console.error('❌ File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        disabled={disabled || isUploading}
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Attach file"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* File Selection Modal */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50"
          >
            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  Drag and drop files here or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    browse
                  </button>
                </p>
              </div>
            </div>

            {/* Selected Files */}
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {selectedFiles.map((filePreview, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {filePreview.preview ? (
                      <img 
                        src={filePreview.preview} 
                        alt={filePreview.file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-500">
                        {getFileIcon(filePreview.type)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {filePreview.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message (optional)..."
              className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setSelectedFiles([])}
                className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                disabled={isUploading}
              >
                Cancel
              </button>

              <button
                onClick={uploadFiles}
                disabled={isUploading || selectedFiles.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
