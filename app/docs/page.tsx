import RooxApp from '@/components/roox-app';
import { pageMetadata } from '@/lib/pages';

export const metadata = pageMetadata('docs');
export default function Docs() { return <RooxApp page="docs" />; }
