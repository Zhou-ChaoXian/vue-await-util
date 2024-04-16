"use strict";

import {
  getCurrentInstance,
  getCurrentScope,
  effectScope,
  customRef,
  ref,
  markRaw,
  watch,
  watchEffect,
  defineComponent,
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
};

const _tracked = Symbol(), _data = Symbol(), _error = Symbol();

/**
 * @template T
 * @typedef {"pending" | "resolve" | "reject"} Status
 * @typedef {{status: Status; data: T; error: *; first: boolean;}} ResolveData
 * @typedef {(first?: boolean) => void} StartFunction
 * @typedef {(first?: boolean) => void} EndFunction
 * @typedef {(error?: any) => void} ErrorFunction
 * @typedef {(cleanupFn: () => void) => void} OnCleanup
 * @typedef {{update: () => void; unWatch: () => void; reWatch: () => void;}} WatchOptions
 */

/**
 * @template T
 * @param resolve {Promise<T>}
 * @param [init] {T}
 * @param [delay] {number}
 * @param [onStart] {StartFunction}
 * @param [onEnd] {EndFunction}
 * @param [onError] {ErrorFunction}
 * @return {import("vue").Ref<Readonly<ResolveData<T>>>}
 */
function useAwait({resolve, init, delay = 300, onStart, onEnd, onError}) {
  const instance = getCurrentInstance();
  const forceUpdate = () => instance.ctx.$forceUpdate();
  let status = "pending";
  let cacheResolve = null;
  let resolveValue = init;
  let first = true;
  const cancelMap = new Map();
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
    if (resolve instanceof Promise && cacheResolve !== resolve) {
      if (!Reflect.has(resolve, _tracked)) {
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
              forceUpdate();
            }
          }, delay);
        });
      } else {
        cacheResolve = resolve;
        setStatus(resolve);
        forceUpdate();
      }
      return true;
    }
    return false;
  };
  handle(resolve);
  return customRef((track, trigger) => ({
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
  }));
}

/**
 * @template T
 * @param [deps] {import("vue").WatchSource[]}
 * @param handle {(value?: any[], oldValue?: any[], onCleanup?: OnCleanup) => Promise<T> | T}
 * @param [init] {T}
 * @param [delay] {number}
 * @param [onStart] {StartFunction}
 * @param [onEnd] {EndFunction}
 * @param [onError] {ErrorFunction}
 * @return {[import("vue").Ref<Readonly<ResolveData<T>>>, WatchOptions]}
 */
function useAwaitWatch({deps = [], handle, init, delay = 300, onStart, onEnd, onError}) {
  const props = {resolve: null, init, delay, onStart, onEnd, onError};
  const resolveData = useAwait(props);
  const [updateFlag, update] = useUpdate(resolveData);
  const watchHandle = () => {
    watch([updateFlag, ...deps], (value, oldValue, onCleanup) => {
      resolveData.value = Promise.resolve(handle(value.slice(1), oldValue.slice(1), onCleanup));
    }, {immediate: true});
  };
  const watchOptions = useWatchOptions(watchHandle, update);
  return [resolveData, watchOptions];
}

/**
 * @template T
 * @param handle {(onCleanup?: OnCleanup) => Promise<T> | T}
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
      const _ = updateFlag.value;
      resolveData.value = Promise.resolve(handle(onCleanup));
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
    resolve: {required: true, type: Promise},
    init: {default: undefined},
    delay: {type: Number, default: 300},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function}
  },
  setup: (props, {slots, expose}) => {
    expose();
    const resolveData = useAwait(props);
    watch(() => props.resolve, (value) => {
      resolveData.value = value;
    });
    return () => slots.default?.(resolveData.value);
  }
});

const AwaitWatch = defineComponent({
  name: "AwaitWatch",
  inheritAttrs: false,
  props: {
    deps: {required: true, type: Array},
    handle: {required: true, type: Function},
    init: {default: undefined},
    delay: {type: Number, default: 300},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function}
  },
  setup: (props, {slots, expose}) => {
    const [resolveData, watchOptions] = useAwaitWatch(props);
    expose(watchOptions);
    return () => slots.default?.(resolveData.value);
  }
});

const AwaitWatchEffect = defineComponent({
  name: "AwaitWatchEffect",
  inheritAttrs: false,
  props: {
    handle: {required: true, type: Function},
    init: {default: undefined},
    delay: {type: Number, default: 300},
    onStart: {type: Function},
    onEnd: {type: Function},
    onError: {type: Function}
  },
  setup: (props, {slots, expose}) => {
    const [resolveData, watchOptions] = useAwaitWatchEffect(props);
    expose(watchOptions);
    return () => slots.default?.(resolveData.value);
  }
});