import { QuestionType } from '../types';

export const toRoman = (num: number): string => {
    const romanMap: { [key: number]: string } = {
        1000: 'M', 900: 'CM', 500: 'D', 400: 'CD', 100: 'C',
        90: 'XC', 50: 'L', 40: 'XL', 10: 'X', 9: 'IX', 5: 'V', 4: 'IV', 1: 'I'
    };
    let result = '';
    const keys = Object.keys(romanMap).map(Number).sort((a, b) => b - a);
    for (const key of keys) {
        while (num >= key) {
            result += romanMap[key];
            num -= key;
        }
    }
    return result;
};

/**
 * Escapes special HTML characters in a string to prevent XSS attacks.
 * @param unsafe The raw string that might contain HTML characters.
 * @returns A sanitized string safe for embedding in HTML.
 */
export const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;");
};

const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SUB', 'SUP',
  'P', 'DIV', 'SPAN', 'BR', 'UL', 'OL', 'LI',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'COLGROUP', 'COL',
  'IMG'
]);

const ALLOWED_ATTRS = new Set([
  'colspan', 'rowspan', 'style', 'src', 'alt', 'width', 'height', 'class'
]);

const ALLOWED_CSS = new Set([
  'text-align', 'direction', 'vertical-align', 'width', 'height'
]);

const sanitizeStyleAttribute = (styleValue: string): string => {
  return styleValue
    .split(';')
    .map(rule => rule.trim())
    .filter(Boolean)
    .map(rule => {
      const [property, ...valueParts] = rule.split(':');
      if (!property || valueParts.length === 0) return null;

      const normalizedProperty = property.trim().toLowerCase();
      const value = valueParts.join(':').trim();
      if (!ALLOWED_CSS.has(normalizedProperty)) return null;
      if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) return null;

      return `${normalizedProperty}: ${value}`;
    })
    .filter((rule): rule is string => Boolean(rule))
    .join('; ');
};

const sanitizeNode = (node: Node): void => {
  if (node.nodeType === Node.COMMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    const parent = element.parentNode;
    if (!parent) return;

    Array.from(element.childNodes).forEach(sanitizeNode);
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    return;
  }

  Array.from(element.attributes).forEach(attr => {
    const attrName = attr.name.toLowerCase();
    const attrValue = attr.value;

    if (attrName.startsWith('on') || !ALLOWED_ATTRS.has(attrName)) {
      element.removeAttribute(attr.name);
      return;
    }

    if (attrName === 'style') {
      const sanitizedStyle = sanitizeStyleAttribute(attrValue);
      if (sanitizedStyle) {
        element.setAttribute('style', sanitizedStyle);
      } else {
        element.removeAttribute('style');
      }
      return;
    }

    if (attrName === 'src') {
      const isSafeImageSource = /^data:image\/|^https?:\/\//i.test(attrValue);
      if (!isSafeImageSource) {
        element.removeAttribute(attr.name);
      }
      return;
    }
  });

  Array.from(element.childNodes).forEach(sanitizeNode);
};

export const sanitizeRichHtml = (html: string): string => {
  if (!html) return '';

  const template = document.createElement('template');
  template.innerHTML = html;
  Array.from(template.content.childNodes).forEach(sanitizeNode);
  return template.innerHTML;
};

/**
 * Strips all HTML tags from a string to get plain text content.
 * Useful for creating accessible labels from rich text content.
 * @param html The string containing HTML.
 * @returns The plain text content of the string.
 */
export const stripHtml = (html: string): string => {
   const tempDiv = document.createElement("div");
   tempDiv.innerHTML = sanitizeRichHtml(html);
   return tempDiv.textContent || tempDiv.innerText || "";
};
