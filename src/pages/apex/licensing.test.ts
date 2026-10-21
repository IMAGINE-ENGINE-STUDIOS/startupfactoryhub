/** Copyright Imagine Engine Studios Corp. All rights reserved. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APEX_LICENSING } from './licensing';

test('APEX white-label setup costs $10,000 once', () => {
  assert.equal(APEX_LICENSING.whiteLabelSetupUsd, 10_000);
  assert.equal(APEX_LICENSING.setupBillingPeriod, 'one-time');
});

test('APEX license costs $5,000 per year per location', () => {
  assert.equal(APEX_LICENSING.annualPriceUsd, 5_000);
  assert.equal(APEX_LICENSING.billingPeriod, 'year');
  assert.equal(APEX_LICENSING.billingUnit, 'location');
});

test('AI credits are additional to the APEX license', () => {
  assert.equal(APEX_LICENSING.aiCreditsIncluded, false);
});