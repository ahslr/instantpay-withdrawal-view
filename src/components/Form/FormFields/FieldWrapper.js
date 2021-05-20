import React, { Component, Fragment } from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import classnames from 'classnames';
import ActionNotification from '../../ActionNotification';

const ERROR_USER_ALREADY_VERIFIED = 'User already verified';
const ERROR_INVALID_CARD_USER = 'Card Number has no linked name';
const ERROR_INVALID_CARD_NUMBER = 'Invalid Card number';
const ERROR_LOGIN_USER_NOT_VERIFIED = 'User is not verified';
const ERROR_LOGIN_USER_NOT_ACTIVATED = 'User is not activated';
const ERROR_LOGIN_INVALID_CREDENTIALS = 'Credentials incorrect';
const ERROR_INVALID_CAPTCHA = 'Invalid captcha';
const INVALID_USERNAME =
  'Invalid username. Username must be 3-15 characters length and only contains lowercase charaters, numbers or underscore';
const USERNAME_CANNOT_BE_CHANGED = 'Username can not be changed';
const USENAME_IS_TAKEN =
  'Username is already taken. Select a different username';

export const getErrorLocalized = (error = '', STRINGS = {}) => {
  switch (error) {
    case ERROR_USER_ALREADY_VERIFIED:
      return STRINGS['ERROR_USER_ALREADY_VERIFIED'];
    case ERROR_INVALID_CARD_USER:
      return STRINGS['ERROR_INVALID_CARD_USER'];
    case ERROR_INVALID_CARD_NUMBER:
      return STRINGS['ERROR_INVALID_CARD_NUMBER'];
    case ERROR_LOGIN_USER_NOT_VERIFIED:
      return STRINGS['ERROR_LOGIN_USER_NOT_VERIFIED'];
    case ERROR_LOGIN_USER_NOT_ACTIVATED:
      return STRINGS['ERROR_LOGIN_USER_NOT_ACTIVATED'];
    case ERROR_LOGIN_INVALID_CREDENTIALS:
      return STRINGS['ERROR_LOGIN_INVALID_CREDENTIALS'];
    case ERROR_INVALID_CAPTCHA:
      return STRINGS['INVALID_CAPTCHA'];
    case INVALID_USERNAME:
      return STRINGS['INVALID_USERNAME'];
    case USERNAME_CANNOT_BE_CHANGED:
      return STRINGS['INVALID_CAPTCHA'];
    case USENAME_IS_TAKEN:
      return STRINGS['USERNAME_TAKEN'];
    default:
      return error;
  }
};


export const FieldContent = ({
	stringId,
	label = '',
	valid = false,
	hasValue = false,
	focused = false,
	children,
	hideUnderline = false,
	contentClassName = '',
	hideCheck = false,
	outlineClassName = '',
	displayError,
	error,
	ishorizontalfield = false,
	dateFieldClassName,
	warning,
	strings,
	preview,
}) => {
	return (
		<div>
			<div className={classnames({ 'field-label-wrapper': ishorizontalfield })}>
				<div className="d-flex">
					{label && (
						<div className="field-label">
							{label}
							{warning && (
								<div className="d-flex align-items-baseline field_warning_wrapper">
									<ExclamationCircleFilled className="field_warning_icon" />
									<div className="field_warning_text">{warning}</div>
								</div>
							)}
						</div>
					)}
				</div>
				<div className={classnames('field-content')}>
					<div
						className={classnames(
							'field-children',
							{ valid, custom: hideUnderline },
							contentClassName,
							{
								'input-box-field':
									ishorizontalfield && dateFieldClassName === '',
							}
						)}
					>
						{children}
					</div>
					{!hideUnderline && (
						<span
							className={classnames('field-content-outline', outlineClassName, {
								focused,
							})}
						/>
					)}
				</div>
			</div>
			<div className="field-label-wrapper">
				{ishorizontalfield ? (
					<Fragment>
						<div className="field-label"></div>
						<FieldError displayError={displayError} error={error} strings={strings} preview={preview}/>
					</Fragment>
				) : null}
			</div>
		</div>
	);
};

export const FieldError = ({ error, displayError, className, stringId, strings, preview }) => (
	<div
		className={classnames('field-error-content', 'align-items-baseline', className, {
			'field-error-hidden': !displayError && !preview,
		})}
		style={preview ? { height: 'auto' } : {}}
	>
		{error && (
			<Fragment>
				<ExclamationCircleFilled className="field_warning_icon" />
				<span className="field-error-text">{getErrorLocalized(error, strings)}</span>
			</Fragment>
		)}
		{
			preview && (
				<Fragment>
          {preview}
				</Fragment>
			)
		}
	</div>
);

class FieldWrapper extends Component {
	render() {
		const {
			children,
			label,
			warning,
			stringId,
			input: { value },
			meta: { active = false, error = '', touched = false, invalid = false },
			focused = false,
			fullWidth = false,
			visited = false,
			hideUnderline = false,
			className = '',
			onClick = () => {},
			notification,
			hideCheck = false,
			outlineClassName = '',
			ishorizontalfield,
			strings,
			preview,
		} = this.props;

		const displayError = !(active || focused) && (visited || touched) && error;
		const hasValue = value || value === false;
		return (
			<div
				className={classnames('field-wrapper', className, {
					error: displayError,
					inline: !fullWidth,
					'with-notification': !!notification,
					'field-valid': !invalid,
				})}
			>
				<FieldContent
					stringId={stringId}
					label={label}
					warning={warning}
					valid={!invalid}
					hasValue={hasValue}
					focused={active || focused}
					hideUnderline={hideUnderline}
					hideCheck={hideCheck}
					outlineClassName={outlineClassName}
					onClick={onClick}
					displayError={displayError}
					error={error}
					ishorizontalfield={ishorizontalfield}
					dateFieldClassName={className}
					strings={strings}
					preview={preview}
				>
					{children}
					{notification && typeof notification === 'object' && (
						<ActionNotification
							{...notification}
							className={classnames('pr-0 pl-0 no_bottom', {
								'with-tick-icon': fullWidth && !invalid && !hideCheck,
							})}
							showActionText={true}
						/>
					)}
				</FieldContent>
				{!ishorizontalfield ? (
					<Fragment>
						<FieldError displayError={displayError} error={error} strings={strings} preview={preview}/>
					</Fragment>
				) : null}
			</div>
		);
	}
}

FieldWrapper.defaultProps = {
	meta: {},
  strings: {},
	input: {
		value: '',
	},
};

export default FieldWrapper;
