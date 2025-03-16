const xss = require('xss');

/**
 * Sanitize HTML content to prevent XSS attacks
 * while allowing basic formatting tags
 * 
 * @param {string} content - Input HTML content to sanitize
 * @returns {string} - Sanitized HTML content
 */
const sanitizeHtml = (content) => {
  if (!content) return '';
  
  // Configure xss with allowed tags and attributes
  const options = {
    whiteList: {
      // Basic formatting
      b: [], strong: [], i: [], em: [], u: [], s: [], p: [], br: [], 
      // Headers
      h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
      // Lists
      ul: [], ol: [], li: [],
      // Links
      a: ['href', 'title', 'target'],
      // Text alignment
      div: ['style', 'align'],
      span: ['style'],
      // Tables
      table: ['border', 'cellpadding', 'cellspacing'],
      thead: [], tbody: [], tr: [], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan']
    },
    // Additional allowed CSS properties
    css: {
      whiteList: {
        'color': true,
        'background-color': true,
        'text-align': true,
        'font-weight': true,
        'font-style': true,
        'text-decoration': true
      }
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object']
  };
  
  return xss(content, options);
};

module.exports = {
  sanitizeHtml
}; 