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

/**
 * Strips all HTML tags from a string to get plain text content.
 * Useful for creating accessible labels from rich text content.
 * @param html The string containing HTML.
 * @returns The plain text content of the string.
 */
export const stripHtml = (html: string): string => {
   const tempDiv = document.createElement("div");
   tempDiv.innerHTML = html;
   return tempDiv.textContent || tempDiv.innerText || "";
};
