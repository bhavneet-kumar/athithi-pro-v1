import { AuthTokens } from '@/store/slices/userSlice';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad(ctx) {
    const { tokens } = ctx.context as { tokens: AuthTokens };
    if (tokens) throw redirect({ to: '/crm' });
  },
});
