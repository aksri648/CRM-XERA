import PipelineEvent from '../models/PipelineEvent.js';

export async function log(data) {
  return PipelineEvent.create(data);
}
