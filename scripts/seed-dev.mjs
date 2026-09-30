#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ REFUSING TO RUN: seed-dev.mjs cannot be run in production environment!\n');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('\n❌ ERROR: MONGODB_URI is not defined in .env.local or .env\n');
  process.exit(1);
}

// Schemas
const AcademySettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Company Academy' },
  tagline: { type: String, default: 'Professional Academy for Career Excellence & Applied Technology' },
  primaryColor: { type: String, default: '#0f2744' },
  secondaryColor: { type: String, default: '#1d4ed8' },
  accentColor: { type: String, default: '#3b82f6' },
  contactEmail: { type: String, default: 'admissions@companyacademy.com' },
  contactPhone: { type: String, default: '+1 (555) 019-2834' },
  address: { type: String, default: '100 Technology Square, Cambridge, MA 02139' },
  certificateSignatoryName: { type: String, default: 'Dr. Evelyn Vance' },
  certificateSignatoryTitle: { type: String, default: 'Dean of Academic Governance' },
  minAttendancePercentForCert: { type: Number, default: 80 },
  minQuizScorePercentForCert: { type: Number, default: 70 },
  requireAllAssignmentsPassed: { type: Boolean, default: true },
});

const CourseSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  summary: String,
  description: String,
  category: String,
  level: String,
  deliveryMode: String,
  durationWeeks: Number,
  estimatedHours: Number,
  leadTutorName: String,
  leadTutorBio: String,
  learningOutcomes: [String],
  prerequisites: [String],
  syllabusOverview: String,
  thumbnailUrl: String,
  status: String,
  publishedAt: Date,
  assignedTutors: [mongoose.Schema.Types.ObjectId],
});

const ModuleSchema = new mongoose.Schema({
  courseId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  order: Number,
});

const LessonSchema = new mongoose.Schema({
  courseId: mongoose.Schema.Types.ObjectId,
  moduleId: mongoose.Schema.Types.ObjectId,
  title: String,
  contentType: String,
  textContent: String,
  videoUrl: String,
  durationMinutes: Number,
  order: Number,
  resources: [
    {
      title: String,
      url: String,
      fileType: String,
      fileSizeBytes: Number,
    },
  ],
});

const BatchSchema = new mongoose.Schema({
  courseId: mongoose.Schema.Types.ObjectId,
  name: String,
  code: { type: String, unique: true },
  startDate: Date,
  endDate: Date,
  status: String,
  timezone: String,
  maxCapacity: Number,
  assignedTutors: [mongoose.Schema.Types.ObjectId],
});

const LiveSessionSchema = new mongoose.Schema({
  batchId: mongoose.Schema.Types.ObjectId,
  courseId: mongoose.Schema.Types.ObjectId,
  tutorId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  scheduledStartTime: Date,
  scheduledEndTime: Date,
  meetingPlatform: String,
  meetingUrl: String,
  status: String,
});

const AssignmentSchema = new mongoose.Schema({
  courseId: mongoose.Schema.Types.ObjectId,
  batchId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  rubric: String,
  dueDate: Date,
  maxScore: Number,
  allowedFileTypes: [String],
  maxFileSizeMB: Number,
  status: String,
});

const QuizSchema = new mongoose.Schema({
  courseId: mongoose.Schema.Types.ObjectId,
  batchId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  timeLimitMinutes: Number,
  maxAttempts: Number,
  passingScorePercent: Number,
  revealAnswersAfterSubmission: Boolean,
  status: String,
  questions: [
    {
      questionText: String,
      options: [
        {
          id: String,
          text: String,
        },
      ],
      correctOptionId: String,
      explanation: String,
      points: Number,
    },
  ],
});

const AcademySettings = mongoose.models.AcademySettings || mongoose.model('AcademySettings', AcademySettingsSchema);
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
const Module = mongoose.models.Module || mongoose.model('Module', ModuleSchema);
const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
const LiveSession = mongoose.models.LiveSession || mongoose.model('LiveSession', LiveSessionSchema);
const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

async function seedDevelopmentData() {
  console.log('\n================================================================');
  console.log(' COMPANY ACADEMY - DEVELOPMENT SEED SCRIPT');
  console.log('================================================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // 1. Academy Settings
    let settings = await AcademySettings.findOne();
    if (!settings) {
      await AcademySettings.create({});
      console.log('✓ Academy settings initialized');
    }

    // 2. Course 1: Full-Stack Cloud Architecture
    console.log('\nCreating sample Course 1: Full-Stack Cloud Architecture & Distributed Systems...');
    let course1 = await Course.findOne({ slug: 'full-stack-cloud-architecture' });
    if (!course1) {
      course1 = await Course.create({
        title: 'Full-Stack Cloud Architecture & Distributed Systems',
        slug: 'full-stack-cloud-architecture',
        summary:
          'Master modern microservices, resilient event-driven architectures, Next.js full-stack systems, and distributed database designs.',
        description:
          'This intensive cohort program trains engineers to architect, deploy, and scale mission-critical web applications. You will work with containerization, cloud orchestration, relational and non-relational distributed databases, message queues, and end-to-end security postures.',
        category: 'Software Engineering',
        level: 'Advanced',
        deliveryMode: 'HYBRID',
        durationWeeks: 12,
        estimatedHours: 90,
        leadTutorName: 'Prof. Marcus Chen, Ph.D.',
        leadTutorBio:
          'Former Principal Distributed Systems Architect with 16+ years designing high-throughput fintech and SaaS infrastructure.',
        learningOutcomes: [
          'Design resilient microservices patterns with fault isolation and circuit breakers',
          'Deploy secure Next.js applications integrated with persistent multi-region databases',
          'Implement event streaming pipelines using Kafka, RabbitMQ, and Redis pub/sub',
          'Optimize query performance, sharding, and ACID isolation levels across distributed stores',
          'Establish automated CI/CD and zero-downtime deployment pipelines',
        ],
        prerequisites: [
          'Proficiency with TypeScript/JavaScript or Python',
          'Foundational understanding of HTTP/Web APIs and database concepts',
          'Experience building full-stack web applications',
        ],
        syllabusOverview:
          '12 structured modules spanning architecture fundamentals, container clusters, event buses, distributed storage, and operational telemetry.',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      });
      console.log(`  ✓ Created course: ${course1.title}`);

      // Modules for Course 1
      const mod1 = await Module.create({
        courseId: course1._id,
        title: 'Module 1: Foundations of Distributed System Design',
        description: 'Cap theorem, consensus algorithms, stateless microservices, and decoupled API boundaries.',
        order: 1,
      });

      const mod2 = await Module.create({
        courseId: course1._id,
        title: 'Module 2: Scalable Data Pipelines & Asynchronous Event Buses',
        description: 'Message queuing patterns, outbox patterns, idempotency, and stream processing.',
        order: 2,
      });

      // Lessons for Module 1
      await Lesson.create([
        {
          courseId: course1._id,
          moduleId: mod1._id,
          title: 'Lesson 1.1: System Deconstruction & Fault Domains',
          contentType: 'VIDEO',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          durationMinutes: 28,
          order: 1,
          textContent: `### Architectural Overview\n\nIn distributed computing, every network call can and will eventually fail. Understanding fault domains and stateless topologies is essential.\n\nKey takeaways:\n- Decouple compute from storage\n- Minimize synchronous dependencies\n- Enforce idempotency keys across all mutations`,
          resources: [
            {
              title: 'Architectural Blueprint & Spec Sheet (PDF)',
              url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              fileType: 'pdf',
              fileSizeBytes: 245000,
            },
          ],
        },
        {
          courseId: course1._id,
          moduleId: mod1._id,
          title: 'Lesson 1.2: Database Sharding & Read-Replica Patterns',
          contentType: 'TEXT',
          durationMinutes: 35,
          order: 2,
          textContent: `### Data Tier Scaling Strategies\n\nWhen scaling database layers beyond single-node throughput, consider:\n\n1. **Vertical Read Scaling**: Employing asynchronous read replicas for analytical queries and dashboards.\n2. **Horizontal Partitioning (Sharding)**: Partitioning by deterministic tenant ID or hash key.\n3. **Connection Pooling**: Reusing socket connections via singleton caching to prevent exhausted limits.`,
          resources: [],
        },
      ]);

      // Lessons for Module 2
      await Lesson.create([
        {
          courseId: course1._id,
          moduleId: mod2._id,
          title: 'Lesson 2.1: Transactional Outbox & Event Publishing',
          contentType: 'VIDEO',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          durationMinutes: 42,
          order: 1,
          textContent: `### Guaranteed Event Delivery\n\nDirectly calling a message broker inside an HTTP handler risks dual-write discrepancies. The transactional outbox pattern guarantees eventual consistency by recording published events in the same transaction as state mutations.`,
        },
      ]);
      console.log('  ✓ Created modules and lessons for Course 1');

      // Batch for Course 1
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14); // started 2 weeks ago
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 70);

      const batch1 = await Batch.create({
        courseId: course1._id,
        name: 'Cohort Alpha - Spring 2026',
        code: 'FSCA-2026-A',
        startDate,
        endDate,
        status: 'ACTIVE',
        timezone: 'UTC',
        maxCapacity: 30,
      });
      console.log(`  ✓ Created batch: ${batch1.name} (${batch1.code})`);

      // Live Session for Batch 1
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + 2);
      sessionDate.setHours(18, 0, 0, 0);
      const sessionEnd = new Date(sessionDate);
      sessionEnd.setHours(20, 0, 0, 0);

      await LiveSession.create({
        batchId: batch1._id,
        courseId: course1._id,
        title: 'Live Lab: Implementing Fault-Tolerant Circuit Breakers',
        description: 'Hands-on live coding workshop demonstrating resilience patterns and chaos testing.',
        scheduledStartTime: sessionDate,
        scheduledEndTime: sessionEnd,
        meetingPlatform: 'Google Meet',
        meetingUrl: 'https://meet.google.com/dev-sample-meeting',
        status: 'SCHEDULED',
      });
      console.log('  ✓ Scheduled sample live session');

      // Quiz for Course 1
      await Quiz.create({
        courseId: course1._id,
        batchId: batch1._id,
        title: 'Assessment 1: Distributed Architectures & CAP Theorem',
        description:
          'Timed 20-minute conceptual assessment evaluating trade-offs in consistency, availability, and network partitioning.',
        timeLimitMinutes: 20,
        maxAttempts: 3,
        passingScorePercent: 75,
        revealAnswersAfterSubmission: true,
        status: 'PUBLISHED',
        questions: [
          {
            questionText:
              'According to the CAP Theorem, which trade-off must a distributed database make during a network partition?',
            options: [
              { id: 'opt_1', text: 'It can maintain both full consistency and 100% availability simultaneously.' },
              { id: 'opt_2', text: 'It must choose between Consistency (CP) and Availability (AP).' },
              { id: 'opt_3', text: 'It automatically eliminates network latency.' },
              { id: 'opt_4', text: 'It transforms into an ACID-only single-node relational store.' },
            ],
            correctOptionId: 'opt_2',
            explanation:
              'When a network partition occurs in a distributed system, the system must either refuse non-replicated writes (preserving consistency) or accept them (preserving availability at the cost of consistency).',
            points: 10,
          },
          {
            questionText:
              'What primary problem does the Transactional Outbox pattern solve in microservices architecture?',
            options: [
              { id: 'opt_a', text: 'Encrypting passwords in transit' },
              { id: 'opt_b', text: 'Eliminating the dual-write problem between database updates and event publishing' },
              { id: 'opt_c', text: 'Compressing HTTP response payloads' },
              { id: 'opt_d', text: 'Bypassing load balancers' },
            ],
            correctOptionId: 'opt_b',
            explanation:
              'The Transactional Outbox pattern ensures that database mutations and event notifications are committed atomically in the same local transaction.',
            points: 10,
          },
          {
            questionText: 'What is the primary benefit of connection pooling in serverless and containerized Node.js environments?',
            options: [
              { id: 'opt_w', text: 'Allows storing images in RAM indefinitely' },
              { id: 'opt_x', text: 'Reuses open TCP database sockets to prevent exhausting connection limits and socket overhead' },
              { id: 'opt_y', text: 'Automatically writes TypeScript types' },
              { id: 'opt_z', text: 'Eliminates all cross-origin security requirements' },
            ],
            correctOptionId: 'opt_x',
            explanation:
              'Connection pooling reuses TCP handshakes and keeps a controlled number of sockets active across multiple requests.',
            points: 10,
          },
        ],
      });
      console.log('  ✓ Created sample course quiz with questions');

      // Assignment for Course 1
      const assignDue = new Date();
      assignDue.setDate(assignDue.getDate() + 7);

      await Assignment.create({
        courseId: course1._id,
        batchId: batch1._id,
        title: 'Assignment 1: Resilient Microservice Design Document & API Spec',
        description:
          'Author an RFC-style architecture design specification outlining a multi-tenant checkout service. Detail data schema, failure handling, circuit breaker thresholds, and OpenAPI endpoints.',
        rubric:
          '1. Architectural rigor & fault isolation (40 pts)\n2. Data consistency model & outbox design (30 pts)\n3. OpenAPI 3.0 specification & schema validation (20 pts)\n4. Clarity & professional documentation (10 pts)',
        dueDate: assignDue,
        maxScore: 100,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'zip'],
        maxFileSizeMB: 25,
        status: 'PUBLISHED',
      });
      console.log('  ✓ Created sample cohort assignment');
    }

    // 3. Course 2: Applied Machine Learning & AI Engineering
    console.log('\nCreating sample Course 2: Applied Machine Learning & AI Engineering...');
    let course2 = await Course.findOne({ slug: 'applied-machine-learning-ai-engineering' });
    if (!course2) {
      course2 = await Course.create({
        title: 'Applied Machine Learning & AI Engineering',
        slug: 'applied-machine-learning-ai-engineering',
        summary:
          'Productionize predictive models, LLM retrieval pipelines (RAG), vector databases, and evaluation harnesses.',
        description:
          'From foundational feature engineering to production agent orchestration, this program equips software engineers to build reliable, high-performance AI services.',
        category: 'Data & Artificial Intelligence',
        level: 'Intermediate',
        deliveryMode: 'ONLINE',
        durationWeeks: 10,
        estimatedHours: 80,
        leadTutorName: 'Dr. Sarah Lin',
        leadTutorBio:
          'AI Research Director and industry veteran with extensive patents in vector similarity search and transformer architectures.',
        learningOutcomes: [
          'Build end-to-end vector retrieval pipelines using Pinecone, pgvector, and hybrid search',
          'Implement structured output validation and deterministic tool calling with LLMs',
          'Deploy automated evaluation benchmarks to detect model hallucination and drift',
          'Scale model serving via Triton and high-throughput containerized inference endpoints',
        ],
        prerequisites: [
          'Proficiency with Python or TypeScript',
          'Basic linear algebra and probability intuition',
          'Experience building REST/JSON web services',
        ],
        syllabusOverview: '10 modules covering embeddings, indexing, prompt pipelines, fine-tuning, and production eval.',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      });
      console.log(`  ✓ Created course: ${course2.title}`);

      const c2mod = await Module.create({
        courseId: course2._id,
        title: 'Module 1: Vector Embeddings & Hybrid Search',
        description: 'Dense vs sparse retrieval, chunking strategies, and metadata filtering.',
        order: 1,
      });

      await Lesson.create({
        courseId: course2._id,
        moduleId: c2mod._id,
        title: 'Lesson 1.1: High-Dimensional Semantic Search',
        contentType: 'TEXT',
        durationMinutes: 30,
        order: 1,
        textContent: `### Semantic Search & Embeddings\n\nUnlike lexical matching (BM25), vector embeddings capture conceptual relationships across multi-lingual corpora.\n\nIn this lesson, we dissect cosine similarity vs dot-product operations on normalized vector planes.`,
      });
    }

    // 4. Course 3: Draft course awaiting admin approval
    let course3 = await Course.findOne({ slug: 'enterprise-cybersecurity-zero-trust' });
    if (!course3) {
      course3 = await Course.create({
        title: 'Enterprise Cybersecurity & Zero-Trust Governance',
        slug: 'enterprise-cybersecurity-zero-trust',
        summary:
          'Implement modern perimeterless security, mutual TLS, identity governance, and threat detection frameworks.',
        description:
          'Comprehensive training in defensive cyber architecture, compliance auditing (SOC2, ISO27001), and cryptography.',
        category: 'Cybersecurity & Governance',
        level: 'Advanced',
        deliveryMode: 'HYBRID',
        durationWeeks: 8,
        estimatedHours: 65,
        leadTutorName: 'James R. Vance, CISSP',
        leadTutorBio: 'CISO and Cybersecurity Advisor to Fortune 500 enterprises.',
        learningOutcomes: [
          'Architect Zero-Trust Network Access (ZTNA) frameworks',
          'Implement automated certificate rotation and SPIFFE/SPIRE identity attestation',
          'Execute red-team simulated breach assessments',
        ],
        prerequisites: ['Foundational networking (TCP/IP, TLS)', 'Basic cloud IAM concepts'],
        syllabusOverview: '8 modules focused on identity federation, mTLS, supply chain security, and audit readiness.',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        status: 'DRAFT', // Awaiting Admin Approval
      });
      console.log(`  ✓ Created draft course pending publication: ${course3.title}`);
    }

    console.log('\n================================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY');
    console.log('================================================================');
    console.log('Next steps:');
    console.log('  1. Run the Next.js dev server: npm run dev');
    console.log('  2. Browse public courses on: http://localhost:3000/courses');
    console.log('  3. Log in with your Google account on: http://localhost:3000/login');
    console.log('  4. Promote your account to Administrator: node scripts/bootstrap-admin.mjs <your-email>\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

seedDevelopmentData();
