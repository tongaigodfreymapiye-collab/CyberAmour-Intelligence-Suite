const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const searchString = `\nimport { useState, useEffect, useRef } from 'react';\n`;
const startIndex = content.lastIndexOf(searchString);

const newContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */` + content.substring(startIndex);

fs.writeFileSync('src/App.tsx', newContent);
console.log('Restored App.tsx');
