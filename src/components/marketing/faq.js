'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    question: 'Do I need to download an app or create an account?',
    answer:
      'No. Scan the HELPY QR code at your venue, share your name and phone number, and request assistance. Your session stays on your phone for the visit.',
  },
  {
    question: 'How much does a HELPY service cost?',
    answer:
      'Pricing is set per venue in 70-minute blocks. A typical block is Rs. 500, and additional blocks are added only when the service runs longer. The final amount is always calculated by the HELPY server from the actual start and end times — never estimated in the browser.',
  },
  {
    question: 'Will my service be recorded?',
    answer:
      'Recording is disclosed before you submit a request. It starts only after consent and stops when the service ends. If the venue requires recording and you decline, a request cannot be created — you will see this clearly before submitting, and you can stop at any time. HELPY never records covertly.',
  },
  {
    question: 'How do payments work?',
    answer:
      'Your bill appears as soon as the service is completed. Card, JazzCash, Easypaisa and bank transfers are submitted with a transaction reference and remain pending until the HELPY team confirms them. Cash payments are recorded by staff. Tips are optional and only counted after a confirmed payment.',
  },
  {
    question: 'Can I cancel my request?',
    answer:
      'You can cancel while a request is waiting for a helper or after a helper is assigned. Once the service is in progress, cancellation is handled by the venue team so the helper is not left stranded.',
  },
  {
    question: 'Who can access my recordings and personal data?',
    answer:
      'Recordings are private to authorised administrators. Playback requires a written reason and generates a short-lived signed link, and every access is logged. Recordings follow the venue’s retention period unless a legal hold applies.',
  },
  {
    question: 'What if I have a complaint?',
    answer:
      'You can file a complaint from your completed service. Complaints are reviewed by the HELPY team. Repeated upheld complaints trigger an internal review — never an automatic salary deduction or termination.',
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white shadow-soft">
      {FAQS.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(expanded ? -1 : index)}
                aria-expanded={expanded}
                aria-controls={`faq-panel-${index}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-navy-50/50"
              >
                <span className="text-sm font-semibold text-navy-900">{item.question}</span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-navy-400 transition-transform', expanded && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={`faq-panel-${index}`}
              className={cn('px-5 pb-5 text-sm leading-relaxed text-navy-600', !expanded && 'hidden')}
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
