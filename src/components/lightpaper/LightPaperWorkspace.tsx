import React, { useState } from 'react';
import { FileText, Table, Presentation } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      <div className="relative tech-card border-0 rounded-2xl p-4 sm:p-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">LightPaper Workspace</h2>
              <p className="text-sm text-muted-foreground">
                Documents, spreadsheets and presentations
              </p>
            </div>
          </div>
          <div className="flex border rounded-lg p-1 bg-muted/30 w-fit">
            {([
              ['document', FileText, 'Document'],
              ['spreadsheet', Table, 'Spreadsheet'],
              ['presentation', Presentation, 'Presentation'],
            ] as const).map(([key, Icon, title]) => (
              <Button
                key={key}
                variant={tab === key ? 'secondary' : 'ghost'}
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setTab(key)}
                title={title}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="tech-card border-0 rounded-2xl p-1 overflow-hidden min-h-[60vh]">
        <Tabs value={tab} onValueChange={setTab} className="w-full h-full">
          <TabsContent value="document" className="mt-0 h-full">
            <LightPaperDocument selectedProject={null} />
          </TabsContent>
          <TabsContent value="spreadsheet" className="mt-0 h-full">
            <LightPaperSpreadsheet />
          </TabsContent>
          <TabsContent value="presentation" className="mt-0 h-full">
            <LightPaperPresentation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default LightPaperWorkspace;
