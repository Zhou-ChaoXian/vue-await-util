"use strict";

import {defineComponent, inject, provide, watch} from "vue";
import {useAwait, useAwaitWatch, useAwaitWatchEffect} from "./hooks.js";

export {
  Await,
  AwaitWatch,
  AwaitWatchEffect,
  Action,
  Host,
  Provision,
  Slotted,
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
    onError: {type: Function}
  },
  setup: (props, {slots, expose}) => {
    expose();
    const resolveData = useAwait(props);
    const use = props.useResolve?.(resolveData);
    watch(() => props.resolve, (value) => {
      resolveData.value = value;
    });
    return () => slots.default?.({...resolveData.value, use});
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
    onError: {type: Function}
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
    onError: {type: Function}
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
    const state = props.useAction(props.options);
    return () => slots.default?.(state);
  }
});

const provisionSlotsSymbol = Symbol();

const Host = defineComponent({
  name: "Host",
  inheritAttrs: false,
  setup: (_, {expose, slots}) => {
    expose();
    const provisionSlots = {value: null};
    provide(provisionSlotsSymbol, provisionSlots);
    return () => {
      const children = slots.default();
      provisionSlots.value = children.slice(1).reduce((container, item) => {
        if (item.type === Provision) {
          const name = item.props?.name ?? "default";
          container[name] ??= item.children?.default;
        }
        return container;
      }, {});
      return children[0];
    };
  }
});

const Provision = defineComponent({
  name: "Provision",
  inheritAttrs: false,
  props: {name: {type: String, default: "default"}},
  setup: (_, {expose, slots}) => {
    expose();
    return () => slots.default();
  }
});

const Slotted = defineComponent({
  name: "Slotted",
  inheritAttrs: false,
  props: {
    name: {type: String, default: "default"},
  },
  setup: (props, {expose, attrs, slots}) => {
    expose();
    const provisionSlots = inject(provisionSlotsSymbol);
    provide(provisionSlotsSymbol, null);
    return () => {
      const slot = provisionSlots?.value[props.name];
      return slot ? slot(attrs) : slots.default?.();
    };
  }
});