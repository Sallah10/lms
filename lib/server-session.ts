import { getServerSession as nextGetServerSession } from 'next-auth/next';
import { authOptions } from './auth';

export const getServerSession = () => nextGetServerSession(authOptions);
