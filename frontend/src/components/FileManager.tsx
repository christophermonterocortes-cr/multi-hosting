import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Folder, 
  File, 
  Upload, 
  FileArchive, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  RefreshCw,
  Save,
  X,
  FileCode,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  Home,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { FileItem } from '../types';

interface FileManagerProps {
  projectId: string;
}

interface UploadQueueItem {
  file: File;
  relativePath: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ projectId }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const loadFiles = async (subPath = currentPath) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${projectId}/files`, {
        params: { path: subPath }
      });
      setFiles(res.data.files);
      setCurrentPath(res.data.currentPath !== undefined ? res.data.currentPath : subPath);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to list files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles('');
  }, [projectId]);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleOpenFolder = (folderName: string) => {
    const nextPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    loadFiles(nextPath);
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    loadFiles(parts.join('/'));
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      loadFiles('');
      return;
    }
    const parts = currentPath.split('/');
    const targetPath = parts.slice(0, index + 1).join('/');
    loadFiles(targetPath);
  };

  const handleOpenFile = async (file: FileItem) => {
    try {
      const res = await api.get(`/projects/${projectId}/files/content`, {
        params: { path: file.relativePath }
      });
      setEditingFile({
        path: file.relativePath,
        name: file.name,
        content: res.data.content
      });
    } catch (err: any) {
      showToast(`Cannot open file: ${err.response?.data?.error || err.message}`, true);
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}/files/content`, {
        path: editingFile.path,
        content: editingFile.content
      });
      setEditingFile(null);
      showToast(`Saved ${editingFile.name} successfully!`);
      loadFiles();
    } catch (err: any) {
      showToast(`Failed to save file: ${err.response?.data?.error || err.message}`, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) return;
    try {
      await api.delete(`/projects/${projectId}/files`, {
        params: { path: file.relativePath }
      });
      showToast(`Deleted ${file.name}`);
      loadFiles();
    } catch (err: any) {
      showToast(`Delete failed: ${err.response?.data?.error || err.message}`, true);
    }
  };

  // Helper to execute multi-file upload with relative subpaths
  const uploadBatch = async (items: UploadQueueItem[]) => {
    if (items.length === 0) return;

    setLoading(true);
    setUploadProgress(`Uploading ${items.length} item(s)...`);

    try {
      const formData = new FormData();
      formData.append('targetPath', currentPath);

      const relativePaths: string[] = [];
      items.forEach((item) => {
        formData.append('files', item.file);
        relativePaths.push(item.relativePath);
      });

      formData.append('relativePaths', JSON.stringify(relativePaths));

      const res = await api.post(`/projects/${projectId}/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(res.data.message || `Uploaded ${items.length} file(s) successfully`);
      loadFiles();
    } catch (err: any) {
      showToast(`Upload failed: ${err.response?.data?.error || err.message}`, true);
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  };

  // 1. Standard File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const queue: UploadQueueItem[] = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const f = uploadedFiles[i];
      queue.push({
        file: f,
        relativePath: f.name
      });
    }

    await uploadBatch(queue);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Folder Upload via webkitdirectory input
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const queue: UploadQueueItem[] = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const f = uploadedFiles[i];
      // webkitRelativePath gives e.g. "my-folder/css/style.css"
      const relPath = f.webkitRelativePath || f.name;
      queue.push({
        file: f,
        relativePath: relPath
      });
    }

    await uploadBatch(queue);
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // 3. ZIP Upload & Automatic Extraction
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipFile = e.target.files?.[0];
    if (!zipFile) return;

    const formData = new FormData();
    formData.append('targetPath', currentPath);
    formData.append('zipFile', zipFile);

    try {
      setLoading(true);
      setUploadProgress(`Extracting ${zipFile.name}...`);
      const res = await api.post(`/projects/${projectId}/files/upload-zip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.data.message || `ZIP extracted successfully!`);
      loadFiles();
    } catch (err: any) {
      showToast(`ZIP upload/extraction failed: ${err.response?.data?.error || err.message}`, true);
    } finally {
      if (zipInputRef.current) zipInputRef.current.value = '';
      setUploadProgress(null);
      setLoading(false);
    }
  };

  // 4. Recursive Drag and Drop Directory Traversal
  const traverseEntry = async (entry: any, basePath = ''): Promise<UploadQueueItem[]> => {
    const items: UploadQueueItem[] = [];

    if (entry.isFile) {
      const file: File = await new Promise((resolve, reject) => {
        entry.file(resolve, reject);
      });
      const relPath = basePath ? `${basePath}/${file.name}` : file.name;
      items.push({ file, relativePath: relPath });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const nextBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      const readAllEntries = async (): Promise<any[]> => {
        let allEntries: any[] = [];
        let readMore = true;
        while (readMore) {
          const entries: any[] = await new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
          if (entries.length === 0) {
            readMore = false;
          } else {
            allEntries = allEntries.concat(entries);
          }
        }
        return allEntries;
      };

      const entries = await readAllEntries();
      for (const childEntry of entries) {
        const nestedItems = await traverseEntry(childEntry, nextBasePath);
        items.push(...nestedItems);
      }
    }

    return items;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const dataTransferItems = e.dataTransfer.items;
    const queue: UploadQueueItem[] = [];

    if (dataTransferItems && dataTransferItems.length > 0) {
      for (let i = 0; i < dataTransferItems.length; i++) {
        const item = dataTransferItems[i];
        if (typeof item.webkitGetAsEntry === 'function') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            const nested = await traverseEntry(entry);
            queue.push(...nested);
          }
        } else if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) queue.push({ file: f, relativePath: f.name });
        }
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const f = e.dataTransfer.files[i];
        queue.push({ file: f, relativePath: (f as any).webkitRelativePath || f.name });
      }
    }

    if (queue.length > 0) {
      await uploadBatch(queue);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const dirPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
    try {
      await api.post(`/projects/${projectId}/files/mkdir`, { path: dirPath });
      setNewFolderName('');
      setShowNewFolder(false);
      showToast(`Created folder: ${newFolderName}`);
      loadFiles();
    } catch (err: any) {
      showToast(`Failed to create directory: ${err.response?.data?.error || err.message}`, true);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const filePath = currentPath ? `${currentPath}/${newFileName.trim()}` : newFileName.trim();
    try {
      await api.put(`/projects/${projectId}/files/content`, { path: filePath, content: '' });
      setNewFileName('');
      setShowNewFile(false);
      showToast(`Created file: ${newFileName}`);
      loadFiles();
    } catch (err: any) {
      showToast(`Failed to create file: ${err.response?.data?.error || err.message}`, true);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) return <Folder className="h-5 w-5 text-brand-500 fill-brand-500/20" />;
    const ext = file.extension.toLowerCase();
    if (['html', 'htm', 'php', 'js', 'jsx', 'ts', 'tsx', 'css', 'json', 'sql'].includes(ext)) {
      return <FileCode className="h-5 w-5 text-purple-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp', 'ico'].includes(ext)) {
      return <ImageIcon className="h-5 w-5 text-emerald-500" />;
    }
    if (['zip', 'tar', 'gz', 'rar'].includes(ext)) {
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    }
    return <FileText className="h-5 w-5 text-slate-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const breadcrumbParts = currentPath ? currentPath.split('/') : [];

  return (
    <div 
      className="space-y-4 relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Full-Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-cyan-600/90 backdrop-blur-md border-2 border-dashed border-white rounded-3xl flex flex-col items-center justify-center text-white p-8 animate-fade-in pointer-events-none">
          <UploadCloud className="h-16 w-16 mb-4 animate-bounce text-white" />
          <h3 className="text-2xl font-black mb-1">Drop Files or Folders Here</h3>
          <p className="text-white/90 text-xs sm:text-sm text-center max-w-md">
            Nested folders, assets (CSS, JS, images), and source files will be uploaded preserving full directory structure.
          </p>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 dark:bg-[#0c1322]/95 p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs backdrop-blur-xl">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 overflow-x-auto max-w-full font-mono">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="flex items-center space-x-1 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Home className="h-3.5 w-3.5" />
            <span>root</span>
          </button>

          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium truncate max-w-[150px] ${
                  index === breadcrumbParts.length - 1 ? 'text-brand-600 dark:text-brand-400 font-semibold' : ''
                }`}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {currentPath && (
            <button
              onClick={handleNavigateUp}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Go Up One Level"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </button>
          )}

          <button
            onClick={() => loadFiles()}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Refresh Files"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* New File Button */}
          <button
            onClick={() => setShowNewFile(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New File
          </button>

          {/* New Folder Button */}
          <button
            onClick={() => setShowNewFolder(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1" />
            New Folder
          </button>

          {/* Upload Files */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-rack flex items-center gap-1"
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            UPLOAD FILES
          </button>

          {/* Upload Folder */}
          <input
            type="file"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            ref={folderInputRef}
            onChange={handleFolderUpload}
            className="hidden"
          />
          <button
            onClick={() => folderInputRef.current?.click()}
            className="btn-rack btn-rack-primary flex items-center gap-1"
            title="Upload whole directory tree"
          >
            <FolderPlus className="h-3.5 w-3.5 mr-1" />
            UPLOAD DIRECTORY
          </button>

          {/* Upload ZIP */}
          <input
            type="file"
            accept=".zip"
            ref={zipInputRef}
            onChange={handleZipUpload}
            className="hidden"
          />
          <button
            onClick={() => zipInputRef.current?.click()}
            className="btn-rack flex items-center gap-1 text-signal-amber"
            title="Upload and extract ZIP archive"
          >
            <FileArchive className="h-3.5 w-3.5 mr-1" />
            UNPACK ZIP
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="border border-breaker-red bg-breaker-red/10 p-3 text-breaker-red font-mono text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>FAULT: {error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {successMessage && (
        <div className="border border-signal-amber bg-signal-amber/10 p-3 text-signal-amber font-mono text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>COMMITTED: {successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {uploadProgress && (
        <div className="p-3 bg-rack-panel border border-signal-amber text-signal-amber font-mono text-xs flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
          <span>I/O BUS: {uploadProgress}</span>
        </div>
      )}

      {/* Modals for Create Folder / Create File */}
      {showNewFolder && (
        <form onSubmit={handleCreateFolder} className="flex items-center gap-2 p-3 bg-rack-panel border border-signal-amber">
          <FolderPlus className="h-5 w-5 text-signal-amber shrink-0" />
          <input
            type="text"
            placeholder="Directory name (e.g. assets, static)..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-rack-bg border border-rack-border text-trace-silver font-mono focus:outline-none focus:border-signal-amber"
            autoFocus
          />
          <button type="submit" className="btn-rack btn-rack-primary">
            CREATE
          </button>
          <button type="button" onClick={() => setShowNewFolder(false)} className="p-1.5 text-trace-dim hover:text-trace-silver">
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {showNewFile && (
        <form onSubmit={handleCreateFile} className="flex items-center gap-2 p-3 bg-rack-panel border border-signal-amber">
          <FileCode className="h-5 w-5 text-signal-amber shrink-0" />
          <input
            type="text"
            placeholder="Filename (e.g. index.php, style.css)..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-rack-bg border border-rack-border text-trace-silver font-mono focus:outline-none focus:border-signal-amber"
            autoFocus
          />
          <button type="submit" className="btn-rack btn-rack-primary">
            CREATE
          </button>
          <button type="button" onClick={() => setShowNewFile(false)} className="p-1.5 text-trace-dim hover:text-trace-silver">
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* File List Table */}
      <div className="rack-blade border-rack-border bg-rack-panel overflow-hidden min-h-[300px]">
        {loading && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-trace-dim">
            <RefreshCw className="h-6 w-6 animate-spin mb-2 text-signal-amber" />
            <p className="text-xs">SCANNING DIRECTORY BUS...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-trace-dim border border-dashed border-rack-border m-4">
            <UploadCloud className="h-10 w-10 text-trace-subtle mb-3" />
            <p className="text-xs font-bold text-trace-silver">DIRECTORY IS EMPTY</p>
            <p className="text-[10px] text-trace-dim mt-1">Drop archives, files, or folders to upload.</p>
          </div>
        ) : (
          <div className="divide-y divide-rack-border">
            <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-bold text-trace-dim uppercase tracking-wider bg-rack-bg border-b border-rack-border">
              <div className="col-span-6">FILENAME</div>
              <div className="col-span-2 text-right">SIZE</div>
              <div className="col-span-3 text-right">MODIFIED</div>
              <div className="col-span-1 text-center">ACTION</div>
            </div>

            {files.map((file) => (
              <div
                key={file.relativePath}
                className="grid grid-cols-12 px-4 py-2.5 items-center text-xs hover:bg-rack-subtle transition cursor-pointer group font-mono"
                onClick={() => {
                  if (file.isDirectory) handleOpenFolder(file.name);
                  else handleOpenFile(file);
                }}
              >
                <div className="col-span-6 flex items-center space-x-2.5 min-w-0">
                  <div className="shrink-0 text-signal-amber">{getFileIcon(file)}</div>
                  <span className="font-bold text-trace-silver truncate group-hover:text-signal-amber transition">
                    {file.name}
                  </span>
                </div>

                <div className="col-span-2 text-right text-[11px] text-trace-dim font-mono">
                  {file.isDirectory ? 'DIR' : formatFileSize(file.size)}
                </div>

                <div className="col-span-3 text-right text-[11px] text-trace-dim font-mono">
                  {new Date(file.modifiedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>

                <div className="col-span-1 flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {!file.isDirectory && (
                    <button
                      onClick={() => handleOpenFile(file)}
                      className="p-1 text-trace-dim hover:text-signal-amber"
                      title="Edit File"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1 text-trace-dim hover:text-breaker-red"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none font-mono">
          <div className="bg-rack-panel border-2 border-signal-amber shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-rack-border bg-rack-bg">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-signal-amber filament-amber"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-sm text-trace-silver">{editingFile.name}</span>
                    <span className="bg-rack-panel border border-rack-border px-1.5 py-0.2 text-[9px] font-mono text-signal-amber">
                      {editingFile.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-trace-dim block truncate max-w-xs sm:max-w-md">
                    PATH: {editingFile.path}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveFile}
                  disabled={saving}
                  className="btn-rack btn-rack-primary flex items-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? 'WRITING...' : 'WRITE CHANGES'}</span>
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1.5 border border-rack-border text-trace-dim hover:text-trace-silver"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Code Textarea */}
            <div className="flex-1 p-3 bg-[#0b0d10] overflow-hidden flex flex-col">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className="w-full flex-1 p-3 bg-[#0b0d10] text-trace-silver font-mono text-xs focus:outline-none resize-none selection:bg-signal-amber selection:text-rack-bg leading-relaxed border border-rack-border select-text"
                spellCheck={false}
              />
            </div>

            {/* Modal Footer / Status Bar */}
            <div className="flex items-center justify-between px-5 py-2 border-t border-rack-border bg-rack-bg text-[10px] font-mono text-trace-dim">
              <span>BUFFER LINES: {editingFile.content.split('\n').length} | BYTES: {editingFile.content.length}</span>
              <span className="text-signal-amber">ENCODING: UTF-8 • UNIX (LF)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
