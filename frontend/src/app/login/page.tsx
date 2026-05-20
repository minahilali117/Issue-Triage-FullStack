'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/components/auth-provider';
import { login, signup } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, isReady } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: isSignup ? z.string().min(1) : z.string().optional(),
      }),
    [isSignup],
  );
  type AuthFormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '' },
  });

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace('/');
    }
  }, [isReady, isAuthenticated, router]);

  const submitForm = async (values: AuthFormValues) => {
    setIsSubmitting(true);
    setError('');

    try {
      const session = isSignup
        ? await signup({
            email: values.email,
            password: values.password,
            name: values.name || undefined,
          })
        : await login({ email: values.email, password: values.password });

      signIn(session);
      router.replace('/');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Authentication failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="grid gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Secure access</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {isSignup ? 'Create your account' : 'Sign in to continue'}
          </h1>
          <p className="text-sm text-slate-600">
            Access the triage dashboard with a JWT-backed session.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit(submitForm)}>
          {isSignup ? (
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
              <Input {...register('name')} placeholder="Your name" />
              {errors.name ? <p className="text-xs text-rose-600">{errors.name.message}</p> : null}
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</label>
            <Input type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500">Password</label>
            <Input type="password" {...register('password')} placeholder="********" />
            {errors.password ? <p className="text-xs text-rose-600">{errors.password.message}</p> : null}
          </div>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Working...' : isSignup ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsSignup((prev) => !prev)}
          className="w-full"
        >
          {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </Button>
      </div>
    </div>
  );
}
