import React from 'react'

interface DataCardProps {
  title: string
}

export const DataCard: React.FC<DataCardProps> = (props) => (
  <div className="overflow-hidden">
    <div className="px-6 py-4 text-center">
      <div className="font-normal text-lg mb-2 text-gray-700">{props.title}</div>
      <div className="text-2xl font-medium text-gray-800">{props.children}</div>
    </div>
  </div>
)
