"use strict";

import {computed, customRef, effectScope, getCurrentScope, markRaw, readonly, ref, watch, watchEffect} from "vue";

export {
  useAwait,
  useAwaitState,
  useAwaitReducer,
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
const resolveSymbol = Symbol();

function useAwait(
  {
    resolve,
    init,
    delay = 300,
    jumpFirst = false,
    onStart,
    onEnd,
    onError,
    onFinal,
  }
) {
  let status = pendingStatus;
  let cacheResolve = null;
  let resolveValue = init;
  let resolveData = null;
  let customTrigger = null;
  let first = true;
  const cancelMap = new Map();
  if (jumpFirst) {
    first = false;
    resolve = Object.defineProperties(Promise.resolve(init), {
      [_tracked]: {value: true},
      [_data]: {value: init},
    });
  }
  if (!validate(resolve) && resolve !== resolveSymbol) {
    first = false;
    status = resolveStatus;
    generateResolveData();
  }

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
      onEnd?.(resolveValue);
    } else {
      status = rejectStatus;
      onError?.(Reflect.get(resolve, _error));
    }
  }

  function validate(resolve) {
    if (resolve instanceof Promise && cacheResolve !== resolve) {
      if (Reflect.has(resolve, _tracked)) {
        cacheResolve = resolve;
        setStatus(resolve);
      } else {
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
              setStatus(resolve);
              onFinal?.(first);
              first = false;
              generateResolveData();
              customTrigger();
            }
          }, delay);
        });
      }
      generateResolveData();
      return true;
    }
  }

  return customRef((track, trigger) => {
    customTrigger = trigger;
    return {
      get() {
        track();
        return resolveData;
      },
      set(value) {
        if (validate(value)) {
          trigger();
        }
      }
    };
  });
}

function useAwaitState(
  {
    deps = [],
    handle,
    init,
    delay = 300,
    jumpFirst = false,
    onStart,
    onEnd,
    onError,
    onFinal,
  }
) {
  let watchDeps = [];
  if (deps.length > 0) {
    watch(deps, (value) => {
      watchDeps = value;
    }, {immediate: true});
  }
  const resolve = jumpFirst ? null : handle(watchDeps);
  const options = {resolve, init, delay, jumpFirst, onStart, onEnd, onError, onFinal};
  const resolveData = useAwait(options);
  const setResolve = (resolve) => {
    if (resolveData.value.first) {
      return;
    }
    resolveData.value = resolve instanceof Promise ?
      resolve.then(value => handle(watchDeps, value)) :
      handle(watchDeps, resolve);
  };
  return [computed(() => resolveData.value), setResolve];
}

function useAwaitReducer(
  {
    deps = [],
    handle,
    reducersDeps,
    reducers: reducersOrFunction,
    init,
    delay = 300,
    jumpFirst = false,
    onStart,
    onEnd,
    onError,
    onFinal,
  }
) {
  const reducers = typeof reducersOrFunction === "function" ? reducersOrFunction() : (reducersOrFunction ?? {});
  const watchReducersDeps = {};
  if (reducersDeps) {
    Object.entries(reducersDeps).forEach(([key, deps]) => {
      if (deps.length > 0) {
        watch(deps, (value) => {
          watchReducersDeps[key] = value;
        }, {immediate: true});
      } else {
        watchReducersDeps[key] = [];
      }
    });
  }
  const options = {deps, handle, init, delay, jumpFirst, onStart, onEnd, onError, onFinal};
  const [resolveData, setResolve] = useAwaitState(options);
  const dispatch = (action) => {
    if (action) {
      const {type, payload} = action;
      const reducer = reducers[type];
      if (typeof reducer === "function") {
        setResolve(reducer({type, payload, deps: watchReducersDeps[type]}));
      }
    } else {
      setResolve();
    }
  };
  const actions = Object.keys(reducers).reduce((obj, type) => {
    obj[type] = (payload) => ({type, payload});
    return obj;
  }, {});
  return [resolveData, dispatch, actions];
}

function useAwaitWatch(
  {
    deps = [],
    handle,
    init,
    delay = 300,
    jumpFirst = false,
    onStart,
    onEnd,
    onError,
    onFinal,
  }
) {
  const options = {resolve: resolveSymbol, init, delay, jumpFirst, onStart, onEnd, onError, onFinal};
  const resolveData = useAwait(options);
  const [updateFlag, update] = useUpdate(resolveData);
  let first = true;
  const watchHandle = () => {
    watch([updateFlag, ...deps], (value, oldValue, onCleanup) => {
      if (first) {
        first = false;
        if (jumpFirst) {
          return;
        }
      }
      resolveData.value = handle(value.slice(1), oldValue.slice(1), onCleanup);
    }, {immediate: true});
  };
  const watchOptions = useWatchOptions(watchHandle, update);
  return [computed(() => resolveData.value), watchOptions];
}

function useAwaitWatchEffect(
  {
    handle,
    init,
    delay = 300,
    onStart,
    onEnd,
    onError,
    onFinal,
  }
) {
  const options = {resolve: resolveSymbol, init, delay, onStart, onEnd, onError, onFinal};
  const resolveData = useAwait(options);
  const [updateFlag, update] = useUpdate(resolveData);
  const watchHandle = () => {
    watchEffect((onCleanup) => {
      updateFlag.value;
      resolveData.value = handle(onCleanup);
    });
  };
  const watchOptions = useWatchOptions(watchHandle, update);
  return [computed(() => resolveData.value), watchOptions];
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