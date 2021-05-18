import React from "react";
import classnames from "classnames";
import { ReactSVG } from "react-svg";

export const Image = ({
  icon,
  alt,
  wrapperClassName,
  imageWrapperClassName,
  svgWrapperClassName,
  beforeInjection = () => {}
}) => {
  const useSvg = icon.indexOf(".svg") > 0;

  return (
    <span>
      {icon && useSvg && (
        <ReactSVG
          src={icon}
          className={classnames(wrapperClassName, svgWrapperClassName)}
          beforeInjection={beforeInjection}
          fallback={() => (
            <img
              src={icon}
              alt={alt}
              className={classnames(wrapperClassName, svgWrapperClassName)}
            />
          )}
        />
      )}
      {icon && !useSvg && (
        <img
          src={icon}
          alt={alt}
          className={classnames(
            wrapperClassName,
            imageWrapperClassName,
            "object-fit-contain"
          )}
        />
      )}
    </span>
  );
};

Image.defaultProps = {
  icon: "",
  iconId: "",
  stringId: "",
  alt: "",
  wrapperClassName: "",
  imageWrapperClassName: "",
  svgWrapperClassName: "",
  showUpload: true
};
