import { FormEventHandler, useContext, useEffect, useState, MouseEvent } from 'react'
import Select, { SingleValue } from 'react-select'
import { usePrices } from '../hooks/usePrices'
import { formatUSD } from '../utils/format'
import { UserContext } from '../hooks/useUser'
import ky from 'ky'
import { Account } from '../db/accounts'
import React from 'react'
import { Price } from '../pages/api/prices'

export interface BuySellModalProps {
  visible: boolean
  onClose: () => void
  currency?: { value: string; label: string }
  action: BuySellAction
}

export interface SelectedOption {
  value: string
  label: string
}

const DEFAULT_CURRENCY_VALUE = {
  value: 'bitcoin',
  label: 'Bitcoin',
} as SelectedOption

enum TransactionState {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export enum BuySellAction {
  Buy = 'buy',
  Sell = 'sell',
}

export const BuySellModal: React.FC<BuySellModalProps> = (props) => {
  // TODO: probably need amountUSD & amountCoin (update both when either changes)
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState<SingleValue<SelectedOption>>(DEFAULT_CURRENCY_VALUE)
  const [coin, setCoin] = useState<Price | null>(null)
  const { prices } = usePrices()
  const { accountInfo, setAccountInfo } = useContext(UserContext)
  const [availableToSpend, setAvailableToSpend] = useState<number>(0)
  const [availableToSell, setAvailableToSell] = useState<number>(0)
  const [transactionStatus, setTransactionStatus] = useState<null | TransactionState>(null)

  const handleCurrencySelectionChange = (
    selectedOption: SingleValue<{ value: string; label: string }>
  ) => {
    setCurrency(selectedOption)
  }

  // Close modal if click event happened on the background overlay itself.
  const handleClickOutsideModal = (e: MouseEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  // Listen for esc key to close modal.
  useEffect(() => {
    const closeIfEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose()
      }
    }
    window.addEventListener('keydown', closeIfEsc)
    return () => window.removeEventListener('keydown', closeIfEsc)
  }, [props])

  // Set selected currency whenever prop is passed in.
  useEffect(() => {
    if (!props.currency) return
    setCurrency(props.currency)
  }, [props.currency])

  // Get current coin data whenever selected currency changes or prices update.
  useEffect(() => {
    if (!prices || !currency) return
    const coin = prices.find((price) => price.id === currency.value)!
    setCoin(coin)
  }, [currency, prices])

  // Whenever modal is hidden, reset transaction status and amount.
  useEffect(() => {
    if (props.visible) return // Don't do it when visible since it will be less smooth.
    setTransactionStatus(null)
    setAmount(0)
  }, [props.visible])

  // Whenever account info updates, set the available amount to spend or sell.
  useEffect(() => {
    setAvailableToSpend(
      accountInfo?.portfolios[0].holdings.find((holding) => holding.currency === 'USD')?.amount ?? 0
    )
    setAvailableToSell(
      accountInfo?.portfolios[0].holdings.find((holding) => holding.currency === coin?.id)
        ?.amount ?? 0
    )
  }, [accountInfo, coin])

  const handleSubmit: FormEventHandler = async (event) => {
    if (!coin || !accountInfo || !currency) return
    event.preventDefault()
    setTransactionStatus(TransactionState.Pending)
    console.log(
      `Attempting to ${props.action === BuySellAction.Buy ? 'buy' : 'sell'} ${
        amount / coin.current_price
      } ${currency.value} for ${amount}.`
    )
    await ky
      .post('/api/transaction', {
        searchParams: {
          portfolioID: accountInfo.portfolios[0]._id.toString(), // TODO: add support for other portfolios eventually
          coin: coin.id,
          amountUSD: amount,
          action: props.action,
        },
      })
      .json<Account>()
      .then((account) => {
        setTransactionStatus(TransactionState.Success)
        setAccountInfo(account)
      })
      .catch((err) => {
        console.error(err)
        setTransactionStatus(TransactionState.Failed)
      })
  }

  if (!props.visible) return <></>

  return (
    <div
      className={`z-50 fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full`}
      onClick={handleClickOutsideModal}
    >
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          {transactionStatus === 'success' && (
            <div>
              Success!
              <button
                autoFocus
                onClick={(event) => {
                  event.preventDefault()
                  props.onClose()
                }}
                className="mt-3 px-4 py-2 bg-gray-400 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                CLOSE
              </button>
            </div>
          )}

          {transactionStatus !== 'success' && (
            <>
              <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">
                {props.action}
              </h3>
              <div className="mt-2 px-7 py-3">
                <form className="w-full max-w-sm" onSubmit={handleSubmit}>
                  <div className="w-full text-left py-2">
                    {props.action === BuySellAction.Buy && (
                      <span>
                        <span className="font-bold">Available to spend:</span>
                        <br /> {formatUSD(availableToSpend)}
                      </span>
                    )}
                    {props.action === 'sell' && coin && (
                      <div className="w-full text-left py-2">
                        <span className="font-bold">Available to sell:</span> <br />
                        {availableToSell} {coin.symbol.toUpperCase()}
                        <br />
                        (~
                        {formatUSD(availableToSell * coin.current_price)})
                      </div>
                    )}
                  </div>
                  <div className="flex items-center border-b border-teal-500 py-2">
                    {/*TODO: allow switching to enter amount in coin currency instead of in USD*/}
                    <span className="text-gray-700 text-5xl text-center">$</span>
                    <input
                      className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-5xl text-center ${
                        (props.action === BuySellAction.Buy && amount > availableToSpend) ||
                        (props.action === BuySellAction.Sell &&
                          coin &&
                          amount > availableToSell * coin.current_price)
                          ? 'text-red-500'
                          : 'text-gray-700'
                      }`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      aria-label="Amount"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value ? parseFloat(event.target.value) : 0)
                      }
                      maxLength={7}
                      autoFocus
                    />
                  </div>
                  <div className="w-full items-center py-2 text-left">
                    <Select
                      options={prices?.map((price) => ({
                        value: price.id,
                        label: price.name,
                      }))}
                      onChange={handleCurrencySelectionChange}
                      value={currency}
                    />
                  </div>
                  {coin && (
                    <>
                      <div className="w-full text-left py-2">
                        <span className="font-bold">Exchange Price:</span>
                        <br /> {formatUSD(coin.current_price)}
                      </div>
                      <div className="w-full text-left py-2">
                        <span className="font-bold">
                          {props.action === BuySellAction.Buy ? 'Purchase' : 'Sale'} amount:
                        </span>
                        <br />~{amount / coin.current_price} {coin.symbol.toUpperCase()}
                      </div>
                    </>
                  )}

                  <div className="items-center px-4 py-1 pt-7">
                    <button
                      className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
                      disabled={
                        !coin ||
                        (props.action === BuySellAction.Buy && amount > availableToSpend) ||
                        (props.action === BuySellAction.Sell &&
                          amount > availableToSell * coin.current_price) ||
                        amount < 1 ||
                        transactionStatus === 'pending'
                      }
                      type="submit"
                    >
                      {props.action.toUpperCase()} NOW
                    </button>
                    <button
                      onClick={(event) => {
                        event.preventDefault()
                        props.onClose()
                      }}
                      className="mt-3 px-4 py-2 bg-gray-400 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      CANCEL
                    </button>
                    {transactionStatus === 'failed' && (
                      <div className="text-red-400 mt-3">
                        {/*TODO: figure out how to handle different errors and show better message*/}
                        ERROR SUBMITTING TRANSACTION (maybe not enough funds or some other error?)
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
