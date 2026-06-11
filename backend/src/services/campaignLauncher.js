import Communication from '../models/Communication.js';
import PipelineEvent from '../models/PipelineEvent.js';

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export async function launchCampaign(campaign, customers) {
  const brandName = process.env.BRAND_NAME || 'Xeno AI';
  const communications = [];

  const commDocs = customers.map(customer => ({
    campaignId: campaign._id,
    customerId: customer._id,
    message: (campaign.messageTemplate || 'Hello {name}')
      .replace('{name}', customer.name)
      .replace('{brand}', brandName),
    channel: campaign.channel,
    status: 'queued',
  }));

  const created = await Communication.insertMany(commDocs);
  for (let i = 0; i < created.length; i++) {
    communications.push({ comm: created[i], customer: customers[i] });
  }

  const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:8002';
  const callbackUrl = process.env.RECEIPT_CALLBACK_URL || 'http://localhost:8000/api/receipts/callback';

  const batches = chunkArray(communications, 100);
  let failed = 0;
  for (const batch of batches) {
    const results = await Promise.allSettled(batch.map(({ comm, customer }) =>
      fetch(`${channelServiceUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communication_id: comm._id.toString(),
          campaign_id: campaign._id.toString(),
          customer_id: customer._id.toString(),
          channel: campaign.channel,
          message: comm.message,
          callback_url: callbackUrl,
        }),
      }).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }).catch(err => {
        console.error('Channel send error:', err.message);
        failed++;
        throw err;
      })
    ));
    results.forEach((r, i) => {
      if (r.status === 'rejected') communications[i].failed = true;
    });
  }

  await PipelineEvent.create({
    type: 'campaign_dispatched',
    title: 'Campaign Dispatched',
    description: `${campaign.name} → ${campaign.channel} Queue`,
    badge: 'Event',
    campaignId: campaign._id,
  });

  return { dispatched: communications.length, failed };
}
