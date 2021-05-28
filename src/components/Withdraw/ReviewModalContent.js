import React, { Fragment } from 'react';
import math from 'mathjs';
import { Image } from '../Image';
import { Button } from '../Button';
import { BASE_CURRENCY, DEFAULT_COIN_DATA, CURRENCY_PRICE_FORMAT, formatToCurrency } from './FormUtils';

const ButtonSection = ({ onClickAccept, onClickCancel, strings: STRINGS }) => {
	return (
		<div className="d-flex">
			<Button
				label={STRINGS['CANCEL']}
				onClick={onClickCancel}
				className="button-fail"
			/>
			<div className="button-separator" />
			<Button
				label={STRINGS['NOTIFICATIONS.BUTTONS.OKAY']}
				onClick={onClickAccept}
				className="button-success"
			/>
		</div>
	);
};

const ReviewModalContent = ({
	strings: STRINGS,
	coins,
	currency,
	data,
	price,
	onClickAccept,
	onClickCancel,
	icons: ICONS,
	banks,
	activeTab,
}) => {
	const { min, fullname, symbol = '' } =
		coins[currency || BASE_CURRENCY] || DEFAULT_COIN_DATA;
	const baseCoin = coins[BASE_CURRENCY] || DEFAULT_COIN_DATA;
	const shortName = symbol.toUpperCase();

	const selectedBank = banks.find(({ id }) => id === data.bank )

	const totalTransaction = math.number(
		math.add(math.fraction(data.amount), math.fraction(data.fee || 0))
	);

	const cryptoAmountText = STRINGS.formatString(
		CURRENCY_PRICE_FORMAT,
		formatToCurrency(totalTransaction, min),
		shortName
	);

	const feePrice = data.fee ? math.number(math.multiply(data.fee, price)) : 0;
	const fee = data.fee ? data.fee : 0;

	const renderContent = () => {
    switch (activeTab) {
      case "bank": {
        return (
					<div className="d-flex py-4">
						<div className="bold pl-2">
							<div>Account owner:</div>
							<div>Bank name:</div>
							<div>Bank account number:</div>
							<div>BSB:</div>
						</div>
						<div className="pl-4">
							<div>{selectedBank.account_name || "-"}</div>
							<div>{selectedBank.bank_name || "-"}</div>
							<div>{selectedBank.account_number || "-"}</div>
							<div>{selectedBank.bsb_number || "-"}</div>
						</div>
					</div>
				);
      }
      case "osko": {
        return (
					<div className="d-flex py-4">
						<div className="bold pl-2">
							<div>Type:</div>
							<div>Account name:</div>
							<div>Email:</div>
						</div>
						<div className="pl-4">
							<div>Osko (PayID)</div>
							<div>{selectedBank.pay_id_account_name || "-"}</div>
							<div>{selectedBank.pay_id_email || "-"}</div>
						</div>
					</div>
				);
      }
      default: {
        return "No content";
      }
    }
	}

	return (
		<div className="d-flex flex-column review-wrapper">
			<Image
				iconId="CHECK_SENDING_BITCOIN"
				icon={ICONS['CHECK_SENDING_BITCOIN']}
				wrapperClassName="review-icon"
			/>
			<div className="d-flex flex-column align-items-center review-info_container">
				<div className="review-info_message">
          {STRINGS['WITHDRAW_PAGE.MESSAGE_ABOUT_SEND']}
				</div>
				<div className="review-crypto-amount review-crypto-address">
					<div>{cryptoAmountText}</div>
					<div className="review-fee_message">
            {STRINGS.formatString(
              STRINGS['WITHDRAW_PAGE.MESSAGE_FEE'],
              fee,
              STRINGS.formatString(
                CURRENCY_PRICE_FORMAT,
                formatToCurrency(feePrice, baseCoin.min),
                baseCoin.symbol.toUpperCase()
              )
            )}
					</div>
				</div>
				<div className="review-warning_arrow" />
				<div className="review-crypto-address" style={{ fontSize: '1.1rem' }}>
					{renderContent()}
				</div>
			</div>
			<ButtonSection
				onClickAccept={onClickAccept}
				onClickCancel={onClickCancel}
				strings={STRINGS}
			/>
		</div>
	);
};

ReviewModalContent.defaultProps = {
	data: {},
	onClickAccept: () => {},
	onClickCancel: () => {},
	price: 0,
	coins: {},
	strings: {},
	icons: {}
};

export default ReviewModalContent;
