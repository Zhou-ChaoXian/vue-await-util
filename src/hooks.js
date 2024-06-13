"use strict";

import {customRef, effectScope, getCurrentScope, markRaw, ref, watch, watchEffect} from "vue";

export {
  useAwait,
  useAwaitWatch,
  useAwaitWatchEffect,
};

const _tracked = Symbol(), _data = Symbol(), _error = Symbol();

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