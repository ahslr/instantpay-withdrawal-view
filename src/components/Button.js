import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

export const Button = ({
  label,
  onClick,
  type,
  disabled,
  className,
  autoFocus = false
}) => (
  <button
    type={type}
    onClick={onClick}
    className={classnames(
      "exir-button",
      "mdc-button",
      "mdc-button--unelevated",
      "exir-button-font",
      {
        disabled
      },
      className
    )}
    disabled={disabled}
    autoFocus={autoFocus}
  >
    {label}
  </button>
);

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool
};

Button.defaultProps = {
  type: "submit",
  disabled: false,
  className: ""
};
