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
  CheckCircle,
  Plus,
  Eye,
  Download,
  Camera,
  Folder
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
  // Add custom styles for scrollbar
  const customScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `;
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
      {/* Custom Scrollbar Styles */}
      <style jsx>{customScrollbarStyles}</style>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        disabled={disabled || isUploading}
      />

      {/* Upload Button - Modern Design */}
      <div className="relative">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="group relative p-2.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          title="Attach files"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="relative">
              <Paperclip className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          )}
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Attach files
        </div>
      </div>

      {/* File Selection Modal - Enhanced Design */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-2xl shadow-2xl border border-slate-200/50 p-6 z-50 backdrop-blur-sm"
            style={{ minWidth: '400px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Folder className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Upload Files</h3>
                  <p className="text-xs text-slate-500">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFiles([])}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Enhanced Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 mb-6 transition-all duration-300 ${
                dragActive
                  ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105'
                  : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <motion.div
                  animate={dragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    dragActive ? 'bg-blue-100' : 'bg-slate-100'
                  }`}
                >
                  {dragActive ? (
                    <Upload className="w-8 h-8 text-blue-500" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400" />
                  )}
                </motion.div>
                <h4 className={`font-medium mb-2 ${dragActive ? 'text-blue-700' : 'text-slate-700'}`}>
                  {dragActive ? 'Drop files here!' : 'Upload your files'}
                </h4>
                <p className="text-sm text-slate-500 mb-3">
                  Drag and drop files here or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600 font-medium underline transition-colors"
                  >
                    browse from device
                  </button>
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    Images
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Videos
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Documents
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced File Preview Cards */}
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
              {selectedFiles.map((filePreview, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex items-center gap-4 p-3 bg-gradient-to-r from-slate-50 to-gray-50 hover:from-blue-50 hover:to-indigo-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-all duration-200"
                >
                  {/* Enhanced File Icon/Preview */}
                  <div className="flex-shrink-0 relative">
                    {filePreview.preview ? (
                      <div className="relative">
                        <img
                          src={filePreview.preview}
                          alt={filePreview.file.name}
                          className="w-12 h-12 object-cover rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                        {getFileIcon(filePreview.type)}
                      </div>
                    )}
                    {/* File type badge */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{selectedFiles.length}</span>
                    </div>
                  </div>

                  {/* Enhanced File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate mb-1">
                      {filePreview.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 bg-slate-200 rounded-full">
                        {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full capitalize">
                        {filePreview.type}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {filePreview.preview && (
                      <button
                        onClick={() => window.open(filePreview.preview, '_blank')}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Message Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Add a message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write something about these files..."
                className="w-full p-3 border border-slate-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-slate-400">
                  {message.length}/500 characters
                </span>
                {message && (
                  <button
                    onClick={() => setMessage('')}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-between items-center gap-3">
              <button
                onClick={() => setSelectedFiles([])}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                disabled={isUploading}
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-1"
                  disabled={isUploading}
                >
                  <Plus className="w-4 h-4" />
                  Add More
                </button>

                <button
                  onClick={uploadFiles}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
