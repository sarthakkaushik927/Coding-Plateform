const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const MCQ_HEADERS = ['questionText', 'option1', 'option2', 'option3', 'option4', 'correctOptionIndex', 'points'];
const MCQ_SAMPLES = [
  ['What does HTML stand for?', 'Hyper Text Markup Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'Hyper Tool Markup Language', 0, 1],
  ['Choose the correct HTML element for the largest heading:', '<heading>', '<h6>', '<h1>', '<head>', 2, 1],
  ['What is the correct syntax for referring to an external script called "xxx.js"?', '<script href="xxx.js">', '<script name="xxx.js">', '<script src="xxx.js">', '<script file="xxx.js">', 2, 2],
];

const CODING_HEADERS = [
  'title', 'description', 'difficulty', 'points', 'constraints',
  'ex1_input', 'ex1_output', 'ex1_explanation',
  'tc1_input', 'tc1_expected', 'tc1_hidden',
  'tc2_input', 'tc2_expected', 'tc2_hidden',
  'tc3_input', 'tc3_expected', 'tc3_hidden'
];

const CODING_SAMPLES = [
  [
    'Two Sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nThe input format should be:\nLine 1: space separated integers representing the array\nLine 2: target integer',
    'easy', 10,
    '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    '2 7 11 15\n9', '0 1', 'nums[0] + nums[1] == 9, we return 0 1',
    '2 7 11 15\n9', '0 1', 'false',
    '3 2 4\n6', '1 2', 'false',
    '3 3\n6', '0 1', 'true'
  ],
  [
    'Reverse String',
    'Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
    'easy', 10,
    '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
    'hello', 'olleh', '',
    'hello', 'olleh', 'false',
    'Hannah', 'hannaH', 'false',
    'A man, a plan, a canal: Panama', 'amanaP :lanac a ,nalp a ,nam A', 'true'
  ]
];

const wb = XLSX.utils.book_new();

const mcqWs = XLSX.utils.aoa_to_sheet([MCQ_HEADERS, ...MCQ_SAMPLES]);
mcqWs['!cols'] = [{ wch: 60 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 8 }];
XLSX.utils.book_append_sheet(wb, mcqWs, 'MCQ');

const codingWs = XLSX.utils.aoa_to_sheet([CODING_HEADERS, ...CODING_SAMPLES]);
codingWs['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 10 }, { wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 10 }];
XLSX.utils.book_append_sheet(wb, codingWs, 'Coding');

const filePath = path.join(__dirname, 'sample_questions.xlsx');
XLSX.writeFile(wb, filePath);
console.log(`Sample file created at: ${filePath}`);
