const nullableText = () => ({ type: ['string', 'null'] });
const strings = () => ({ type: 'array', items: { type: 'string' } });
const record = properties => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false
});

export function answerSchema(section) {
  const price = record({
    name: { type: 'string' },
    amount: { type: ['number', 'null'] },
    currency: { type: 'string' },
    unit: { type: 'string' },
    price_type: { enum: ['standard', 'from', 'supplement', 'deposit', 'fee', 'unknown'] },
    conditions: strings(),
    source_url: nullableText(),
    excerpt: nullableText()
  });
  const evidence = record({
    field: { type: 'string' }, source_url: { type: 'string' }, excerpt: { type: 'string' }
  });
  const details = section === 'neighbourhood'
    ? record({
      boundary: nullableText(), character: nullableText(), food_drink_example: nullableText(),
      shopping_culture_example: nullableText(), suits_interpretation: nullableText(),
      practical_trade_off: nullableText()
    })
    : record({
      official_url: nullableText(), room_unit_type: nullableText(), kitchen: nullableText(),
      laundry: nullableText(), check_in: nullableText(), fees_deposit: nullableText(),
      minimum_stay: nullableText(), quote_status: { const: 'date_specific_quote_required' }
    });
  return record({
    city: { type: 'string' }, section: { const: section },
    items: {
      type: 'array',
      maxItems: section === 'neighbourhood' ? 4 : 3,
      items: record({
        name: { type: 'string' }, kind: { type: 'string' }, location: nullableText(),
        summary: { type: 'string' }, prices: { type: 'array', items: price }, details,
        evidence: { type: 'array', items: evidence }, unknowns: strings()
      })
    },
    coverage_gaps: strings()
  });
}
