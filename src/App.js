import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import math from 'mathjs';
import { change } from "redux-form";
import {
  generateFormValues,
  generateInitialValues,
  DEFAULT_COIN_DATA,
  roundNumber,
  getDecimals,
} from './components/Withdraw/FormUtils';
import WithdrawalForm, { FORM_NAME, selector } from './components/Withdraw';

const verified_status = 3;

class App extends Component {
  state = {
    formValues: {},
    initialValues: {},
  }

  componentDidMount() {
    const { currency, user: { balance, verification_level, bank_account }, coins } = this.props;
    const banks = bank_account.filter(({ status }) => status === verified_status);
    let initialBank;
    if (banks && banks.length === 1) {
      initialBank = banks[0]['id'];
    }

    this.generateFormValues(currency, balance, coins, verification_level, banks, initialBank);
  }

  onCalculateMax = () => {
    const {
      user: {
        balance,
        verification_level,
      },
      selectedFee = 0,
      dispatch,
      coins,
      config_level = {},
      currency,
    } = this.props;
    const { withdrawal_limit } = config_level[verification_level] || {};
    const balanceAvailable = balance[`${currency}_available`];
    const { increment_unit } = coins[currency] || DEFAULT_COIN_DATA;

    let amount = math.number(
      math.subtract(math.fraction(balanceAvailable), math.fraction(selectedFee))
    );
    if (amount < 0) {
      amount = 0;
    } else if (
      math.larger(amount, math.number(withdrawal_limit)) &&
      withdrawal_limit !== 0 &&
      withdrawal_limit !== -1
    ) {
      amount = math.number(
        math.subtract(
          math.fraction(withdrawal_limit),
          math.fraction(selectedFee)
        )
      );
    }
    dispatch(
      change(
        FORM_NAME,
        'amount',
        roundNumber(amount, getDecimals(increment_unit))
      )
    );
    // }
  };

  generateFormValues = (
    currency,
    balance,
    coins,
    verification_level,
    banks,
    selectedBank
  ) => {
    const {
      strings: STRINGS,
      icons: ICONS,
      activeTheme,
      activeLanguage,
      constants,
    } = this.props;
    const balanceAvailable = balance[`${currency}_available`];

    const formValues = generateFormValues(
      constants,
      STRINGS,
      currency,
      balanceAvailable,
      this.onCalculateMax,
      coins,
      verification_level,
      activeTheme,
      activeLanguage,
      ICONS['BLUE_PLUS'],
      'BLUE_PLUS',
      banks,
      selectedBank
    );

    const initialValues = generateInitialValues(
      currency,
      coins,
      banks,
      selectedBank
    );

    this.setState({ formValues, initialValues });
  };

  render() {
    const { initialValues, formValues } = this.state;
    const { currency, user: { balance }, children } = this.props;

    const balanceAvailable = balance[`${currency}_available`];

    const formProps = {
      balanceAvailable,
      ...this.props,
      initialValues,
      formValues,
    }

    if (currency !== 'aud') {
      return (
        <Fragment>
          {children}
        </Fragment>
      )
    }

    return (
      <div>
        <WithdrawalForm
          {...formProps}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    selectedBank: selector(state, 'bank'),
    amount: selector(state, 'amount'),
  };
};

const mapDispatchToProps = (dispatch) => ({
  dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
