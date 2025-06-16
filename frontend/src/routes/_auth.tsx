import { createFileRoute, redirect } from '@tanstack/react-router';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/_auth')({
  beforeLoad(ctx) {
    const { currentUser } = ctx.context as { currentUser: User };
    if (currentUser) {
      throw redirect({ to: '/' });
    }
  },
});
