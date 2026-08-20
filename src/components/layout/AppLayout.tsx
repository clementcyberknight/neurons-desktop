import React, { useState, useEffect } from 'react'
import { Sidebar, type ActiveModule } from './Sidebar'
import { Header } from './Header'
import { ChatModule } from '@/modules/chat/ChatModule'
import { DocumentsModule } from '@/modules/documents/DocumentsModule'
import { InventoryModule } from '@/modules/inventory/InventoryModule'
import { PosModule } from '@/modules/pos/PosModule'
import { FinanceModule } from '@/modules/finance/FinanceModule'
import { SalesModule } from '@/modules/sales/SalesModule'
import { StaffModule } from '@/modules/staff/StaffModule'
import { TasksModule } from '@/modules/tasks/TasksModule'
import { ExpenseModule } from '@/modules/expense/ExpenseModule'
import { CashbookModule } from '@/modules/cashbook/CashbookModule'
import { initializeSeedDataIfEmpty } from '@/db/seedData'

export const AppLayout: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('chat')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chatKey, setChatKey] = useState(0)

  useEffect(() => {
    // Initialize seed data on first mount
    initializeSeedDataIfEmpty().catch(console.error)
  }, [])

  const handleNewAction = () => {
    setChatKey((prev) => prev + 1)
    setActiveModule('chat')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-neutral-900 font-sans antialiased">
      {/* Neurons Side Navigation Panel */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onNewAction={handleNewAction}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top Header */}
        <Header
          activeModule={activeModule}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(false)}
        />

        {/* Dynamic Module Content */}
        <main className="flex-1 overflow-hidden bg-white">
          {activeModule === 'chat' && (
            <ChatModule key={chatKey} />
          )}
          {activeModule === 'documents' && (
            <DocumentsModule
              searchQuery={searchQuery}
              onAskAI={() => {}}
            />
          )}
          {activeModule === 'inventory' && (
            <InventoryModule
              searchQuery={searchQuery}
              onAskAI={() => {}}
            />
          )}
          {activeModule === 'pos' && (
            <PosModule onAskAI={() => {}} />
          )}
          {activeModule === 'finance' && (
            <FinanceModule onAskAI={() => {}} />
          )}
          {activeModule === 'sales' && (
            <SalesModule
              searchQuery={searchQuery}
              onAskAI={() => {}}
            />
          )}
          {activeModule === 'staff' && (
            <StaffModule
              searchQuery={searchQuery}
              onAskAI={() => {}}
            />
          )}
          {activeModule === 'tasks' && (
            <TasksModule
              searchQuery={searchQuery}
              onAskAI={() => {}}
            />
          )}
          {activeModule === 'expense' && (
            <ExpenseModule
              searchQuery={searchQuery}
              onAskAI={() => {}}
            />
          )}
          {activeModule === 'cashbook' && (
            <CashbookModule onAskAI={() => {}} />
          )}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
