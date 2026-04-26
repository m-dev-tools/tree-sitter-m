// Tests for lib/stamp.js (B3 attribute stamping).
// Run with: node --test lib/stamp.test.js

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const stamp = require('./stamp.js');

test('lookup returns null for unknown node type', () => {
  assert.strictEqual(stamp.lookup('not_a_keyword_type', 'BREAK'), null);
});

test('lookup returns null for unknown form', () => {
  assert.strictEqual(stamp.lookup('command_keyword', 'XYZNOTACOMMAND'), null);
});

test('lookup BREAK abbreviation forms all map to BREAK canonical', () => {
  for (const form of ['B', 'BR', 'BRE', 'BREA', 'BREAK']) {
    const r = stamp.lookup('command_keyword', form);
    assert.ok(r, `form ${form} not found`);
    assert.strictEqual(r.matched_form, form);
    assert.strictEqual(r.concept, 'commands');
    assert.strictEqual(r.candidates.length, 1);
    assert.strictEqual(r.candidates[0].canonical, 'BREAK');
    assert.strictEqual(r.candidates[0].standard_status, 'ansi');
    assert.strictEqual(r.ambiguous, false);
  }
});

test('lookup CATCH (IRIS extension) carries iris-extension status', () => {
  const r = stamp.lookup('command_keyword', 'CATCH');
  assert.ok(r);
  assert.strictEqual(r.candidates[0].canonical, 'CATCH');
  assert.strictEqual(r.candidates[0].standard_status, 'iris-extension');
});

test('lookup H (HALT/HANG ambiguity) returns 2 candidates', () => {
  const r = stamp.lookup('command_keyword', 'H');
  assert.ok(r);
  assert.strictEqual(r.candidates.length, 2);
  assert.strictEqual(r.ambiguous, true);
  const canonicals = r.candidates.map(c => c.canonical).sort();
  assert.deepStrictEqual(canonicals, ['HALT', 'HANG']);
});

test('lookup $LENGTH abbreviations all map to $LENGTH', () => {
  for (const form of ['$L', '$LE', '$LEN', '$LENG', '$LENGT', '$LENGTH']) {
    const r = stamp.lookup('intrinsic_function_keyword', form);
    assert.ok(r, `form ${form} not found`);
    assert.strictEqual(r.candidates[0].canonical, '$LENGTH');
    assert.strictEqual(r.candidates[0].standard_status, 'ansi');
  }
});

test('lookup $JOB ISV', () => {
  const r = stamp.lookup('special_variable_keyword', '$JOB');
  assert.ok(r);
  assert.strictEqual(r.candidates[0].canonical, '$JOB');
});

test('lookup $D ambiguous in ISV context (DEVICE only — DATA is a function)', () => {
  // $D as an ISV keyword resolves to $DEVICE (no other ISV starts with $D).
  const r = stamp.lookup('special_variable_keyword', '$D');
  assert.ok(r);
  assert.strictEqual(r.candidates.length, 1);
  assert.strictEqual(r.candidates[0].canonical, '$DEVICE');
});

test('lookup $D ambiguous in function context resolves to $DATA', () => {
  // $D as a function keyword resolves to $DATA (no other function starts
  // with $D as an abbreviation).
  const r = stamp.lookup('intrinsic_function_keyword', '$D');
  assert.ok(r);
  assert.strictEqual(r.candidates.length, 1);
  assert.strictEqual(r.candidates[0].canonical, '$DATA');
});

test('lookup $ST ambiguous between $STACK and $STORAGE', () => {
  const r = stamp.lookup('special_variable_keyword', '$ST');
  assert.ok(r);
  assert.strictEqual(r.candidates.length, 2);
  assert.strictEqual(r.ambiguous, true);
  const canonicals = r.candidates.map(c => c.canonical).sort();
  assert.deepStrictEqual(canonicals, ['$STACK', '$STORAGE']);
});

test('lookup operator returns single canonical', () => {
  const r = stamp.lookup('operator', '_');
  assert.ok(r);
  assert.strictEqual(r.candidates[0].canonical, '_');
  assert.strictEqual(r.concept, 'operators');
});

test('lookupSingle returns flat object for unambiguous form', () => {
  const r = stamp.lookupSingle('command_keyword', 'BREAK');
  assert.deepStrictEqual(r, {
    matched_form: 'BREAK',
    canonical: 'BREAK',
    standard_status: 'ansi',
    concept: 'commands',
  });
});

test('lookupSingle throws on ambiguous form', () => {
  assert.throws(
    () => stamp.lookupSingle('command_keyword', 'H'),
    /ambiguous form/
  );
});

test('resolve picks HANG when arguments present', () => {
  // Caller pretends the parser saw arguments after H.
  const hasArgs = true;
  const r = stamp.resolve('command_keyword', 'H', (c) =>
    c.canonical === 'HANG' ? hasArgs : !hasArgs
  );
  assert.ok(r);
  assert.strictEqual(r.canonical, 'HANG');
  assert.strictEqual(r.standard_status, 'ansi');
});

test('resolve picks HALT when no arguments', () => {
  const hasArgs = false;
  const r = stamp.resolve('command_keyword', 'H', (c) =>
    c.canonical === 'HANG' ? hasArgs : !hasArgs
  );
  assert.ok(r);
  assert.strictEqual(r.canonical, 'HALT');
});

test('resolve returns null when no candidate matches', () => {
  const r = stamp.resolve('command_keyword', 'H', () => false);
  assert.strictEqual(r, null);
});

test('schemaVersion matches m-standard pin', () => {
  const pkg = require('../package.json');
  assert.strictEqual(stamp.schemaVersion(), pkg['m-standard'].schema_version);
});

test('every keyword form in keywords.generated.js has metadata', () => {
  const K = require('../keywords.generated.js');
  const concepts = {
    commands: 'command_keyword',
    intrinsic_functions: 'intrinsic_function_keyword',
    intrinsic_special_variables: 'special_variable_keyword',
    operators: 'operator',
  };
  for (const [conceptName, nodeType] of Object.entries(concepts)) {
    for (const form of K[conceptName]) {
      const r = stamp.lookup(nodeType, form);
      assert.ok(r, `${conceptName}/${form} missing from metadata`);
    }
  }
});
