export const DELIVERY_RATES = {
  whatsapp: 0.92,
  sms:      0.96,
  email:    0.87,
  rcs:      0.85,
};

export const ENGAGEMENT_FUNNEL = {
  opened:    0.45,
  read:      0.70,
  clicked:   0.30,
  converted: 0.12,
};

export const DELAYS = {
  pending_to_sent:      [500, 1500],
  sent_to_delivered:    [1000, 4000],
  delivered_to_opened:  [3000, 15000],
  opened_to_read:       [2000, 8000],
  read_to_clicked:      [1000, 5000],
  clicked_to_converted: [2000, 10000],
};

export function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBool(probability) {
  return Math.random() < probability;
}
