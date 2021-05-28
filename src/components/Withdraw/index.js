import React, { Component, Fragment } from 'react';
import math from 'mathjs';
import classnames from 'classnames';
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
import { IconTitle } from '../IconTitle';
import { Tab } from '../Tab';
import axios from 'axios';

export const FORM_NAME = "FiatWithdrawalForm";
export const selector = formValueSelector(FORM_NAME);
const verified_status = 3;

const TABS = {
  bank: {
    iconId: "VERIFICATION_BANK_NEW",
    title: "Bank"
  },
  osko: {
    iconId: "OSKO_LOGO",
    title: "Osko (PayID)"
  }
};

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
    const { plugin_url: PLUGIN_URL, token } = this.props;
    const { bank, ...rest } = values;
    return axios({
      url: `${PLUGIN_URL}/plugins/instantpay/withdraw`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        ...rest,
        bank_id: bank,
      }
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

  renderContent = () => {
    const { activeTab } = this.props;
    switch (activeTab) {
      case "bank": {
        return this.renderBankContent();
      }
      case "osko": {
        return this.renderOskoContent();
      }
      default: {
        return "No content";
      }
    }
  };

  renderTabs = () => {
    const { activeTab, setActiveTab, icons: ICONS } = this.props;
    return(
      <div
        className={classnames('custom-tab-wrapper d-flex flex-nowrap flex-row justify-content-start')}
      >
        {Object.entries(TABS).map(([key, { title, iconId }]) => {
          const tabProps = {
            key: `tab_item-${key}`,
            className: classnames('tab_item', 'f-1', {
              'tab_item-active': key === activeTab,
              pointer: setActiveTab,
            }),
          };
          if (setActiveTab) {
            tabProps.onClick = () => setActiveTab(key);
          }

          return (
            <div {...tabProps}>
              <Tab
                icon={ICONS[iconId]}
                title={title}
              />
            </div>
          );
        })}
      </div>
    );
  }

  renderButtonSection = () => {
    const { activeTab } = this.props;
    switch (activeTab) {
      case "bank": {
        return this.renderBankButtonSection();
      }
      case "osko": {
        return this.renderOskoButtonSection();
      }
      default: {
        return "No content";
      }
    }
  }

  renderOskoContent = () => {
    const {
      formValues,
      icons: ICONS,
      user: { bank_account: all_accounts = [] } = {}
    } = this.props;

    const osko_account = all_accounts.filter(({ bank_name }) => bank_name === "pay id");
    const verified_osko_account = osko_account.filter(({ status }) => status === verified_status);
    const has_verified_osko_account = !!verified_osko_account.length;

    return (
      <Fragment>
        {
          !has_verified_osko_account && (
            <Fragment>
              <IconTitle
                text="Complete verification"
                iconId="VERIFICATION_BANK_NEW"
                iconPath={ICONS['VERIFICATION_BANK_NEW']}
                className="flex-direction-column"
              />
              <div className="text-align-center py-4">
                In order to make a withdrawal you are required to complete your verification which includes verification of your bank details. Please proceed to verification below.
              </div>
            </Fragment>
          )
        }
        {has_verified_osko_account && renderFields(formValues)}
      </Fragment>
    );
  }

  renderBankContent = () => {
    const {
      formValues,
      icons: ICONS,
      user: { bank_account: all_accounts = [] } = {}
    } = this.props;

    const bank_account = all_accounts.filter(({ bank_name }) => bank_name !== "pay id");
    const verified_bank_account = bank_account.filter(({ status }) => status === verified_status);
    const has_verified_bank_account = !!verified_bank_account.length;

    return (
      <Fragment>
        {
          !has_verified_bank_account && (
            <Fragment>
              <IconTitle
                text="Complete verification"
                iconId="VERIFICATION_BANK_NEW"
                iconPath={ICONS['VERIFICATION_BANK_NEW']}
                className="flex-direction-column"
              />
              <div className="text-align-center py-4">
                In order to make a withdrawal you are required to complete your verification which includes verification of your bank details. Please proceed to verification below.
              </div>
            </Fragment>
          )
        }
        {has_verified_bank_account && renderFields(formValues)}
      </Fragment>
    );
  }

  renderBankButtonSection = () => {
    const {
      data,
      submitting,
      pristine,
      valid,
      router,
      strings: STRINGS,
      user: { bank_account: all_accounts = [] } = {}
    } = this.props;

    const bank_account = all_accounts.filter(({ bank_name }) => bank_name !== "pay id");
    const verified_bank_account = bank_account.filter(({ status }) => status === verified_status);
    const has_verified_bank_account = !!verified_bank_account.length;

    return (
      <Fragment>
        {
          !has_verified_bank_account && (
            <Button
              label={STRINGS["ACCOUNTS.TAB_VERIFICATION"]}
              onClick={() => router.push('/verification?initial_tab=bank&initial_bank_tab=bank')}
              className="mb-3"
            />
          )
        }
        {
          has_verified_bank_account && data.bank && (
            <Button
              label={STRINGS['WITHDRAWALS_BUTTON_TEXT']}
              disabled={pristine || submitting || !valid}
              onClick={this.onOpenDialog}
              className="mb-3"
            />
          )
        }
      </Fragment>
    );
  }

  renderOskoButtonSection = () => {
    const {
      data,
      submitting,
      pristine,
      valid,
      router,
      strings: STRINGS,
      user: { bank_account: all_accounts = [] } = {}
    } = this.props;

    const osko_account = all_accounts.filter(({ bank_name }) => bank_name === "pay id");
    const verified_osko_account = osko_account.filter(({ status }) => status === verified_status);
    const has_verified_osko_account = !!verified_osko_account.length;

    return (
      <Fragment>
        {
          !has_verified_osko_account && (
            <Button
              label={STRINGS["ACCOUNTS.TAB_VERIFICATION"]}
              onClick={() => router.push('/verification?initial_tab=bank&initial_bank_tab=osko')}
              className="mb-3"
            />
          )
        }
        {
          has_verified_osko_account && data.bank && (
            <Button
              label={STRINGS['WITHDRAWALS_BUTTON_TEXT']}
              disabled={pristine || submitting || !valid}
              onClick={this.onOpenDialog}
              className="mb-3"
            />
          )
        }
      </Fragment>
    );
  }

  render() {
    const {
      user: { bank_account = [] } = {},
      activeTheme,
      submitting,
      error,
      currency,
      data,
      coins,
      currentPrice,
      titleSection,
      icons: ICONS,
      strings: STRINGS,
      activeTab,
    } = this.props;
    const { dialogIsOpen, dialogOtpOpen } = this.state;

    const verified_bank_account = bank_account.filter(({ status }) => status === verified_status);

    return (
      <div className="withdraw-form-wrapper">
        <div className="withdraw-form">
          <Image
            icon={ICONS[`${currency.toUpperCase()}_ICON`]}
            wrapperClassName="form_currency-ball"
          />
          {titleSection}
          {this.renderTabs()}
          <div className="py-4">Please note: You can only withdraw to an account in your name.</div>
          {this.renderContent()}
          {error && <div className="warning_text">{error}</div>}
        </div>

        <div className="btn-wrapper">
          {this.renderButtonSection()}
        </div>

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
              activeTab={activeTab}
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