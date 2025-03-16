import React, { useState, useEffect, useCallback } from 'react';
import { Box, FormHelperText, CircularProgress, Tooltip } from '@mui/material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection } from 'lexical';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, SELECTION_CHANGE_COMMAND } from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { HeadingTagType, $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';
import { $isListNode, $isListItemNode } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';

// Import Material-UI icons
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TitleIcon from '@mui/icons-material/Title';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SubjectIcon from '@mui/icons-material/Subject';

import { parseHTML, $generateHtmlFromNodes } from '../../utils/htmlParser';

// Placeholder component with better React memo implementation
const Placeholder = React.memo(({ placeholder }) => {
  return (
    <div className="editor-placeholder">
      {placeholder}
    </div>
  );
});

// Plugin to handle headings correctly
function HeadingPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) return;

    return mergeRegister(
      editor.registerCommand(
        FORMAT_ELEMENT_COMMAND,
        (tag) => {
          if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'paragraph') {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.formatNodes(
                (node) => {
                  if (tag === 'paragraph') {
                    return $createParagraphNode();
                  } else {
                    return $createHeadingNode(tag);
                  }
                }
              );
              return true;
            }
          }
          return false;
        },
        1
      )
    );
  }, [editor]);

  return null;
}

// Custom toolbar component
const Toolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [currentBlockType, setCurrentBlockType] = useState('paragraph');

  // Track format states
  useEffect(() => {
    if (!editor) return;

    // Use a single update listener to improve performance
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Check text formatting
        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setIsUnderline(selection.hasFormat('underline'));
        setIsStrikethrough(selection.hasFormat('strikethrough'));

        // Check block type (paragraph, heading, etc.)
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root' 
          ? anchorNode 
          : anchorNode.getTopLevelElementOrThrow();
        
        const elementKey = element.getKey();
        const elementDOM = editor.getElementByKey(elementKey);
        
        if (elementDOM) {
          if ($isHeadingNode(element)) {
            const tag = element.getTag();
            setCurrentBlockType(tag);
          } else if ($isListNode(element)) {
            const parentList = anchorNode.getTopLevelElementOrThrow();
            const type = parentList.getListType();
            setCurrentBlockType(type === 'bullet' ? 'ul' : 'ol');
          } else {
            setCurrentBlockType('paragraph');
          }
        }
      });
    });

    return unregisterListener;
  }, [editor]);

  // Memoize handlers to prevent recreating them on every render
  const formatTextAs = useCallback((format) => {
    if (!editor) return;
    
    editor.update(() => {
      if (format === 'bold') {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
      } else if (format === 'italic') {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
      } else if (format === 'underline') {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
      } else if (format === 'strikethrough') {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
      }
    });
  }, [editor]);
  
  const formatAsList = useCallback((listType) => {
    if (!editor) return;
    
    editor.update(() => {
      if (listType === 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
      } else {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
      }
    });
  }, [editor]);
  
  const formatAsHeading = useCallback((level) => {
    if (!editor) return;
    
    editor.update(() => {
      if (level === 0) {
        // Format as paragraph
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'paragraph');
      } else {
        // Format as heading
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, `h${level}`);
      }
    });
  }, [editor]);

  return (
    <div className="editor-toolbar">
      <div className="toolbar-section">
        <Tooltip title="Heading 1">
          <button 
            onClick={() => formatAsHeading(1)} 
            type="button" 
            className={`toolbar-button ${currentBlockType === 'h1' ? 'active' : ''}`}
          >
            <TitleIcon fontSize="small" />
            <span className="toolbar-label">H1</span>
          </button>
        </Tooltip>
        <Tooltip title="Heading 2">
          <button 
            onClick={() => formatAsHeading(2)} 
            type="button" 
            className={`toolbar-button ${currentBlockType === 'h2' ? 'active' : ''}`}
          >
            <TitleIcon fontSize="small" />
            <span className="toolbar-label">H2</span>
          </button>
        </Tooltip>
        <Tooltip title="Heading 3">
          <button 
            onClick={() => formatAsHeading(3)} 
            type="button" 
            className={`toolbar-button ${currentBlockType === 'h3' ? 'active' : ''}`}
          >
            <TextFieldsIcon fontSize="small" />
            <span className="toolbar-label">H3</span>
          </button>
        </Tooltip>
        <Tooltip title="Paragraph">
          <button 
            onClick={() => formatAsHeading(0)} 
            type="button" 
            className={`toolbar-button ${currentBlockType === 'paragraph' ? 'active' : ''}`}
          >
            <SubjectIcon fontSize="small" />
          </button>
        </Tooltip>
      </div>
      
      <div className="toolbar-section">
        <Tooltip title="Bold">
          <button 
            onClick={() => formatTextAs('bold')} 
            type="button" 
            className={`toolbar-button ${isBold ? 'active' : ''}`}
          >
            <FormatBoldIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Italic">
          <button 
            onClick={() => formatTextAs('italic')} 
            type="button" 
            className={`toolbar-button ${isItalic ? 'active' : ''}`}
          >
            <FormatItalicIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Underline">
          <button 
            onClick={() => formatTextAs('underline')} 
            type="button" 
            className={`toolbar-button ${isUnderline ? 'active' : ''}`}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Strikethrough">
          <button 
            onClick={() => formatTextAs('strikethrough')} 
            type="button" 
            className={`toolbar-button ${isStrikethrough ? 'active' : ''}`}
          >
            <StrikethroughSIcon fontSize="small" />
          </button>
        </Tooltip>
      </div>
      
      <div className="toolbar-section">
        <Tooltip title="Bullet List">
          <button 
            onClick={() => formatAsList('bullet')} 
            type="button" 
            className={`toolbar-button ${currentBlockType === 'ul' ? 'active' : ''}`}
          >
            <FormatListBulletedIcon fontSize="small" />
          </button>
        </Tooltip>
        <Tooltip title="Numbered List">
          <button 
            onClick={() => formatAsList('number')} 
            type="button" 
            className={`toolbar-button ${currentBlockType === 'ol' ? 'active' : ''}`}
          >
            <FormatListNumberedIcon fontSize="small" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

const RichTextEditor = ({ 
  value, 
  onChange, 
  error, 
  helperText, 
  placeholder = 'Enter content here...',
  minHeight = 200,
  readOnly = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [prevHtmlValue, setPrevHtmlValue] = useState('');
  
  // Define theme
  const theme = {
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
      h4: 'editor-heading-h4',
    },
    paragraph: 'editor-paragraph',
    text: {
      bold: 'editor-text-bold',
      italic: 'editor-text-italic',
      underline: 'editor-text-underline',
      strikethrough: 'editor-text-strikethrough',
    },
    list: {
      ul: 'editor-list-ul',
      ol: 'editor-list-ol',
      listitem: 'editor-listitem',
    }
  };

  // Initial editor configuration
  const initialConfig = {
    namespace: 'EDU-EDITOR',
    theme,
    onError: (error) => {
      console.error(error);
    },
    nodes: [HeadingNode, QuoteNode, ListItemNode, ListNode, LinkNode],
    editorState: () => {
      return value ? parseHTML(value) : '';
    },
    editable: !readOnly,
  };

  // Use useCallback to memoize the function and prevent recreating it on every render
  const handleEditorChange = useCallback((editorState) => {
    if (onChange) {
      // Use our custom function to generate HTML
      const htmlString = $generateHtmlFromNodes(editorState);
      
      // Only trigger onChange if the HTML content has actually changed
      if (htmlString !== prevHtmlValue) {
        setPrevHtmlValue(htmlString);
        onChange(htmlString);
      }
    }
  }, [onChange, prevHtmlValue]);

  return (
    <Box 
      sx={{ 
        mb: 1,
        width: '100%',
        position: 'relative',
        border: error ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
        borderRadius: '4px',
        overflow: 'hidden',
        '& .lexical-editor': {
          position: 'relative',
          border: 'none',
          outline: 'none',
        },
        '& .editor-input': {
          minHeight: `${minHeight}px`,
          maxHeight: `${minHeight * 2}px`,
          padding: '10px',
          outline: 'none',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          overflowY: 'auto',
        },
        '& .editor-placeholder': {
          color: 'rgba(0, 0, 0, 0.38)',
          overflow: 'hidden',
          position: 'absolute',
          textOverflow: 'ellipsis',
          top: '10px',
          left: '10px',
          userSelect: 'none',
          pointerEvents: 'none',
          display: 'inline-block',
        },
        '& .editor-toolbar': {
          display: 'flex',
          padding: '8px',
          gap: '8px',
          backgroundColor: '#f5f5f5',
          borderBottom: error ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
          flexWrap: 'wrap',
        },
        '& .toolbar-section': {
          display: 'flex',
          gap: '2px',
          marginRight: '8px',
          borderRight: '1px solid #ddd',
          paddingRight: '8px',
          '&:last-child': {
            borderRight: 'none',
          }
        },
        '& .toolbar-button': {
          padding: '4px 8px',
          minWidth: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '3px',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#eee',
          },
          '&.active': {
            backgroundColor: '#e3f2fd',
            borderColor: '#2196f3',
          }
        },
        '& .toolbar-label': {
          fontSize: '11px',
          marginLeft: '2px',
        },
        // Heading styles
        '& .editor-heading-h1': {
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '10px 0',
          color: '#000',
        },
        '& .editor-heading-h2': {
          fontSize: '20px',
          fontWeight: 'bold',
          margin: '10px 0',
          color: '#333',
        },
        '& .editor-heading-h3': {
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '10px 0',
          color: '#444',
        },
        '& .editor-heading-h4': {
          fontSize: '14px',
          fontWeight: 'bold',
          margin: '10px 0',
          color: '#666',
        },
        // Text formatting
        '& .editor-text-bold': {
          fontWeight: 'bold',
        },
        '& .editor-text-italic': {
          fontStyle: 'italic',
        },
        '& .editor-text-underline': {
          textDecoration: 'underline',
        },
        '& .editor-text-strikethrough': {
          textDecoration: 'line-through',
        },
        // List styles
        '& .editor-list-ul': {
          padding: '0 0 0 20px',
          margin: '0',
        },
        '& .editor-list-ol': {
          padding: '0 0 0 20px',
          margin: '0',
        },
        '& .editor-listitem': {
          margin: '0 0 0.5em 0',
        }
      }}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: minHeight }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <LexicalComposer initialConfig={initialConfig}>
          <div className="lexical-editor">
            {!readOnly && <Toolbar />}
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="editor-input" />
              }
              placeholder={<Placeholder placeholder={placeholder} />}
              ErrorBoundary={LexicalErrorBoundary}
              initialEditorState={initialConfig.editorState}
            />
            <ListPlugin />
            <LinkPlugin />
            <HeadingPlugin />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <OnChangePlugin onChange={handleEditorChange} />
          </div>
        </LexicalComposer>
      )}
      {helperText && (
        <FormHelperText error={error}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default RichTextEditor; 