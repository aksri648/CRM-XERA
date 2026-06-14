import Communication from '../models/Communication.js';
import Campaign from '../models/Campaign.js';
import PipelineEvent from '../models/PipelineEvent.js';

const DISPATCH_CONCURRENCY = parseInt(process.env.DISPATCH_CONCURRENCY || '50', 10);
const DISPATCH_MAX_RETRIES = parseInt(process.env.DISPATCH_MAX_RETRIES || '3', 10);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function dispatchOne({ comm, customer, campaign, channelServiceUrl, callbackUrl }) {
  const body = JSON.stringify({
    communication_id: comm._id.toString(),
    campaign_id:      campaign._id.toString(),
    customer_id:      customer._id.toString(),
    channel:          campaign.channel,
    message:          comm.message,
    callback_url:     callbackUrl,
  });

  for (let attempt = 1; attempt <= DISPATCH_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${channelServiceUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (res.ok) return { ok: true };
      if (res.status === 429) {
        await sleep(500 * attempt);
        continue;
      }
      return { ok: false, status: res.status, reason: `HTTP ${res.status}` };
    } catch (err) {
      if (attempt < DISPATCH_MAX_RETRIES) {
        await sleep(500 * attempt);
        continue;
      }
      return { ok: false, reason: err.message };
    }
  }
  return { ok: false, reason: 'queue_full_exhausted' };
}

async function runPool(items, workerCount, taskFn) {
  let idx = 0;
  const results = new Array(items.length);
  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      results[i] = await taskFn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(workerCount, items.length) }, () => worker()));
  return results;
}

export async function launchCampaign(campaign, customers) {
  const brandName = process.env.BRAND_NAME || 'Xeno AI';

  const commDocs = customers.map(customer => ({
    userId: campaign.userId,
    campaignId: campaign._id,
    customerId: customer._id,
    message: (campaign.messageTemplate || 'Hello {name}')
      .replace('{name}', customer.name)
      .replace('{brand}', brandName),
    channel: campaign.channel,
    status: 'pending',
  }));

  const created = await Communication.insertMany(commDocs);

  await Campaign.findByIdAndUpdate(campaign._id, {
    $set: { totalComms: created.length, settledComms: 0 },
  });

  const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:8002';
  const callbackUrl       = process.env.RECEIPT_CALLBACK_URL || 'http://localhost:8000/api/receipts/callback';

  const items = created.map((comm, i) => ({ comm, customer: customers[i] }));

  let failed = 0;
  const failedCommIds = [];

  await runPool(items, DISPATCH_CONCURRENCY, async ({ comm, customer }) => {
    const result = await dispatchOne({ comm, customer, campaign, channelServiceUrl, callbackUrl });
    if (!result.ok) {
      failed++;
      failedCommIds.push(comm._id);
      console.error(`Dispatch failed for comm ${comm._id}: ${result.reason}`);
    }
    return result;
  });

  if (failedCommIds.length > 0) {
    await Communication.updateMany(
      { _id: { $in: failedCommIds } },
      { $set: { status: 'failed', settled: true, updatedAt: new Date() } }
    );
    await Campaign.findByIdAndUpdate(campaign._id, {
      $inc: {
        'stats.failed':  failedCommIds.length,
        'settledComms':  failedCommIds.length,
      },
    });

    const updated = await Campaign.findById(campaign._id);
    if (updated && updated.totalComms > 0 && updated.settledComms >= updated.totalComms && updated.status !== 'completed') {
      await Campaign.findOneAndUpdate(
        { _id: campaign._id, status: { $ne: 'completed' } },
        { $set: { status: 'completed', completedAt: new Date() } }
      );
    }
  }

  await PipelineEvent.create({
    userId: campaign.userId,
    type: 'campaign_dispatched',
    title: 'Campaign Dispatched',
    description: `${campaign.name} → ${campaign.channel} Dispatched (${created.length - failed}/${created.length} ok)`,
    badge: 'Event',
    campaignId: campaign._id,
  });

  return { dispatched: created.length, failed };
}
