import React from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { Mail, Phone, MapPin, ShieldCheck, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-navy-800/80">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <BrandLogo lightMode={true} />
            <p className="text-sm text-slate-400 leading-relaxed">
              Professional enterprise academy delivering rigorous technical curriculums, live cohort sessions, and applied engineering excellence.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Academy Certification</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4">Academies & Learning</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/courses" className="hover:text-blue-400 transition-colors">
                  Course Catalogue
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Cloud+%26+DevOps" className="hover:text-blue-400 transition-colors">
                  Cloud & Infrastructure
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Full-Stack+Engineering" className="hover:text-blue-400 transition-colors">
                  Full-Stack Systems
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Data+%26+AI" className="hover:text-blue-400 transition-colors">
                  Data & Applied AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Academy Info */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4">Admissions & Verification</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  Teaching Methodology
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Corporate Inquiries
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  Certificate Verification
                </Link>
              </li>
              <li>
                <span className="text-xs text-slate-500 block pt-1">
                  * All student enrollments are managed directly by academy administration.
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-4">Campus & Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>100 Innovation Way, Suite 400, Tech City, CA</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>admissions@companyacademy.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>+1 (800) 555-0199</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Company Academy. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link href="/about" className="hover:text-slate-300">
              Governance & Policies
            </Link>
            <Link href="/contact" className="hover:text-slate-300">
              Academic Support
            </Link>
            <Link href="/verify" className="hover:text-slate-300">
              Verify Credentials
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
