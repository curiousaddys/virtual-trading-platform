import { Modal, ModalProps } from './common/Modal'
import React, { FormEventHandler, useState } from 'react'
import { useAccountContext } from '../hooks/useAccount'
import { toast } from 'react-toastify'
import ky from 'ky'
import { AccountWithPortfolio } from '../pages/api/account'
import { ErrResp } from '../utils/errors'
import Image from 'next/image'

export const WelcomeModal: React.VFC<ModalProps> = (props) => {
  const { accountInfo, setAccountInfo } = useAccountContext()
  const [newNickname, setNewNickname] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit: FormEventHandler = async (event) => {
    event.preventDefault()
    if (!accountInfo) {
      toast(`Cannot update account since no account info is loaded.`, { type: 'error' })
      return
    }
    setIsSubmitting(true)
    ky.post('/api/account', {
      searchParams: {
        nickname: newNickname ?? accountInfo?.nickname ?? '',
        defaultPortfolioID: accountInfo.defaultPortfolioID.toString(),
      },
    })
      .json<AccountWithPortfolio>()
      .then((data) => {
        setAccountInfo(data)
        toast('Nickname updated!', { type: 'success' })
        props.onClose()
      })
      .catch((err) =>
        err.response.json().then((error: ErrResp) => {
          toast(`Error updating account: ${error.error}`, { type: 'error' })
        })
      )
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <Modal {...props}>
      <div className="flex flex-row items-center gap-5 mb-6">
        <Image src={'/addy.jpg'} height={100} width={100} alt={'Addy'} className="rounded-full" />
        <h1 className="text-lg font-black text-center">
          Welcome to Curious Addys&apos; Virtual Trading Platform!
        </h1>
      </div>
      <div>
        <form className="w-full max-w-sm" onSubmit={handleSubmit}>
          <label className="block text-gray-700 text-sm font-bold" htmlFor="username">
            What would you like to be called?
          </label>
          <div className="mb-2 text-xs">This will be visible to other users.</div>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-3"
            type="text"
            aria-label="nickname"
            value={newNickname ?? accountInfo?.nickname ?? ''}
            onChange={(e) => {
              setNewNickname(e.target.value)
            }}
          />
          <button
            className="mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
            disabled={isSubmitting}
          >
            Save
          </button>
          <button
            className="mt-5 bg-gray-400 hover:bg-gray-700 text-white font-bold py-2 px-4 mx-3 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="button"
            onClick={props.onClose}
            disabled={isSubmitting}
          >
            Stay anonymous
          </button>
        </form>
      </div>
    </Modal>
  )
}
