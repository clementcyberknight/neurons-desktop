import React, { useState, useEffect } from 'react'
import { Sidebar, type ActiveModule } from './Sidebar'
import { Header } from './Header'
import { CopilotDrawer } from '@/components/ai/CopilotDrawer'
import { DocumentsModule } from '@/modules/documents/DocumentsModule'
import { PosModule } from '@/modules/pos/PosModule'
import { InventoryModule } from '@/modules/inventory/InventoryModule'
import { StaffModule } from '@/modules/staff/StaffModule'
import { FinanceModule } from '@/modules/finance/FinanceModule'
import { TasksModule } from '@/modules/tasks/TasksModule'
import { initializeSeedDataIfEmpty } from '@/db/seedData'

export const AppLayout: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('inventory')
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Initialize seed data on first mount
    initializeSeedDataIfEmpty().catch(console.error)

    // Keyboard Shortcuts (Ctrl+K for AI Copilot)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsCopilotOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleAskAIWithPrompt = (promptText: string) => {
    setIsCopilotOpen(true)
    // Could also prefill or dispatch prompt
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Notion-style Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950/20">
        {/* Top Header */}
        <Header
          activeModule={activeModule}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Module Content */}
        <main className="flex-1 overflow-hidden">
          {activeModule === 'documents' && (
            <DocumentsModule
              searchQuery={searchQuery}
              onAskAI={handleAskAIWithPrompt}
            />
          )}
          {activeModule === 'pos' && (
            <PosModule onAskAI={handleAskAIWithPrompt} />
          )}
          {activeModule === 'inventory' && (
            <InventoryModule
              searchQuery={searchQuery}
              onAskAI={handleAskAIWithPrompt}
            />
          )}
          {activeModule === 'staff' && (
            <StaffModule
              searchQuery={searchQuery}
              onAskAI={handleAskAIWithPrompt}
            />
          )}
          {activeModule === 'finance' && (
            <FinanceModule onAskAI={handleAskAIWithPrompt} />
          )}
          {activeModule === 'tasks' && (
            <TasksModule
              searchQuery={searchQuery}
              onAskAI={handleAskAIWithPrompt}
            />
          )}
        </main>
      </div>

      {/* ChatGPT-style AI Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onActionApplied={() => {
          // Trigger reactive updates across live queries
        }}
      />
    </div>
  )
}
