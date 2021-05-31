import React from 'react';
import math from 'mathjs';
import numbro from 'numbro';
import validator from 'validator';

export const DEFAULT_COIN_DATA = {
  fullname: '',
  symbol: '',
  min: 0.001,
};

const local_base_currnecy = localStorage.getItem('base_currnecy');

export const BASE_CURRENCY = local_base_currnecy
  ? local_base_currnecy.toLowerCase()
  : 'usdt';

export const CURRENCY_PRICE_FORMAT = '{0} {1}';

export const getFormat = (min = 0, fullFormat) => {
  let value = math.format(min, { notation: 'fixed' });
  if (fullFormat) {
    return { digit: 8, format: '0,0.[00000000]' };
  } else if (min % 1) {
    let point = value.toString().split('.')[1]
      ? value.toString().split('.')[1]
      : '';
    let res = point
      .split('')
      .map((val) => 0)
      .join('');
    return { digit: point.length, format: `0,0.[${res}]` };
  } else {
    return { digit: 4, format: `0,0.[0000]` };
  }
};

export const formatToCurrency = (amount = 0, min = 0, fullFormat = false) => {
  let formatObj = getFormat(min, fullFormat);
  return numbro(roundNumber(amount, formatObj.digit)).format(formatObj.format);
};

export const required = value => (!value ? "required" : undefined);

export const roundNumber = (number = 0, decimals = 4) => {
  if (number === 0) {
    return 0;
  } else if (decimals > 0) {
    const multipliedNumber = math.multiply(
      math.fraction(number),
      math.pow(10, decimals)
    );
    const dividedNumber = math.divide(
      math.floor(multipliedNumber),
      math.pow(10, decimals)
    );
    return math.number(dividedNumber);
  } else {
    return math.floor(number);
  }
};

const normalizeBTC = (value = 0) => (value ? roundNumber(value, 8) : '');

const maxValue = (maxValue, message) => (value = 0) =>
  value > maxValue
    ? message
    : undefined;

const minValue = (minValue, message) => (value = 0) =>
  value < minValue
    ? message
    : undefined;

const checkBalance = (available, message, fee = 0) => (value = 0) => {
  const operation =
    fee > 0
      ? math.number(
      math.add(
        math.fraction(value),
        math.multiply(math.fraction(value), math.fraction(fee))
      )
      )
      : value;

  if (operation > available) {
    return message;
  }
  return undefined;
};

const toFixed = (exponential) => {
  if (Math.abs(exponential) < 1.0) {
    let e = parseInt(exponential.toString().split('e-')[1], 10);
    if (e) {
      exponential *= Math.pow(10, e - 1);
      exponential =
        '0.' + new Array(e).join('0') + exponential.toString().substring(2);
    }
  } else {
    let e = parseInt(exponential.toString().split('+')[1], 10);
    if (e > 20) {
      e -= 20;
      exponential /= Math.pow(10, e);
      exponential += new Array(e + 1).join('0');
    }
  }
  return exponential;
};

export const getDecimals = (value = 0) => {
  let result = math.format(math.number(value), { notation: 'fixed' });
  return value % 1
    ? result.toString().split('.')[1]
      ? result.toString().split('.')[1].length
      : 0
    : 0;
};

export const validateOtp = (message) => (
  value = ''
) => {
  let error = undefined;
  if (value.length !== 6 || !validator.isNumeric(value)) {
    error = message;
  }
  return error;
};

export const generateFormValues = (
  constants,
  STRINGS,
  symbol,
  available = 0,
  calculateMax,
  coins = {},
  verification_level,
  theme,
  language,
  icon,
  iconId,
  banks,
  selectedBank,
  activeTab,
) => {
  const { fullname, min, increment_unit, withdrawal_limits = {} } =
  coins[symbol] || DEFAULT_COIN_DATA;
  let MAX = withdrawal_limits[verification_level];
  if (withdrawal_limits[verification_level] === 0) MAX = '';
  if (withdrawal_limits[verification_level] === -1) MAX = 0;

  const fields = {};

  if (banks) {
    const banksOptions = banks.map(({ bank_name = 'unnamed', id }) => ({
      value: id,
      label: bank_name,
    }));

    let preview
    if(selectedBank) {
      const selectedBankObj = banks.find(({ id }) => id === selectedBank );
      if (activeTab === "bank" && selectedBankObj) {
        preview = (
          <div className="d-flex py-2 field-content_preview">
            <div className="bold pl-4">
              <div>Account owner:</div>
              <div>Bank name:</div>
              <div>Bank account number:</div>
              <div>BSB:</div>
            </div>
            <div className="pl-4">
              <div>{selectedBankObj.account_name || '-'}</div>
              <div>{selectedBankObj.bank_name || '-'}</div>
              <div>{selectedBankObj.account_number || '-'}</div>
              <div>{selectedBankObj.bsb_number || '-'}</div>
            </div>
          </div>
        )
      } else if (activeTab === "osko" && selectedBankObj) {
        preview = (
          <div className="d-flex py-2 field-content_preview hidden-field_preview">
            <div className="bold pl-4">
              <div>Account name:</div>
              <div>Email:</div>
            </div>
            <div className="pl-4">
              <div>{selectedBankObj.pay_id_account_name || '-'}</div>
              <div>{selectedBankObj.pay_id_email || '-'}</div>
            </div>
          </div>
        )
      }
    }

    const bankFieldLabel = activeTab === "osko" ? "Osko PayID details" : 'Bank'

    fields.bank = {
      type: 'select',
      label: bankFieldLabel,
      placeholder: 'Select a bank',
      validate: [required],
      fullWidth: true,
      options: banksOptions,
      hideCheck: true,
      ishorizontalfield: true,
      disabled: banks.length === 1,
      strings: STRINGS,
      preview,
      hidden: activeTab === "osko",
    };
  }

  if ((banks && (banks.length === 1 || selectedBank))) {
    const amountValidate = [required];
    if (min) {
      amountValidate.push(
        minValue(min, 'The transaction is too small to send. Try a larger amount.')
      );
    }
    if (MAX) {
      amountValidate.push(
        maxValue(MAX, 'The transaction is too big to send. Try a smaller amount.')
      );
    }
    // FIX add according fee
    // amountValidate.push(checkBalance(available, STRINGS.formatString(STRINGS["WITHDRAWALS_LOWER_BALANCE"], fullname), fee));
    amountValidate.push(
      checkBalance(
        available,
        `You don’t have enough ${fullname} in your balance to send that transaction`,
        0
      )
    );

    fields.amount = {
      type: 'number',
      stringId:
        'WITHDRAWALS_FORM_AMOUNT_LABEL,WITHDRAWALS_FORM_AMOUNT_PLACEHOLDER',
      label: STRINGS.formatString(
        STRINGS['WITHDRAWALS_FORM_AMOUNT_LABEL'],
        fullname
      ),
      placeholder: STRINGS.formatString(
        STRINGS['WITHDRAWALS_FORM_AMOUNT_PLACEHOLDER'],
        fullname
      ).join(''),
      min: min,
      max: MAX,
      step: increment_unit,
      validate: amountValidate,
      normalize: normalizeBTC,
      fullWidth: true,
      ishorizontalfield: true,
      notification: {
        stringId: 'CALCULATE_MAX',
        text: STRINGS['CALCULATE_MAX'],
        status: 'information',
        iconPath: icon,
        iconId,
        className: 'file_upload_icon',
        useSvg: true,
        onClick: calculateMax,
      },
      parse: (value = '') => {
        let decimal = getDecimals(increment_unit);
        let decValue = toFixed(value);
        let valueDecimal = getDecimals(decValue);

        let result = value;
        if (decimal < valueDecimal) {
          result = decValue
            .toString()
            .substring(
              0,
              decValue.toString().length - (valueDecimal - decimal)
            );
        }
        return result;
      },
      strings: STRINGS,
    };

  }

  fields.captcha = {
    type: 'captcha',
    language,
    theme,
    validate: [required],
    strings: STRINGS,
    constants,
  };

  return fields;
};

export const generateInitialValues = (
  symbol,
  coins = {},
  banks,
  selectedBank
) => {
  const { min } =
  coins[symbol] || DEFAULT_COIN_DATA;
  const initialValues = {};

  if (min) {
    initialValues.amount = min;
  } else {
    initialValues.amount = '';
  }

  if (banks && banks.length > 0) {
    initialValues.bank = selectedBank;
  }

  return initialValues;
};