import React, { Component } from 'react';
import classnames from 'classnames';
import { ReCaptcha } from 'react-recaptcha-v3';

export const DEFAULT_CAPTCHA_SITEKEY =
  '6LeuOKoUAAAAAGVoZcSWXJH60GHt4crvIaNXn1YA'; // default recaptcha v3; // default recaptcha v3

class CaptchaField extends Component {
	state = {
		active: true,
		ready: false,
	};

	componentDidMount() {
		this.expiryTime = setInterval(() => {
			this.captcha.execute();
		}, 120000);
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (
			nextProps.input.value === '' &&
			nextProps.input.value !== this.props.input.value
		) {
			this.captcha.execute();
		}
	}

	setRef = (el) => {
		this.captcha = el;
	};

	onVerifyCallback = (data) => {
		this.props.input.onChange(data);
	};

	onExpiredCallback = () => {
		this.props.input.onChange('');
		this.captcha.execute();
	};

	componentWillUnmount() {
		if (this.expiryTime) {
			clearInterval(this.expiryTime);
		}
	}

	render() {
		const {
			language,
			constants: { captcha = {} },
		} = this.props;
		const { ready, active } = this.state;

		return (
			active && (
				<div
					className={classnames('field-wrapper', 'captcha-wrapper', {
						hidden: !ready,
					})}
				>
					<ReCaptcha
						ref={this.setRef}
						sitekey={captcha.site_key || DEFAULT_CAPTCHA_SITEKEY}
						verifyCallback={this.onVerifyCallback}
						expiredCallback={this.onExpiredCallback}
						lang={language}
					/>
				</div>
			)
		);
	}
}

export default CaptchaField;
