import RooxApp from '@/components/roox-app';
import { pageMetadata } from '@/lib/pages';

export const metadata = pageMetadata('market');
export default function Marketplace() { return <RooxApp page="market" />; }
