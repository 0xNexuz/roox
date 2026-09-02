import { createInferenceGateway } from '../lib/inference-gateway.js';

const handle = createInferenceGateway();
const inference = {
  fetch(request: Request) { return handle(request, process.env); },
};

export default inference;
