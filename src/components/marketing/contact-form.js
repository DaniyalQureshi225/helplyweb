'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { Field, FormError, Input, Select, Textarea } from '@/components/ui/form';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  email: z.string().trim().email('Enter a valid email address'),
  topic: z.enum(['guest', 'venue', 'support', 'privacy']),
  message: z.string().trim().min(10, 'Please add a little more detail').max(2000, 'Please keep it under 2000 characters'),
});

const TOPICS = [
  { value: 'guest', label: 'I am a guest and need help' },
  { value: 'venue', label: 'I want to bring HELPY to my venue' },
  { value: 'support', label: 'I have a question about a service' },
  { value: 'privacy', label: 'Privacy or recording question' },
];

export function ContactForm({ email, phone }) {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', topic: 'guest', message: '' },
  });

  const onSubmit = async (values) => {
    const subject = `HELPY enquiry — ${TOPICS.find((topic) => topic.value === values.topic)?.label ?? values.topic}`;
    const body = `Name: ${values.name}\nEmail: ${values.email}\nTopic: ${values.topic}\n\n${values.message}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
        <h3 className="text-lg font-semibold text-teal-900">Your email app should be open</h3>
        <p className="mt-2 text-sm leading-relaxed text-teal-800">
          We prepared a message addressed to <strong>{email}</strong>. Send it from your email app and our team will
          reply. If nothing opened, email us directly at{' '}
          <a href={`mailto:${email}`} className="font-semibold underline underline-offset-4">
            {email}
          </a>
          {phone ? (
            <>
              {' '}
              or call{' '}
              <a href={`tel:${String(phone).replace(/[^\d+]/g, '')}`} className="font-semibold underline underline-offset-4">
                {phone}
              </a>
            </>
          ) : null}
          .
        </p>
        <button type="button" onClick={() => setSent(false)} className="link-subtle mt-4 text-sm">
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name" error={errors.name?.message} required>
          <Input id="contact-name" autoComplete="name" invalid={Boolean(errors.name)} {...register('name')} />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={errors.email?.message} required>
          <Input id="contact-email" type="email" autoComplete="email" invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
      </div>

      <Field label="What is this about?" htmlFor="contact-topic" error={errors.topic?.message} required>
        <Select id="contact-topic" {...register('topic')}>
          {TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Message"
        htmlFor="contact-message"
        error={errors.message?.message}
        hint="Do not include payment card numbers or identity documents."
        required
      >
        <Textarea id="contact-message" rows={5} invalid={Boolean(errors.message)} {...register('message')} />
      </Field>

      <FormError message={errors.root?.message} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={isSubmitting}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Prepare email
        </Button>
        <p className="text-xs text-navy-500">This opens your email app. Nothing is sent automatically.</p>
      </div>
    </form>
  );
}
