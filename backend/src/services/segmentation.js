export function buildMongoQuery(filterRules, logic = 'AND') {
  if (!filterRules || filterRules.length === 0) return {};

  const conditions = filterRules.map(rule => {
    const { field, operator, value } = rule;
    if (field === 'last_order_days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(value));
      return operator === 'gt'
        ? { lastOrderAt: { $lt: cutoff } }
        : { lastOrderAt: { $gte: cutoff } };
    }

    const mongoOp = {
      gt: '$gt', lt: '$lt', eq: '$eq',
      gte: '$gte', lte: '$lte',
      contains: '$in', not_contains: '$nin',
    }[operator];

    if (!mongoOp) return {};

    const queryValue = operator === 'contains' || operator === 'not_contains'
      ? (Array.isArray(value) ? value : [value])
      : (isNaN(value) ? value : Number(value));

    return { [field]: { [mongoOp]: queryValue } };
  }).filter(Boolean);

  if (conditions.length === 0) return {};
  return logic === 'AND' ? { $and: conditions } : { $or: conditions };
}
