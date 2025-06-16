import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUploader({ onFileSelect, disabled = false }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type - only .pptx supported for real processing
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    const isValidExtension = file.name.toLowerCase().endsWith('.pptx');
    
    if (!validTypes.includes(file.type) && !isValidExtension) {
      return {
        isValid: false,
        error: 'Please select a valid PowerPoint file (.pptx format only)'
      };
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 100MB'
      };
    }

    // Check if file is not empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File cannot be empty'
      };
    }

    return { isValid: true };
  };

  const handleFileSelection = useCallback((file: File) => {
    if (disabled) return;

    setError('');
    
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect, disabled]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection, disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* File Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${dragActive 
            ? 'border-blue-400 bg-blue-500/10' 
            : error 
              ? 'border-red-400 bg-red-500/10'
              : selectedFile
                ? 'border-green-400 bg-green-500/10'
                : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        {/* Hidden file input */}
        <input
          id="file-input"
          type="file"
          accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload Icon */}
        <div className="flex justify-center mb-4">
          {error ? (
            <AlertCircle className="w-12 h-12 text-red-400" />
          ) : selectedFile ? (
            <CheckCircle className="w-12 h-12 text-green-400" />
          ) : (
            <Upload className={`w-12 h-12 transition-colors ${
              dragActive ? 'text-blue-400' : 'text-gray-400'
            }`} />
          )}
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          {error ? (
            <>
              <p className="text-red-400 font-medium">Upload Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </>
          ) : selectedFile ? (
            <>
              <p className="text-green-400 font-medium">File Ready</p>
              <p className="text-green-300 text-sm">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            </>
          ) : (
            <>
              <p className="text-white font-medium">
                {dragActive ? 'Drop your PPTX file here' : 'Choose or drag PPTX file'}
              </p>
              <p className="text-gray-400 text-sm">
                Supports .pptx files up to 100MB with REAL text extraction
              </p>
            </>
          )}
        </div>

        {/* Upload Button */}
        {!selectedFile && !error && (
          <div className="mt-6">
            <Button
              variant="outline"
              className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
              disabled={disabled}
            >
              <FileText className="w-4 h-4 mr-2" />
              Select PPTX File
            </Button>
          </div>
        )}

        {/* Retry Button */}
        {error && (
          <div className="mt-6">
            <Button
              onClick={() => {
                setError('');
                setSelectedFile(null);
              }}
              variant="outline"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              disabled={disabled}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* File Info */}
      {selectedFile && !error && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">{selectedFile.name}</p>
                <p className="text-green-300 text-sm">
                  Size: {formatFileSize(selectedFile.size)} • Ready for processing
                </p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>✅ Supports PowerPoint 2007+ (.pptx format only)</p>
        <p>🔒 Files are processed securely and not stored permanently</p>
        <p>⚡ Large files (50MB+) may take a few minutes to process</p>
        <p>🔧 Preserves original formatting and file structure</p>
        <p>✨ Up to 100MB files with REAL text extraction</p>
      </div>
    </div>
  );
}