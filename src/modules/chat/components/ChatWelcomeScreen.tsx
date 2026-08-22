import React from 'react'
import { ChatInputCapsule } from './ChatInputCapsule'
import { useAuth } from '@/context/AuthContext'

interface ChatWelcomeScreenProps {
  input: string
  setInput: (val: string) => void
  loading: boolean
  thinkMode: boolean
  setThinkMode: React.Dispatch<React.SetStateAction<boolean>>
  isExpanded: boolean
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  onSend: (text?: string) => void
}

export const ChatWelcomeScreen: React.FC<ChatWelcomeScreenProps> = ({
  input,
  setInput,
  loading,
  thinkMode,
  setThinkMode,
  isExpanded,
  setIsExpanded,
  onSend,
}) => {
  const { user } = useAuth()
  const userName = user?.fullName ? user.fullName.split(' ')[0] : 'there'

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto w-full -mt-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium text-neutral-800 tracking-tight">
          Good to see you, {userName}.
        </h1>
      </div>

      {/* Centered Floating Multiline Input Capsule */}
      <div className="w-full max-w-2xl">
        <ChatInputCapsule
          input={input}
          setInput={setInput}
          loading={loading}
          thinkMode={thinkMode}
          setThinkMode={setThinkMode}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          onSend={onSend}
          autoFocus
          showDisclaimer
        />
      </div>
    </div>
  )
}
