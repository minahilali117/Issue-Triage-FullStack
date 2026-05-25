'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { KeyRound, Shield, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AppShell from '@/components/app-shell';
import LoadingState from '@/components/loading-state';
import { useAuth } from '@/components/auth-provider';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/components/ui';
import {
  ApiError,
  changeMyPassword,
  fetchUsers,
  updateMyProfile,
  updateUserRole,
} from '@/lib/api';
import { appToast } from '@/lib/toast';
import type { AuthResponse } from '@/types/auth';
import type { UserRole } from '@/types/issue';

const profileSchema = z.object({
  name: z.string().max(100).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6).max(128),
    newPassword: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError || error instanceof Error ? error.message : fallback;

const roleOptions: UserRole[] = ['ADMIN', 'DEVELOPER', 'VIEWER'];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, signIn, isAuthenticated, isReady } = useAuth();
  const [roleDrafts, setRoleDrafts] = useState<Record<number, UserRole>>({});

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isReady, router]);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    profileForm.reset({ name: user?.name ?? '' });
  }, [profileForm, user]);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const profileMutation = useMutation({
    mutationFn: async (payload: ProfileFormValues) => updateMyProfile({ name: payload.name?.trim() || null }),
    onSuccess: (updatedUser) => {
      signIn({ user: updatedUser } as AuthResponse);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      appToast.success('Profile updated.');
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Could not update profile.')),
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: PasswordFormValues) =>
      changeMyPassword({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      appToast.success('Password updated.');
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Could not change password.')),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      appToast.success('User role updated.');
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Could not update role.')),
  });

  const isAdmin = user?.role === 'ADMIN';
  const loading = !isReady || !isAuthenticated;

  if (loading) {
    return <LoadingState label="Loading account settings..." variant="details" />;
  }

  if (!user) {
    return null;
  }

  const profileTitle = isAdmin ? 'Edit your profile' : 'Your profile';

  return (
    <AppShell>
      <div className="grid gap-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 rounded-3xl border border-slate-200 bg-white/75 px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:px-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Account settings</p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Manage identity, security, and team access.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Profile changes are kept lightweight, password updates stay self-service, and admins can manage roles without leaving the dashboard.
          </p>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Profile</p>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{profileTitle}</h3>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  {(user.name ?? user.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-slate-950 dark:text-white">{user.name ?? 'Unnamed user'}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{user.role}</p>
                </div>
              </div>

              {isAdmin ? (
                <form
                  className="grid gap-4"
                  onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))}
                >
                  <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Display name</label>
                    <Input {...profileForm.register('name')} maxLength={100} placeholder="Your display name" />
                    {profileForm.formState.errors.name ? (
                      <p className="text-xs text-rose-600">{profileForm.formState.errors.name.message}</p>
                    ) : null}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => profileForm.reset({ name: user.name ?? '' })}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={profileMutation.isPending}>
                      {profileMutation.isPending ? 'Saving...' : 'Save profile'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Admin profile edits are restricted to administrators. Your password remains self-service below.
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Security</p>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Change password</h3>
              </div>
            </div>

            <form
              className="mt-5 grid gap-4"
              onSubmit={passwordForm.handleSubmit((values) => passwordMutation.mutate(values))}
            >
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Current password</label>
                <Input type="password" {...passwordForm.register('currentPassword')} placeholder="Current password" />
                {passwordForm.formState.errors.currentPassword ? (
                  <p className="text-xs text-rose-600">{passwordForm.formState.errors.currentPassword.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">New password</label>
                <Input type="password" {...passwordForm.register('newPassword')} placeholder="New password" />
                {passwordForm.formState.errors.newPassword ? (
                  <p className="text-xs text-rose-600">{passwordForm.formState.errors.newPassword.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Confirm password</label>
                <Input type="password" {...passwordForm.register('confirmPassword')} placeholder="Confirm password" />
                {passwordForm.formState.errors.confirmPassword ? (
                  <p className="text-xs text-rose-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                ) : null}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                >
                  Clear
                </Button>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? 'Updating...' : 'Update password'}
                </Button>
              </div>
            </form>
          </motion.section>
        </div>

        {isAdmin ? (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Team access</p>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Manage user roles</h3>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              {usersQuery.isLoading ? (
                <div className="grid gap-2 p-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="grid flex-1 gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-10 w-28" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid divide-y divide-slate-200 dark:divide-white/10">
                  {usersQuery.data?.map((member) => {
                    const draftRole = roleDrafts[member.id] ?? member.role;
                    const isSaving = roleMutation.isPending && roleMutation.variables?.userId === member.id;
                    const isSelf = member.id === user.id;

                    return (
                      <div key={member.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                            {(member.name ?? member.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-950 dark:text-white">{member.name ?? 'Unnamed user'}</p>
                              {isSelf ? (
                                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Select
                            value={draftRole}
                            onValueChange={(value) =>
                              setRoleDrafts((current) => ({
                                ...current,
                                [member.id]: value as UserRole,
                              }))
                            }
                            disabled={isSelf}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={draftRole} />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => roleMutation.mutate({ userId: member.id, role: draftRole })}
                            disabled={isSelf || isSaving || draftRole === member.role}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>
        ) : null}
      </div>
    </AppShell>
  );
}