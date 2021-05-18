import React from "react";
import classnames from "classnames";
import {Image} from "./Image";

export const IconTitle = ({
  text,
  iconPath,
  textType,
  underline,
  className,
  imageWrapperClassName = ""
}) => {
  return (
    <div className={classnames("icon_title-wrapper", { underline }, className)}>
      {iconPath && (
        <Image
          icon={iconPath}
          alt={text}
          wrapperClassName={imageWrapperClassName}
          imageWrapperClassName="icon_title-image"
          svgWrapperClassName="icon_title-svg"
          showUpload={false}
        />
      )}
      <div className={classnames("icon_title-text", "text-center", textType)}>
        {text}
      </div>
    </div>
  );
};

IconTitle.defaultProps = {
  iconPath: "",
  textType: "",
  underline: false
};
