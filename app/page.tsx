import RooxApp from '@/components/roox-app';
import { pageMetadata } from '@/lib/pages';

export const metadata = pageMetadata('home');
export default function Home() { return <RooxApp page="home" />; }
