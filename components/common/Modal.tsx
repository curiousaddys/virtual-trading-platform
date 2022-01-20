import React from 'react'

export interface ModalProps {
  onClose: () => void
}

export const Modal: React.FC<ModalProps> = ({ children, onClose }) => (
  <div
    className={`z-50 fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full`}
    onClick={(e) => e.target === e.currentTarget && onClose()}
    onKeyUp={(e) => e.key === 'Escape' && onClose()}
  >
    <div className="relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white full max-w-md">
      {children}
    </div>
  </div>
)
