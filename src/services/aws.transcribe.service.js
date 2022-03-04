import { TranscribeClient } from "@aws-sdk/client-transcribe";

const REGION = 'us-east-1';

const transcribeClient = new TranscribeClient({ region: REGION });

export { transcribeClient };
