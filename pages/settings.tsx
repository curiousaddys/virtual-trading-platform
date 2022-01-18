import { NextPage } from 'next'
import React, { FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react'
import { useAccountContext } from '../hooks/useAccount'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'
import ky from 'ky'
import { PageWrapper } from '../components/common/PageWrapper'
import { AccountWithPortfolio } from './api/account'
import { usePortfolios } from '../hooks/usePortfolios'
import { ErrResp } from '../utils/errors'

const Settings: NextPage = () => {
  const { accountInfo, setAccountInfo, accountError, isLoaded } = useAccountContext()
  const [newNickname, setNewNickname] = useState<string | undefined>(undefined)
  const [defaultPortfolioID, setDefaultPortfolioID] = useState<string>('')
  const [portfolioName, setPortfolioName] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { portfolios, createPortfolio, updatePortfolio } = usePortfolios()
  const [isRenamingPortfolio, setIsRenamingPortfolio] = useState<boolean>(false)
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState<boolean>(false)
  const defaultPortfolio = useMemo(
    () =>
      portfolios?.length && defaultPortfolioID
        ? portfolios.find((portfolio) => portfolio._id.toString() === defaultPortfolioID)
        : undefined,
    [portfolios, defaultPortfolioID]
  )

  // Select the existing default portfolio ID when the account info loads.
  useEffect(() => {
    if (!accountInfo) return
    setDefaultPortfolioID(accountInfo.defaultPortfolioID.toString())
  }, [accountInfo])

  useEffect(() => {
    if (!accountError) return
    console.error(accountError)
    toast('Error loading account info!', { type: 'error' })
  }, [accountError])

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault()
    if (!accountInfo) {
      toast(`Cannot update account since no account info is loaded.`, { type: 'error' })
      return
    }
    setIsSubmitting(true)
    ky.post('/api/account', {
      searchParams: {
        nickname: newNickname ?? accountInfo.nickname,
        defaultPortfolioID,
      },
    })
      .json<AccountWithPortfolio>()
      .then((data) => {
        setAccountInfo(data)
        toast('Account updated!', { type: 'success' })
      })
      .catch((err) =>
        err.response.json().then((error: ErrResp) => {
          toast(`Error updating account: ${error.error}`, { type: 'error' })
        })
      )
      .finally(() => setIsSubmitting(false))
  }

  const submitCreatePortfolio = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const newPortfolio = await createPortfolio(portfolioName)
      toast('New portfolio created!', { type: 'success' })
      setIsCreatingPortfolio(false)
      setDefaultPortfolioID(newPortfolio._id.toString())
    } catch (err) {
      console.error(err)
      toast(`Error creating portfolio: ${err}`, { type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }, [createPortfolio, portfolioName])

  const submitRenamePortfolio = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const updatedPortfolio = await updatePortfolio(defaultPortfolioID, portfolioName)
      toast('Portfolio renamed successfully!', { type: 'success' })
      setIsRenamingPortfolio(false)
      setDefaultPortfolioID(updatedPortfolio._id.toString())
    } catch (err) {
      console.error(err)
      toast(`Error renaming portfolio: ${err}`, { type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }, [updatePortfolio, portfolioName, defaultPortfolioID])

  return (
    <PageWrapper title="User Settings">
      {!isLoaded ? (
        <div className="mb-3">Loading...</div>
      ) : !accountInfo ? (
        <div className="mb-3">
          You must connect your MetaMask wallet in order to access this page.
        </div>
      ) : (
        <>
          <h2 className="text-2xl text-gray-800 font-semibold ml-1">Settings</h2>
          <section className="rounded-2xl border-2 border-gray-200 p-4 bg-white mt-3 mb-6">
            <form className="w-full max-w-sm" onSubmit={handleSubmit}>
              <label className="block text-gray-700 text-sm font-bold" htmlFor="username">
                Nickname
              </label>
              <div className="mb-2 text-xs">This will be visible to other users.</div>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-3"
                type="text"
                aria-label="nickname"
                value={newNickname ?? accountInfo.nickname}
                onChange={(e) => {
                  setNewNickname(e.target.value)
                }}
              />
              {/*TODO: refactor this into its own component*/}
              {!isCreatingPortfolio && !isRenamingPortfolio ? (
                <>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="active-portfolio"
                  >
                    Active Portfolio
                  </label>
                  <div className="flex">
                    <div className="block relative mb-3 w-full">
                      <select
                        id="active-portfolio"
                        value={defaultPortfolioID}
                        onChange={(e) => {
                          setDefaultPortfolioID(e.target.value)
                          setPortfolioName(e.target.options[e.target.selectedIndex].text)
                        }}
                        className="block shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        {portfolios.map((portfolio) => (
                          <option key={portfolio._id.toString()} value={portfolio._id.toString()}>
                            {portfolio.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        className="text-sm px-2 py-2 ml-2 border rounded"
                        onClick={() => {
                          setPortfolioName(defaultPortfolio?.name ?? '')
                          setIsRenamingPortfolio(true)
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="text-sm px-2 py-2 ml-2 border rounded"
                        disabled={isSubmitting}
                        onClick={() => {
                          setPortfolioName('')
                          setIsCreatingPortfolio(true)
                        }}
                      >
                        + New
                      </button>
                    </div>
                  </div>
                </>
              ) : isCreatingPortfolio ? (
                <>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="new-portfolio-name"
                  >
                    New Portfolio Name
                  </label>
                  <div className="flex">
                    <input
                      id="new-portfolio-name"
                      autoFocus
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-3"
                      type="text"
                      aria-label="portfolio name"
                      value={portfolioName}
                      onChange={(e) => {
                        setPortfolioName(e.target.value)
                      }}
                      onKeyUp={(e) => {
                        e.preventDefault()
                        if (e.key === 'Enter') {
                          submitCreatePortfolio()
                        }
                      }}
                    />
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        className="text-sm font-bold px-2 py-2 ml-2 border rounded bg-blue-600 hover:bg-blue-800 text-white disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={submitCreatePortfolio}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </>
              ) : isRenamingPortfolio ? (
                <>
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="rename-portfolio-name"
                  >
                    Portfolio Name
                  </label>
                  <div className="flex">
                    <input
                      id="rename-portfolio-name"
                      autoFocus
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-3"
                      type="text"
                      aria-label="portfolio name"
                      value={portfolioName}
                      onChange={(e) => {
                        setPortfolioName(e.target.value)
                      }}
                      onKeyUp={(e) => {
                        e.preventDefault()
                        if (e.key === 'Enter') {
                          submitRenamePortfolio()
                        }
                      }}
                    />
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        className="text-sm font-bold px-2 py-2 ml-2 border rounded bg-blue-600 hover:bg-blue-800 text-white disabled:opacity-50"
                        onClick={submitRenamePortfolio}
                      >
                        Save Name
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Join Date
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                aria-label="nickname"
                value={dayjs(accountInfo.joined).format('YYYY-MM-DD')}
                disabled
              />

              <button
                className="mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                type="submit"
                disabled={
                  !isLoaded ||
                  !portfolios.length ||
                  isSubmitting ||
                  isRenamingPortfolio ||
                  isCreatingPortfolio
                }
              >
                Save
              </button>
            </form>
          </section>
        </>
      )}
    </PageWrapper>
  )
}

export default Settings
