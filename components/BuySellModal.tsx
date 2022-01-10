import { FormEventHandler, useEffect, useState, MouseEvent, FormEvent } from 'react'
import Select, { SingleValue } from 'react-select'
import { usePrices } from '../hooks/usePrices'
import { formatUSD } from '../utils/format'
import { useAccountContext } from '../hooks/useAccount'
import ky from 'ky'
import { Account } from '../db/accounts'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faExchangeAlt } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'react-toastify'
import { GeckoPrices } from '../api/CoinGecko/markets'

export interface BuySellModalProps {
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

const parseFloatOrReturnZero = (s: string) => {
  const parsed = parseFloat(s)
  return isNaN(parsed) ? 0 : parsed
}

export const BuySellModal: React.VFC<BuySellModalProps> = (props) => {
  const [transactInUSD, setTransactInUSD] = useState<boolean>(true)
  const [amountUSDString, setAmountUSDString] = useState<string>('')
  const [amountCoinString, setAmountCoinString] = useState<string>('')
  const [amountUSD, setAmountUSD] = useState<number>(0)
  const [amountCoin, setAmountCoin] = useState<number>(0)
  const [currency, setCurrency] = useState<SingleValue<SelectedOption>>(DEFAULT_CURRENCY_VALUE)
  const [coinPriceData, setCoinPriceData] = useState<GeckoPrices | null>(null)
  const { prices } = usePrices()
  const { accountInfo, setAccountInfo } = useAccountContext()
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

  const flipDenominations = (e: FormEvent) => {
    e.preventDefault()
    if (transactInUSD) {
      setAmountCoinString(amountCoin ? amountCoin.toString() : '')
    } else {
      setAmountUSDString(amountUSD ? amountUSD.toString() : '')
    }
    setTransactInUSD((prev) => !prev)
  }

  // When the amount input string changes, update the actual amount.
  // It's easier to store input amount as strings since storing them as a number would cause
  // it to just update the state w/ "0" when ".0" is typed, preventing the user from entering amounts like ".01"
  useEffect(() => {
    setAmountUSD(parseFloatOrReturnZero(amountUSDString))
  }, [amountUSDString])

  useEffect(() => {
    setAmountCoin(parseFloatOrReturnZero(amountCoinString))
  }, [amountCoinString])

  // Whenever price changes or input changes, update appropriate field based on which one is currently editable.
  // We can't just let the user update both fields whenever they want b/c one of them has to be constantly
  // updated based on the market price changes from the server.
  useEffect(() => {
    if (!coinPriceData) return
    if (transactInUSD) {
      const newAmountCoin = parseFloat((amountUSD / coinPriceData.current_price).toFixed(16))
      if (amountCoin !== newAmountCoin) {
        setAmountCoin(newAmountCoin)
      }
    } else {
      const newAmountUSD = parseFloat((amountCoin * coinPriceData.current_price).toFixed(2))
      if (amountUSD !== newAmountUSD) {
        setAmountUSD(newAmountUSD)
      }
    }
  }, [coinPriceData, transactInUSD, amountUSD, amountCoin])

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
    setCoinPriceData(coin)
  }, [currency, prices])

  // Whenever account info or price data updates, set the available amount to spend or sell.
  useEffect(() => {
    setAvailableToSpend(
      accountInfo?.portfolios[0].holdings.find((holding) => holding.currency === 'USD')?.amount ?? 0
    )
    setAvailableToSell(
      accountInfo?.portfolios[0].holdings.find((holding) => holding.currency === coinPriceData?.id)
        ?.amount ?? 0
    )
  }, [accountInfo, coinPriceData])

  const handleSubmit: FormEventHandler = async (event) => {
    if (!coinPriceData || !accountInfo || !currency) return
    event.preventDefault()
    setTransactionStatus(TransactionState.Pending)
    await ky
      .post('/api/transaction', {
        searchParams: {
          portfolioID: accountInfo.portfolios[0]._id.toString(), // TODO: add support for other portfolios eventually
          coin: coinPriceData.id,
          transactInUSD,
          amountUSD,
          amountCoin,
          action: props.action,
        },
      })
      .json<Account>()
      .then((account) => {
        setTransactionStatus(TransactionState.Success)
        setAccountInfo(account)
      })
      .catch((err) => {
        err.response.json().then((errResp: { error: string }) => {
          console.error(errResp)
          toast(`Transaction failed: ${errResp.error}.`, { type: 'error' })
        })
        setTransactionStatus(TransactionState.Failed)
      })
  }

  // TODO: show loading spinner while preparing the form so that it doesn't look jumpy

  return (
    <div
      className={`z-50 fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full`}
      onClick={handleClickOutsideModal}
    >
      <div
        className="relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white"
        style={{ width: 440, maxWidth: '100%' }}
      >
        <div className="mt-3 text-center">
          {transactionStatus === 'success' && (
            <div className="grid place-items-center gap-5">
              <FontAwesomeIcon icon={faCheckCircle} color="green" className="w-24" />
              Transaction successful.
              <button
                autoFocus
                onClick={(event) => {
                  event.preventDefault()
                  props.onClose()
                }}
                className="mt-3 px-4 py-2 bg-green-700 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                OK
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
                  <div className="w-full text-left py-2 text-sm">
                    {props.action === BuySellAction.Buy && (
                      <span>
                        <span className="font-bold">Available to spend:</span>
                        <br />
                        {formatUSD(availableToSpend)}{' '}
                        {coinPriceData && (
                          <>
                            (~{availableToSpend / coinPriceData.current_price}{' '}
                            {coinPriceData.symbol.toUpperCase()})
                          </>
                        )}
                      </span>
                    )}
                    {props.action === 'sell' && coinPriceData && (
                      <div className="w-full text-left py-2">
                        <span className="font-bold">Available to sell:</span>
                        <br />
                        {availableToSell} {coinPriceData.symbol.toUpperCase()} (~
                        {formatUSD(availableToSell * coinPriceData.current_price)})
                      </div>
                    )}
                  </div>

                  {/*Editable USD amount*/}
                  {transactInUSD && (
                    <div className="flex items-center border-b border-teal-500 py-2">
                      <span className="text-gray-700 text-5xl text-center">$</span>
                      <input
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-5xl text-center ${
                          (props.action === BuySellAction.Buy && amountUSD > availableToSpend) ||
                          (props.action === BuySellAction.Sell &&
                            coinPriceData &&
                            amountUSD > availableToSell * coinPriceData.current_price)
                            ? 'text-red-500'
                            : 'text-gray-700'
                        }`}
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        aria-label="Amount"
                        value={amountUSDString}
                        onChange={(e) => {
                          setAmountUSDString(e.target.value)
                        }}
                        autoFocus
                      />
                    </div>
                  )}

                  {/*Editable coin amount*/}
                  {!transactInUSD && (
                    <div className="flex items-center border-b border-teal-500 py-2">
                      <input
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-2xl text-center ${
                          (props.action === BuySellAction.Buy && amountUSD > availableToSpend) ||
                          (props.action === BuySellAction.Sell &&
                            coinPriceData &&
                            amountUSD > availableToSell * coinPriceData.current_price)
                            ? 'text-red-500'
                            : 'text-gray-700'
                        }`}
                        type="number"
                        inputMode="decimal"
                        maxLength={6}
                        placeholder="0"
                        aria-label="Amount"
                        value={amountCoinString}
                        onChange={(e) => {
                          setAmountCoinString(e.target.value)
                        }}
                        autoFocus
                      />
                      <span className="text-gray-700 text-xl text-center">
                        {coinPriceData?.symbol.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/*Non-editable USD amount*/}
                  {!transactInUSD && (
                    <div className="flex items-center py-2">
                      <span className="text-gray-500 text-xl text-center">≈</span>
                      <div
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-xl text-center text-gray-500`}
                      >
                        {formatUSD(amountUSD ? amountUSD : 0)}
                      </div>
                    </div>
                  )}

                  {/*Non-editable coin amount*/}
                  {transactInUSD && (
                    <div className="flex items-center py-2">
                      <span className="text-gray-500 text-xl text-center">≈</span>
                      <div
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-xl text-center text-gray-500`}
                      >
                        {amountCoin ? amountCoin : 0}
                      </div>
                      <span className="text-gray-500 text-xl text-center">
                        {coinPriceData?.symbol.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="w-full flex py-2 text-left gap-2">
                    <Select
                      options={prices?.map((price) => ({
                        value: price.id,
                        label: price.name,
                      }))}
                      onChange={handleCurrencySelectionChange}
                      value={currency}
                      className="flex-grow"
                    />
                    <button
                      onClick={flipDenominations}
                      type="button"
                      className="bg-white hover:bg-gray-100 px-4 border border-gray-400 rounded shadow"
                    >
                      <FontAwesomeIcon
                        icon={faExchangeAlt}
                        className="rotate-90"
                        style={{ width: 18 }}
                      />
                    </button>
                  </div>

                  <div className="items-center px-4 py-1 pt-7">
                    <button
                      className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 uppercase"
                      disabled={
                        !coinPriceData ||
                        (props.action === BuySellAction.Buy && amountUSD > availableToSpend) ||
                        (props.action === BuySellAction.Sell &&
                          amountUSD > availableToSell * coinPriceData.current_price) ||
                        amountUSD < 1 ||
                        transactionStatus === 'pending'
                      }
                      type="submit"
                    >
                      {props.action.toUpperCase()} now
                    </button>
                    <button
                      onClick={(event) => {
                        event.preventDefault()
                        props.onClose()
                      }}
                      className="mt-3 px-4 py-2 bg-gray-400 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 uppercase"
                    >
                      Cancel
                    </button>
                    {amountUSD > 0 && amountUSD < 1 && (
                      <div className="text-red-400 mt-5 font-bold">
                        Transaction must be at least $1.
                      </div>
                    )}
                    {transactionStatus === 'failed' && (
                      <div className="text-red-400 mt-5 font-bold">
                        Transaction failed.
                        <br />
                        Please try again.
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
