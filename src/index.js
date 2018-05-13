const immutable = require('object-path-immutable');
const loglevel = require('loglevel');

loglevel.enableAll();
let coreState = {};

// const isObject = obj =>
//   obj && typeof obj === 'object' && !obj.hasOwnProperty('length');
const isArray = obj =>
  obj && typeof obj === 'object' && obj.hasOwnProperty('length');

const hasComponent = (component, list) => {
  for (const item of list) if (item === component) return true;

  return false;
};

const pushToUpdate = (item, key, val, listToUpdate = []) => {
  for (let i = 0; i < listToUpdate.length; i++)
    if (item === listToUpdate[i][0]) {
      listToUpdate[i][1][key] = val;
      return;
    }

  listToUpdate.push([item, { [key]: val }]);
};

const immutableSet = (state, pathsMap) => {
  let finalState = state;
  const paths = Object.keys(pathsMap);
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const val = pathsMap[path];
    finalState = immutable.set(finalState, path, val);
  }
  return finalState;
};

const getUpdateKeys = updateObj => {
  const paths = Object.keys(updateObj);
  const finalKeys = [];
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const key = path.split('.')[0];
    finalKeys.push(key);
  }
  return finalKeys;
};

class StateManager {
  constructor(state, debug = false) {
    coreState = state;
    this.debug = debug;
    this.mapStateToComponents = {};
    this.hijackMap = {};
    this.actionsList = {};

    // bind functions
    this.attachState = this.attachState.bind(this);
    this.registerAction = this.registerAction.bind(this);
    this.hijack = this.hijack.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  attachState(component, propsMap) {
    if (isArray(propsMap)) {
      const state = {};
      for (let i = 0; i < propsMap.length; i++) {
        const propName = propsMap[i];
        if (!this.mapStateToComponents[propName])
          this.mapStateToComponents[propName] = [];
        const has = hasComponent(
          component,
          this.mapStateToComponents[propName]
        );
        if (!has) this.mapStateToComponents[propName].push(component);
        state[propName] = coreState[propName];
      }
      component.state = state;
    }
    // attach manager
    component.triggerAction = this.trigger;
    return this;
  }

  registerAction(actionName, fn) {
    this.actionsList[actionName] = fn;
  }

  hijack(actionName, fn) {
    this.hijackMap[actionName] = fn;
  }

  async trigger(actionName, ...args) {
    let response = {};
    if (this.hijackMap[actionName]) {
      if (this.debug === true) loglevel.info('ACTION:HIJACK:', actionName);
      await this.hijackMap[actionName].call(this, ...args);
    } else if (this.actionsList[actionName]) {
      if (this.debug === true) {
        loglevel.info('ACTION:', actionName);
        loglevel.info('PREV STATE:', coreState);
      }
      response = await this.actionsList[actionName].call(this, ...args);
      setState.call(this, response);
      if (this.debug === true) loglevel.info('NEW STATE:', coreState);
    }
  }
}

const setState = function(_state) {
  // console.time('Update time');
  coreState = immutableSet(coreState, _state);
  const toUpdate = [];
  const keys = getUpdateKeys(_state);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (this.mapStateToComponents[key])
      for (const item of this.mapStateToComponents[key])
        pushToUpdate(item, key, coreState[key], toUpdate);
  }
  // update all components related to the updated props
  if (toUpdate.length)
    for (let i = 0; i < toUpdate.length; i++) {
      const item = toUpdate[i][0];
      const props = toUpdate[i][1];
      item.setState({
        ...item.state,
        ...props
      });
    }

  // console.timeEnd('Update time');
  return this;
};

export default ({ state, debug }) => {
  return new StateManager(state, debug);
};
