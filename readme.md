# react-sman

[![npm version](https://img.shields.io/npm/v/react-sman.svg)](https://npm.im/react-sman) ![Licence](https://img.shields.io/npm/l/react-sman.svg) [![Github issues](https://img.shields.io/github/issues/danielmeneses/react-sman.svg)](https://github.com/danielmeneses/react-sman/issues) [![Github stars](https://img.shields.io/github/stars/danielmeneses/react-sman.svg)](https://github.com/danielmeneses/react-sman/stargazers)

Very easy to use, a pico and immutable state manager for react apps. Great for simple apps.

## Table of contents

- [The goal](#the-goal)
- [Install](#install)
- [Set initial app state](#set-initial-app-state)
- [Attach state to Component](#attach-state-to-component)
- [Create actions](#create-actions)
- [Hijack an action execution](#hijack-an-action-execution)
- [Contributions](#contributions)

### The goal

Deliver a simple and easy way of managing the state for react applications. The API is very simple and it implements some of the concepts we find in a redux and redux-saga/thunk applications. Lastly, handle immutable state updates is also covered by the lib.

### Install

```
npm i react-sman --save-prod
```

### Set initial app state

For the example let's name this file `app-state.js`

```js
import smanFactory from 'react-sman';

const state = {
  tvshows: [{
      name: 'Silicon Valley',
      seasons: 5,
      watched: false
    }, {
      name: 'Breaking Bad',
      seasons: 5,
      watched: false
    }, {
      name: 'Dark',
      seasons: 1,
      watched: false
    }
  ],
  selectedTvshow: null,
  loading: false
};

const sman = smanFactory({ state, debug: true });

export default sman;
```

### Attach state to Component

We should only attach sman to container components, so `this.state` is back for them.

```js
import React, { Component } from 'react';
import sman from './app-state';

class TvshowList extends Component {
  constructor(props) {
    super(props);

    // attach state sman to component - pass a list of key names (from sman) you need
    // you cannot rename state keys. Sounds bad right? not really!
    sman.attachState(this, ['tvshows', 'selectedTvshow', 'loading']);
  }

  _onClickTvshow(id, index) {
    // this.triggerAction() function will be available for all components using sman
    this.triggerAction('ON_SELECT', id, index);
  }

  render() {
    const { tvshows, selectedTvshow } = this.state;
    return (
      // ... my JSX
    );
  }
}

// ... prop-types and defaultProps ...

export default TvshowList;
```

Sman doesn't allow changing state keys when attaching state to a container component. First of all, let me remind you that sman it's designed mainly for small/medium apps, second point I want to make is that I understand why this can be considered an issue or a bad implementation of the library, in fact the implementation is completely intentional, the problem with renaming state keys per container is that it's very hard to reason about what data we're looking at, that said, just be sure give meaninful key names to your state keys in a way that they are unique and easy to identify.

### Create actions

Actions work almost the same as in redux. You need to return an object with all fields we want to update. The main difference is that this object will update the state, so no reducer here. The reducer makes perfect sense and I'm not saying otherwise, but mainly what we usually do in a reducer is make sure that we don't mutate the state. `react-sman` does that already, it uses `object-path-immutable` as a helper to achieve that, so before updating the state the object is copied avoiding mutations. Just make sure you don't pass an object from the previous state to update state. Check the example bellow `SET_WATCHED` action is a good example of a deep copy that the manager will perform.

```js
import sman from './app-state'; // wherever we created sman

sman.registerAction('LOADING', function(isLoading) {
  return {
    loading: isLoading
  };
});

sman.registerAction('SET_SELECTED', function(id) {
  return {
    selectedMovie: id
  };
});

sman.registerAction('SET_WATCHED', function(index) {
  // change only the field you need, don't produce
  // a deep copy the library alredy does it
  return {
    // path to leaf prop we want to update
    [`series.${index}.watched`]: true
  };
});

```

`sman.registerAction` callback can also be `async`.

### Hijack an action execution

The `hijack` function allows you to catch an action when it's fired. Then you can perform async calls and trigger multiple actions inside the callback function. This is something similar as you can find some side effects manager libs such as `redux-saga`. Of course, this is just a very simple and minimal implementation of a function like `take`.

```js

sman.hijack('ON_SELECT', async function(id, index) {
  await this.trigger('LOADING', true);
  // perform any async call
  try {
    const remoteData = await fetch();
    // ... do stuff with incoming data

    await this.trigger('SET_SELECTED', id);
    await this.trigger('SET_WATCHED', index);
  } catch (e) {
    console.error(e);
  } finally {
    // cleanup - if any error, even inside catch, this will run
    await this.trigger('LOADING', false);
  }
});
```

`trigger` function returns a Promise, so with that in mind when inside an `sman.hijack` function always use `await` when you need to trigger an action.

## Contributions

Contributions are very welcome. There's a lot of room for improvements and new features so feel free to fork the repo and get into it. Also, let me know of any bugs you come across, any help on bug fixing is also a plus!
