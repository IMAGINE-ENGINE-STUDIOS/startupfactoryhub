/** Copyright Imagine Engine Studios Corp. All rights reserved. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APEX_LICENSING } from './licensing';

test('APEX license costs $10,000 per year per location', () => {
  assert.equal(APEX_LICENSING.annualPriceUsd, 10_000);
  assert.equal(APEX_LICENSING.billingPeriod, 'year');
  assert.equal(APEX_LICENSING.billingUnit, 'location');
});

test('AI credits are additional to the APEX license', () => {
  assert.equal(APEX_LICENSING.aiCreditsIncluded, false);
});