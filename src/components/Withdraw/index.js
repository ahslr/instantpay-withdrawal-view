import React, { Component } from 'react';
import math from 'mathjs';
import { connect } from 'react-redux';
import {
  reduxForm,
  formValueSelector,
  reset,
  SubmissionError,
  stopSubmit,
  change,
} from "redux-form";
import renderFields from '../Form/factoryFields';
import Dialog from '../Dialog';
import ReviewModalContent from './ReviewModalContent';
import OtpForm from '../OtpForm';
import { Image } from '../Image';
import { Button } from '../Button';
import axios from 'axios';

export const FORM_NAME = "FiatWithdrawalForm";
export const selector = formValueSelector(FORM_NAME);
const verified_status = 3;

let errorTimeOut = null;

const validate = (values, props) => {
  const errors = {};
  const amount = math.fraction(values.amount || 0);
  const fee = math.fraction(values.fee || 0);
  const balance = math.fraction(props.balanceAvailable || 0);

  const totalTransaction = math.add(fee, amount);
  if (math.larger(totalTransaction, balance)) {
    errors.amount = props.strings.formatString(
      props.strings['WITHDRAWALS_LOWER_BALANCE'],
      math.number(totalTransaction)
    );
  }

  return errors;
};

class Index extends Component {
  state = {
    dialogIsOpen: false,
    dialogOtpOpen: false,
    otp_code: '',
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.currency !== this.props.currency) {
      nextProps.dispatch(reset(FORM_NAME));
    }
    if (
      !nextProps.submitting &&
      nextProps.submitting !== this.props.submitting
    ) {
      this.onCloseDialog();
    }
  }

  componentWillUnmount() {
    if (errorTimeOut) {
      clearTimeout(errorTimeOut);
    }
  }

  onSubmitWithdrawReq = (values) => {
    const { plugin_url: PLUGIN_URL } = this.props;
    const { bank, ...rest } = values;
    return axios.post(`${PLUGIN_URL}/plugins/instantpay/withdraw`, {
      ...rest,
      bank_id: bank,
    })
  }

  onAcceptDialog = () => {
    const { user: { otp_enabled } } = this.props;
    if (otp_enabled) {
      this.setState({ dialogOtpOpen: true });
    } else {
      this.onCloseDialog();
      // this.props.submit();
      const values = this.props.data;
      return this.onSubmitWithdrawReq({
          ...values,
          amount: math.eval(values.amount),
        })
        .then((response) => {
          this.props.onSubmitSuccess(
            { ...response.data, currency: this.props.currency },
            this.props.dispatch
          );
          return response;
        })
        .catch((err) => {
          const error = { _error: err.message, ...err.errors };
          errorTimeOut = setTimeout(() => {
            this.props.dispatch(change(FORM_NAME, 'captcha', ''));
          }, 5000);
          this.props.onSubmitFail(err.errors || err, this.props.dispatch);
          this.onCloseDialog();
          this.props.dispatch(stopSubmit(FORM_NAME, error));
          // throw new SubmissionError(error);
        });
    }
  };

  onOpenDialog = (ev) => {
    if (ev && ev.preventDefault) {
      ev.preventDefault();
    }
    this.setState({ dialogIsOpen: true });
  };

  onCloseDialog = (ev) => {
    if (ev && ev.preventDefault) {
      ev.preventDefault();
    }
    this.setState({ dialogIsOpen: false, dialogOtpOpen: false });
  };

  onSubmitOtp = ({ otp_code = '' }) => {
    const values = this.props.data;
    return this.onSubmitWithdrawReq({
        ...values,
        amount: math.eval(values.amount),
        otp_code,
      })
      .then((response) => {
        this.onCloseDialog();
        this.props.onSubmitSuccess(
          { ...response.data, currency: this.props.currency },
          this.props.dispatch
        );
        return response;
      })
      .catch((err) => {
        if (err instanceof SubmissionError) {
          if (err.errors && !err.errors.otp_code) {
            const error = { _error: err.message, ...err.errors };
            errorTimeOut = setTimeout(() => {
              this.props.dispatch(change(FORM_NAME, 'captcha', ''));
            }, 5000);
            this.props.onSubmitFail(err.errors, this.props.dispatch);
            this.onCloseDialog();
            this.props.dispatch(stopSubmit(FORM_NAME, error));
          }
          throw err;
        } else {
          const error = { _error: err.message };
          errorTimeOut = setTimeout(() => {
            this.props.dispatch(change(FORM_NAME, 'captcha', ''));
          }, 5000);
          this.props.onSubmitFail(error, this.props.dispatch);
          this.onCloseDialog();
          this.props.dispatch(stopSubmit(FORM_NAME, error));
          throw new SubmissionError(error);
        }
      });
  };

  render() {
    const {
      user: { bank_account = [] } = {},
      formValues,
      activeTheme,
      submitting,
      pristine,
      error,
      valid,
      currency,
      data,
      coins,
      currentPrice,
      titleSection,
      icons: ICONS,
      strings: STRINGS,
      router,
    } = this.props;
    const { dialogIsOpen, dialogOtpOpen } = this.state;

    const verified_bank_account = bank_account.filter(({ status }) => status === verified_status);
    const has_verified_bank_account = !!verified_bank_account.length;

    return (
      <div className="withdraw-form-wrapper">
        <div className="withdraw-form">
          <Image
            icon={ICONS[`${currency.toUpperCase()}_ICON`]}
            wrapperClassName="form_currency-ball"
          />
          {titleSection}
          {
            !has_verified_bank_account && (
              <div>
                In order to make a withdrawal you are required to complete your verification which includes verification of your bank details. Please proceed to verification below.
              </div>
            )
          }
          {has_verified_bank_account && renderFields(formValues)}
          {error && <div className="warning_text">{error}</div>}
        </div>
        {
          !has_verified_bank_account && (
            <div className="btn-wrapper">
              <Button
                label={STRINGS["ACCOUNTS.TAB_VERIFICATION"]}
                onClick={() => router.push('/verification')}
                className="mb-3"
              />
            </div>
          )
        }
        {
          has_verified_bank_account && data.bank && (
            <div className="btn-wrapper">
              <Button
                label={STRINGS['WITHDRAWALS_BUTTON_TEXT']}
                disabled={pristine || submitting || !valid}
                onClick={this.onOpenDialog}
                className="mb-3"
              />
            </div>
        )
      }
        <Dialog
          isOpen={dialogIsOpen}
          label="withdraw-modal"
          onCloseDialog={this.onCloseDialog}
          shouldCloseOnOverlayClick={dialogOtpOpen}
          theme={activeTheme}
          showCloseText={false}
        >
          {dialogOtpOpen ? (
            <OtpForm
              onSubmit={this.onSubmitOtp}
              strings={STRINGS}
              icons={ICONS}
            />
          ) : !submitting ? (
            <ReviewModalContent
              banks={verified_bank_account}
              strings={STRINGS}
              coins={coins}
              currency={currency}
              data={data}
              price={currentPrice}
              onClickAccept={this.onAcceptDialog}
              onClickCancel={this.onCloseDialog}
              icons={ICONS}
            />
          ) : null}
        </Dialog>
      </div>
    )
  }
}

const FiatWithdrawalForm = reduxForm({
  form: FORM_NAME,
  enableReinitialize: true,
  onSubmitFail: () => console.log('failed'),
  onSubmitSuccess: (data, dispatch) => {
    dispatch(reset(FORM_NAME));
    console.log('data', data);
  },
  validate,
})(Index);

const mapStateToProps = (state) => ({
  data: selector(
    state,
    'bank',
    'amount',
    'fee',
    'captcha'
  ),
});

export default connect(mapStateToProps)(FiatWithdrawalForm);