import React, { useState } from 'react';
import { FileText, Table, Presentation, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { LightPaperDocument } from './LightPaperDocument';
import { LightPaperSpreadsheet } from './LightPaperSpreadsheet';
import { LightPaperPresentation } from './LightPaperPresentation';

/**
 * Standalone LightPaper workspace with document / spreadsheet / presentation tabs.
 * Rendered as a full dashboard tab so the main navigation bar stays visible.
 */
export function LightPaperWorkspace() {
  const [tab, setTab] = useState('document');
  const navigate = useNavigate();

  const workspaceTools = (
    <>
      {([
        ['document', FileText, 'Document'],
        ['spreadsheet', Table, 'Spreadsheet'],
        ['presentation', Presentation, 'Presentation'],
      ] as const).map(([key, Icon, title]) => (
        <Button
          key={key}
          variant={tab === key ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setTab(key)}
          title={title}
          aria-label={title}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => navigate('/lightpaper')}
        title="Open full workspace"
        aria-label="Open full workspace"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[680px]">
      <div className="tech-card border-0 rounded-lg overflow-hidden h-full">
        <Tabs value={tab} onValueChange={setTab} className="w-full h-full">
          <TabsContent value="document" className="mt-0 h-full">
            <LightPaperDocument selectedProject={null} workspaceTools={workspaceTools} />
          </TabsContent>
          <TabsContent value="spreadsheet" className="mt-0 h-full">
            <div className="flex items-center border-b bg-background px-2 py-1">{workspaceTools}</div>
            <LightPaperSpreadsheet />
          </TabsContent>
          <TabsContent value="presentation" className="mt-0 h-full">
            <div className="flex items-center border-b bg-background px-2 py-1">{workspaceTools}</div>
            <LightPaperPresentation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default LightPaperWorkspace;
