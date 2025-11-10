import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Refresh,
  Settings,
  Fullscreen,
  FullscreenExit,
  ContentCopy,
  ContentPaste,
  Undo,
  Redo,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
} from '@mui/icons-material';
import * as monaco from 'monaco-editor';
import { apiService } from '../../services/api';
import { Question } from '../../types';
import toast from 'react-hot-toast';

interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string) => void;
  onRun?: (code: string) => void;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  height?: string | number;
  readOnly?: boolean;
  question?: Question;
  showRunButton?: boolean;
  fontSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap?: { enabled: boolean };
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  autoSave?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'python',
  value = '',
  onChange,
  onRun,
  theme = 'vs-dark',
  height = '400px',
  readOnly = false,
  question,
  showRunButton = true,
  fontSize = 14,
  wordWrap = 'on',
  minimap = { enabled: true },
  lineNumbers = 'on',
  autoSave = false,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isRunning, setIsRunning] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ name: string; version: string; aliases: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load available languages
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await apiService.codeExecution.getLanguages();
        if (response.success) {
          setAvailableLanguages(response.data);
        }
      } catch (error) {
        console.error('Failed to load languages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguages();
  }, []);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Define themes
    monaco.editor.defineTheme 'codeloop-dark' {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorCursor.foreground': '#AEAFAD',
        'editor.lineHighlightBackground': '#2D2D30',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
      },
    };

    monaco.editor.defineTheme('codeloop-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editorCursor.foreground': '#000000',
        'editor.lineHighlightBackground': '#F0F0F0',
        'editorLineNumber.foreground': '#237893',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#E5EBF1',
      },
    });

    // Create editor instance
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: currentLanguage,
      theme: currentTheme === 'vs-dark' ? 'codeloop-dark' : currentTheme === 'vs-light' ? 'codeloop-light' : currentTheme,
      fontSize,
      wordWrap,
      minimap,
      lineNumbers,
      readOnly,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'line',
      renderWhitespace: 'selection',
      bracketPairColorization: {
        enabled: true,
      },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
    });

    editorRef.current = editor;

    // Handle content changes
    const disposable = editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      setHasUnsavedChanges(newValue !== value);
      onChange?.(newValue);

      // Auto-save if enabled
      if (autoSave) {
        const timer = setTimeout(() => {
          // Save to localStorage or backend
          localStorage.setItem('code-editor-content', newValue);
        }, 2000);
        return () => clearTimeout(timer);
      }
    });

    // Load saved content if exists
    const savedContent = localStorage.getItem('code-editor-content');
    if (savedContent && !value) {
      editor.setValue(savedContent);
    }

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCode();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveCode();
    });

    return () => {
      disposable.dispose();
      editor.dispose();
    };
  }, []);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update language
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, currentLanguage);
      }
    }
  }, [currentLanguage]);

  // Update theme
  useEffect(() => {
    if (editorRef.current) {
      const themeName = currentTheme === 'vs-dark' ? 'codeloop-dark' :
                        currentTheme === 'vs-light' ? 'codeloop-light' : currentTheme;
      monaco.editor.setTheme(themeName);
    }
  }, [currentTheme]);

  // Update editor options
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize,
        wordWrap,
        minimap,
        lineNumbers,
        readOnly,
      });
    }
  }, [fontSize, wordWrap, minimap, lineNumbers, readOnly]);

  const handleRunCode = useCallback(async () => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    setIsRunning(true);

    try {
      onRun?.(code);
    } finally {
      setIsRunning(false);
    }
  }, [onRun]);

  const handleSaveCode = useCallback(() => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    localStorage.setItem('code-editor-content', code);
    setHasUnsavedChanges(false);
    toast.success('Code saved');
  }, []);

  const handleFormatCode = useCallback(() => {
    if (!editorRef.current) return;

    editorRef.current.getAction('editor.action.formatDocument')?.run();
  }, []);

  const handleCopyCode = useCallback(() => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  }, []);

  const handlePasteCode = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (editorRef.current) {
        editorRef.current.executeEdits('paste-code', [{
          range: editorRef.current.getSelection() || new monaco.Range(1, 1, 1, 1),
          text: text,
        }]);
      }
    } catch (error) {
      toast.error('Failed to paste from clipboard');
    }
  }, []);

  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('source', 'undo', null);
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('source', 'redo', null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const getMonacoLanguageId = (lang: string): string => {
    const languageMap: Record<string, string> = {
      python: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      javascript: 'javascript',
      typescript: 'typescript',
      go: 'go',
      rust: 'rust',
      php: 'php',
      ruby: 'ruby',
      sql: 'sql',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      markdown: 'markdown',
    };
    return languageMap[lang.toLowerCase()] || 'plaintext';
  };

  const questionInfo = question && (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="body2">
        <strong>Question:</strong> {question.title}
      </Typography>
      {question.description && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {question.description.substring(0, 200)}...
        </Typography>
      )}
      {question.starterCode && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          <em>Starter code has been provided</em>
        </Typography>
      )}
    </Alert>
  );

  return (
    <Box
      sx={{
        height: isFullscreen ? '100vh' : height,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 1,
        bgcolor: 'background.paper',
      }}
    >
      {questionInfo}

      {/* Toolbar */}
      <Paper
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
        elevation={0}
      >
        {/* Language Selector */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={currentLanguage}
            label="Language"
            onChange={(e) => setCurrentLanguage(e.target.value)}
            disabled={isLoading || readOnly}
          >
            {isLoading ? (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Loading...
              </MenuItem>
            ) : (
              [
                { value: 'python', label: 'Python' },
                { value: 'java', label: 'Java' },
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'c', label: 'C' },
                { value: 'cpp', label: 'C++' },
                { value: 'go', label: 'Go' },
                { value: 'rust', label: 'Rust' },
                { value: 'php', label: 'PHP' },
                { value: 'ruby', label: 'Ruby' },
              ].map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Divider orientation="vertical" flexItem />

        {/* Edit Actions */}
        <Tooltip title="Undo (Ctrl+Z)">
          <IconButton size="small" onClick={handleUndo} disabled={readOnly}>
            <Undo />
          </IconButton>
        </Tooltip>

        <Tooltip title="Redo (Ctrl+Y)">
          <IconButton size="small" onClick={handleRedo} disabled={readOnly}>
            <Redo />
          </IconButton>
        </Tooltip>

        <Tooltip title="Copy">
          <IconButton size="small" onClick={handleCopyCode}>
            <ContentCopy />
          </IconButton>
        </Tooltip>

        <Tooltip title="Paste">
          <IconButton size="small" onClick={handlePasteCode} disabled={readOnly}>
            <ContentPaste />
          </IconButton>
        </Tooltip>

        <Tooltip title="Format Code">
          <IconButton size="small" onClick={handleFormatCode} disabled={readOnly}>
            <FormatAlignLeft />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Run Button */}
        {showRunButton && !readOnly && (
          <Button
            variant="contained"
            startIcon={isRunning ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={handleRunCode}
            disabled={isRunning || !currentLanguage}
            size="small"
          >
            {isRunning ? 'Running...' : 'Run (Ctrl+Enter)'}
          </Button>
        )}

        {/* Save Button */}
        {autoSave && (
          <Tooltip title="Save (Ctrl+S)">
            <IconButton
              size="small"
              onClick={handleSaveCode}
              color={hasUnsavedChanges ? 'primary' : 'default'}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Status */}
        {hasUnsavedChanges && (
          <Chip
            label="Unsaved changes"
            size="small"
            color="warning"
            variant="outlined"
          />
        )}

        {/* Theme Toggle */}
        <Tooltip title="Toggle Theme">
          <IconButton
            size="small"
            onClick={() => setCurrentTheme(currentTheme === 'vs-dark' ? 'vs-light' : 'vs-dark')}
          >
            {currentTheme === 'vs-dark' ? '🌙' : '☀️'}
          </IconButton>
        </Tooltip>

        {/* Fullscreen */}
        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          <IconButton size="small" onClick={toggleFullscreen}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Editor Container */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'hidden',
        }}
      />

      {/* Status Bar */}
      <Paper
        sx={{
          p: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
        elevation={0}
      >
        <Typography variant="caption" color="text.secondary">
          Language: {currentLanguage} |
          {editorRef.current && ` Line: ${editorRef.current.getPosition()?.lineNumber} | Column: ${editorRef.current.getPosition()?.column}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {editorRef.current && `Length: ${editorRef.current.getValue().length} characters`}
        </Typography>
      </Paper>
    </Box>
  );
};

export default CodeEditor;