"use strict";

import {defineComponent, inject, provide, computed, watch} from "vue";
import {useAwait, useAwaitState, useAwaitReducer, useAwaitWatch, useAwaitWatchEffect} from "./hooks.js";

export {
  Await,
  AwaitState,
  AwaitReducer,
  AwaitWatch,
  AwaitWatchEffect,
  Action,
  Host,
  Tmpl,
  Slotted,
  Gen,
  Yield,
  Next,
};

const Await = defineComponent({
  name: "Await",
  inheritAttrs: false,
  props: {
    resolve: {type: Promise},
    init: {default: undefined},
    useResolve: {type: Function},
    delay: {type: Number, default: 300},
    jumpFirst: {type: Boolean, default: false},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function},
    onFinal: {type: Function},
  },
  setup: (props, {slots, expose}) => {
    expose();
    const resolveData = useAwait(props);
    const readonlyResolveData = computed(() => resolveData.value);
    const use = props.useResolve?.(readonlyResolveData);
    watch(() => props.resolve, (value) => {
      resolveData.value = value;
    });
    return () => slots.default?.({...resolveData.value, use});
  }
});

const AwaitState = defineComponent({
  name: "AwaitState",
  inheritAttrs: false,
  props: {
    deps: {type: Array},
    handle: {required: true, type: Function},
    init: {default: undefined},
    useResolve: {type: Function},
    delay: {type: Number, default: 300},
    jumpFirst: {type: Boolean, default: false},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function},
    onFinal: {type: Function},
  },
  setup: (props, {slots, expose}) => {
    const [resolveData, setResolve] = useAwaitState(props);
    const use = props.useResolve?.(resolveData, setResolve);
    expose({setResolve});
    return () => slots.default?.({...resolveData.value, setResolve, use});
  }
});

const AwaitReducer = defineComponent({
  name: "AwaitReducer",
  inheritAttrs: false,
  props: {
    deps: {type: Array},
    handle: {required: true, type: Function},
    reducersDeps: {type: Object},
    reducers: {type: [Object, Function]},
    init: {default: undefined},
    useResolve: {type: Function},
    delay: {type: Number, default: 300},
    jumpFirst: {type: Boolean, default: false},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function},
    onFinal: {type: Function},
  },
  setup: (props, {slots, expose}) => {
    const [resolveData, dispatch, actions] = useAwaitReducer(props);
    const use = props.useResolve?.(resolveData, dispatch, actions);
    expose({dispatch, actions});
    return () => slots.default?.({...resolveData.value, dispatch, actions, use});
  }
});

const AwaitWatch = defineComponent({
  name: "AwaitWatch",
  inheritAttrs: false,
  props: {
    deps: {type: Array},
    handle: {required: true, type: Function},
    init: {default: undefined},
    useResolve: {type: Function},
    delay: {type: Number, default: 300},
    jumpFirst: {type: Boolean, default: false},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function},
    onFinal: {type: Function},
  },
  setup: (props, {slots, expose}) => {
    const [resolveData, watchOptions] = useAwaitWatch(props);
    const use = props.useResolve?.(resolveData, watchOptions);
    expose(watchOptions);
    return () => slots.default?.({...resolveData.value, watchOptions, use});
  }
});

const AwaitWatchEffect = defineComponent({
  name: "AwaitWatchEffect",
  inheritAttrs: false,
  props: {
    handle: {required: true, type: Function},
    init: {default: undefined},
    useResolve: {type: Function},
    delay: {type: Number, default: 300},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function},
    onFinal: {type: Function},
  },
  setup: (props, {slots, expose}) => {
    const [resolveData, watchOptions] = useAwaitWatchEffect(props);
    const use = props.useResolve?.(resolveData, watchOptions);
    expose(watchOptions);
    return () => slots.default?.({...resolveData.value, watchOptions, use});
  }
});

const Action = defineComponent({
  name: "Action",
  inheritAttrs: false,
  props: {
    useAction: {required: true, type: Function},
    options: {default: undefined},
  },
  setup: (props, {expose, slots}) => {
    expose();
    const action = props.useAction(props.options);
    return () => slots.default?.(action);
  }
});

const HostContext = Symbol();

const Host = defineComponent({
  name: "Host",
  inheritAttrs: false,
  setup: (_, {expose, slots}) => {
    expose();
    const value = {
      tmplSlots: undefined,
      parent: inject(HostContext, undefined)
    };
    provide(HostContext, value);
    return () => {
      const children = slots.default();
      value.tmplSlots = children.slice(1).reduce((container, item) => {
        if (item.type === Tmpl) {
          const name = item.props?.name ?? "default";
          container[name] ??= item.children?.default;
        }
        return container;
      }, {});
      return children[0];
    };
  }
});

const Tmpl = defineComponent({
  name: "Tmpl",
  inheritAttrs: false,
  props: {name: {type: String, default: "default"}},
  setup: () => () => undefined,
});

const Slotted = defineComponent({
  name: "Slotted",
  inheritAttrs: false,
  props: {name: {type: String, default: "default"}},
  setup: (props, {expose, attrs, slots}) => {
    expose();
    const value = inject(HostContext, undefined);
    provide(HostContext, value?.parent);
    return () => {
      const slot = value?.tmplSlots[props.name];
      return slot ? slot(attrs) : slots.default?.();
    };
  }
});

const GenContext = Symbol();

const Gen = defineComponent({
  name: "Gen",
  inheritAttrs: false,
  setup: (_, {slots, expose}) => {
    expose();
    const value = {};
    provide(GenContext, value);
    return () => {
      const children = slots.default();
      Object.assign(value, {
        index: 0,
        array: children.slice(1).reduce((arr, child) => {
          if (child.type === Yield) {
            arr.push(child.children?.default);
          }
          return arr;
        }, []),
        state: {},
      });
      return children[0];
    };
  }
});

const Yield = defineComponent({
  name: "Yield",
  inheritAttrs: false,
  setup: () => () => undefined,
});

const Next = defineComponent({
  name: "Next",
  inheritAttrs: false,
  setup: (_, {expose, attrs}) => {
    expose();
    const value = inject(GenContext, undefined);
    const newValue = {};
    provide(GenContext, newValue);
    return () => {
      if (value) {
        const {index, array, state} = value;
        if (state[index]) {
          return;
        }
        state[index] = true;
        const slot = array[index];
        Object.assign(newValue, {index: index + 1, array, state});
        return slot?.(attrs);
      }
    };
  }
});