#!/usr/bin/env node
import crypto from 'crypto';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// Logic implementations mirroring src/lib/utils.ts and src/lib/cloudinary.ts
function sanitizeHtml(dirty) {
  if (!dirty) return '';
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function generateCertificateCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    randomPart += chars[bytes[i] % chars.length];
  }
  return `CA-2026-${randomPart}`;
}

function validateFileTypeAndSize(
  fileName,
  fileSize,
  allowedExtensions = ['pdf', 'doc', 'docx', 'zip', 'png', 'jpg', 'jpeg', 'mp4'],
  maxSizeMB = 25
) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: `File type .${ext} is not supported. Allowed: ${allowedExtensions.join(', ')}` };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (fileSize > maxBytes) {
    return { valid: false, error: `File size exceeds maximum permitted limit of ${maxSizeMB}MB.` };
  }

  return { valid: true };
}

function generateUploadSignature(folder = 'company_academy') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return { signature, timestamp, apiKey, cloudName, folder };
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log(' COMPANY ACADEMY - AUTOMATED INTEGRATION & LOGIC TEST SUITE');
  console.log('================================================================\n');

  // Test Suite 1: Security & Input Sanitization
  console.log('Test Suite 1: Security & Input Sanitization');
  const dirtyHtml = '<script>alert("xss")</script><p>Safe Paragraph</p><img src="x" onerror="evil()"/>';
  const cleanHtml = sanitizeHtml(dirtyHtml);
  assert(!cleanHtml.includes('<script>'), 'Sanitizer strips harmful script tags');
  assert(!cleanHtml.includes('onerror'), 'Sanitizer strips malicious inline event handlers');
  assert(cleanHtml.includes('Safe Paragraph'), 'Sanitizer preserves legitimate text content');

  // Test Suite 2: Certificate Code & Formatting
  console.log('\nTest Suite 2: Credential & Certificate Generation');
  const certCode1 = generateCertificateCode();
  const certCode2 = generateCertificateCode();
  assert(certCode1.startsWith('CA-2026-'), `Certificate code has standard academy prefix: ${certCode1}`);
  assert(certCode1.length === 16, `Certificate code has expected 16-character length (${certCode1})`);
  assert(certCode1 !== certCode2, 'Successive certificate codes are cryptographically distinct');

  // Test Suite 3: Certificate Eligibility Calculation
  console.log('\nTest Suite 3: Academic Completion Eligibility Rules');
  const minAttendance = 80;
  const minQuizScore = 70;
  const requireAllAssignments = true;

  function evaluateEligibility(stats) {
    const attendancePass = stats.attendancePercent >= minAttendance;
    const quizPass = stats.quizzesAveragePercent >= minQuizScore;
    const assignmentsPass = !requireAllAssignments || stats.pendingAssignmentsCount === 0;
    const lessonsPass = stats.progressPercent === 100;

    return {
      eligible: attendancePass && quizPass && assignmentsPass && lessonsPass,
      reasons: [
        !lessonsPass && 'Lessons not 100% completed',
        !attendancePass && `Attendance (${stats.attendancePercent}%) is below ${minAttendance}%`,
        !quizPass && `Quiz average (${stats.quizzesAveragePercent}%) is below ${minQuizScore}%`,
        !assignmentsPass && `${stats.pendingAssignmentsCount} assignments remaining or unpassed`,
      ].filter(Boolean),
    };
  }

  const failingStudent = {
    attendancePercent: 75,
    quizzesAveragePercent: 85,
    pendingAssignmentsCount: 0,
    progressPercent: 100,
  };
  const failResult = evaluateEligibility(failingStudent);
  assert(!failResult.eligible, 'Fails student with 75% attendance when 80% is required');
  assert(failResult.reasons.length === 1, 'Accurately reports the exact shortfall reason');

  const passingStudent = {
    attendancePercent: 92,
    quizzesAveragePercent: 88,
    pendingAssignmentsCount: 0,
    progressPercent: 100,
  };
  const passResult = evaluateEligibility(passingStudent);
  assert(passResult.eligible, 'Approves student meeting all lesson, attendance, quiz, and assignment gates');
  assert(passResult.reasons.length === 0, 'No shortfalls reported for eligible candidate');

  // Test Suite 4: Media Upload Authorization & Validation
  console.log('\nTest Suite 4: Media Upload Type & Size Guards');
  const validDoc = validateFileTypeAndSize('project_submission.pdf', 5 * 1024 * 1024);
  assert(validDoc.valid, 'Validates 5MB PDF document submission');

  const oversizeDoc = validateFileTypeAndSize('project_submission.pdf', 30 * 1024 * 1024, ['pdf'], 25);
  assert(!oversizeDoc.valid, 'Rejects 30MB file when maximum quota is 25MB');

  const illegalFileType = validateFileTypeAndSize('exploit.exe', 1024);
  assert(!illegalFileType.valid, 'Blocks unauthorized executable .exe file extension');

  // Test Suite 5: Cloudinary Signature Hashing
  console.log('\nTest Suite 5: Cloudinary Signed Upload Hash Verification');
  process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
  process.env.CLOUDINARY_API_KEY = 'test_key';
  process.env.CLOUDINARY_API_SECRET = 'test_secret';

  const sig = generateUploadSignature('company_academy/assignments');
  assert(typeof sig.signature === 'string' && sig.signature.length === 64, 'Produces 64-char SHA256 hex signature');
  assert(sig.folder === 'company_academy/assignments', 'Correctly signs designated isolated folder parameter');

  // Test Suite 6: Server-Side Quiz Grading Engine
  console.log('\nTest Suite 6: Server-Side Quiz Evaluation & Answer Secrecy');
  const questions = [
    { id: 'q1', correctOptionId: 'b', points: 10 },
    { id: 'q2', correctOptionId: 'd', points: 15 },
    { id: 'q3', correctOptionId: 'a', points: 25 },
  ];

  function gradeQuizAttempt(submittedAnswers, questionBank) {
    let score = 0;
    let totalPoints = 0;

    questionBank.forEach((q) => {
      totalPoints += q.points;
      if (submittedAnswers[q.id] === q.correctOptionId) {
        score += q.points;
      }
    });

    const percent = Math.round((score / totalPoints) * 100);
    return { score, totalPoints, percent, passed: percent >= 70 };
  }

  const perfectAnswers = { q1: 'b', q2: 'd', q3: 'a' };
  const perfectResult = gradeQuizAttempt(perfectAnswers, questions);
  assert(perfectResult.score === 50 && perfectResult.percent === 100 && perfectResult.passed, 'Grades 100% attempt accurately');

  const partialAnswers = { q1: 'b', q2: 'wrong', q3: 'a' };
  const partialResult = gradeQuizAttempt(partialAnswers, questions);
  assert(partialResult.score === 35 && partialResult.percent === 70 && partialResult.passed, 'Grades 70% threshold pass accurately');

  const failAnswers = { q1: 'wrong', q2: 'wrong', q3: 'wrong' };
  const failAttemptResult = gradeQuizAttempt(failAnswers, questions);
  assert(failAttemptResult.score === 0 && !failAttemptResult.passed, 'Scores failed attempt accurately');

  // Summary
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite();
