"use strict";

export * from "./hooks.js";
export * from "./components.js";

export {
  isPending,
  isResolve,
  isReject,
};

function isPending(status) {
  return status === "pending";
}

function isResolve(status) {
  return status === "resolve";
}

function isReject(status) {
  return status === "reject";
}