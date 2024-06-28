"use strict";

import {customRef, effectScope, getCurrentScope, markRaw, readonly, ref, watch, watchEffect} from "vue";

export {
  useAwait,
  useAwaitWatch,
  useAwaitWatchEffect,
  isPending,
  isResolve,
  isReject,
};

const _tracked = Symbol(), _data = Symbol(), _error = Symbol();
const pendingStatus = Symbol("pending");
const resolveStatus = Symbol("resolve");
const rejectStatus = Symbol("reject");

function useAwait({resolve, init, delay = 300, jumpFirst = false, onStart, onEnd, onError}) {
  let status = resolve instanceof Promise ? pendingStatus : resolveStatus;
  let cacheResolve = null;
  let resolveValue = init;
  let first = true;
  const cancelMap = new Map();
  let customTrigger = null;
  let resolveData = null;

  function generateResolveData() {
    resolveData = markRaw({
      first,
      status,
      data: resolveValue,
      error: cacheResolve instanceof Promise ? Reflect.get(cacheResolve, _error) : undefined,
    });
  }

  function setStatus(resolve) {
    if (Reflect.has(resolve, _data)) {
      status = resolveStatus;
      resolveValue = Reflect.get(resolve, _data);
    } else {
      status = rejectStatus;
      onError?.(Reflect.get(resolve, _error));
    }
  }

  function validate(resolve) {
    if (!(resolve instanceof Promise) || cacheResolve === resolve)
      return false;
    if (!Reflect.has(resolve, _tracked)) {
      resolve = Object.defineProperty(resolve, _tracked, {value: true});
      cancelMap.get(cacheResolve)?.();
      cacheResolve = resolve;
      let flag = true;
      cancelMap.set(resolve, () => {
        flag = false;
        cancelMap.delete(resolve);
      });
      status = pendingStatus;
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
            generateResolveData();
            customTrigger();
          }
        }, delay);
      });
    } else {
      cacheResolve = resolve;
      setStatus(resolve);
    }
    generateResolveData();
    return true;
  }

  if (jumpFirst) {
    first = false;
    resolve = Object.defineProperties(Promise.resolve(init), {
      [_tracked]: {value: true},
      [_data]: {value: init},
    });
  }
  validate(resolve);
  return customRef((track, trigger) => {
    customTrigger = trigger;
    return {
      get() {
        track();
        return resolveData;
      },
      set(value) {
        validate(value) && trigger();
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
  const isWatching = ref(true);
  return readonly({
    update,
    unWatch: () => {
      if (watchScope) {
        isWatching.value = false;
        watchScope.stop(false);
        watchScope = null;
      }
    },
    reWatch: () => {
      if (watchScope === null) {
        isWatching.value = true;
        scope.run(scopeFunction);
      }
    },
    isWatching,
  });
}

function isPending(status) {
  return status === pendingStatus;
}

function isResolve(status) {
  return status === resolveStatus;
}

function isReject(status) {
  return status === rejectStatus;
}