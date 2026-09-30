import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'Company Academy | Enterprise Learning Management Portal',
  description:
    'Official enterprise academy management portal for students, tutors, and administrators. Cohort-based live learning, syllabus mastery, assessments, and verified certifications.',
  keywords: ['LMS', 'Enterprise Academy', 'Live Online Classes', 'Certifications', 'Engineering Cohorts'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col font-sans antialiased text-slate-900 bg-slate-50">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
