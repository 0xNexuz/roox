import { createInferenceGateway } from '@/lib/inference-gateway';

export const dynamic = 'force-dynamic';
const handle = createInferenceGateway();
export function POST(request: Request) { return handle(request, process.env); }
