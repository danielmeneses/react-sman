/* global test expect */
const smanFactory = require('../lib/main/index');

const state = {
  count: 0,
  complex: {
    arr: [{ id: 1 }]
  }
};

const sman = smanFactory({ state });

sman.registerAction('PLUS', function(num) {
  const state = this.getState();
  return {
    count: state.count + num
  };
});

sman.registerAction('CHANGE_ID', function(newId) {
  return {
    'complex.arr.0.id': newId
  };
});

test('trigger actions', async () => {
  const prevState = sman.getState();
  await sman.trigger('PLUS', 10);
  await sman.trigger('CHANGE_ID', 'Homer Simpson');
  const newState = sman.getState();

  // test values
  expect(newState).not.toBe(null);
  expect(newState).not.toBe(undefined);
  expect(newState).toBeInstanceOf(Object);
  expect(prevState).not.toEqual(newState);
  expect(prevState.complex.arr[0]).not.toEqual(newState.complex.arr[0]);
  expect(prevState.complex.arr[0].id).not.toEqual(newState.complex.arr[0].id);
  expect(newState.count).toEqual(10);
  expect(newState.complex.arr[0].id).toEqual('Homer Simpson');
});
