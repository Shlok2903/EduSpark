import { $createParagraphNode, $createTextNode, $getRoot, $isParagraphNode, $isTextNode } from 'lexical';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';

/**
 * HTML Parser for Lexical Editor
 * 
 * @param {string} html - HTML string to parse into Lexical nodes
 * @returns {Function} - Function that sets up the editor state with parsed HTML
 */
export const parseHTML = (html) => {
  if (!html) {
    return () => {
      // Create empty paragraph
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      root.append(paragraph);
    };
  }
  
  return () => {
    const root = $getRoot();
    root.clear();
    
    try {
      // Create a temporary DOM element to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get all elements from the body
      const elements = Array.from(doc.body.children);
      
      if (elements.length === 0) {
        // If no elements, create a simple paragraph with the text content
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(doc.body.textContent || '');
        paragraph.append(textNode);
        root.append(paragraph);
        return;
      }
      
      // Process each element
      elements.forEach(element => {
        let node;
        
        // Check element type and create appropriate Lexical node
        switch (element.tagName.toLowerCase()) {
          case 'h1':
            node = $createHeadingNode('h1');
            break;
          case 'h2':
            node = $createHeadingNode('h2');
            break;
          case 'h3':
            node = $createHeadingNode('h3');
            break;
          case 'h4':
            node = $createHeadingNode('h4');
            break;
          case 'p':
          default:
            node = $createParagraphNode();
            break;
        }
        
        // Handle text content with potential formatting
        const textContent = element.textContent || '';
        
        // For a more comprehensive solution, we'd need to properly parse HTML
        // and apply formats based on the tags. This is a simplified version:
        let hasFormatting = false;
        
        if (element.innerHTML.includes('<strong>') || element.innerHTML.includes('<b>')) {
          // Create a bold text node
          const textNode = $createTextNode(textContent);
          textNode.toggleFormat('bold');
          node.append(textNode);
          hasFormatting = true;
        } 
        else if (element.innerHTML.includes('<em>') || element.innerHTML.includes('<i>')) {
          // Create an italic text node
          const textNode = $createTextNode(textContent);
          textNode.toggleFormat('italic');
          node.append(textNode);
          hasFormatting = true;
        }
        else if (element.innerHTML.includes('<u>')) {
          // Create an underlined text node
          const textNode = $createTextNode(textContent);
          textNode.toggleFormat('underline');
          node.append(textNode);
          hasFormatting = true;
        }
        else if (element.innerHTML.includes('<s>') || element.innerHTML.includes('<del>')) {
          // Create a strikethrough text node
          const textNode = $createTextNode(textContent);
          textNode.toggleFormat('strikethrough');
          node.append(textNode);
          hasFormatting = true;
        }
        
        // If no formatting was applied, add the plain text
        if (!hasFormatting) {
          const textNode = $createTextNode(textContent);
          node.append(textNode);
        }
        
        root.append(node);
      });
      
    } catch (error) {
      console.error('Error parsing HTML:', error);
      
      // Fallback to a simple paragraph
      const paragraph = $createParagraphNode();
      const textContent = html.replace(/<[^>]*>/g, '') || '';
      const textNode = $createTextNode(textContent);
      paragraph.append(textNode);
      root.append(paragraph);
    }
  };
};

/**
 * Process formatted text from a node
 * @param {Node} node - The Lexical node to process
 * @returns {string} - HTML-formatted string
 */
function processFormattedText(node) {
  let result = '';
  
  if ($isTextNode(node)) {
    let text = node.getTextContent();
    
    // Apply formatting to text node
    if (node.hasFormat('bold')) {
      text = `<strong>${text}</strong>`;
    }
    if (node.hasFormat('italic')) {
      text = `<em>${text}</em>`;
    }
    if (node.hasFormat('underline')) {
      text = `<u>${text}</u>`;
    }
    if (node.hasFormat('strikethrough')) {
      text = `<s>${text}</s>`;
    }
    
    result += text;
  } else {
    // Process children of non-text nodes
    const children = node.getChildren();
    children.forEach(child => {
      result += processFormattedText(child);
    });
  }
  
  return result;
}

/**
 * Convert Lexical editor state to HTML
 * 
 * @param {EditorState} editorState - The Lexical editor state
 * @returns {string} - HTML string representation
 */
export const $generateHtmlFromNodes = (editorState) => {
  let html = '';
  
  try {
    editorState.read(() => {
      const root = $getRoot();
      if (!root) return;
      
      const children = root.getChildren();
      
      if (children.length === 0) {
        html = '<p></p>';
        return;
      }
      
      children.forEach(node => {
        let nodeHtml = '';
        
        if ($isHeadingNode(node)) {
          const tag = node.getTag(); // h1, h2, h3, etc.
          const textContent = processFormattedText(node);
          nodeHtml = `<${tag}>${textContent}</${tag}>`;
        } else if ($isParagraphNode(node)) {
          // Process paragraph with potential formatting
          const textContent = processFormattedText(node);
          nodeHtml = `<p>${textContent}</p>`;
        } else {
          // Fallback for other node types
          const textContent = processFormattedText(node);
          nodeHtml = `<p>${textContent}</p>`;
        }
        
        html += nodeHtml;
      });
    });
  } catch (error) {
    console.error('Error generating HTML:', error);
    html = '<p></p>';
  }
  
  return html || '<p></p>';
};