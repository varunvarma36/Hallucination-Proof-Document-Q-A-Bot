import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DocumentUploadModal } from './components/DocumentUploadModal';

import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { ChatPage } from './pages/ChatPage';
import { EvidencePage } from './pages/EvidencePage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';

import { DocumentItem, Collection, SystemHealth } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [chatCollectionId, setChatCollectionId] = useState<string>('');

  const loadData = async () => {
    try {
      const [docs, cols, h] = await Promise.allSettled([
        api.getDocuments(),
        api.getCollections(),
        api.getHealth()
      ]);

      if (docs.status === 'fulfilled') setDocuments(docs.value);
      if (cols.status === 'fulfilled') setCollections(cols.value);
      if (h.status === 'fulfilled') setHealth(h.value);
    } catch (e) {
      console.error('Data load error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCollectionForChat = (colId: string) => {
    setChatCollectionId(colId);
    setCurrentTab('chat');
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar 
        health={health} 
        onOpenUpload={() => setIsUploadOpen(true)} 
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          documentCount={documents.length}
          collectionCount={collections.length}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-surface-950">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardPage
                documents={documents}
                collections={collections}
                health={health}
                onNavigate={setCurrentTab}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}

            {currentTab === 'documents' && (
              <DocumentsPage
                documents={documents}
                collections={collections}
                onRefresh={loadData}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}

            {currentTab === 'collections' && (
              <CollectionsPage
                collections={collections}
                onRefresh={loadData}
                onSelectCollectionForChat={handleSelectCollectionForChat}
              />
            )}

            {currentTab === 'chat' && (
              <ChatPage
                collections={collections}
                selectedCollectionId={chatCollectionId}
                onSelectCollection={setChatCollectionId}
              />
            )}

            {currentTab === 'evidence' && (
              <EvidencePage
                collections={collections}
                documents={documents}
              />
            )}

            {currentTab === 'evaluation' && (
              <EvaluationPage />
            )}

            {currentTab === 'settings' && (
              <SettingsPage />
            )}

            {currentTab === 'health' && (
              <SystemHealthPage
                health={health}
                onRefresh={loadData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Ingestion Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        collections={collections}
        onUploadSuccess={() => {
          loadData();
          setIsUploadOpen(false);
        }}
      />
    </div>
  );
};

export default App;
