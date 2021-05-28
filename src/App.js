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

import "./App.css";

const verified_status = 3;

class App extends Component {
  state = {
    formValues: {},
    initialValues: {},
    activeTab: 'bank'
  }

  componentDidMount() {
    const { currency, user: { balance, verification_level, bank_account }, coins } = this.props;
    const { activeTab } = this.state;

    const banks = bank_account.filter(({ status }) => status === verified_status);
    const filtered_banks = banks.filter(({ bank_name }) => activeTab === 'osko' ? bank_name === "pay id" : bank_name !== "pay id");

    let initialBank;
    if (filtered_banks && filtered_banks.length === 1) {
      initialBank = banks[0]['id'];
    }

    this.generateFormValues(activeTab, currency, balance, coins, verification_level, banks, initialBank);
  }

  UNSAFE_componentWillUpdate(nextProps, nextState) {
    const { selectedBank } = this.props;
    const { activeTab } = this.state;
    if (
      nextProps.selectedBank !== selectedBank ||
      nextState.activeTab !== activeTab
    ) {
      const { currency, user: { balance, verification_level, bank_account }, coins } = this.props;
      const banks = bank_account.filter(({ status }) => status === verified_status);
      const filtered_banks = banks.filter(({ bank_name }) => nextState.activeTab === 'osko' ? bank_name === "pay id" : bank_name !== "pay id");
      let initialBank;
      if (nextState.activeTab === activeTab) {
        if (filtered_banks && filtered_banks.length === 1) {
          initialBank = filtered_banks[0]['id'];
        } else {
          initialBank = nextProps.selectedBank
        }
      } else {
        if (filtered_banks && filtered_banks.length !== 0) {
          initialBank = filtered_banks[0]['id'];
        }
      }

      this.generateFormValues(nextState.activeTab, currency, balance, coins, verification_level, banks, initialBank);
    }
  }

  updatePath = (key, value) => {
    const { router, router: { location: { pathname }} } = this.props;
    router.push({ pathname, query: { [key]: value } })
  }

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
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
    activeTab,
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

    const filtered_banks = banks.filter(({ bank_name }) => activeTab === 'osko' ? bank_name === "pay id" : bank_name !== "pay id")

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
      filtered_banks,
      selectedBank,
      activeTab,
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
    const { initialValues, formValues, activeTab } = this.state;
    const { currency, user: { balance }, children, token } = this.props;
    const { setActiveTab } = this;

    const balanceAvailable = balance[`${currency}_available`];

    const formProps = {
      balanceAvailable,
      ...this.props,
      initialValues,
      formValues,
      token,
      setActiveTab,
      activeTab,
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
