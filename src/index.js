/**
 * Entrypoint of the Remote Component.
 */
import React from "react";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store";

const Plugin = props => (
  <Provider store={store}>
    <App {...props} />
  </Provider>
);

export default Plugin;
