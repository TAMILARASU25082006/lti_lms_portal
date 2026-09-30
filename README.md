# Company Academy - Enterprise Learning Management System (LMS)

A production-grade, full-stack Learning Management System combining modern frontend experiences with secure backend services in a unified **Next.js App Router** architecture. Designed specifically for cohort-based academy models where enrollment is managed by administrators and tutors.

---

## 🏛️ System Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Unified server actions, route handlers, and React server/client components |
| **Language** | TypeScript | Strict type safety across database models, APIs, and client interfaces |
| **Styling** | Tailwind CSS | Tailored Navy (`#0f2744`), Royal Blue (`#1d4ed8`), Slate, and White design system |
| **Authentication** | NextAuth.js (Auth.js) | Google OAuth / OpenID Connect (`openid`, `email`, `profile`) with strict verified-email validation |
| **Database** | MongoDB & Mongoose | Persistent cached singleton connection pool with schema indexes and uniqueness constraints |
| **Media Storage** | Cloudinary | Pre-signed upload signatures for direct browser-to-cloud file delivery without server buffering |
| **Credentials** | jsPDF | Cryptographically stamped A4 landscape completion certificates with public verification lookup |

---

## 🚀 Workspaces & Features

### 1. Public Academy Portal
- **Homepage (`/`)**: Hero branding, real-time metrics, featured courses, cohort learning model breakdown, and admissions philosophy.
- **Course Catalog (`/courses`)**: Search and multi-criteria filters by domain category, skill level, and delivery format (Hybrid, Online, In-Person).
- **Course Details (`/courses/[slug]`)**: Detailed curriculum syllabus, learning outcomes, prerequisites, lead tutor profiles, and admissions inquiries.
- **About (`/about`)**: Institutional governance, academic standards, and pedagogical vision.
- **Contact & Admissions (`/contact`)**: Prospective student inquiries persisted directly to MongoDB for administrator review.
- **Public Certificate Verification (`/verify` & `/verify/[certificateId]`)**: Tamper-proof credential authenticity validation with privacy preservation.

### 2. Student Workspace (`/student`)
- **Dashboard**: Enrolled courses, overall learning progress, upcoming live sessions, pending assignments, and cohort announcements. Empty-state guidance for newly registered students awaiting enrollment.
- **Classroom Player (`/student/courses/[courseId]/classroom`)**: Modular video lesson player with playback position memory, markdown lesson content, completion toggles, and downloadable resource vaults.
- **Live Class Schedule (`/student/schedule`)**: Timezone-aware calendar of Google Meet/Zoom live lab sessions with authorized access links.
- **Assignments Console (`/student/assignments`)**: Detailed instructions, rubric criteria, submission modals (file upload or online text), late status tracking, and tutor grade/feedback review.
- **Timed Quizzes (`/student/quizzes/[quizId]`)**: Server-side countdown timers that cannot be reset by refreshing, attempt limits, question snapshots, and delayed answer reviews.
- **Attendance Log (`/student/attendance`)**: Session-by-session presence tracking and cohort attendance rate calculation.
- **Completion Certificates (`/student/certificates`)**: Automated server-side eligibility evaluation (100% lessons, >=80% attendance, passed quizzes, submitted assignments) and instant downloadable PDF.
- **Notifications & Profile Settings**: Real-time alerts, profile updates, and timezone preferences.

### 3. Tutor Workspace (`/tutor`)
- **Tutor Dashboard**: Assigned active courses, cohorts, upcoming sessions, and ungraded assignment submission counts.
- **Curriculum Builder (`/tutor/courses/[courseId]/builder`)**: Course module and lesson authoring, reordering, video URL integration, and drafting/submission for publication approval.
- **Cohort Batch Operations (`/tutor/batches/[batchId]`)**: Live class scheduling with meeting URLs, real-time student attendance marking, direct batch student enrollment, and cohort announcements.
- **Assessment & Grading Console (`/tutor/assignments` & `/tutor/quizzes`)**: Rubric-based assignment grading with private student feedback, and quiz question authoring.
- **Student Progress Tracker (`/tutor/students`)**: Granular visibility into individual student progress across assigned cohorts.

### 4. Administrator Portal (`/admin`)
- **Executive Dashboard**: Real database-backed statistics (students, tutors, published courses, active cohorts, issued certificates, unread inquiries).
- **User Governance (`/admin/users`)**: Searchable user directory, role management, and instant account suspension controls.
- **Tutor Invitation Management (`/admin/tutors`)**: Cryptographic invitation tokens generated for verified Google email accounts.
- **Course Lifecycle Governance (`/admin/courses`)**: Full curriculum review, publication approval, unpublishing, and archival.
- **Cohort & Enrollment Operations (`/admin/batches`)**: Batch creation, tutor assignment, student enrollment, cohort-to-cohort transfers, and access revocation.
- **Academic Reports & CSV Export (`/admin/reports`)**: Enrolment, progress, attendance, and assessment metrics with authorized CSV data downloads.
- **Admissions Inquiries Review (`/admin/enquiries`)**: Full inquiry tracking with internal counselor notes and status management.
- **Certificate Registry & Revocation (`/admin/certificates`)**: Complete ledger of issued credentials with mandatory-reason revocation.
- **Academy Settings & Customization (`/admin/settings`)**: Dynamic branding (company name, tagline, logo, navy/blue theme colors) and certificate qualification rules.
- **System Audit Log (`/admin/audit`)**: Comprehensive chronological audit trail of all administrative and sensitive operations.

---

## 🛠️ Getting Started & Installation

### Prerequisites
- Node.js 18.17+ or 20+
- MongoDB instance (MongoDB Atlas connection string or local MongoDB on `mongodb://localhost:27017/company_academy`)
- Google Cloud Console Project (for Google OAuth 2.0 Client ID and Secret)
- Cloudinary Account (optional, for direct media storage)

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd lti_lms_portal

# Install all dependencies
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the configuration parameters in `.env.local`:
```env
# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-random-32-byte-hex-string"

# MongoDB Database
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/company_academy?retryWrites=true&w=majority"

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Cloudinary (Optional - for real file/video uploads)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Development Impersonation (Enables local instant switching for testing without Google keys)
ALLOW_DEV_IMPERSONATION="true"
```

---

## 🔑 Google OAuth 2.0 Configuration Guide

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Company Academy LMS`).
3. Navigate to **APIs & Services** ➔ **OAuth consent screen**:
   - Choose **External** (or **Internal** if using Google Workspace).
   - Fill in App name: `Company Academy`.
   - User support email: your email.
   - Developer contact email: your email.
   - Scopes: Select `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and `openid`.
4. Navigate to **APIs & Services** ➔ **Credentials**:
   - Click **Create Credentials** ➔ **OAuth Client ID**.
   - Application type: **Web application**.
   - Name: `Company Academy Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (Localhost)
     - `https://your-production-domain.com` (Production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (Localhost)
     - `https://your-production-domain.com/api/auth/callback/google` (Production)
5. Copy the generated **Client ID** and **Client Secret** into your `.env.local` file.

> **Security Note:** The LMS strictly checks `profile.email_verified === true`. Accounts unverified by Google are rejected at the authentication gate.

---

## 👑 Initial Administrator Bootstrap Instructions

To adhere to the strict security requirement that **no user is automatically granted administrative access upon registration**:

1. Start your local server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000/login` and sign in with your Google account (or use the Dev Student login if testing locally).
3. Open your terminal and run the bootstrap script:
   ```bash
   npm run bootstrap:admin
   ```
   *This command lists all registered users in your database.*
4. Promote your account by passing your email or MongoDB ID:
   ```bash
   npm run bootstrap:admin your-email@domain.com
   ```
5. You are now an authorized **Administrator**! Navigate to `http://localhost:3000/admin` to access the Admin Portal.

---

## 📚 Development Data Seed Script

To populate realistic sample courses, modules, video lessons, quizzes, assignments, cohort batches, and live sessions:

```bash
npm run seed:dev
```

*Note: The seed script includes safety checks preventing execution in production (`NODE_ENV === 'production'`).*

---

## 🧪 Automated Testing

Execute the automated test suite covering input sanitization, certificate code generation, academic completion eligibility rules, media upload quotas, Cloudinary signature hashing, and server-side quiz evaluation:

```bash
npm test
```

Expected output:
```
================================================================
 COMPANY ACADEMY - AUTOMATED INTEGRATION & LOGIC TEST SUITE
================================================================
Test Suite 1: Security & Input Sanitization
  ✓ PASS: Sanitizer strips harmful script tags
  ✓ PASS: Sanitizer strips malicious inline event handlers
  ✓ PASS: Sanitizer preserves legitimate text content
...
================================================================
TEST RESULTS: 18/18 PASSED (0 FAILED)
================================================================
```

---

## 🚢 Deployment Instructions

The entire system is a single Next.js application containing both frontend UI and backend API routes.

### Option A: Vercel Deployment
1. Push your repository to GitHub / GitLab.
2. Import the project into Vercel.
3. In Project Settings ➔ Environment Variables, configure:
   - `NEXT_PUBLIC_APP_URL`: `https://your-domain.vercel.app`
   - `NEXTAUTH_URL`: `https://your-domain.vercel.app`
   - `NEXTAUTH_SECRET`: (generated secure secret)
   - `MONGODB_URI`: (MongoDB Atlas URI)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - `ALLOW_DEV_IMPERSONATION`: `false`
4. Deploy!

### Option B: Docker / Node.js Production Server
```bash
# Build production bundle
npm run build

# Start production server
npm start
```

---

## 💾 MongoDB Backup & Restore Guidance

### Backup (mongodump)
```bash
mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/company_academy" --out=/backups/$(date +%F)
```

### Restore (mongorestore)
```bash
mongorestore --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/company_academy" /backups/2026-09-30/company_academy
```

---

## 📋 Verification Report

| Feature Category | Status | Verification Method |
|---|---|---|
| **Google OAuth & OIDC** | ✅ Implemented & Guarded | Validated via NextAuth GoogleProvider, openid/email/profile scopes, email_verified guard, and dev impersonation toggle |
| **Role-Based Isolation** | ✅ Implemented & Tested | Server-side role guards on `/student`, `/tutor`, `/admin` and API routes |
| **Curriculum Builder** | ✅ Implemented | Module reordering, lesson creation (text/video), and admin approval workflow |
| **Cohort Batches & Enrolment** | ✅ Implemented | Batch assignment, tutor assignment, student enrollment/transfers, and schedule coordination |
| **Classroom Player** | ✅ Implemented | Modular navigation, video resume position, completion tracking, resource downloads |
| **Server-Side Quizzes** | ✅ Implemented & Tested | Countdown timer deadline stored on server, answer secrecy until grading, attempt limit checks |
| **Assignments & Grading** | ✅ Implemented | Rubric criteria, submission deadlines, tutor grading console with feedback |
| **Certificates & Verification** | ✅ Implemented & Tested | Server eligibility engine, unique code generator, jsPDF generation, public verification endpoint |
| **Account Suspension** | ✅ Implemented | Checked on every authenticated session and route layout |
| **Admin Audit Log** | ✅ Implemented | Chronological audit logging on all administrative actions with payload inspector |
| **Cloudinary Media** | ⚡ Configuration-Dependent | Signed authorization route implemented; active when credentials supplied in `.env.local` |
