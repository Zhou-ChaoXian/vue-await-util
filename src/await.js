"use strict";

import {
  getCurrentScope,
  effectScope,
  customRef,
  ref,
  markRaw,
  watch,
  watchEffect,
  defineComponent,
  provide,
  inject,
} from "vue";

export {
  useAwait,
  useAwaitWatch,
  useAwaitWatchEffect,
  isPending,
  isResolve,
  isReject,
  Await,
  AwaitWatch,
  AwaitWatchEffect,
  Action,
  Host,
  Provision,
  Slotted,
};

const _tracked = Symbol(), _data = Symbol(), _error = Symbol();

/**
 * @template T
 * @param [resolve] {Promise<T>}
 * @param [init] {T}
 * @param [delay] {number}
 * @param [jumpFirst] {boolean}
 * @param [onStart] {StartFunction}
 * @param [onEnd] {EndFunction}
 * @param [onError] {ErrorFunction}
 * @return {import("vue").Ref<Readonly<ResolveData<T>>>}
 */
function useAwait({resolve, init, delay = 300, jumpFirst = false, onStart, onEnd, onError}) {
  let status = "pending";
  let cacheResolve = null;
  let resolveValue = init;
  let first = true;
  const cancelMap = new Map();
  let customTrigger = null;
  const setStatus = (resolve) => {
    if (Reflect.has(resolve, _data)) {
      status = "resolve";
      resolveValue = Reflect.get(resolve, _data);
    } else {
      status = "reject";
      onError?.(Reflect.get(resolve, _error));
    }
  };
  const handle = (resolve) => {
    if (!(resolve instanceof Promise) || cacheResolve === resolve)
      return false;
    if (!Reflect.has(resolve, _tracked)) {
      Object.defineProperty(resolve, _tracked, {value: true});
      cancelMap.get(cacheResolve)?.();
      cacheResolve = resolve;
      let flag = true;
      cancelMap.set(resolve, () => {
        flag = false;
        cancelMap.delete(resolve);
      });
      status = "pending";
      onStart?.(first);
      resolve.then(
        v => Object.defineProperty(resolve, _data, {value: v}),
        e => Object.defineProperty(resolve, _error, {value: e})
      ).finally(() => {
        setTimeout(() => {
          if (flag) {
            cancelMap.delete(resolve);
            onEnd?.(first);
            first = false;
            setStatus(resolve);
            customTrigger();
          }
        }, delay);
      });
    } else {
      cacheResolve = resolve;
      setStatus(resolve);
    }
    return true;
  };
  if (jumpFirst) {
    first = false;
    resolve = Object.defineProperties(Promise.resolve(init), {
      [_tracked]: {value: true},
      [_data]: {value: init},
    });
  }
  handle(resolve);
  return customRef((track, trigger) => {
    customTrigger = trigger;
    return {
      get() {
        track();
        return markRaw({
          status,
          data: resolveValue,
          error: Reflect.get(cacheResolve, _error),
          first,
        });
      },
      set(value) {
        handle(value) && trigger();
      }
    };
  });
}

/**
 * @template T
 * @param [deps] {import("vue").WatchSource[]}
 * @param handle {(value?: any[], oldValue?: any[], onCleanup?: OnCleanup) => Promise<T>}
 * @param [init] {T}
 * @param [delay] {number}
 * @param [jumpFirst] {boolean}
 * @param [onStart] {StartFunction}
 * @param [onEnd] {EndFunction}
 * @param [onError] {ErrorFunction}
 * @return {[import("vue").Ref<Readonly<ResolveData<T>>>, WatchOptions]}
 */
function useAwaitWatch({deps = [], handle, init, delay = 300, jumpFirst = false, onStart, onEnd, onError}) {
  const props = {resolve: null, init, delay, jumpFirst, onStart, onEnd, onError};
  const resolveData = useAwait(props);
  const [updateFlag, update] = useUpdate(resolveData);
  let jumpFlag = true;
  const watchHandle = () => {
    watch([updateFlag, ...deps], (value, oldValue, onCleanup) => {
      if (jumpFirst && jumpFlag) {
        jumpFlag = false;
        return;
      }
      resolveData.value = handle(value.slice(1), oldValue.slice(1), onCleanup);
    }, {immediate: true});
  };
  const watchOptions = useWatchOptions(watchHandle, update);
  return [resolveData, watchOptions];
}

/**
 * @template T
 * @param handle {(onCleanup?: OnCleanup) => Promise<T>}
 * @param [init] {T}
 * @param [delay] {number}
 * @param [onStart] {StartFunction}
 * @param [onEnd] {EndFunction}
 * @param [onError] {ErrorFunction}
 * @return {[import("vue").Ref<Readonly<ResolveData<T>>>, WatchOptions]}
 */
function useAwaitWatchEffect({handle, init, delay = 300, onStart, onEnd, onError}) {
  const props = {resolve: null, init, delay, onStart, onEnd, onError};
  const resolveData = useAwait(props);
  const [updateFlag, update] = useUpdate(resolveData);
  const watchHandle = () => {
    watchEffect((onCleanup) => {
      updateFlag.value;
      resolveData.value = handle(onCleanup);
    });
  };
  const watchOptions = useWatchOptions(watchHandle, update);
  return [resolveData, watchOptions];
}

function useUpdate(resolveData) {
  const updateFlag = ref(true);
  const update = () => {
    if (!resolveData.value.first) {
      updateFlag.value = !updateFlag.value;
    }
  };
  return [updateFlag, update];
}

function useWatchOptions(watchHandle, update) {
  const scope = getCurrentScope();
  let watchScope = null;
  const scopeFunction = () => {
    watchScope = effectScope();
    watchScope.run(watchHandle);
  };
  scope.run(scopeFunction);
  return {
    update,
    unWatch: () => {
      watchScope?.stop(false);
      watchScope = null;
    },
    reWatch: () => {
      if (watchScope === null) {
        scope.run(scopeFunction);
      }
    }
  };
}

/**
 * @param status {Status}
 * @return {boolean}
 */
function isPending(status) {
  return status === "pending";
}

/**
 * @param status {Status}
 * @return {boolean}
 */
function isResolve(status) {
  return status === "resolve";
}

/**
 * @param status {Status}
 * @return {boolean}
 */
function isReject(status) {
  return status === "reject";
}

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

/**
 * @typedef {"pending" | "resolve" | "reject"} Status
 */

/**
 * @template T
 * @typedef {{status: Status; data: T; error: any; first: boolean;}} ResolveData
 */

/**
 * @typedef {(first?: boolean) => void} StartFunction
 */

/**
 * @typedef {(first?: boolean) => void} EndFunction
 */

/**
 * @typedef {(error?: any) => void} ErrorFunction
 */

/**
 * @typedef {(cleanupFn: () => void) => void} OnCleanup
 */

/**
 * @typedef {{update: () => void; unWatch: () => void; reWatch: () => void;}} WatchOptions
 */

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