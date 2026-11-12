import React from 'react';

/**
 * Safely converts a CSS inline style string (e.g., "background-color: #fff; font-family: Inter;")
 * into a React-compliant camelCase style object (e.g., { backgroundColor: '#fff', fontFamily: 'Inter' }).
 */
export function cssStringToStyleObject(cssString?: string): React.CSSProperties {
  if (!cssString || typeof cssString !== 'string') return {};

  const styleObj: Record<string, string> = {};
  const rules = cssString.split(';').map((r) => r.trim()).filter(Boolean);

  for (const rule of rules) {
    const colonIndex = rule.indexOf(':');
    if (colonIndex === -1) continue;

    const rawKey = rule.slice(0, colonIndex).trim();
    const rawVal = rule.slice(colonIndex + 1).trim();
    if (!rawKey || !rawVal) continue;

    // Convert kebab-case (e.g. background-color, font-family, min-height) to camelCase
    let camelKey = rawKey;
    if (!rawKey.startsWith('--')) {
      camelKey = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    // Sanitize problematic viewport units on container dimensions so they stay bounded to the slide stage
    let val = rawVal;
    if (camelKey === 'width' && (val.includes('100vw') || val.includes('100vh'))) {
      val = '100%';
    } else if (camelKey === 'maxWidth' && val.includes('100vw')) {
      val = '100%';
    } else if (camelKey === 'minWidth' && val.includes('100vw')) {
      val = '0';
    } else if (camelKey === 'height' && (val.includes('100vh') || val.includes('calc(100vh'))) {
      val = '100%';
    } else if (camelKey === 'maxHeight' && val.includes('100vh')) {
      val = '100%';
    }

    styleObj[camelKey] = val;
  }

  return styleObj as React.CSSProperties;
}
