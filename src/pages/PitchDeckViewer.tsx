import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useToast } from '@/hooks/use-toast';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CompanyData {
  id: string;
  name: string;
  description: string;
  industry: string;
  logo_url: string | null;
  pitch_deck_url: string | null;
}

export default function PitchDeckViewer() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, description, industry, logo_url, pitch_deck_url')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      if (!data.pitch_deck_url) {
        toast({
          title: 'No Pitch Deck',
          description: 'This company has not uploaded a pitch deck yet.',
          variant: 'destructive',
        });
        navigate(-1);
        return;
      }

      setCompany(data);
    } catch (error: any) {
      console.error('Error fetching company:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pitch deck.',
        variant: 'destructive',
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleDownload = () => {
    if (company?.pitch_deck_url) {
      window.open(company.pitch_deck_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {company.logo_url && (
                <img 
                  src={company.logo_url} 
                  alt={company.name} 
                  className="h-10 w-10 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{company.name}</h1>
                <p className="text-sm text-muted-foreground">{company.industry}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleDownload}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Original
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Document
            file={company.pitch_deck_url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
            error={
              <div className="text-center p-8">
                <p className="text-destructive">Failed to load PDF. Please try downloading instead.</p>
              </div>
            }
            className="max-w-4xl"
          >
            {Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={Math.min(window.innerWidth - 100, 1000)}
                className="mb-4 shadow-lg"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            ))}
          </Document>

          {numPages > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <span className="text-sm text-muted-foreground">
                {numPages} {numPages === 1 ? 'page' : 'pages'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <img src="/startup-factory-hub-logo.png" alt="Startup Factory Hub" className="h-6" />
            <span>Powered by Startup Factory Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
