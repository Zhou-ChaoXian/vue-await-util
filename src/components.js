"use strict";

import {defineComponent, inject, provide, shallowReadonly, watch} from "vue";
import {useAwait, useAwaitWatch, useAwaitWatchEffect} from "./hooks.js";

export {
  Await,
  AwaitWatch,
  AwaitWatchEffect,
  Action,
  Host,
  Tmpl,
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
    const readonlyResolveData = shallowReadonly(resolveData);
    const use = props.useResolve?.(readonlyResolveData);
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
    const readonlyResolveData = shallowReadonly(resolveData);
    const use = props.useResolve?.(readonlyResolveData, watchOptions);
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
    const readonlyResolveData = shallowReadonly(resolveData);
    const use = props.useResolve?.(readonlyResolveData, watchOptions);
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
    const value = inject(HostContext);
    provide(HostContext, value?.parent);
    return () => {
      const slot = value?.tmplSlots[props.name];
      return slot ? slot(attrs) : slots.default?.();
    };
  }
});