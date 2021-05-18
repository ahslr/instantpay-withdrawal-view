import React from 'react';
import { Field } from 'redux-form';
import InputField from './FormFields/InputField';
import DropdownField from './FormFields/DropdownField';
import CaptchaField from './FormFields/Captcha';

const renderFields = (fields = {}, callback) => {
	return (
		<div>
			{Object.keys(fields).map((key, index) => {
				const { type, validate = [], ishorizontalfield, ...rest } = fields[key];
				const commonProps = {
					callback,
					key,
					name: key,
					type,
					validate,
					ishorizontalfield,
					...rest,
				};

				switch (type) {
					case 'captcha':
						return <Field component={CaptchaField} {...commonProps} />;
					case 'hidden':
						return (
							<Field
								component={() => <div className="hidden" />}
								{...commonProps}
							/>
						);
					case 'select':
					case 'autocomplete':
						return (
							<Field
								component={DropdownField}
								autocomplete={type === 'autocomplete'}
								{...commonProps}
							/>
						);
					case 'text':
					case 'password':
					case 'email':
					default:
						return <Field component={InputField} {...commonProps} />;
				}
			})}
		</div>
	);
};

export default renderFields;
