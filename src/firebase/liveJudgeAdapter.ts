import { getToken } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, InferenceSource } from 'firebase/ai';
import { liveJudgeIssueKinds, liveJudgeModel } from '../ingestion/liveJudgeCase';
import { getLiveFirebase } from './config';

export async function inferLiveJudge(approvedBytes: string, isAllowed: () => boolean) {
  const { app, appCheck } = getLiveFirebase();
  await getToken(appCheck);
  if (!isAllowed()) throw new Error('LIVE_JUDGE_CANCELLED');

  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    mode: InferenceMode.ONLY_IN_CLOUD,
    inCloudParams: {
      model: liveJudgeModel,
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: { issues: { type: 'array', items: { type: 'string', enum: [...liveJudgeIssueKinds] } } },
          required: ['issues'],
        },
        maxOutputTokens: 128,
      },
    },
  }, { timeout: 20000 });
  const { response } = await model.generateContent(approvedBytes);
  return { text: response.text(), observedCloud: response.inferenceSource === InferenceSource.IN_CLOUD };
}
